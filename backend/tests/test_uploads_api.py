import io
from pathlib import Path


def test_upload_missing_extension(client):
    response = client.post(
        "/api/v1/uploads",
        files={"file": ("test.txt", b"some,text,data", "text/plain")},
    )
    assert response.status_code == 415


def test_upload_empty_csv(client):
    response = client.post(
        "/api/v1/uploads",
        files={"file": ("empty.csv", b"", "text/csv")},
    )
    assert response.status_code == 400


def test_upload_missing_columns(client):
    bad_csv = b"student_ref,apaar_id\nSTU-01,111122223333"
    response = client.post(
        "/api/v1/uploads",
        files={"file": ("bad_headers.csv", bad_csv, "text/csv")},
    )
    assert response.status_code == 422
    assert "missing mandatory column" in response.json()["detail"].lower()


def test_upload_oversized_file(client):
    large_payload = b"x" * (5242880 + 10)
    response = client.post(
        "/api/v1/uploads",
        files={"file": ("large.csv", large_payload, "text/csv")},
    )
    assert response.status_code == 413


def test_upload_synthetic_csv_and_verify_results(client):
    synthetic_csv_path = Path(__file__).resolve().parent.parent.parent / "database" / "seed" / "synthetic_students.csv"
    with open(synthetic_csv_path, "rb") as f:
        file_bytes = f.read()

    response = client.post(
        "/api/v1/uploads",
        files={"file": ("synthetic_students.csv", file_bytes, "text/csv")},
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    upload_id = data["id"]
    assert data["total_rows"] == 16
    assert data["status"] == "COMPLETED"
    assert data["accepted_rows"] > 0
    assert data["rejected_rows"] > 0
    assert data["issue_count"] > 0

    # 1. Verify Upload Detail endpoint
    detail_res = client.get(f"/api/v1/uploads/{upload_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["id"] == upload_id
    assert len(detail_data["issues"]) > 0

    # 2. Verify Upload Errors endpoint
    errors_res = client.get(f"/api/v1/uploads/{upload_id}/errors")
    assert errors_res.status_code == 200
    issues = errors_res.json()
    assert len(issues) > 0
    issue_codes = {i["issue_code"] for i in issues}
    assert "MISSING_REQUIRED_FIELD" in issue_codes
    assert "FORMAT_INVALID" in issue_codes
    assert "DUPLICATE_CANDIDATE" in issue_codes

    # 3. Verify Idempotency on exact duplicate upload retry
    retry_res = client.post(
        "/api/v1/uploads",
        files={"file": ("synthetic_students.csv", file_bytes, "text/csv")},
    )
    assert retry_res.status_code == 201
    assert retry_res.json()["id"] == upload_id

    # 4. Verify 404 for unknown upload ID
    missing_res = client.get("/api/v1/uploads/00000000-0000-0000-0000-000000000000")
    assert missing_res.status_code == 404

