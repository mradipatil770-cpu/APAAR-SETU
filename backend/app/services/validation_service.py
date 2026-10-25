import re
from typing import List, Dict, Any, Set, Tuple
from app.core.crypto import crypto_service

APAAR_REGEX = re.compile(r"^\d{12}$")
REQUIRED_COLUMNS = {"student_ref", "apaar_id", "programme_code", "academic_year", "category"}


class ValidationResult:
    def __init__(self):
        self.accepted_rows: List[Dict[str, Any]] = []
        self.issues: List[Dict[str, Any]] = []
        self.anomalies: List[Dict[str, Any]] = []
        self.total_rows: int = 0
        self.accepted_count: int = 0
        self.rejected_count: int = 0


def validate_csv_rows(
    rows: List[Dict[str, str]],
    configured_programmes: Dict[str, str], # code -> programme_id
    configured_intakes: Dict[Tuple[str, str], int], # (programme_code, academic_year) -> approved_intake
    existing_enrolments: Set[Tuple[str, str]], # (apaar_lookup_hash or student_ref, academic_year)
    current_enrolled_counts: Dict[Tuple[str, str], int], # (programme_code, academic_year) -> current count
) -> ValidationResult:
    """
    Deterministic business validation service for student records.
    Validates APAAR ID format (prototype rule), required fields, duplicates, programmes, and intakes.
    Masks all sensitive identifiers in captured validation issues and anomaly cases.
    """
    result = ValidationResult()
    result.total_rows = len(rows)

    seen_apaar_tokens_in_batch: Set[str] = set()
    seen_ref_in_batch: Set[str] = set()

    running_counts = dict(current_enrolled_counts)

    for idx, raw_row in enumerate(rows, start=1):
        row = {k.strip(): (v.strip() if v else "") for k, v in raw_row.items()}
        student_ref = row.get("student_ref", "")
        raw_apaar_id = row.get("apaar_id", "")
        programme_code = row.get("programme_code", "").upper()
        academic_year = row.get("academic_year", "")
        category = row.get("category", "").upper()

        masked_apaar = crypto_service.mask_identifier(raw_apaar_id) if raw_apaar_id else None
        apaar_hmac_token = crypto_service.compute_hmac_token(raw_apaar_id) if raw_apaar_id else None

        is_row_rejected = False

        # 1. R01: Missing Required Fields
        missing_fields = []
        for field in ["student_ref", "apaar_id", "programme_code", "academic_year", "category"]:
            if not row.get(field):
                missing_fields.append(field)

        if missing_fields:
            result.issues.append({
                "row_number": idx,
                "student_ref": student_ref or None,
                "apaar_id": masked_apaar,
                "issue_code": "MISSING_REQUIRED_FIELD",
                "severity": "ERROR",
                "explanation": f"Missing mandatory field(s): {', '.join(missing_fields)}.",
            })
            is_row_rejected = True

        # 2. R02: APAAR ID Format Check (Configurable prototype rule, not authoritative verification)
        if raw_apaar_id:
            normalized_apaar = crypto_service.normalize_identifier(raw_apaar_id)
            if not APAAR_REGEX.match(normalized_apaar):
                result.issues.append({
                    "row_number": idx,
                    "student_ref": student_ref or None,
                    "apaar_id": masked_apaar,
                    "issue_code": "FORMAT_INVALID",
                    "severity": "ERROR",
                    "explanation": (
                        f"Identifier format invalid. Expected 12-digit numeric structure. "
                        "(Note: Format validation is structural only and does not constitute official government APAAR verification)."
                    ),
                })
                is_row_rejected = True

        # 3. R03: Repeated Identifiers Within Upload Batch (Duplicate Candidate)
        if apaar_hmac_token and apaar_hmac_token in seen_apaar_tokens_in_batch:
            result.issues.append({
                "row_number": idx,
                "student_ref": student_ref or None,
                "apaar_id": masked_apaar,
                "issue_code": "DUPLICATE_CANDIDATE",
                "severity": "WARNING",
                "explanation": f"Candidate collision: APAAR ID appears multiple times within this upload batch.",
            })
            result.anomalies.append({
                "student_ref": student_ref or None,
                "apaar_id": masked_apaar,
                "issue_code": "DUPLICATE_CANDIDATE",
                "explanation": f"Batch duplicate collision detected for student reference '{student_ref}' at row {idx}.",
            })
        elif apaar_hmac_token:
            seen_apaar_tokens_in_batch.add(apaar_hmac_token)

        if student_ref and student_ref in seen_ref_in_batch:
            result.issues.append({
                "row_number": idx,
                "student_ref": student_ref,
                "apaar_id": masked_apaar,
                "issue_code": "DUPLICATE_CANDIDATE",
                "severity": "WARNING",
                "explanation": f"Candidate collision: Student reference '{student_ref}' appears multiple times in upload batch.",
            })
        elif student_ref:
            seen_ref_in_batch.add(student_ref)

        # 4. R04: Existing Active Enrolment Conflict
        if apaar_hmac_token and (apaar_hmac_token, academic_year) in existing_enrolments:
            result.issues.append({
                "row_number": idx,
                "student_ref": student_ref or None,
                "apaar_id": masked_apaar,
                "issue_code": "DUPLICATE_CANDIDATE",
                "severity": "WARNING",
                "explanation": f"Existing active enrolment conflict detected for academic year '{academic_year}'. Requires verification.",
            })
            result.anomalies.append({
                "student_ref": student_ref or None,
                "apaar_id": masked_apaar,
                "issue_code": "DUPLICATE_CANDIDATE",
                "explanation": f"Active enrolment conflict for academic year '{academic_year}'. Candidate flagged for administrative review.",
            })

        # 5. R05: Programme Master Check
        programme_id = configured_programmes.get(programme_code)
        if programme_code and not programme_id:
            result.issues.append({
                "row_number": idx,
                "student_ref": student_ref or None,
                "apaar_id": masked_apaar,
                "issue_code": "PROGRAMME_NOT_CONFIGURED",
                "severity": "ERROR",
                "explanation": f"Academic programme '{programme_code}' is not recognized or approved for this institution.",
            })
            is_row_rejected = True

        # 6. R06: Approved Intake Master Check
        intake_key = (programme_code, academic_year)
        approved_intake = configured_intakes.get(intake_key)
        if programme_code and academic_year and approved_intake is None:
            result.issues.append({
                "row_number": idx,
                "student_ref": student_ref or None,
                "apaar_id": masked_apaar,
                "issue_code": "INTAKE_NOT_CONFIGURED",
                "severity": "ERROR",
                "explanation": f"No approved intake quota configured for programme '{programme_code}' in academic year '{academic_year}'.",
            })
            is_row_rejected = True

        # 7. R07: Intake Capacity Check
        if approved_intake is not None and not is_row_rejected:
            current_count = running_counts.get(intake_key, 0)
            if current_count >= approved_intake:
                result.issues.append({
                    "row_number": idx,
                    "student_ref": student_ref or None,
                    "apaar_id": masked_apaar,
                    "issue_code": "INTAKE_MISMATCH",
                    "severity": "WARNING",
                    "explanation": (
                        f"Enrolment for programme '{programme_code}' ({academic_year}) exceeds AICTE approved intake of {approved_intake}. "
                        f"Total admitted count reaches {current_count + 1}."
                    ),
                })
                result.anomalies.append({
                    "student_ref": student_ref or None,
                    "apaar_id": masked_apaar,
                    "issue_code": "INTAKE_MISMATCH",
                    "explanation": f"Approved quota of {approved_intake} exceeded for {programme_code} ({academic_year}) at row {idx}.",
                })

            running_counts[intake_key] = current_count + 1

        # Accept or Reject
        if is_row_rejected:
            result.rejected_count += 1
        else:
            result.accepted_count += 1
            result.accepted_rows.append({
                "row_number": idx,
                "student_ref": student_ref,
                "raw_apaar_id": raw_apaar_id,
                "masked_apaar": masked_apaar,
                "apaar_lookup_hash": apaar_hmac_token,
                "programme_code": programme_code,
                "programme_id": programme_id,
                "academic_year": academic_year,
                "category": category,
            })

    return result
