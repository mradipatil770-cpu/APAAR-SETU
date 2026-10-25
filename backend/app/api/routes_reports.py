import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_user_context, AuthenticatedContext
from app.services.report_service import generate_institution_summary_csv
from app.models.models import AuditLog

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


@router.get("", response_class=Response)
def download_institution_report(
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Generates and downloads a secure CSV summary report of institutional data,
    uploads, and flagged anomalies. All values are escaped to prevent formula injection.
    """
    if not auth.can_export_reports():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Insufficient privileges to export institutional compliance reports.",
        )

    csv_content = generate_institution_summary_csv(db, auth.institution_id)
    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"apaarsetu_report_{timestamp_str}.csv"

    # Audit the export event
    audit_user_id = None
    if auth.user_id:
        try:
            audit_user_id = str(uuid.UUID(str(auth.user_id)))
        except (ValueError, TypeError, AttributeError):
            audit_user_id = None

    audit = AuditLog(
        institution_id=auth.institution_id,
        user_id=audit_user_id,
        actor_role=auth.role,
        target_id=str(auth.institution_id),
        action="REPORT_EXPORTED",
        status="SUCCESS",
        details=f"Institutional compliance report generated and exported by {auth.email}.",
    )
    db.add(audit)
    db.commit()

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    )
