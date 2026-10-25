import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_user_context, AuthenticatedContext, enforce_institution_access
from app.schemas.schemas import AnomalyResponse, ResolveAnomalyRequest
from app.models.models import AnomalyCase, AuditLog

router = APIRouter(prefix="/api/v1/anomalies", tags=["Anomalies"])


@router.get("", response_model=List[AnomalyResponse])
def list_anomalies(
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(OPEN|RESOLVED|IGNORED)$"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """Lists anomaly cases flagged for human-in-the-loop review for this institution."""
    query = db.query(AnomalyCase).filter(AnomalyCase.institution_id == auth.institution_id)
    if status_filter:
        query = query.filter(AnomalyCase.status == status_filter)

    anomalies = query.order_by(AnomalyCase.created_at.desc()).offset(offset).limit(limit).all()
    return anomalies


@router.post("/{anomaly_id}/resolve", response_model=AnomalyResponse)
def resolve_anomaly(
    anomaly_id: str,
    payload: ResolveAnomalyRequest,
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Submits a review decision (RESOLVED / IGNORED) for a flagged anomaly case,
    recording reviewer notes and audit log.
    """
    if not auth.can_resolve_anomalies():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Anomaly resolution requires an administrative role (AICTE_ADMIN or INSTITUTE_ADMIN).",
        )

    anomaly = db.query(AnomalyCase).filter(AnomalyCase.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anomaly case record not found.",
        )

    enforce_institution_access(auth, anomaly.institution_id)

    anomaly.status = payload.status
    anomaly.resolution_notes = payload.resolution_notes
    anomaly.resolved_at = datetime.now(timezone.utc)

    audit_user_id = None
    if auth.user_id:
        try:
            audit_user_id = str(uuid.UUID(str(auth.user_id)))
        except (ValueError, TypeError, AttributeError):
            audit_user_id = None

    audit = AuditLog(
        institution_id=anomaly.institution_id,
        user_id=audit_user_id,
        actor_role=auth.role,
        target_id=str(anomaly.id),
        action=f"ANOMALY_{payload.status}",
        status="SUCCESS",
        details=f"Anomaly {anomaly.id} ({anomaly.issue_code}) marked as {payload.status}. Notes: {payload.resolution_notes}",
    )
    db.add(audit)
    db.commit()
    db.refresh(anomaly)

    return anomaly

