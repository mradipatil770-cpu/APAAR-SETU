import uuid
import time
import base64
import json
import hmac
import hashlib
import pytest
from app.models.models import AuditLog
from app.core.security import verify_supabase_jwt, get_current_user_context, Role
from app.core.config import settings
from fastapi import HTTPException


def test_audit_log_validates_uuid():
    """Verify AuditLog strictly validates user_id and institution_id."""
    valid_uuid = str(uuid.uuid4())

    # 1. Valid UUID succeeds
    audit = AuditLog(
        institution_id=valid_uuid,
        user_id=valid_uuid,
        action="TEST_ACTION",
        actor_role="INSTITUTE_ADMIN",
    )
    assert audit.user_id == valid_uuid
    assert audit.institution_id == valid_uuid

    # 2. None succeeds (permitted for unauthenticated or system events)
    audit_sys = AuditLog(
        institution_id=valid_uuid,
        user_id=None,
        action="SYSTEM_CRON",
        actor_role="SYSTEM",
    )
    assert audit_sys.user_id is None

    # 3. Invalid UUID string ('demo-user-1') raises ValueError to protect audit integrity
    with pytest.raises(ValueError) as exc:
        AuditLog(
            institution_id=valid_uuid,
            user_id="demo-user-1",
            action="TEST_ACTION",
        )
    assert "Invalid UUID for audit log actor" in str(exc.value)

    # 4. Invalid institution UUID raises ValueError
    with pytest.raises(ValueError) as exc_inst:
        AuditLog(
            institution_id="not-a-uuid",
            user_id=valid_uuid,
            action="TEST_ACTION",
        )
    assert "Invalid UUID for audit log institution" in str(exc_inst.value)


def test_jwt_signature_and_expiry_verification():
    """Verify JWT cryptographic validation: valid signature, tampering, expiry."""
    secret = "super-secret-test-key-32-chars-long!"
    valid_sub = str(uuid.uuid4())

    def make_token(payload_dict, test_secret=secret):
        header_b64 = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload_dict).encode()).decode().rstrip("=")
        signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
        sig = hmac.new(test_secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
        sig_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")
        return f"{header_b64}.{payload_b64}.{sig_b64}"

    # A. Valid Token
    token_valid = make_token({
        "sub": valid_sub,
        "aud": "authenticated",
        "exp": time.time() + 3600,
        "email": "officer@inst.edu",
    })
    payload = verify_supabase_jwt(token_valid, secret, expected_audience="authenticated")
    assert payload["sub"] == valid_sub

    # B. Tampered Token Signature Fails
    token_tampered = make_token({"sub": valid_sub, "aud": "authenticated", "exp": time.time() + 3600}, test_secret="wrong-secret")
    with pytest.raises(HTTPException) as exc_tamper:
        verify_supabase_jwt(token_tampered, secret, expected_audience="authenticated")
    assert exc_tamper.value.status_code == 401
    assert "signature" in exc_tamper.value.detail.lower()

    # C. Expired Token Fails
    token_expired = make_token({
        "sub": valid_sub,
        "aud": "authenticated",
        "exp": time.time() - 60,
    })
    with pytest.raises(HTTPException) as exc_exp:
        verify_supabase_jwt(token_expired, secret, expected_audience="authenticated")
    assert exc_exp.value.status_code == 401
    assert "expired" in exc_exp.value.detail.lower()

    # D. Audience Mismatch Fails
    token_wrong_aud = make_token({
        "sub": valid_sub,
        "aud": "other_service",
        "exp": time.time() + 3600,
    })
    with pytest.raises(HTTPException) as exc_aud:
        verify_supabase_jwt(token_wrong_aud, secret, expected_audience="authenticated")
    assert exc_aud.value.status_code == 401
    assert "audience" in exc_aud.value.detail.lower()


@pytest.mark.anyio
async def test_production_mode_rejects_unauthenticated(monkeypatch):
    """Verify demo fallback is strictly forbidden in production mode."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    with pytest.raises(HTTPException) as exc:
        await get_current_user_context(authorization=None)
    assert exc.value.status_code == 401
    assert "demo authentication is disabled in production" in exc.value.detail.lower()

