# APAARSetu API Specification & Contract

Base URL: `http://127.0.0.1:8000` (or configured deployment host)  
API Version: `0.1.0`  
Standard Header: `Accept: application/json`

---

## 1. System Health & Readiness

### `GET /`
- **Description**: Service root descriptor and navigation links.
- **Status Code**: `200 OK`
- **Response**:
```json
{
  "message": "Welcome to APAARSetu API",
  "docs": "/docs",
  "health": "/api/v1/health",
  "ready": "/api/v1/ready"
}
```

### `GET /api/v1/health`
- **Description**: Liveness probe indicating the HTTP application server is operational.
- **Status Code**: `200 OK`
- **Response**:
```json
{
  "status": "ok",
  "service": "APAARSetu API"
}
```

### `GET /api/v1/ready`
- **Description**: Readiness probe testing connectivity to Supabase PostgreSQL without exposing connection credentials.
- **Status Codes**:
  - `200 OK`: Database connected and responsive.
  - `503 Service Unavailable`: Database unreachable or `DATABASE_URL` not configured.
- **Response (200)**:
```json
{
  "status": "ready",
  "database": "connected",
  "message": "Database connection operational"
}
```

---

## 2. Upload Operations

### `POST /api/v1/uploads`
- **Description**: Upload a student records CSV file (multipart/form-data).
- **Constraints**: Maximum file size 5 MB, maximum 10,000 rows.
- **Headers**: `Content-Type: multipart/form-data`
- **Parameters**: `file` (binary CSV)
- **Status Codes**:
  - `201 Created`: File processed, validated, and persisted.
  - `400 Bad Request`: Empty file or row count exceeded.
  - `413 Content Too Large`: File exceeds 5 MB.
  - `415 Unsupported Media Type`: File does not have `.csv` extension or invalid encoding.
  - `422 Unprocessable Content`: Missing mandatory CSV columns.
  - `500 Internal Server Error`: Transaction failure (changes safely rolled back).
- **Response (201)**:
```json
{
  "id": "c1f7a012-3456-7890-abcd-ef0123456789",
  "institution_id": "11111111-1111-1111-1111-111111111111",
  "filename": "synthetic_students.csv",
  "total_rows": 16,
  "accepted_rows": 8,
  "rejected_rows": 8,
  "issue_count": 8,
  "status": "COMPLETED",
  "created_at": "2026-10-25T11:20:00Z"
}
```

### `GET /api/v1/uploads`
- **Description**: List upload batches for the caller's institution.
- **Query Params**: `limit` (default 20), `offset` (default 0).
- **Status Code**: `200 OK`

### `GET /api/v1/uploads/{upload_id}`
- **Description**: Fetch detailed metrics and embedded issues for an upload.
- **Status Codes**:
  - `200 OK`: Upload retrieved.
  - `403 Forbidden`: Cross-institution access prohibited.
  - `404 Not Found`: Upload ID does not exist.

### `GET /api/v1/uploads/{upload_id}/errors`
- **Description**: Fetch row-level validation issues encountered in a specific upload.
- **Query Params**: `limit` (default 100), `offset` (default 0).
- **Status Code**: `200 OK`
- **Response Items**:
```json
[
  {
    "id": "f5e4d3c2-b1a0-9876-5432-10fedcba9876",
    "upload_id": "c1f7a012-3456-7890-abcd-ef0123456789",
    "row_number": 7,
    "student_ref": "STU-2026-007",
    "apaar_id": null,
    "issue_code": "MISSING_REQUIRED_FIELD",
    "severity": "ERROR",
    "explanation": "Missing mandatory field(s): apaar_id.",
    "created_at": "2026-10-25T11:20:00Z"
  }
]
```

---

## 3. Institutional & Central Dashboards

### `GET /api/v1/institution/dashboard`
- **Description**: Returns live aggregated counts, open anomalies, and AICTE programme intake utilization.
- **Status Code**: `200 OK`
- **Response**:
```json
{
  "institution_id": "11111111-1111-1111-1111-111111111111",
  "institution_name": "Delhi Institute of Engineering & Technology (Synthetic)",
  "total_processed_records": 16,
  "total_accepted_records": 8,
  "total_rejected_records": 8,
  "open_anomaly_count": 3,
  "intake_discrepancy_count": 1,
  "latest_uploads": [...],
  "programme_stats": [
    {
      "programme_code": "CSE",
      "programme_name": "Computer Science and Engineering",
      "academic_year": "2026-27",
      "approved_intake": 5,
      "enrolled_count": 6,
      "is_exceeded": true
    }
  ]
}
```

### `GET /api/v1/admin/dashboard`
- **Description**: Central administrative dashboard across all institutions. Requires admin role.
- **Status Codes**: `200 OK`, `403 Forbidden`.

---

## 4. Anomaly Review & Human-in-the-Loop Actions

### `GET /api/v1/anomalies`
- **Description**: List candidate anomalies requiring human verification.
- **Query Params**: `status` (`OPEN`, `RESOLVED`, `IGNORED`), `limit`, `offset`.
- **Status Code**: `200 OK`

### `POST /api/v1/anomalies/{anomaly_id}/resolve`
- **Description**: Submit a review determination and record audit rationale.
- **Body**:
```json
{
  "resolution_notes": "Physical admission records verified against original state board certificate.",
  "status": "RESOLVED"
}
```
- **Status Codes**: `200 OK`, `404 Not Found`, `422 Unprocessable Content`.

---

## 5. Secure Compliance Reports

### `GET /api/v1/reports`
- **Description**: Download sanitized CSV summary report for the institution.
- **Content-Type**: `text/csv`
- **Header**: `Content-Disposition: attachment; filename="apaarsetu_report_YYYYMMDD_HHMMSS.csv"`
- **Security**: Mitigates CWE-1236 Spreadsheet Formula Injection by prepending `'` to unsafe leading characters.

