# APAARSetu — Engineering Team Onboarding Guide
**Smart India Hackathon 2026 — Problem Statement PS 26263**  
**Organization:** All India Council for Technical Education (AICTE)  
**Department:** Regulation Bureau — New Delhi  

---

## 1. Project Overview & Problem Statement

**APAARSetu** is a secure, public-sector institutional student data management and verification platform engineered specifically for AICTE-approved technical institutions. 

Under AICTE Problem Statement PS 26263, technical institutions across India require a standardized, tamper-resistant system to:
1. Reconcile student admissions against approved annual intake limits across engineering, management, and polytechnic programmes.
2. Ingest and validate student records linked to their 12-digit **Automated Permanent Academic Account Registry (APAAR) ID**.
3. Identify cross-institutional dual enrolment collisions without exposing student identity tokens.
4. Support controlled, consent-verified academic verifications for external entities (scholarship boards, employers).
5. Oversee inter-institutional student transfers and dual-degree policy compliance under AICTE regulations.

---

## 2. Technology Stack & Non-Negotiable Constraints

| Layer | Technology | Version / Spec |
| :--- | :--- | :--- |
| **Frontend** | React, JSX, Vite | React 18.3.1, Vite 5.4.2 |
| **Frontend Language** | Pure JavaScript | **Strictly no TypeScript (`.ts`/`.tsx`)** |
| **Backend API** | Python, FastAPI | Python 3.13+, FastAPI 0.115+ |
| **Database** | PostgreSQL via Supabase | PostgreSQL 15+ (Transaction Pooler port 6543) |
| **Authentication** | Supabase Auth Authority | HS256/RS256 JWT cryptographic verification |
| **Field-Level Encryption** | AES-256-GCM | 96-bit random nonce, Institutional AAD binding |
| **Privacy-Preserving Search** | HMAC-SHA-256 | Blind indexing for cross-institution collision scans |

---

## 3. Local Development Setup

### Prerequisites
- Python 3.13+ installed (`python --version`)
- Node.js 18+ and npm installed (`node -v`, `npm -v`)
- Git (`git --version`)

### Step 1: Clone and Set Up Workspace
```bash
git clone <repository-url>
cd APPAR-SETU
```

### Step 2: Backend Configuration & Virtual Environment
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate

# On Linux/macOS:
source .venv/bin/activate

# Install dependencies:
pip install -r requirements.txt
pip install python-docx reportlab
```

Copy the backend configuration template and populate your local variables:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` is set to your Supabase PostgreSQL connection URI.

### Step 3: Frontend Configuration
```bash
cd ../frontend
npm install
cp .env.example .env
```

---

## 4. Running the Development Services

### Starting Backend API Service
From the `backend` folder (with virtual environment active):
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive Swagger OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/v1/health`

### Starting Frontend Development Server
From the `frontend` folder:
```bash
npm run dev
```
- Frontend application runs at: `http://localhost:5173`

---

## 5. Verification & Testing Protocol

All code changes must be verified through the test suite before submitting pull requests:

### 1. Backend Automated Pytest Suite (38 tests)
```bash
# From workspace root:
backend\.venv\Scripts\pytest backend\tests
```

### 2. Live Supabase Database Integration Verification
```bash
backend\.venv\Scripts\python backend\scripts\verify_phase3_live.py
```

### 3. Frontend Production Build Verification
```bash
npm --prefix frontend run build
```

---

## 6. Role Hierarchy & Demonstration Personas

All credentials below are synthetic demo identities provisioned for testing and evaluation:

| Role | Role Code | Demonstration Email | Capabilities |
| :--- | :--- | :--- | :--- |
| **Central AICTE Director** | `AICTE_ADMIN` | `aicte_director@aicte-india.org.synthetic` | National oversight, approves new institutions, adjudicates disputed transfers |
| **Regulatory Analyst** | `AICTE_ANALYST` | `analyst@aicte-india.org.synthetic` | National quota monitoring, collision triage |
| **Compliance Auditor** | `AUDITOR` | `auditor@aicte-india.org.synthetic` | Read-only inspection of reports and audit ledgers |
| **Active Institutional Admin** | `INSTITUTE_ADMIN` | `demo_admin@delhi-tech.edu.synthetic` | Batch student CSV upload, anomaly resolution, verifications, initiate transfers |
| **Pending Institutional Admin** | `INSTITUTE_ADMIN` | `principal@svrit-nagpur.ac.in.synthetic` | Non-privileged: Uploads blocked until Central AICTE approval |

*Standard demonstration password:* `demo_password_2026`

---

## 7. Security & Code Integrity Guidelines

1. **JavaScript Only:** Do not introduce TypeScript, `.ts`, or `.tsx` files.
2. **Never Commit Secrets:** Do not commit `.env`, private keys, database passwords, or JWT secrets to Git.
3. **Additive Migrations Only:** Never execute `DROP TABLE`, `TRUNCATE`, or destructive migrations on the database.
4. **Tenant Isolation:** Ensure all institutional queries strictly filter by `auth.institution_id`.
5. **Formula Injection Sanitization:** Every exported CSV must sanitize cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` (CWE-1236 prevention).

