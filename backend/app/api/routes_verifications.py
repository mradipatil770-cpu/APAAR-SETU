import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import (
    get_current_user_context,
    AuthenticatedContext,
    enforce_institution_access,
    Role,
)
from app.models.models import VerificationRequest, Student, Institution, AuditLog
from app.schemas.schemas import (
    VerificationResponse,
    VerificationCreateRequest,
    VerificationDecisionRequest,
)

router = APIRouter(prefix="/api/v1/verifications", tags=["Academic Verification"])


@router.get("", response_model=List[VerificationResponse])
def list_verification_requests(
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(PENDING|APPROVED|REJECTED)$"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Lists controlled student academic verification requests.
    - Institutional users see requests scoped strictly to their institution.
    - Central AICTE roles can audit verification requests nationally.
    """
    query = db.query(VerificationRequest, Institution.name).join(
        Institution, VerificationRequest.institution_id == Institution.id
    )

    if not auth.is_central():
        query = query.filter(VerificationRequest.institution_id == auth.institution_id)

    if status_filter:
        query = query.filter(VerificationRequest.status == status_filter)

    results = query.order_by(VerificationRequest.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for req, inst_name in results:
        items.append(
            VerificationResponse(
                id=str(req.id),
                institution_id=str(req.institution_id),
                institution_name=inst_name,
                student_ref=req.student_ref,
                requester_org=req.requester_org,
                requester_email=req.requester_email,
                purpose=req.purpose,
                scope=req.scope,
                consent_ref=req.consent_ref,
                consent_status=req.consent_status,
                status=req.status,
                decision_notes=req.decision_notes,
                decided_at=req.decided_at,
                created_at=req.created_at,
            )
        )
    return items


@router.post("", response_model=VerificationResponse, status_code=status.HTTP_201_CREATED)
def submit_verification_request(
    payload: VerificationCreateRequest,
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Submits a controlled verification request for an enrolled student.
    Enforces student existence in the target institution and records purpose and consent basis.
    """
    # Verify target institution exists
    inst = db.query(Institution).filter(Institution.id == payload.institution_id).first()
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target institution not found.",
        )

    # Verify student exists in the institution
    student = db.query(Student).filter(
        Student.institution_id == payload.institution_id,
        Student.student_ref == payload.student_ref,
    ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student record '{payload.student_ref}' not found in target institution.",
        )

    req = VerificationRequest(
        institution_id=payload.institution_id,
        student_ref=payload.student_ref,
        requester_org=payload.requester_org.strip(),
        requester_email=payload.requester_email.strip().lower(),
        purpose=payload.purpose.strip(),
        scope=payload.scope.strip(),
        consent_ref=payload.consent_ref.strip() if payload.consent_ref else None,
        consent_status="STUDENT_CONSENT_VERIFIED" if payload.consent_ref else "CONSENT_PENDING_CONFIRMATION",
        status="PENDING",
    )
    db.add(req)

    # Audit the request
    audit = AuditLog(
        institution_id=payload.institution_id,
        user_id=auth.user_id if auth.is_authenticated else None,
        actor_role=auth.role,
        target_id=str(req.id),
        action="VERIFICATION_REQUEST_CREATED",
        status="SUCCESS",
        details=f"Verification request submitted by '{payload.requester_org}' for student '{payload.student_ref}'.",
    )
    db.add(audit)
    db.commit()
    db.refresh(req)

    return VerificationResponse(
        id=str(req.id),
        institution_id=str(req.institution_id),
        institution_name=inst.name,
        student_ref=req.student_ref,
        requester_org=req.requester_org,
        requester_email=req.requester_email,
        purpose=req.purpose,
        scope=req.scope,
        consent_ref=req.consent_ref,
        consent_status=req.consent_status,
        status=req.status,
        decision_notes=req.decision_notes,
        decided_at=req.decided_at,
        created_at=req.created_at,
    )


@router.post("/{request_id}/decide", response_model=VerificationResponse)
def decide_verification_request(
    request_id: str,
    payload: VerificationDecisionRequest,
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Institutional or Central Administrator determination on an academic verification request.
    Requires administrative privileges and logs the decision into the permanent audit trail.
    """
    if auth.role not in {Role.AICTE_ADMIN, Role.INSTITUTE_ADMIN}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Verification determination requires administrative privileges.",
        )

    req = db.query(VerificationRequest).filter(VerificationRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification request record not found.",
        )

    enforce_institution_access(auth, req.institution_id)

    req.status = payload.status
    req.decision_notes = payload.decision_notes.strip()
    req.decided_by = auth.user_id if auth.is_authenticated else None
    req.decided_at = datetime.now(timezone.utc)

    # Audit the determination
    audit = AuditLog(
        institution_id=req.institution_id,
        user_id=auth.user_id if auth.is_authenticated else None,
        actor_role=auth.role,
        target_id=str(req.id),
        action=f"VERIFICATION_{payload.status}",
        status="SUCCESS",
        details=f"Verification request {req.id} marked as {payload.status}. Notes: {payload.decision_notes}",
    )
    db.add(audit)
    db.commit()
    db.refresh(req)

    inst = db.query(Institution).filter(Institution.id == req.institution_id).first()

    return VerificationResponse(
        id=str(req.id),
        institution_id=str(req.institution_id),
        institution_name=inst.name if inst else "Unknown",
        student_ref=req.student_ref,
        requester_org=req.requester_org,
        requester_email=req.requester_email,
        purpose=req.purpose,
        scope=req.scope,
        consent_ref=req.consent_ref,
        consent_status=req.consent_status,
        status=req.status,
        decision_notes=req.decision_notes,
        decided_at=req.decided_at,
        created_at=req.created_at,
    )

