import csv
import io
import uuid
import hashlib
import logging
from typing import Tuple, List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.models import (
    DataUpload,
    StagingRow,
    Student,
    Enrolment,
    ValidationIssue,
    AnomalyCase,
    Programme,
    ApprovedIntake,
    AuditLog,
)
from app.services.validation_service import (
    validate_csv_rows,
    REQUIRED_COLUMNS,
    ValidationResult,
)
from app.core.crypto import crypto_service
from app.core.config import settings

logger = logging.getLogger("apaarsetu.upload")


def compute_file_hash(content: bytes) -> str:
    """Computes SHA-256 hash for file idempotency and auditing."""
    return hashlib.sha256(content).hexdigest()


def parse_and_validate_csv_content(content: bytes) -> List[Dict[str, str]]:
    """Decodes and parses CSV bytes in memory, enforcing basic size and structure limits."""
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded CSV file is completely empty.",
        )

    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE if hasattr(status, "HTTP_413_CONTENT_TOO_LARGE") else 413,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES} bytes.",
        )

    try:
        text_data = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            text_data = content.decode("latin-1")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unable to decode file. Please upload a valid UTF-8 encoded CSV file.",
            )

    reader = csv.DictReader(io.StringIO(text_data))
    if not reader.fieldnames:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file contains no valid header row.",
        )

    clean_headers = {col.strip().lower() for col in reader.fieldnames if col}
    missing_required = REQUIRED_COLUMNS - clean_headers
    if missing_required:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"CSV missing mandatory column(s): {', '.join(sorted(missing_required))}. Expected columns: {', '.join(sorted(REQUIRED_COLUMNS))}",
        )

    rows: List[Dict[str, str]] = []
    for row in reader:
        if len(rows) >= settings.MAX_UPLOAD_ROWS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CSV file exceeds maximum limit of {settings.MAX_UPLOAD_ROWS} rows.",
            )
        normalized_row = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items() if k}
        rows.append(normalized_row)

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file contains headers but no data rows.",
        )

    return rows


def process_upload_transaction(
    db: Session,
    institution_id: str,
    filename: str,
    content: bytes,
    user_id: Optional[str] = None,
    actor_role: str = "INSTITUTE_ADMIN",
) -> Tuple[DataUpload, ValidationResult]:
    """
    Executes complete CSV upload pipeline within a strict database transaction:
    1. Enforces idempotency via SHA-256 digest.
    2. Parses and validates in-memory without disk leakage.
    3. Uses blind HMAC indexing for duplicate detection.
    4. Encrypts recoverable identifiers with AES-256-GCM.
    5. Saves staging rows and transactionally commits students, enrolments, issues, and audit logs.
    """
    file_hash = compute_file_hash(content)
    correlation_id = str(uuid.uuid4())

    # 1. Idempotency check: has this identical file already been uploaded?
    existing_upload = db.query(DataUpload).filter(
        DataUpload.institution_id == institution_id,
        DataUpload.file_hash == file_hash,
        DataUpload.status == "COMPLETED"
    ).first()
    if existing_upload:
        logger.info(f"Duplicate upload detected with hash {file_hash}. Returning existing upload ID {existing_upload.id}.")
        dummy_result = ValidationResult()
        dummy_result.total_rows = existing_upload.total_rows
        dummy_result.accepted_count = existing_upload.accepted_rows
        dummy_result.rejected_count = existing_upload.rejected_rows
        return existing_upload, dummy_result

    # 2. In-memory parse
    rows = parse_and_validate_csv_content(content)

    # 3. Master records lookup
    programmes = db.query(Programme).filter(Programme.institution_id == institution_id).all()
    prog_map = {p.code.upper(): p.id for p in programmes}

    intakes = db.query(ApprovedIntake, Programme).join(
        Programme, ApprovedIntake.programme_id == Programme.id
    ).filter(ApprovedIntake.institution_id == institution_id).all()
    intake_map = {(prog.code.upper(), intake.academic_year): intake.approved_intake for intake, prog in intakes}

    enrolled_counts_query = db.query(
        Programme.code,
        Enrolment.academic_year,
        func.count(Enrolment.id)
    ).join(
        Programme, Enrolment.programme_id == Programme.id
    ).filter(
        Enrolment.institution_id == institution_id
    ).group_by(Programme.code, Enrolment.academic_year).all()

    current_counts: Dict[Tuple[str, str], int] = {
        (code.upper(), year): count for code, year, count in enrolled_counts_query
    }

    # 4. Fetch existing enrolments using privacy-preserving HMAC lookup hash or student_ref
    existing_enrolments_query = db.query(
        Student.apaar_lookup_hash,
        Student.student_ref,
        Enrolment.academic_year
    ).join(
        Enrolment, Student.id == Enrolment.student_id
    ).filter(
        Enrolment.institution_id == institution_id
    ).all()

    existing_enrolments_set = set()
    for lookup_hash, sref, year in existing_enrolments_query:
        if lookup_hash:
            existing_enrolments_set.add((lookup_hash, year))
        if sref:
            existing_enrolments_set.add((sref, year))

    # 5. Deterministic validation with identifier masking
    val_result = validate_csv_rows(
        rows=rows,
        configured_programmes=prog_map,
        configured_intakes=intake_map,
        existing_enrolments=existing_enrolments_set,
        current_enrolled_counts=current_counts,
    )

    # 6. Atomic Database Transaction Write
    try:
        upload_record = DataUpload(
            institution_id=institution_id,
            filename=filename,
            file_hash=file_hash,
            total_rows=val_result.total_rows,
            accepted_rows=val_result.accepted_count,
            rejected_rows=val_result.rejected_count,
            issue_count=len(val_result.issues),
            status="COMPLETED",
        )
        db.add(upload_record)
        db.flush()

        # Temporary Staging Rows
        for r_idx, row_item in enumerate(rows, start=1):
            stg = StagingRow(
                upload_id=upload_record.id,
                row_number=r_idx,
                student_ref=row_item.get("student_ref", "UNKNOWN"),
                apaar_lookup_hash=crypto_service.compute_hmac_token(row_item.get("apaar_id", "")),
                programme_code=row_item.get("programme_code", "UNKNOWN"),
                academic_year=row_item.get("academic_year", "UNKNOWN"),
                category=row_item.get("category", ""),
                validation_status="PROCESSED",
            )
            db.add(stg)

        # Validation Issues (Masked identifiers)
        for issue in val_result.issues:
            issue_record = ValidationIssue(
                upload_id=upload_record.id,
                row_number=issue["row_number"],
                student_ref=issue.get("student_ref"),
                apaar_id=issue.get("apaar_id"), # Masked e.g. XXXXXXXX1234
                issue_code=issue["issue_code"],
                severity=issue["severity"],
                explanation=issue["explanation"],
            )
            db.add(issue_record)

        # Anomaly Cases for Human-in-the-Loop Review
        for anomaly in val_result.anomalies:
            anomaly_record = AnomalyCase(
                upload_id=upload_record.id,
                institution_id=institution_id,
                student_ref=anomaly.get("student_ref"),
                apaar_id=anomaly.get("apaar_id"), # Masked
                issue_code=anomaly["issue_code"],
                explanation=anomaly["explanation"],
                status="OPEN",
            )
            db.add(anomaly_record)

        # Accepted Students & Enrolments (AES-256-GCM encrypted + HMAC indexed)
        for accepted in val_result.accepted_rows:
            raw_apaar = accepted.get("raw_apaar_id", "")
            masked_apaar = accepted.get("masked_apaar", "")
            hmac_token = accepted.get("apaar_lookup_hash")

            ciphertext, nonce, key_ver = ("", "", "v1")
            if raw_apaar:
                ciphertext, nonce, key_ver = crypto_service.encrypt_identifier(
                    raw_apaar,
                    associated_data=institution_id
                )

            student = db.query(Student).filter(
                Student.institution_id == institution_id,
                Student.student_ref == accepted["student_ref"],
            ).first()

            if not student:
                student = Student(
                    institution_id=institution_id,
                    student_ref=accepted["student_ref"],
                    apaar_id=masked_apaar,
                    apaar_encrypted=ciphertext or None,
                    apaar_nonce=nonce or None,
                    apaar_lookup_hash=hmac_token or None,
                    apaar_key_version=key_ver,
                    category=accepted.get("category"),
                )
                db.add(student)
                db.flush()
            else:
                # Update encrypted credentials if newly presented
                if raw_apaar and not student.apaar_encrypted:
                    student.apaar_id = masked_apaar
                    student.apaar_encrypted = ciphertext
                    student.apaar_nonce = nonce
                    student.apaar_lookup_hash = hmac_token
                    student.apaar_key_version = key_ver

            existing_enrolment = db.query(Enrolment).filter(
                Enrolment.student_id == student.id,
                Enrolment.programme_id == accepted["programme_id"],
                Enrolment.academic_year == accepted["academic_year"],
            ).first()

            if not existing_enrolment:
                enrolment = Enrolment(
                    upload_id=upload_record.id,
                    student_id=student.id,
                    institution_id=institution_id,
                    programme_id=accepted["programme_id"],
                    academic_year=accepted["academic_year"],
                    enrolment_status="VALID",
                )
                db.add(enrolment)

        # Audit Log Entry with Full Traceability
        audit_user_id = None
        if user_id:
            try:
                audit_user_id = str(uuid.UUID(str(user_id)))
            except (ValueError, TypeError, AttributeError):
                audit_user_id = None

        audit = AuditLog(
            institution_id=institution_id,
            user_id=audit_user_id,
            actor_role=actor_role,
            target_id=str(upload_record.id),
            action="CSV_UPLOAD_PROCESSED",
            status="SUCCESS",
            correlation_id=correlation_id,
            details=f"Processed '{filename}': {val_result.accepted_count} accepted, {val_result.rejected_count} rejected, {len(val_result.issues)} issues.",
        )
        db.add(audit)

        db.commit()
        db.refresh(upload_record)
        return upload_record, val_result

    except Exception as exc:
        db.rollback()
        logger.error(f"Failed transaction while persisting CSV upload: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database transaction failed while saving upload records. Transaction was safely rolled back.",
        )
