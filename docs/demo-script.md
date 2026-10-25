# APAARSetu — 5-Minute Demonstration Walkthrough

This script provides an interactive step-by-step demonstration flow to present APAARSetu to evaluators, faculty, or technical reviewers.

---

## Pre-Demo Checklist
- [ ] Terminal 1: Backend running at `http://127.0.0.1:8000`
- [ ] Terminal 2: Frontend running at `http://localhost:5173`
- [ ] Browser: Opened to `http://localhost:5173`
- [ ] Sample CSV located at: `D:\APPAR-SETU\database\seed\synthetic_students.csv`

---

## Demonstration Script

### Minute 0:00 – 1:00: Problem Statement & Prototype Context
1. **Welcome & Context**:
   > *"Good morning. Today I am presenting APAARSetu, a prototype platform designed for AICTE-approved institutions to streamline student registration, detect admission anomalies, and ensure compliance with approved intake quotas."*
2. **Key Boundaries**:
   > *"As a student developer, I have strictly separated prototype capabilities from production reality. APAARSetu validates format and institutional integrity deterministically; it does not claim official government verification, and all data used today is 100% synthetic."*

### Minute 1:00 – 2:00: API Health & System Architecture
1. **Show Swagger API Docs**:
   - Navigate to `http://127.0.0.1:8000/docs`.
   - Point out the health `/api/v1/health` and readiness `/api/v1/ready` probes.
   - Explain that the backend connects to PostgreSQL using SQLAlchemy 2.0 with connection pooling, and fails safely if the connection drops.
2. **Switch to Web UI**:
   - Navigate to `http://localhost:5173`.
   - Highlight the status indicators in the navbar: `API: Online | DB: Connected`.
   - Note the top disclaimer banner explaining prototype mode.

### Minute 2:00 – 3:30: Synthetic CSV Upload & Real-Time Validation
1. **Navigate to CSV Upload**:
   - Click the **CSV Upload** tab in the navbar.
2. **Explain the Dataset**:
   - Mention that `synthetic_students.csv` contains 16 rows covering 7 real-world scenarios: valid students, missing fields, format violations, duplicates, unconfigured programmes, and intake overflows.
3. **Execute Upload**:
   - Select or drag `database/seed/synthetic_students.csv`.
   - Click **Validate & Upload CSV**.
4. **Inspect Processing Results**:
   - The UI displays:
     - **Total Rows**: 16
     - **Accepted**: 8
     - **Rejected**: 8
     - **Issues Captured**: 8
   - Click **Inspect Validation Issues** to view the breakdown table.
   - Point out specific issue codes:
     - `MISSING_REQUIRED_FIELD` for row 7 (missing APAAR ID).
     - `FORMAT_INVALID` for row 9 (`12345ABC9019`).
     - `PROGRAMME_NOT_CONFIGURED` for row 13 (`AERO` not approved).
     - `INTAKE_MISMATCH` for row 6 (exceeding CSE quota of 5).

### Minute 3:30 – 4:30: Human-in-the-Loop Anomaly Resolution
1. **Navigate to Anomaly Review**:
   - Click **Anomaly Review** in the navbar.
   - Explain that duplicate candidates and intake overages are not immediately deleted or called "fraud" — they are placed in a queue for institutional officers to review.
2. **Review a Case**:
   - Click **Review & Resolve** on one of the open cases.
   - Enter notes: *"Verified admission registration slip with student affairs office."*
   - Click **Save Decision**.
   - Show that the case transitions to `RESOLVED` and the action is recorded in the immutable audit log.

### Minute 4:30 – 5:00: Audit Reports & Wrap-Up
1. **Navigate to Audit Reports**:
   - Click **Audit Reports** in the navbar.
   - Click **Export Sanitized Institutional Report (.CSV)**.
   - Open the downloaded file to show the structured summary.
   - Highlight the security measure: *Formula injection mitigation (CWE-1236)* prepends apostrophes to prevent spreadsheet execution vulnerabilities.
2. **Closing Summary**:
   > *"In summary, APAARSetu demonstrates a production-structured three-tier architecture: React SPA, modular FastAPI backend, and Supabase PostgreSQL with strict multi-tenant isolation, safe error handling, and 100% automated test coverage."*

