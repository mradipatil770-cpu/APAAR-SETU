import pytest
from app.core.security import AuthenticatedContext, enforce_institution_access, require_role, Role, get_current_user_context
from app.main import app
from fastapi import HTTPException


def test_invalid_authorization_header(client):
    res = client.get("/api/v1/uploads", headers={"Authorization": "Basic dXNlcjpwYXNz"})
    assert res.status_code == 401
    assert "Bearer token required" in res.json()["detail"]


def test_malformed_token_header(client):
    res = client.get("/api/v1/uploads", headers={"Authorization": "Bearer not_a_jwt_token"})
    assert res.status_code == 401
    assert "Malformed JWT" in res.json()["detail"]


def test_cross_institution_isolation_prevented():
    context = AuthenticatedContext(
        user_id="user-inst-1",
        email="user@inst1.edu",
        institution_id="11111111-1111-1111-1111-111111111111",
        role=Role.INSTITUTE_ADMIN,
    )
    # Attempting to access institution 2 data should raise 403 Forbidden
    with pytest.raises(HTTPException) as excinfo:
        enforce_institution_access(context, "22222222-2222-2222-2222-222222222222")

    assert excinfo.value.status_code == 403
    assert "Cross-institution" in excinfo.value.detail


def test_role_enforcement_logic():
    operator_ctx = AuthenticatedContext(
        user_id="op-1",
        email="op@inst.edu",
        institution_id="11111111-1111-1111-1111-111111111111",
        role=Role.INSTITUTE_OPERATOR,
    )
    admin_ctx = AuthenticatedContext(
        user_id="adm-1",
        email="adm@inst.edu",
        institution_id="11111111-1111-1111-1111-111111111111",
        role=Role.INSTITUTE_ADMIN,
    )

    # Operator cannot resolve anomalies
    assert operator_ctx.can_resolve_anomalies() is False
    assert admin_ctx.can_resolve_anomalies() is True

    # require_role raises 403 if role not permitted
    with pytest.raises(HTTPException) as exc:
        require_role(operator_ctx, {Role.AICTE_ADMIN, Role.INSTITUTE_ADMIN})
    assert exc.value.status_code == 403


def test_operator_cannot_resolve_anomaly_api(client):
    # Override auth to simulate an INSTITUTE_OPERATOR
    def mock_operator_auth():
        return AuthenticatedContext(
            user_id="op-1",
            email="op@inst.edu",
            institution_id="11111111-1111-1111-1111-111111111111",
            role=Role.INSTITUTE_OPERATOR,
        )

    app.dependency_overrides[get_current_user_context] = mock_operator_auth
    try:
        res = client.post(
            "/api/v1/anomalies/00000000-0000-0000-0000-000000000000/resolve",
            json={"resolution_notes": "Attempt by operator", "status": "RESOLVED"},
        )
        assert res.status_code == 403
        assert "Anomaly resolution requires an administrative role" in res.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user_context, None)
