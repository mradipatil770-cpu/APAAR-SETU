# APAARSetu — APAAR ID-Based Student Data Management & Verification Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791.svg?style=flat&logo=postgresql)](https://supabase.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![Pytest](https://img.shields.io/badge/Tests-33%20Passed-brightgreen.svg?style=flat&logo=pytest)](https://docs.pytest.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev)

**Problem Statement:** AICTE PS 26263  
**Project:** APAARSetu — A Unified Framework for Student Enrolment and Academic Identity Verification for AICTE-Approved Institutions.

---

> [!IMPORTANT]
> **Regulatory Boundary & Synthetic Data Policy**:
> - All demonstration datasets, student records, and email accounts are **100% synthetic**. Real student Personally Identifiable Information (PII) or Aadhaar numbers are never stored.
> - The 12-digit numeric validation check confirms structural compliance (`^\d{12}$`); official national identity verification requires authorized government production API gateways (DigiLocker / NAD / APAAR).
> - Duplicate candidate detection flags potential concurrent enrolments for administrative audit and investigation, **not confirmed fraud**.

---

## 1. System Overview & Key Capabilities

APAARSetu addresses AICTE Problem Statement 26263 by providing a dual-dashboard platform connecting technical institutions, central regulatory authorities, and external verifying bodies.

```
                           +----------------------------------------+
                           |         Public Landing Portal          |
                           |  (NIC / AICTE Public Architecture)     |
                           +-------------------+--------------------+
                                               |
                                     [ Portal Sign In ]
                                               |
                     +-------------------------+-------------------------+
                     |                                                   |
                     v                                                   v
    +----------------------------------+               +----------------------------------+
    |   Central AICTE Dashboard        |               |   Institutional Staff Workspace  |
    |   (Role: AICTE_ADMIN / ANALYST)  |               |   (Role: INSTITUTE_ADMIN)        |
    +----------------------------------+               +----------------------------------+
    | * National Intake Allocation     |               | * Student CSV Batch Ingestion    |
    | * Institutions Directory         |               | * 12-Digit APAAR Format Check    |
    | * Cross-Institution Duplicates   |               | * Sanctioned Quota Reconciliation|
    | * Central Verification Oversight |               | * Exception Review & Resolution  |
    | * Cryptographic Audit Telemetry  |               | * Controlled Academic Verify     |
    +----------------------------------+               +----------------------------------+
```

### Core Capabilities:
1. **Public Portal & Executive Architecture**:
   - Styled directly in accordance with National Informatics Centre (NIC) and AICTE portal design guidelines.
   - Includes Indian tricolor branding, accessibility controls, executive leadership highlights, circulars/notices stream, and partner digital initiatives ribbon.
2. **Dual-Dashboard Role-Based Architecture**:
   - **Central AICTE Dashboard**: National capacity utilization meters, searchable institutional directory, cross-university candidate detection queue, and central verification audits.
   - **Institutional Staff Dashboard**: Batch CSV ingestion, automated intake validation, human-in-the-loop exception resolution, and registrar verification actions.
3. **Controlled Academic Verification**:
   - Consent-backed verification workflow allowing authorized third parties (fellowship bodies, employers, universities) to submit verification requests.
   - Institutional registrars review and formally record `CONFIRMED` or `REJECTED` determinations with mandatory audit notes.
4. **Multi-Tenant Cryptographic Protection**:
   - **AES-256-GCM Envelope Encryption**: Field-level encryption for sensitive identifiers with fresh 12-byte nonces and institution-bound AAD.
   - **Keyed HMAC-SHA-256 Blind Indexing**: Deterministic token generation enabling cross-institution duplicate search without decrypting or exposing student identity numbers.
   - **Cryptographic JWT Sessions**: Signed Bearer tokens enforcing tenant isolation and RBAC.

---

## 2. Evaluation Personas & Demo Accounts

For demonstration and hackathon evaluation, click any demo persona on the Portal Login page to auto-populate credentials:

| Persona | Role | Synthetic Email | Scope |
| :--- | :--- | :--- | :--- |
| **AICTE Central Director** | `AICTE_ADMIN` | `aicte_director@aicte-india.org.synthetic` | Central Regulatory Oversight across all institutions |
| **AICTE Regulatory Analyst** | `AICTE_ANALYST` | `analyst@aicte-india.org.synthetic` | National anomaly triage & quota audits |
| **Institutional Registrar** | `institution_admin` | `demo_admin@delhi-tech.edu.synthetic` | Delhi Institute of Engineering & Technology (`AICTE-ENG-001`) |

*Demo Password for all synthetic accounts:* `demo_password_2026`

---

## 3. Technology Stack & Verification

- **Frontend**: Pure JavaScript (ES Modules, JSX), React 18, Vite 5.4. (Strictly no TypeScript).
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Psycopg 3.
- **Database**: Supabase PostgreSQL (AWS ap-south-1).
- **Security**: AES-256-GCM, HMAC-SHA-256, PyJWT, CSV Injection Defenses (CWE-1236).

### Verification Status:
- **33/33 Backend Tests Passing** (`pytest backend/tests`).
- **Clean Vite Production Build**: 0 errors, 44 modules transformed, pure JavaScript output.
- **Live Supabase E2E Verification**: Endpoints verified against live database (Session pooler port 6543).

---

## 4. Getting Started

### Backend Setup:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # On Windows
pip install -r requirements.txt
pytest backend/tests
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup:
```bash
cd frontend
npm install
npm run build
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
