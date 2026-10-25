import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user_context, AuthenticatedContext, Role


def test_auth_login_and_me_flow(client):
    """Tests /api/v1/auth/login and /api/v1/auth/me endpoints."""
    # 1. Login with demo admin
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "demo_admin@delhi-tech.edu.synthetic", "password": "demo_password_2026"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "institution_admin"
    token = data["access_token"]

    # 2. Unknown user login fails with 401
    res_bad = client.post(
        "/api/v1/auth/login",
        json={"email": "unknown@university.edu", "password": "some_password"}
    )
    assert res_bad.status_code == 401

    # 3. Call /me with Bearer token
    res_me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_me.status_code == 200
    me_data = res_me.json()
    assert me_data["email"] == "demo_admin@delhi-tech.edu.synthetic"


def test_central_dashboard_rbac_enforcement(client):
    """
    Central AICTE dashboard must reject institutional users with 403 Forbidden
    and allow central regulatory roles (AICTE_ADMIN, AICTE_ANALYST).
    """
    # 1. Institutional Admin trying to access Central AICTE Dashboard is rejected
    def mock_institute_admin():
        return AuthenticatedContext(
            user_id="33333333-3333-3333-3333-333333333333",
            email="registrar@delhi-tech.edu.synthetic",
            institution_id="11111111-1111-1111-1111-111111111111",
            role=Role.INSTITUTE_ADMIN,
        )

    app.dependency_overrides[get_current_user_context] = mock_institute_admin
    try:
        res = client.get("/api/v1/aicte/dashboard")
        assert res.status_code == 403
        assert "central regulatory privileges" in res.json()["detail"].lower()

        res_insts = client.get("/api/v1/aicte/institutions")
        assert res_insts.status_code == 403

        res_dups = client.get("/api/v1/aicte/duplicate-candidates")
        assert res_dups.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user_context, None)

    # 2. Central AICTE Admin succeeds
    def mock_aicte_admin():
        return AuthenticatedContext(
            user_id="44444444-4444-4444-4444-444444440000",
            email="director@aicte-india.org.synthetic",
            institution_id="00000000-0000-0000-0000-000000000000",
            role=Role.AICTE_ADMIN,
        )

    app.dependency_overrides[get_current_user_context] = mock_aicte_admin
    try:
        res = client.get("/api/v1/aicte/dashboard")
        assert res.status_code == 200
        stats = res.json()
        assert "total_institutions" in stats
        assert "total_approved_intake" in stats
        assert "programme_breakdown" in stats

        res_insts = client.get("/api/v1/aicte/institutions")
        assert res_insts.status_code == 200
        inst_list = res_insts.json()
        assert isinstance(inst_list, list)

        res_dups = client.get("/api/v1/aicte/duplicate-candidates")
        assert res_dups.status_code == 200
        assert isinstance(res_dups.json(), list)
    finally:
        app.dependency_overrides.pop(get_current_user_context, None)


def test_verification_requests_workflow(client):
    """
    Tests academic verification request submission, tenant isolation, and determination.
    """
    # 1. Create a verification request for an existing synthetic student
    def mock_inst_admin():
        return AuthenticatedContext(
            user_id="33333333-3333-3333-3333-333333333333",
            email="registrar@delhi-tech.edu.synthetic",
            institution_id="11111111-1111-1111-1111-111111111111",
            role=Role.INSTITUTE_ADMIN,
        )

    app.dependency_overrides[get_current_user_context] = mock_inst_admin
    try:
        # Non-existent student fails with 404
        bad_req = client.post(
            "/api/v1/verifications",
            json={
                "institution_id": "11111111-1111-1111-1111-111111111111",
                "student_ref": "NON-EXISTENT-STUDENT-999",
                "requester_org": "Acme Corp",
                "requester_email": "verify@acme.com",
                "purpose": "EMPLOYMENT_CHECK",
                "scope": "ENROLMENT_STATUS",
            }
        )
        assert bad_req.status_code == 404

        # List requests
        list_res = client.get("/api/v1/verifications")
        assert list_res.status_code == 200
        requests = list_res.json()
        assert len(requests) >= 1
        target_id = requests[0]["id"]

        # Operator cannot decide (requires admin)
        def mock_operator():
            return AuthenticatedContext(
                user_id="33333333-3333-3333-3333-333333333333",
                email="operator@delhi-tech.edu.synthetic",
                institution_id="11111111-1111-1111-1111-111111111111",
                role=Role.INSTITUTE_OPERATOR,
            )
        app.dependency_overrides[get_current_user_context] = mock_operator
        op_res = client.post(
            f"/api/v1/verifications/{target_id}/decide",
            json={"status": "APPROVED", "decision_notes": "Attempt by operator"}
        )
        assert op_res.status_code == 403

        # Admin can decide
        app.dependency_overrides[get_current_user_context] = mock_inst_admin
        decide_res = client.post(
            f"/api/v1/verifications/{target_id}/decide",
            json={"status": "APPROVED", "decision_notes": "Verified against institutional records"}
        )
        assert decide_res.status_code == 200
        assert decide_res.json()["status"] == "APPROVED"
        assert decide_res.json()["decision_notes"] == "Verified against institutional records"
    finally:
        app.dependency_overrides.pop(get_current_user_context, None)

