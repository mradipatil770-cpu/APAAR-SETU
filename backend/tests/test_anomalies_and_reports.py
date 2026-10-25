from app.services.report_service import escape_csv_cell


def test_spreadsheet_formula_escaping():
    # Test formula characters =, +, -, @, tab
    assert escape_csv_cell("=SUM(A1:A10)") == "'=SUM(A1:A10)"
    assert escape_csv_cell("+cmd|'/c calc'!A0") == "'+cmd|'/c calc'!A0"
    assert escape_csv_cell("-12345") == "'-12345"
    assert escape_csv_cell("@lookup") == "'@lookup"
    assert escape_csv_cell("\tmalicious") == "'\tmalicious"
    # Normal safe string should not be altered
    assert escape_csv_cell("STU-2026-001") == "STU-2026-001"
    assert escape_csv_cell(None) == ""


def test_anomalies_flow_and_resolution(client):
    # Query open anomalies
    res = client.get("/api/v1/anomalies?status=OPEN")
    assert res.status_code == 200
    anomalies = res.json()
    assert isinstance(anomalies, list)

    if anomalies:
        anomaly_id = anomalies[0]["id"]
        # Resolve the anomaly
        resolve_res = client.post(
            f"/api/v1/anomalies/{anomaly_id}/resolve",
            json={"resolution_notes": "Verified candidate with physical registry.", "status": "RESOLVED"},
        )
        assert resolve_res.status_code == 200
        data = resolve_res.json()
        assert data["status"] == "RESOLVED"
        assert data["resolution_notes"] == "Verified candidate with physical registry."
        assert data["resolved_at"] is not None

    # Test resolving non-existent anomaly returns 404
    missing_resolve = client.post(
        "/api/v1/anomalies/00000000-0000-0000-0000-000000000000/resolve",
        json={"resolution_notes": "Note", "status": "RESOLVED"},
    )
    assert missing_resolve.status_code == 404


def test_institution_and_admin_dashboards(client):
    inst_res = client.get("/api/v1/institution/dashboard")
    assert inst_res.status_code == 200
    data = inst_res.json()
    assert "total_processed_records" in data
    assert "open_anomaly_count" in data
    assert "programme_stats" in data

    admin_res = client.get("/api/v1/admin/dashboard")
    assert admin_res.status_code == 200
    admin_data = admin_res.json()
    assert "total_institutions" in admin_data
    assert "total_uploads" in admin_data


def test_reports_endpoint(client):
    report_res = client.get("/api/v1/reports")
    assert report_res.status_code == 200
    assert report_res.headers["content-type"].startswith("text/csv")
    content = report_res.text
    assert "# APAARSetu Institutional Summary Report" in content
    assert "[Upload History]" in content

