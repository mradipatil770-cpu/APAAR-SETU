from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct

from app.database.session import get_db
from app.core.security import get_current_user_context, AuthenticatedContext, CENTRAL_ROLES
from app.core.crypto import crypto_service
from app.models.models import (
    Institution,
    Programme,
    ApprovedIntake,
    DataUpload,
    Student,
    Enrolment,
    AnomalyCase,
    AuditLog,
    StudentTransfer,
)
from app.schemas.schemas import (
    CentralDashboardStats,
    InstitutionDirectoryItem,
    CrossInstitutionCandidateResponse,
    UploadResponse,
    ProgrammeIntakeStat,
    PendingInstitutionResponse,
    InstitutionApprovalRequest,
    StudentTransferResponse,
    StudentTransferDecisionRequest,
)

router = APIRouter(prefix="/api/v1/aicte", tags=["Central AICTE Oversight"])


def enforce_central_regulatory_access(auth: AuthenticatedContext) -> None:
    if not auth.is_central():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Central AICTE oversight endpoints require central regulatory privileges.",
        )


@router.get("/dashboard", response_model=CentralDashboardStats)
def get_central_dashboard(
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Returns national-level aggregated metrics across all onboarded institutions:
    - Total institutions & programmes
    - National intake capacity vs accepted enrolments
    - Open regulatory anomaly cases
    - Cross-institution collision candidate counts
    - Recent national upload events
    """
    enforce_central_regulatory_access(auth)

    total_insts = db.query(func.count(Institution.id)).scalar() or 0
    total_progs = db.query(func.count(Programme.id)).scalar() or 0

    upload_aggregates = db.query(
        func.coalesce(func.sum(DataUpload.total_rows), 0),
        func.coalesce(func.sum(DataUpload.accepted_rows), 0),
        func.coalesce(func.sum(DataUpload.rejected_rows), 0),
    ).first()

    total_proc = int(upload_aggregates[0])
    total_acc = int(upload_aggregates[1])
    total_rej = int(upload_aggregates[2])

    total_intake = db.query(func.coalesce(func.sum(ApprovedIntake.approved_intake), 0)).scalar() or 0
    utilization_pct = round((total_acc / total_intake * 100), 1) if total_intake > 0 else 0.0

    open_anomalies = db.query(func.count(AnomalyCase.id)).filter(
        AnomalyCase.status == "OPEN"
    ).scalar() or 0

    # Cross-institution duplicate candidates: lookup hashes appearing in >1 institution
    cross_dup_subq = db.query(
        Student.apaar_lookup_hash
    ).filter(
        Student.apaar_lookup_hash.isnot(None)
    ).group_by(
        Student.apaar_lookup_hash
    ).having(
        func.count(distinct(Student.institution_id)) > 1
    ).subquery()

    total_cross_dups = db.query(func.count(cross_dup_subq.c.apaar_lookup_hash)).scalar() or 0

    latest_uploads = db.query(DataUpload).order_by(DataUpload.created_at.desc()).limit(10).all()

    # Programme-wise national aggregation (Batch query instead of N+1)
    progs_agg = db.query(
        Programme.code,
        Programme.name,
        func.coalesce(func.sum(ApprovedIntake.approved_intake), 0).label("approved_seats"),
    ).outerjoin(
        ApprovedIntake, Programme.id == ApprovedIntake.programme_id
    ).group_by(Programme.code, Programme.name).all()

    # Single batch query for national enrolments by programme code
    enrolled_by_code = dict(
        db.query(Programme.code, func.count(Enrolment.id))
        .join(Programme, Enrolment.programme_id == Programme.id)
        .group_by(Programme.code)
        .all()
    )

    programme_breakdown = []
    for code, name, approved in progs_agg:
        enrolled = enrolled_by_code.get(code, 0)
        programme_breakdown.append({
            "programme_code": code,
            "programme_name": name,
            "approved_intake": int(approved),
            "enrolled_count": int(enrolled),
            "utilization_pct": round((enrolled / approved * 100), 1) if approved > 0 else 0.0,
        })

    return CentralDashboardStats(
        total_institutions=total_insts,
        total_programmes=total_progs,
        total_processed_records=total_proc,
        total_accepted_records=total_acc,
        total_rejected_records=total_rej,
        total_approved_intake=int(total_intake),
        national_utilization_pct=utilization_pct,
        total_open_anomalies=open_anomalies,
        total_cross_institution_duplicates=total_cross_dups,
        latest_uploads=latest_uploads,
        programme_breakdown=programme_breakdown,
    )


@router.get("/institutions", response_model=List[InstitutionDirectoryItem])
def list_institutions_directory(
    search: Optional[str] = Query(None, description="Search by institution name or code"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Searchable and filterable institution directory for central regulatory monitoring.
    Uses batch grouped aggregations to eliminate N+1 database round trips.
    """
    enforce_central_regulatory_access(auth)

    query = db.query(Institution)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (Institution.name.ilike(search_filter)) | (Institution.code.ilike(search_filter))
        )

    institutions = query.order_by(Institution.name.asc()).offset(offset).limit(limit).all()
    if not institutions:
        return []

    inst_ids = [inst.id for inst in institutions]

    # Batch 1: Programme counts per institution
    prog_counts = dict(
        db.query(Programme.institution_id, func.count(Programme.id))
        .filter(Programme.institution_id.in_(inst_ids))
        .group_by(Programme.institution_id)
        .all()
    )

    # Batch 2: Approved intake sums per institution
    intake_sums = dict(
        db.query(ApprovedIntake.institution_id, func.coalesce(func.sum(ApprovedIntake.approved_intake), 0))
        .filter(ApprovedIntake.institution_id.in_(inst_ids))
        .group_by(ApprovedIntake.institution_id)
        .all()
    )

    # Batch 3: Enrolment counts per institution
    enrolment_counts = dict(
        db.query(Enrolment.institution_id, func.count(Enrolment.id))
        .filter(Enrolment.institution_id.in_(inst_ids))
        .group_by(Enrolment.institution_id)
        .all()
    )

    # Batch 4: Open anomalies per institution
    anomaly_counts = dict(
        db.query(AnomalyCase.institution_id, func.count(AnomalyCase.id))
        .filter(AnomalyCase.institution_id.in_(inst_ids), AnomalyCase.status == "OPEN")
        .group_by(AnomalyCase.institution_id)
        .all()
    )

    # Batch 5: Latest upload timestamp per institution
    latest_uploads = dict(
        db.query(DataUpload.institution_id, func.max(DataUpload.created_at))
        .filter(DataUpload.institution_id.in_(inst_ids))
        .group_by(DataUpload.institution_id)
        .all()
    )

    items = []
    for inst in institutions:
        p_count = prog_counts.get(inst.id, 0)
        appr_intake = int(intake_sums.get(inst.id, 0))
        enr_count = int(enrolment_counts.get(inst.id, 0))
        op_anom = anomaly_counts.get(inst.id, 0)
        last_up = latest_uploads.get(inst.id, None)

        util_pct = round((enr_count / appr_intake * 100), 1) if appr_intake > 0 else 0.0

        items.append(
            InstitutionDirectoryItem(
                id=str(inst.id),
                code=inst.code,
                name=inst.name,
                programme_count=p_count,
                approved_intake=appr_intake,
                enrolled_count=enr_count,
                utilization_pct=util_pct,
                open_anomalies=op_anom,
                latest_upload_at=last_up,
            )
        )

    return items


@router.get("/institutions/{institution_id}")
def get_central_institution_detail(
    institution_id: str,
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Retrieves full institutional compliance profile for central regulatory audit.
    """
    enforce_central_regulatory_access(auth)

    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution record not found.",
        )

    # Programmes with capacity
    intakes = db.query(ApprovedIntake, Programme).join(
        Programme, ApprovedIntake.programme_id == Programme.id
    ).filter(ApprovedIntake.institution_id == inst.id).all()

    enrolment_map = {
        (str(row[0]), str(row[1])): int(row[2])
        for row in db.query(
            Enrolment.programme_id,
            Enrolment.academic_year,
            func.count(Enrolment.id),
        ).filter(
            Enrolment.institution_id == inst.id
        ).group_by(
            Enrolment.programme_id,
            Enrolment.academic_year,
        ).all()
    }

    programme_stats = []
    for intake_obj, prog_obj in intakes:
        enrolled_count = enrolment_map.get((str(prog_obj.id), str(intake_obj.academic_year)), 0)

        programme_stats.append({
            "programme_code": prog_obj.code,
            "programme_name": prog_obj.name,
            "academic_year": intake_obj.academic_year,
            "approved_intake": intake_obj.approved_intake,
            "enrolled_count": enrolled_count,
            "is_exceeded": enrolled_count > intake_obj.approved_intake,
        })

    recent_uploads = db.query(DataUpload).filter(
        DataUpload.institution_id == inst.id
    ).order_by(DataUpload.created_at.desc()).limit(10).all()

    open_anomalies = db.query(func.count(AnomalyCase.id)).filter(
        AnomalyCase.institution_id == inst.id,
        AnomalyCase.status == "OPEN",
    ).scalar() or 0

    return {
        "id": str(inst.id),
        "code": inst.code,
        "name": inst.name,
        "open_anomalies": open_anomalies,
        "programmes": programme_stats,
        "recent_uploads": recent_uploads,
    }


@router.get("/duplicate-candidates", response_model=List[CrossInstitutionCandidateResponse])
def get_cross_institution_duplicate_candidates(
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Central review queue for potential cross-institution duplicate enrolments.
    Uses keyed HMAC blind indexing without exposing raw identifiers.
    """
    enforce_central_regulatory_access(auth)

    # Find lookup hashes appearing in multiple institutions
    collisions = db.query(
        Student.apaar_lookup_hash,
        func.count(distinct(Student.institution_id)).label("inst_count"),
    ).filter(
        Student.apaar_lookup_hash.isnot(None)
    ).group_by(
        Student.apaar_lookup_hash
    ).having(
        func.count(distinct(Student.institution_id)) > 1
    ).all()

    candidates: List[CrossInstitutionCandidateResponse] = []
    for lookup_hash, count in collisions:
        students = db.query(Student, Institution).join(
            Institution, Student.institution_id == Institution.id
        ).filter(Student.apaar_lookup_hash == lookup_hash).all()

        inst_codes = list({inst.code for _, inst in students})
        srefs = [s.student_ref for s, _ in students]
        masked = next((s.apaar_id for s, _ in students if s.apaar_id), "XXXXXXXX0000")

        # Academic years from enrolments
        student_ids = [s.id for s, _ in students]
        enrolment_years = db.query(Enrolment.academic_year).filter(
            Enrolment.student_id.in_(student_ids)
        ).distinct().all()
        years = [y[0] for y in enrolment_years]

        candidates.append(
            CrossInstitutionCandidateResponse(
                apaar_lookup_hash=lookup_hash,
                masked_apaar=masked,
                student_count=len(students),
                institutions=inst_codes,
                student_refs=srefs,
                academic_years=years,
                risk_level="CONCURRENT_ENROLMENT_CANDIDATE",
            )
        )

    return candidates


@router.get("/intake-summary")
def get_national_intake_summary(
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Returns programme-wise national intake quota summaries.
    """
    enforce_central_regulatory_access(auth)

    results = db.query(
        Programme.code,
        Programme.name,
        ApprovedIntake.academic_year,
        func.sum(ApprovedIntake.approved_intake).label("total_approved"),
    ).join(
        ApprovedIntake, Programme.id == ApprovedIntake.programme_id
    ).group_by(
        Programme.code, Programme.name, ApprovedIntake.academic_year
    ).order_by(Programme.code.asc()).all()

    # Batch query for enrolments by (programme_code, academic_year)
    enrolled_by_code_year = {
        (row[0], row[1]): int(row[2])
        for row in db.query(
            Programme.code,
            Enrolment.academic_year,
            func.count(Enrolment.id),
        ).join(
            Programme, Enrolment.programme_id == Programme.id
        ).group_by(
            Programme.code,
            Enrolment.academic_year,
        ).all()
    }

    summary = []
    for code, name, year, approved in results:
        enrolled = enrolled_by_code_year.get((code, year), 0)

        summary.append({
            "programme_code": code,
            "programme_name": name,
            "academic_year": year,
            "total_approved_intake": int(approved),
            "total_enrolled": int(enrolled),
            "utilization_pct": round((enrolled / approved * 100), 1) if approved > 0 else 0.0,
        })

    return summary


# -----------------------------------------------------------------
# Institutional Onboarding Approvals (Central Regulatory Gate)
# -----------------------------------------------------------------
@router.get("/pending-institutions", response_model=List[PendingInstitutionResponse])
def list_pending_institutions(
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Lists all institutions with status 'PENDING_VERIFICATION' awaiting AICTE regulatory approval.
    """
    enforce_central_regulatory_access(auth)
    pending = db.query(Institution).filter(Institution.status == "PENDING_VERIFICATION").order_by(Institution.created_at.desc()).all()
    return pending


@router.post("/institutions/{institution_id}/decide", response_model=PendingInstitutionResponse)
def decide_institution_onboarding(
    institution_id: str,
    payload: InstitutionApprovalRequest,
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Approves or rejects a newly registered institution.
    Only AICTE_ADMIN can approve new institutions.
    """
    enforce_central_regulatory_access(auth)
    if auth.role != "AICTE_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only AICTE_ADMIN role has authority to approve or reject institution registrations.",
        )

    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution with ID '{institution_id}' was not found.",
        )

    prev_status = inst.status
    inst.status = payload.status

    # Record immutable audit log
    audit = AuditLog(
        institution_id=inst.id,
        user_id=auth.user_id,
        actor_role=auth.role,
        action="INSTITUTION_VERIFICATION_DECIDED",
        target_id=str(inst.id),
        details=f"Status changed from {prev_status} to {payload.status} by AICTE Admin {auth.email}. Remarks: {payload.review_remarks or 'None'}",
        status="SUCCESS",
    )
    db.add(audit)
    db.commit()
    db.refresh(inst)

    return inst


# -----------------------------------------------------------------
# Student Transfers & Dual Enrolments Central Oversight
# -----------------------------------------------------------------
@router.get("/transfers", response_model=List[StudentTransferResponse])
def list_all_transfers(
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Central review of all cross-institution student transfer requests.
    """
    enforce_central_regulatory_access(auth)
    transfers = db.query(StudentTransfer).order_by(StudentTransfer.created_at.desc()).all()
    
    resp = []
    for t in transfers:
        from_name = t.from_institution.name if t.from_institution else None
        to_name = t.to_institution.name if t.to_institution else None
        resp.append(StudentTransferResponse(
            id=str(t.id),
            student_id=str(t.student_id),
            student_ref=t.student_ref,
            from_institution_id=str(t.from_institution_id),
            from_institution_name=from_name,
            to_institution_id=str(t.to_institution_id),
            to_institution_name=to_name,
            apaar_id_masked=t.apaar_id_masked,
            transfer_reason=t.transfer_reason,
            status=t.status,
            remarks=t.remarks,
            created_at=t.created_at,
            updated_at=t.updated_at,
        ))
    return resp


@router.post("/transfers/{transfer_id}/decide", response_model=StudentTransferResponse)
def decide_transfer(
    transfer_id: str,
    payload: StudentTransferDecisionRequest,
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Central AICTE adjudication of disputed or pending student transfers.
    """
    enforce_central_regulatory_access(auth)
    transfer = db.query(StudentTransfer).filter(StudentTransfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transfer request '{transfer_id}' not found.",
        )

    transfer.status = payload.status
    transfer.remarks = payload.remarks
    transfer.decided_by = auth.user_id
    import datetime
    transfer.decided_at = datetime.datetime.now(datetime.timezone.utc)

    # If APPROVED, update student's institution_id
    if payload.status == "APPROVED":
        student = db.query(Student).filter(Student.id == transfer.student_id).first()
        if student:
            student.institution_id = transfer.to_institution_id

    audit = AuditLog(
        institution_id=transfer.to_institution_id,
        user_id=auth.user_id,
        actor_role=auth.role,
        action="STUDENT_TRANSFER_DECIDED",
        target_id=str(transfer.id),
        details=f"Transfer for student {transfer.student_ref} marked {payload.status}. Remarks: {payload.remarks}",
        status="SUCCESS",
    )
    db.add(audit)
    db.commit()
    db.refresh(transfer)

    return StudentTransferResponse(
        id=str(transfer.id),
        student_id=str(transfer.student_id),
        student_ref=transfer.student_ref,
        from_institution_id=str(transfer.from_institution_id),
        from_institution_name=transfer.from_institution.name if transfer.from_institution else None,
        to_institution_id=str(transfer.to_institution_id),
        to_institution_name=transfer.to_institution.name if transfer.to_institution else None,
        apaar_id_masked=transfer.apaar_id_masked,
        transfer_reason=transfer.transfer_reason,
        status=transfer.status,
        remarks=transfer.remarks,
        created_at=transfer.created_at,
        updated_at=transfer.updated_at,
    )


