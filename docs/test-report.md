# Automated Test Execution Report — Security & Hardening Suite

**Date of Execution**: 2026-10-25  
**Test Framework**: Pytest 9.1.1 (Python 3.13)  
**Execution Environment**: Local Windows (isolated in-memory test double for unit/integration tests)  

---

## 1. Summary of Test Results

| Test Category | Total Tests | Passed | Failed | Status |
| :--- | :---: | :---: | :---: | :---: |
| **System Health & Readiness** | 3 | 3 | 0 | PASS |
| **Field-Level Cryptography (AES-GCM & HMAC)** | 4 | 4 | 0 | PASS |
| **Pure Validation Logic** | 6 | 6 | 0 | PASS |
| **Upload Pipeline & Error Handling** | 5 | 5 | 0 | PASS |
| **Anomalies, Dashboards & Reports** | 4 | 4 | 0 | PASS |
| **Security, RBAC & Tenant Isolation** | 5 | 5 | 0 | PASS |
| **Total** | **27** | **27** | **0** | **100% PASS** |

**Execution Time**: 16.59 seconds  

---

## 2. Test Breakdown by Module

### `backend/tests/test_crypto_service.py` (New)
- `test_aes_gcm_encryption_roundtrip`: Verifies AES-256-GCM encryption and decryption with 96-bit nonce and AAD. (PASSED)
- `test_aes_gcm_tampering_fails_safely`: Verifies that tampering with ciphertext or AAD raises `CryptoTamperError` safely without leaking plaintext. (PASSED)
- `test_hmac_blind_token_properties`: Verifies keyed HMAC-SHA-256 token normalization, determinism, and collision resistance. (PASSED)
- `test_identifier_masking`: Verifies formatting e.g. `123456789012` -> `XXXXXXXX9012`. (PASSED)

### `backend/tests/test_security_and_auth.py` (Expanded)
- `test_invalid_authorization_header`: Rejects non-Bearer schemes with 401. (PASSED)
- `test_malformed_token_header`: Rejects non-JWT structures with 401. (PASSED)
- `test_cross_institution_isolation_prevented`: Rejects cross-tenant access with 403 Forbidden. (PASSED)
- `test_role_enforcement_logic`: Verifies `INSTITUTE_OPERATOR` vs `INSTITUTE_ADMIN` permission matrix. (PASSED)
- `test_operator_cannot_resolve_anomaly_api`: Verifies API enforces that `INSTITUTE_OPERATOR` cannot resolve anomalies (403 Forbidden). (PASSED)

### `backend/tests/test_health_and_ready.py`
- `test_root_endpoint`: Verifies `/` returns 200 with service description. (PASSED)
- `test_health_endpoint`: Verifies `/api/v1/health` returns status "ok". (PASSED)
- `test_readiness_endpoint`: Verifies `/api/v1/ready` reports database connectivity without leaking credentials. (PASSED)

### `backend/tests/test_validation_service.py`
- `test_validation_all_valid`: All valid rows accepted without issues. (PASSED)
- `test_validation_missing_required_fields`: Blank fields rejected with `MISSING_REQUIRED_FIELD`. (PASSED)
- `test_validation_format_invalid`: Malformed APAAR IDs rejected with `FORMAT_INVALID`. (PASSED)
- `test_validation_duplicate_candidate_in_batch`: Repeated APAAR IDs within the same file flagged as `DUPLICATE_CANDIDATE`. (PASSED)
- `test_validation_unconfigured_programme_and_intake`: Unrecognized programmes rejected with `PROGRAMME_NOT_CONFIGURED`. (PASSED)
- `test_validation_intake_capacity_exceeded`: Admissions exceeding quota flagged with `INTAKE_MISMATCH`. (PASSED)

### `backend/tests/test_uploads_api.py`
- `test_upload_missing_extension`: Non-CSV files rejected with 415. (PASSED)
- `test_upload_empty_csv`: 0-byte files rejected with 400. (PASSED)
- `test_upload_missing_columns`: CSVs without mandatory headers rejected with 422. (PASSED)
- `test_upload_oversized_file`: Files > 5 MB rejected with 413. (PASSED)
- `test_upload_synthetic_csv_and_verify_results`: End-to-end processing of `synthetic_students.csv` (16 rows, AES encryption, HMAC indexing, and idempotency). (PASSED)

### `backend/tests/test_anomalies_and_reports.py`
- `test_spreadsheet_formula_escaping`: Verifies formula injection characters (`=`, `+`, `-`, `@`, `\t`) are prepended with `'` to prevent CWE-1236. (PASSED)
- `test_anomalies_flow_and_resolution`: Fetches open anomaly, resolves with notes via `POST /api/v1/anomalies/{id}/resolve`, verifies 404 for missing anomaly. (PASSED)
- `test_institution_and_admin_dashboards`: Verifies live aggregated metrics and programme intake utilization stats. (PASSED)
- `test_reports_endpoint`: Verifies `GET /api/v1/reports` streams CSV download with proper Content-Disposition and audit entry. (PASSED)

---

## 3. Frontend Build Verification

- **Command**: `npm run build` inside `frontend/`
- **Output**: 
  - `dist/index.html` (0.72 kB)
  - `dist/assets/index-fE509fgV.css` (9.12 kB)
  - `dist/assets/index-CvD31uDc.js` (178.57 kB)
- **Result**: Built successfully with Vite in 3.52s with zero errors.
