from app.services.validation_service import validate_csv_rows


def test_validation_all_valid():
    rows = [
        {"student_ref": "STU-01", "apaar_id": "111122223333", "programme_code": "CSE", "academic_year": "2026-27", "category": "GENERAL"},
        {"student_ref": "STU-02", "apaar_id": "111122223334", "programme_code": "CSE", "academic_year": "2026-27", "category": "OBC"},
    ]
    configured_programmes = {"CSE": "prog-cse-id"}
    configured_intakes = {("CSE", "2026-27"): 50}
    existing_enrolments = set()
    current_counts = {("CSE", "2026-27"): 0}

    res = validate_csv_rows(rows, configured_programmes, configured_intakes, existing_enrolments, current_counts)

    assert res.total_rows == 2
    assert res.accepted_count == 2
    assert res.rejected_count == 0
    assert len(res.issues) == 0


def test_validation_missing_required_fields():
    rows = [
        {"student_ref": "STU-01", "apaar_id": "", "programme_code": "CSE", "academic_year": "2026-27", "category": "GENERAL"},
        {"student_ref": "", "apaar_id": "111122223334", "programme_code": "", "academic_year": "2026-27", "category": "GENERAL"},
    ]
    res = validate_csv_rows(rows, {"CSE": "id"}, {("CSE", "2026-27"): 50}, set(), {})

    assert res.total_rows == 2
    assert res.accepted_count == 0
    assert res.rejected_count == 2
    codes = [issue["issue_code"] for issue in res.issues]
    assert "MISSING_REQUIRED_FIELD" in codes


def test_validation_format_invalid():
    rows = [
        {"student_ref": "STU-01", "apaar_id": "12345ABC8901", "programme_code": "CSE", "academic_year": "2026-27", "category": "GENERAL"},
        {"student_ref": "STU-02", "apaar_id": "12345", "programme_code": "CSE", "academic_year": "2026-27", "category": "GENERAL"},
    ]
    res = validate_csv_rows(rows, {"CSE": "id"}, {("CSE", "2026-27"): 50}, set(), {})

    assert res.accepted_count == 0
    assert res.rejected_count == 2
    codes = [i["issue_code"] for i in res.issues]
    assert codes.count("FORMAT_INVALID") == 2


def test_validation_duplicate_candidate_in_batch():
    rows = [
        {"student_ref": "STU-01", "apaar_id": "111122223333", "programme_code": "CSE", "academic_year": "2026-27", "category": "GENERAL"},
        {"student_ref": "STU-02", "apaar_id": "111122223333", "programme_code": "CSE", "academic_year": "2026-27", "category": "GENERAL"},
    ]
    res = validate_csv_rows(rows, {"CSE": "id"}, {("CSE", "2026-27"): 50}, set(), {})

    codes = [i["issue_code"] for i in res.issues]
    assert "DUPLICATE_CANDIDATE" in codes
    assert len(res.anomalies) == 1
    assert res.anomalies[0]["issue_code"] == "DUPLICATE_CANDIDATE"


def test_validation_unconfigured_programme_and_intake():
    rows = [
        {"student_ref": "STU-01", "apaar_id": "111122223333", "programme_code": "ROBOTICS", "academic_year": "2026-27", "category": "GENERAL"},
        {"student_ref": "STU-02", "apaar_id": "111122223334", "programme_code": "CSE", "academic_year": "2035-36", "category": "GENERAL"},
    ]
    # 'ROBOTICS' not in configured_programmes
    # ('CSE', '2035-36') not in configured_intakes
    res = validate_csv_rows(rows, {"CSE": "id"}, {("CSE", "2026-27"): 50}, set(), {})

    codes = [i["issue_code"] for i in res.issues]
    assert "PROGRAMME_NOT_CONFIGURED" in codes
    assert "INTAKE_NOT_CONFIGURED" in codes
    assert res.rejected_count == 2


def test_validation_intake_capacity_exceeded():
    rows = [
        {"student_ref": "STU-01", "apaar_id": "111122223331", "programme_code": "CSE", "academic_year": "2026-27", "category": "GENERAL"},
        {"student_ref": "STU-02", "apaar_id": "111122223332", "programme_code": "CSE", "academic_year": "2026-27", "category": "GENERAL"},
    ]
    # Approved intake is 1, so row 2 pushes it over limit
    configured_programmes = {"CSE": "id"}
    configured_intakes = {("CSE", "2026-27"): 1}
    current_counts = {("CSE", "2026-27"): 0}

    res = validate_csv_rows(rows, configured_programmes, configured_intakes, set(), current_counts)

    assert res.total_rows == 2
    # Row 1 is accepted, Row 2 is accepted but flagged with warning anomaly
    assert res.accepted_count == 2
    codes = [i["issue_code"] for i in res.issues]
    assert "INTAKE_MISMATCH" in codes
    assert len(res.anomalies) == 1
    assert res.anomalies[0]["issue_code"] == "INTAKE_MISMATCH"

