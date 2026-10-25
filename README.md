# APAARSetu — Student Data Management & Verification Platform (AICTE Prototype)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791.svg?style=flat&logo=postgresql)](https://supabase.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![Pytest](https://img.shields.io/badge/Tests-21%20Passed-brightgreen.svg?style=flat&logo=pytest)](https://docs.pytest.org)

APAARSetu is a local prototype demonstrating an APAAR ID-based student data management and intake compliance platform for AICTE-approved institutions.

> [!IMPORTANT]
> **Prototype & Academic Integrity Boundary**:
> - All student records used in this prototype are **100% synthetic**. Real student data or Aadhaar numbers must **never** be uploaded.
> - A 12-digit numeric format check is a prototype structural heuristic; it **does not** constitute authoritative verification from official APAAR, ABC, NAD, or AICTE gateways.
> - A duplicate candidate flag represents a candidate for administrative review, **not automatic fraud**.

---

## 1. Implemented Features

- **Synthetic CSV Batch Ingestion**: Uploads processed in-memory (up to 5 MB, 10,000 rows) with SHA-256 idempotency.
- **Deterministic Multi-Stage Validation Service**:
  - `MISSING_REQUIRED_FIELD`: Mandates all 5 columns (`student_ref`, `apaar_id`, `programme_code`, `academic_year`, `category`).
  - `FORMAT_INVALID`: Checks 12-digit numeric structure (`^\d{12}$`).
  - `DUPLICATE_CANDIDATE`: Identifies repeated identifiers within an upload batch or existing active enrolments.
  - `PROGRAMME_NOT_CONFIGURED`: Flags unapproved programmes for the institution.
  - `INTAKE_NOT_CONFIGURED`: Detects missing quota definitions for academic years.
  - `INTAKE_MISMATCH`: Alerts when enrolments exceed approved intake limits.
- **Relational PostgreSQL Schema (Supabase)**: Separates student identities from enrolments to preserve legitimate academic transfer history across 10 tables.
- **Human-in-the-Loop Anomaly Review**: Review queue allowing institutional staff to resolve discrepancies with audit notes.
- **Institutional & Central Dashboards**: Aggregated totals, intake utilization progress meters, and batch history.
- **Spreadsheet Formula Injection Defense**: Exported CSV reports escape dangerous leading characters (`=`, `+`, `-`, `@`, `\t`) mitigating CWE-1236.
- **Automated Test Suite**: 21 comprehensive Pytest unit and integration tests (100% pass rate).

---

## 2. Technology Stack

- **Frontend**: React 18, JavaScript (ES Modules), Vite, Accessible Light-Mode CSS.
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Psycopg 3 driver.
- **Database**: Supabase PostgreSQL (via Supavisor Transaction Pooler on port 6543 / 5432).
- **Testing**: Pytest, TestClient (`httpx`).

---

## 3. Directory Structure

```text
apaarsetu/
├── backend/
│   ├── app/
│   │   ├── api/             # API routes (health, uploads, dashboard, anomalies, reports)
│   │   ├── core/            # Configuration, logging, and security boundaries
│   │   ├── database/        # SQLAlchemy engine, session maker, base
│   │   ├── models/          # Relational ORM models (10 tables)
│   │   ├── schemas/         # Pydantic v2 request/response schemas
│   │   ├── services/        # Validation engine, upload transaction, report service
│   │   └── main.py          # FastAPI application factory and middleware
│   ├── tests/               # Pytest automated test suite (21 tests)
│   ├── main.py              # Run proxy: uvicorn main:app --reload
│   ├── requirements.txt     # Python backend dependencies
│   └── .env.example         # Template for DATABASE_URL
├── frontend/
│   ├── src/
│   │   ├── components/      # Navigation bar and reusable UI
│   │   ├── pages/           # Overview, Upload, Details, Anomalies, Reports
│   │   ├── services/        # API service client
│   │   ├── App.jsx          # Root component & routing
│   │   └── styles.css       # Clean, accessible light-mode CSS
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite configuration (port 5173)
├── database/
│   ├── migrations/          # 001_initial_schema.sql (10 tables + RLS)
│   ├── seed/                # 001_synthetic_seed.sql & synthetic_students.csv
│   └── README.md            # Supabase migration and safe reset guide
└── docs/
    ├── architecture.md      # Mermaid diagrams & trust boundaries
    ├── api-contract.md      # OpenAPI contract and status codes
    ├── test-report.md       # Pytest execution report (21 passed)
    ├── supabase-setup.md    # Supabase connection & pooling setup
    ├── security-and-limitations.md # Auth & RLS security considerations
    └── demo-script.md       # 5-minute evaluation demonstration guide
```

---

## 4. Getting Started (PowerShell Setup)

### Prerequisites
- Python 3.11+ (Python 3.13 installed in `backend/.venv`)
- Node.js 18+ and npm (v24 & npm 11 installed)
- A Supabase Project ([https://supabase.com](https://supabase.com))

### Step 1: Database Setup (Supabase)
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Execute [`database/migrations/001_initial_schema.sql`](database/migrations/001_initial_schema.sql).
3. Execute [`database/seed/001_synthetic_seed.sql`](database/seed/001_synthetic_seed.sql).
4. In your Supabase Dashboard, go to **Settings** -> **Database** -> **Connection string** (URI mode, Transaction pooler).
5. Copy your connection URI.

### Step 2: Configure Environment Variables
Inside `D:\APPAR-SETU\backend`:
```powershell
Copy-Item backend\.env.example backend\.env
```
Edit `backend\.env` and paste your Supabase connection string:
```env
DATABASE_URL=postgresql+psycopg://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### Step 3: Run the FastAPI Backend
```powershell
cd D:\APPAR-SETU\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload
```
- API Root: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- Health Check: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- Database Readiness: [http://127.0.0.1:8000/api/v1/ready](http://127.0.0.1:8000/api/v1/ready)
- Interactive Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Step 4: Run the React Frontend
In a separate PowerShell terminal:
```powershell
cd D:\APPAR-SETU\frontend
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

---

## 5. Running Automated Tests

Run the full Pytest test suite:
```powershell
cd D:\APPAR-SETU
.\backend\.venv\Scripts\python.exe -m pytest backend/tests -v
```

Build the React frontend:
```powershell
cd D:\APPAR-SETU\frontend
npm run build
```

---

## 6. How to Test the CSV Upload Workflow

1. Navigate to [http://localhost:5173](http://localhost:5173) in your browser.
2. Click the **CSV Upload** tab.
3. Upload `database/seed/synthetic_students.csv`.
4. Observe the validation engine in action:
   - **Total Rows**: 16
   - **Accepted Rows**: 8 (registered in PostgreSQL)
   - **Rejected Rows**: 8 (rejected due to missing fields, format violations, unconfigured programmes)
   - **Captured Issues**: 8
5. Click **Inspect Validation Issues** to view row-by-row codes and explanations.
6. Open the **Anomaly Review** tab to resolve duplicate candidates and intake discrepancies with administrative notes.
7. Click **Audit Reports** to download the sanitized institutional summary report.

