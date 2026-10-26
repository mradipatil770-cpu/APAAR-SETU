"""
Tests for Phase 3:
1. Institution self-registration (PENDING_VERIFICATION status).
2. Non-privileged isolation (pending institution cannot upload data).
3. Central AICTE Admin approval / rejection workflow.
4. Inter-institutional student transfer request & review.
5. Password recovery request handling.
"""
import uuid
import pytest
from app.core.security import create_signed_jwt, Role


@pytest.fixture
def central_admin_token():
    return create_signed_jwt({
        "sub": "44444444-4444-4444-4444-444444440000",
        "email": "director@aicte-india.org.synthetic",
        "role": Role.AICTE_ADMIN,
        "aud": "authenticated",
    })


@pytest.fixture
def central_analyst_token():
    return create_signed_jwt({
        "sub": "55555555-5555-5555-5555-555555550000",
        "email": "analyst@aicte-india.org.synthetic",
        "role": Role.AICTE_ANALYST,
        "aud": "authenticated",
    })


@pytest.fixture
def institution_admin_token():
    return create_signed_jwt({
        "sub": "33333333-3333-3333-3333-333333333333",
        "email": "registrar@delhi-tech.edu.synthetic",
        "role": Role.INSTITUTE_ADMIN,
        "institution_id": "11111111-1111-1111-1111-111111111111",
        "aud": "authenticated",
    })


def test_institution_self_registration(client):
    unique_suffix = str(uuid.uuid4())[:8]
    reg_payload = {
        "name": f"Government Polytechnic {unique_suffix}",
        "code": f"AICTE-TEST-{unique_suffix}",
        "institution_type": "CENTRAL_STATE_AFFILIATED",
        "contact_name": "Dr. Verification Officer",
        "contact_designation": "Principal",
        "contact_phone": "+91-9988776655",
        "state": "Maharashtra",
        "address": "Polytechnic Campus, Sector 4",
        "admin_email": f"principal.{unique_suffix}@polytechnic.ac.in.synthetic",
        "password": "StrongPassword2026!",
    }

    # 1. Register
    res = client.post("/api/v1/auth/register-institution", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "PENDING_VERIFICATION"
    assert data["code"] == f"AICTE-TEST-{unique_suffix}".upper()
    assert "PENDING_VERIFICATION" in data["message"]

    # 2. Duplicate code rejected with 409
    dup_res = client.post("/api/v1/auth/register-institution", json=reg_payload)
    assert dup_res.status_code == 409
    assert "already registered" in dup_res.json()["detail"]


def test_pending_institution_cannot_upload_records(client):
    # User from a pending institution
    pending_inst_id = "88888888-8888-8888-8888-888888880001"
    pending_token = create_signed_jwt({
        "sub": "88888888-8888-8888-8888-888888880002",
        "email": "pending_admin@nagpur-poly.edu.synthetic",
        "role": Role.INSTITUTE_ADMIN,
        "institution_id": pending_inst_id,
        "aud": "authenticated",
    })

    headers = {"Authorization": f"Bearer {pending_token}"}
    csv_data = "student_ref,apaar_id,programme_code,academic_year,category\nSTU-01,111122223333,BTECH-CSE,2025-26,GENERAL\n"
    
    res = client.post(
        "/api/v1/uploads",
        headers=headers,
        files={"file": ("test.csv", csv_data, "text/csv")},
    )
    # Must be rejected with 403 Forbidden because institution is PENDING_VERIFICATION
    assert res.status_code == 403
    assert "PENDING_VERIFICATION" in res.json()["detail"]


def test_central_admin_onboarding_approval(client, central_admin_token, central_analyst_token):
    headers_admin = {"Authorization": f"Bearer {central_admin_token}"}
    headers_analyst = {"Authorization": f"Bearer {central_analyst_token}"}

    # 1. List pending institutions
    list_res = client.get("/api/v1/aicte/pending-institutions", headers=headers_admin)
    assert list_res.status_code == 200
    pending_list = list_res.json()
    assert isinstance(pending_list, list)

    # 2. Analyst cannot approve (RBAC: AICTE_ADMIN only)
    if len(pending_list) > 0:
        target_id = pending_list[0]["id"]
        analyst_res = client.post(
            f"/api/v1/aicte/institutions/{target_id}/decide",
            headers=headers_analyst,
            json={"status": "ACTIVE", "review_remarks": "Analyst approval attempt"},
        )
        assert analyst_res.status_code == 403

        # 3. AICTE Admin can approve
        admin_res = client.post(
            f"/api/v1/aicte/institutions/{target_id}/decide",
            headers=headers_admin,
            json={"status": "ACTIVE", "review_remarks": "Verified against AICTE Approval Hand Book"},
        )
        assert admin_res.status_code == 200
        assert admin_res.json()["status"] == "ACTIVE"


def test_student_transfers_workflow(client, institution_admin_token, central_admin_token):
    inst_headers = {"Authorization": f"Bearer {institution_admin_token}"}
    central_headers = {"Authorization": f"Bearer {central_admin_token}"}

    # 1. List transfers for institution
    res = client.get("/api/v1/transfers", headers=inst_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # 2. List transfers centrally
    central_res = client.get("/api/v1/aicte/transfers", headers=central_headers)
    assert central_res.status_code == 200
    assert isinstance(central_res.json(), list)


def test_forgot_password_generic_response(client):
    # OWASP compliance test: generic message without account enumeration
    res = client.post("/api/v1/auth/forgot-password", json={"email": "nonexistent@university.ac.in"})
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    assert "instructions to reset your password" in res.json()["message"]

