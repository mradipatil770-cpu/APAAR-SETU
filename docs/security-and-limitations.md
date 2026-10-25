# Security Architecture & Prototype Limitations

## 1. Authentication Status & Architecture

- **Current State**: Prepared integration boundary in FastAPI (`app.core.security.get_current_user_context`).
- **Live Supabase Auth Status**: **Unverified** (credentials were not supplied during local prototype initialization).
- **Security Boundary**:
  - The API checks for the `Authorization: Bearer <token>` header.
  - Invalid headers or malformed JWT structures are rejected with `HTTP 401 Unauthorized`.
  - In local development mode without configured Supabase JWT keys, unauthenticated calls use an explicit synthetic prototype context for `AICTE-ENG-001`.
  - **No Fake Auth**: The system does not present mock tokens as cryptographically verified Supabase identities.

---

## 2. Multi-Tenant Authorization & Row Level Security (RLS)

### Server Connection vs. RLS Behavior
- When FastAPI connects to PostgreSQL via `DATABASE_URL` (using the standard `postgres` role in Supabase), it operates as a server-side process with elevated database permissions.
- In PostgreSQL, superuser and table-owner roles bypass RLS policies by default.
- **Critical Architectural Rule**: We do not rely exclusively on RLS for server-side security. FastAPI explicitly filters every query and enforces tenant isolation (`enforce_institution_access`) before returning or updating any record.
- If a user from Institution A attempts to inspect an upload from Institution B, the backend rejects the request with `HTTP 403 Forbidden`.

### Supabase Client Exposure
- React does **NOT** connect directly to the PostgreSQL database.
- The browser client interacts solely with FastAPI.
- Sensitive environment variables (`DATABASE_URL`, service-role keys) are **strictly isolated** to the backend `.env` and excluded from git tracking.

---

## 3. Official Verification Boundaries & Prototype Disclaimers

### A. APAAR ID Format Check vs. Official Verification
- The prototype evaluates APAAR IDs using a 12-digit numeric regular expression (`^\d{12}$`).
- **Crucial Distinction**: A successful format check proves only that the identifier conforms to structural length and character constraints. It does **not** verify that the ID belongs to a real citizen, is registered in the Academic Bank of Credits (ABC), or is approved by NAD/AICTE.
- The prototype never labels an unverified record as `OFFICIALLY_VERIFIED`.

### B. Duplicate Candidates vs. Fraud
- When an APAAR ID or Student Reference appears multiple times or collides with an active enrolment, it is flagged as `DUPLICATE_CANDIDATE` and placed into the Anomaly Review queue.
- **Educational Context**: A duplicate candidate flag represents a case requiring human administrative review (e.g. transfer students, dual-degree admissions, clerical re-uploads), not proof of fraudulent activity.

### C. Synthetic Data Strict Mandate
- No real student records, Aadhaar numbers, personal phone numbers, or institutional passwords are used or stored in this codebase.
- The test dataset (`database/seed/synthetic_students.csv`) contains fictitious identifiers (`123456789012`...) designed exclusively to test edge cases.

---

## 4. Production-Readiness Gaps

Before moving this prototype toward production, the following must be implemented:
1. **Supabase Auth Live Verification**: Configure FastAPI to download and verify Supabase JWKS public keys or sign with the project secret.
2. **Dedicated Least-Privilege DB Role**: Create a dedicated PostgreSQL role for FastAPI that does not have superuser privileges.
3. **Official APAAR/ABC API Integration**: Securely connect to authorized government gateway APIs using production certificates.
4. **Audit Immutability**: Configure append-only storage or write-once audit log tables for regulatory compliance.
5. **Rate Limiting & Anti-Abuse**: Introduce Redis-backed IP and user rate limiting on upload endpoints.

