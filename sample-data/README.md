# APAARSetu — Synthetic Demonstration Datasets

> [!IMPORTANT]
> **DISCLOSURE & COMPLIANCE NOTICE**:
> All records in this directory are **strictly synthetic and fictional**.
> - No real student Personally Identifiable Information (PII) is contained herein.
> - The 12-digit numeric values represent fictional mock values formatted to test structural validation (`^\d{12}$`). They do **not** represent real APAAR IDs or Aadhaar numbers.
> - These files are provided solely for local testing, quality assurance, and demonstration of batch CSV ingestion, intake limit enforcement, and anomaly detection.
> - These files must not be imported into production systems or represented as authentic government records.

---

## Included Demonstration Files

1. **`synthetic_students.csv`**:
   - Standard student enrolment batch file for testing institutional CSV ingestion.
   - Columns: `student_ref`, `apaar_id`, `programme_code`, `academic_year`, `category`.
   - Includes valid entries across branches (CSE, ECE, MECH) as well as intentional boundary cases to demonstrate format checking and duplicate candidate detection.

2. **`synthetic_intake.csv`**:
   - Reference table of sanctioned intake quotas by programme for Academic Session 2026–27.
   - Columns: `institution_code`, `programme_code`, `programme_name`, `academic_year`, `approved_intake`.

3. **`synthetic_verification_requests.csv`**:
   - Reference records of external academic verification requests.
   - Columns: `request_id`, `student_ref`, `requester_org`, `requester_email`, `purpose`, `scope`, `consent_status`.

