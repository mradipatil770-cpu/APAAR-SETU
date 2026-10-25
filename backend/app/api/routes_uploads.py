from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_user_context, AuthenticatedContext, enforce_institution_access
from app.schemas.schemas import UploadResponse, UploadDetailResponse, ValidationIssueResponse
from app.models.models import DataUpload, ValidationIssue
from app.services.upload_service import process_upload_transaction

router = APIRouter(prefix="/api/v1/uploads", tags=["Uploads"])


@router.get("", response_model=List[UploadResponse])
def list_uploads(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """Lists upload history for the authenticated institution with pagination."""
    query = db.query(DataUpload).filter(DataUpload.institution_id == auth.institution_id)
    uploads = query.order_by(DataUpload.created_at.desc()).offset(offset).limit(limit).all()
    return uploads


@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_csv_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Accepts multipart CSV upload, validates data against institution rules,
    detects anomalies/duplicates, and persists records in a single transaction.
    """
    if not auth.can_upload():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Insufficient privileges to upload institutional CSV records.",
        )

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File must be a CSV file with a .csv extension.",
        )

    content = await file.read()
    upload_record, val_result = process_upload_transaction(
        db=db,
        institution_id=auth.institution_id,
        filename=file.filename,
        content=content,
        user_id=auth.user_id,
        actor_role=auth.role,
    )
    return upload_record


@router.get("/{upload_id}", response_model=UploadDetailResponse)
def get_upload_detail(
    upload_id: str,
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """Retrieves full upload details and associated validation issues."""
    upload = db.query(DataUpload).filter(DataUpload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload batch not found.")

    enforce_institution_access(auth, upload.institution_id)
    return upload


@router.get("/{upload_id}/errors", response_model=List[ValidationIssueResponse])
def get_upload_errors(
    upload_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """Retrieves row-level validation issues encountered during upload processing."""
    upload = db.query(DataUpload).filter(DataUpload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload batch not found.")

    enforce_institution_access(auth, upload.institution_id)

    issues = db.query(ValidationIssue).filter(
        ValidationIssue.upload_id == upload_id
    ).order_by(ValidationIssue.row_number.asc()).offset(offset).limit(limit).all()

    return issues

