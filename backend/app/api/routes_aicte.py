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
)
from app.schemas.schemas import (
    CentralDashboardStats,
    InstitutionDirectoryItem,
    CrossInstitutionCandidateResponse,
    UploadResponse,
    ProgrammeIntakeStat,
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

    # Programme-wise national aggregation
    progs_agg = db.query(
        Programme.code,
        Programme.name,
        func.coalesce(func.sum(ApprovedIntake.approved_intake), 0).label("approved_seats"),
    ).outerjoin(
        ApprovedIntake, Programme.id == ApprovedIntake.programme_id
    ).group_by(Programme.code, Programme.name).all()

    programme_breakdown = []
    for code, name, approved in progs_agg:
        enrolled = db.query(func.count(Enrolment.id)).join(
            Programme, Enrolment.programme_id == Programme.id
        ).filter(Programme.code == code).scalar() or 0

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
    """
    enforce_central_regulatory_access(auth)

    query = db.query(Institution)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (Institution.name.ilike(search_filter)) | (Institution.code.ilike(search_filter))
        )

    institutions = query.order_by(Institution.name.asc()).offset(offset).limit(limit).all()

    items = []
    for inst in institutions:
        prog_count = db.query(func.count(Programme.id)).filter(Programme.institution_id == inst.id).scalar() or 0
        approved_intake = db.query(
            func.coalesce(func.sum(ApprovedIntake.approved_intake), 0)
        ).filter(ApprovedIntake.institution_id == inst.id).scalar() or 0

        enrolled_count = db.query(func.count(Enrolment.id)).filter(
            Enrolment.institution_id == inst.id
        ).scalar() or 0

        open_anomalies = db.query(func.count(AnomalyCase.id)).filter(
            AnomalyCase.institution_id == inst.id,
            AnomalyCase.status == "OPEN",
        ).scalar() or 0

        latest_upload = db.query(DataUpload.created_at).filter(
            DataUpload.institution_id == inst.id
        ).order_by(DataUpload.created_at.desc()).first()

        util_pct = round((enrolled_count / approved_intake * 100), 1) if approved_intake > 0 else 0.0

        items.append(
            InstitutionDirectoryItem(
                id=str(inst.id),
                code=inst.code,
                name=inst.name,
                programme_count=prog_count,
                approved_intake=int(approved_intake),
                enrolled_count=int(enrolled_count),
                utilization_pct=util_pct,
                open_anomalies=open_anomalies,
                latest_upload_at=latest_upload[0] if latest_upload else None,
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

    programme_stats = []
    for intake_obj, prog_obj in intakes:
        enrolled_count = db.query(func.count(Enrolment.id)).filter(
            Enrolment.institution_id == inst.id,
            Enrolment.programme_id == prog_obj.id,
            Enrolment.academic_year == intake_obj.academic_year,
        ).scalar() or 0

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

    summary = []
    for code, name, year, approved in results:
        enrolled = db.query(func.count(Enrolment.id)).join(
            Programme, Enrolment.programme_id == Programme.id
        ).filter(
            Programme.code == code,
            Enrolment.academic_year == year,
        ).scalar() or 0

        summary.append({
            "programme_code": code,
            "programme_name": name,
            "academic_year": year,
            "total_approved_intake": int(approved),
            "total_enrolled": int(enrolled),
            "utilization_pct": round((enrolled / approved * 100), 1) if approved > 0 else 0.0,
        })

    return summary

