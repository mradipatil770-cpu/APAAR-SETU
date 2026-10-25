from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.core.security import get_current_user_context, AuthenticatedContext, require_role, Role
from app.schemas.schemas import DashboardStats, AdminDashboardStats, ProgrammeIntakeStat
from app.models.models import (
    Institution,
    DataUpload,
    AnomalyCase,
    Programme,
    ApprovedIntake,
    Enrolment,
)

router = APIRouter(prefix="/api/v1", tags=["Dashboard"])


@router.get("/institution/dashboard", response_model=DashboardStats)
def get_institution_dashboard(
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Returns real-time aggregated metrics for the authenticated institution:
    - Total processed, accepted, and rejected records
    - Count of open anomalies requiring review
    - Configured programme intake vs actual enrolments
    - Latest uploads
    """
    inst = db.query(Institution).filter(Institution.id == auth.institution_id).first()
    institution_name = inst.name if inst else "Unknown Institution"

    # Aggregated upload stats
    upload_aggregates = db.query(
        func.coalesce(func.sum(DataUpload.total_rows), 0),
        func.coalesce(func.sum(DataUpload.accepted_rows), 0),
        func.coalesce(func.sum(DataUpload.rejected_rows), 0),
    ).filter(DataUpload.institution_id == auth.institution_id).first()

    total_proc = int(upload_aggregates[0])
    total_acc = int(upload_aggregates[1])
    total_rej = int(upload_aggregates[2])

    # Count open anomaly cases
    open_anomalies = db.query(func.count(AnomalyCase.id)).filter(
        AnomalyCase.institution_id == auth.institution_id,
        AnomalyCase.status == "OPEN",
    ).scalar() or 0

    # Programme & Intake statistics
    intakes = db.query(ApprovedIntake, Programme).join(
        Programme, ApprovedIntake.programme_id == Programme.id
    ).filter(ApprovedIntake.institution_id == auth.institution_id).all()

    programme_stats: List[ProgrammeIntakeStat] = []
    intake_discrepancy_count = 0

    for intake_obj, prog_obj in intakes:
        enrolled_count = db.query(func.count(Enrolment.id)).filter(
            Enrolment.institution_id == auth.institution_id,
            Enrolment.programme_id == prog_obj.id,
            Enrolment.academic_year == intake_obj.academic_year,
        ).scalar() or 0

        is_exceeded = enrolled_count > intake_obj.approved_intake
        if is_exceeded:
            intake_discrepancy_count += 1

        programme_stats.append(
            ProgrammeIntakeStat(
                programme_code=prog_obj.code,
                programme_name=prog_obj.name,
                academic_year=intake_obj.academic_year,
                approved_intake=intake_obj.approved_intake,
                enrolled_count=enrolled_count,
                is_exceeded=is_exceeded,
            )
        )

    # Latest 5 uploads
    latest_uploads = db.query(DataUpload).filter(
        DataUpload.institution_id == auth.institution_id
    ).order_by(DataUpload.created_at.desc()).limit(5).all()

    return DashboardStats(
        institution_id=str(auth.institution_id),
        institution_name=institution_name,
        total_processed_records=total_proc,
        total_accepted_records=total_acc,
        total_rejected_records=total_rej,
        open_anomaly_count=open_anomalies,
        intake_discrepancy_count=intake_discrepancy_count,
        latest_uploads=latest_uploads,
        programme_stats=programme_stats,
    )


@router.get("/admin/dashboard", response_model=AdminDashboardStats)
def get_admin_dashboard(
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """Central administrative overview across all AICTE institutions."""
    require_role(auth, {Role.AICTE_ADMIN, Role.AICTE_ANALYST, Role.INSTITUTE_ADMIN})

    total_institutions = db.query(func.count(Institution.id)).scalar() or 0
    total_uploads = db.query(func.count(DataUpload.id)).scalar() or 0

    aggregates = db.query(
        func.coalesce(func.sum(DataUpload.total_rows), 0),
        func.coalesce(func.sum(DataUpload.accepted_rows), 0),
    ).first()

    total_open_anomalies = db.query(func.count(AnomalyCase.id)).filter(
        AnomalyCase.status == "OPEN"
    ).scalar() or 0

    institutions = db.query(Institution).all()
    summaries = []
    for inst in institutions:
        inst_uploads = db.query(func.count(DataUpload.id)).filter(DataUpload.institution_id == inst.id).scalar() or 0
        inst_anomalies = db.query(func.count(AnomalyCase.id)).filter(
            AnomalyCase.institution_id == inst.id,
            AnomalyCase.status == "OPEN",
        ).scalar() or 0
        summaries.append({
            "institution_id": inst.id,
            "code": inst.code,
            "name": inst.name,
            "uploads_count": inst_uploads,
            "open_anomalies": inst_anomalies,
        })

    return AdminDashboardStats(
        total_institutions=total_institutions,
        total_uploads=total_uploads,
        total_processed_records=int(aggregates[0]),
        total_accepted_records=int(aggregates[1]),
        total_open_anomalies=total_open_anomalies,
        institution_summaries=summaries,
    )

