import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_user_context, AuthenticatedContext, enforce_institution_access, Role
from app.models.models import Student, StudentTransfer, Institution, AuditLog
from app.schemas.schemas import (
    StudentTransferRequest,
    StudentTransferDecisionRequest,
    StudentTransferResponse,
)

router = APIRouter(prefix="/api/v1/transfers", tags=["Student Transfers"])


@router.get("", response_model=List[StudentTransferResponse])
def list_institution_transfers(
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Lists all inter-institutional student transfers associated with the authenticated institution
    (either as the originating source institution or the destination institution).
    """
    if auth.is_central():
        transfers = db.query(StudentTransfer).order_by(StudentTransfer.created_at.desc()).all()
    else:
        transfers = db.query(StudentTransfer).filter(
            (StudentTransfer.from_institution_id == auth.institution_id) |
            (StudentTransfer.to_institution_id == auth.institution_id)
        ).order_by(StudentTransfer.created_at.desc()).all()

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


@router.post("", response_model=StudentTransferResponse, status_code=status.HTTP_201_CREATED)
def initiate_student_transfer(
    payload: StudentTransferRequest,
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Initiates an inter-institutional migration request for an enrolled student.
    Guarantees tenant isolation: Source student must belong to the caller's institution.
    """
    # Verify student exists in caller's institution
    student = db.query(Student).filter(
        Student.institution_id == auth.institution_id,
        Student.student_ref == payload.student_ref.strip(),
    ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student record '{payload.student_ref}' not found in your institution.",
        )

    # Verify destination institution exists
    dest_inst = db.query(Institution).filter(
        Institution.code == payload.to_institution_code.strip().upper()
    ).first()

    if not dest_inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination institution code '{payload.to_institution_code}' does not exist.",
        )

    if str(dest_inst.id) == str(auth.institution_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot initiate transfer to the same institution.",
        )

    transfer_id = str(uuid.uuid4())
    transfer = StudentTransfer(
        id=transfer_id,
        student_id=student.id,
        from_institution_id=auth.institution_id,
        to_institution_id=dest_inst.id,
        student_ref=student.student_ref,
        apaar_id_masked=student.apaar_id,
        transfer_reason=payload.transfer_reason.strip(),
        status="PENDING_TRANSFER",
        requested_by=auth.user_id,
    )
    db.add(transfer)

    # Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        institution_id=auth.institution_id,
        user_id=auth.user_id,
        actor_role=auth.role,
        action="STUDENT_TRANSFER_INITIATED",
        target_id=transfer_id,
        details=f"Transfer initiated for student {student.student_ref} to {dest_inst.name} ({dest_inst.code}).",
        status="SUCCESS",
    )
    db.add(audit)
    db.commit()
    db.refresh(transfer)

    from_inst = db.query(Institution).filter(Institution.id == auth.institution_id).first()
    return StudentTransferResponse(
        id=str(transfer.id),
        student_id=str(transfer.student_id),
        student_ref=transfer.student_ref,
        from_institution_id=str(transfer.from_institution_id),
        from_institution_name=from_inst.name if from_inst else None,
        to_institution_id=str(transfer.to_institution_id),
        to_institution_name=dest_inst.name,
        apaar_id_masked=transfer.apaar_id_masked,
        transfer_reason=transfer.transfer_reason,
        status=transfer.status,
        remarks=transfer.remarks,
        created_at=transfer.created_at,
        updated_at=transfer.updated_at,
    )

