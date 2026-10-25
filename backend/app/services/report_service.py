import csv
import io
from typing import List, Any
from sqlalchemy.orm import Session
from app.models.models import DataUpload, ValidationIssue, AnomalyCase, Enrolment, Student, Programme
from app.core.crypto import crypto_service


def escape_csv_cell(value: Any) -> str:
    """
    Escapes CSV values to mitigate Spreadsheet Formula Injection (CWE-1236).
    If a string starts with =, +, -, @, tab, or carriage return, it prefixes it with a single quote (').
    """
    if value is None:
        return ""
    str_val = str(value)
    if str_val and str_val[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{str_val}"
    return str_val


def generate_institution_summary_csv(db: Session, institution_id: str) -> str:
    """Generates a comprehensive audit report of uploads, enrolments, and issues for an institution."""
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")

    # Section 1: Upload Batches
    writer.writerow(["# APAARSetu Institutional Summary Report"])
    writer.writerow(["# Generated at UTC"])
    writer.writerow([])
    writer.writerow(["[Upload History]"])
    writer.writerow(["Upload ID", "Filename", "Total Rows", "Accepted", "Rejected", "Issues", "Status", "Timestamp"])

    uploads = db.query(DataUpload).filter(
        DataUpload.institution_id == institution_id
    ).order_by(DataUpload.created_at.desc()).all()

    for u in uploads:
        writer.writerow([
            escape_csv_cell(u.id),
            escape_csv_cell(u.filename),
            escape_csv_cell(u.total_rows),
            escape_csv_cell(u.accepted_rows),
            escape_csv_cell(u.rejected_rows),
            escape_csv_cell(u.issue_count),
            escape_csv_cell(u.status),
            escape_csv_cell(u.created_at.isoformat() if u.created_at else ""),
        ])

    # Section 2: Open Anomalies Requiring Attention
    writer.writerow([])
    writer.writerow(["[Open Review Anomalies]"])
    writer.writerow(["Anomaly ID", "Upload ID", "Student Ref", "APAAR ID", "Issue Code", "Explanation", "Status", "Date"])

    anomalies = db.query(AnomalyCase).filter(
        AnomalyCase.institution_id == institution_id
    ).order_by(AnomalyCase.created_at.desc()).all()

    for a in anomalies:
        writer.writerow([
            escape_csv_cell(a.id),
            escape_csv_cell(a.upload_id),
            escape_csv_cell(a.student_ref),
            escape_csv_cell(crypto_service.mask_identifier(a.apaar_id)),
            escape_csv_cell(a.issue_code),
            escape_csv_cell(a.explanation),
            escape_csv_cell(a.status),
            escape_csv_cell(a.created_at.isoformat() if a.created_at else ""),
        ])

    return output.getvalue()

