import base64
import json
import logging
import uuid
import hmac
import hashlib
import time
from typing import Optional, Set
from fastapi import Header, HTTPException, status
from app.core.config import settings

logger = logging.getLogger("apaarsetu.security")


# Reconciled Government/Institutional Roles (Priority 5)
class Role:
    AICTE_ADMIN = "AICTE_ADMIN"
    AICTE_ANALYST = "AICTE_ANALYST"
    INSTITUTE_ADMIN = "INSTITUTE_ADMIN"
    INSTITUTE_OPERATOR = "INSTITUTE_OPERATOR"
    AUDITOR = "AUDITOR"


ALL_ROLES = {
    Role.AICTE_ADMIN,
    Role.AICTE_ANALYST,
    Role.INSTITUTE_ADMIN,
    Role.INSTITUTE_OPERATOR,
    Role.AUDITOR,
}

CENTRAL_ROLES = {Role.AICTE_ADMIN, Role.AICTE_ANALYST, Role.AUDITOR}


class AuthenticatedContext:
    """Represents the verified user and institutional context derived on the server side."""
    def __init__(
        self,
        user_id: str,
        email: str,
        institution_id: str,
        role: str = Role.INSTITUTE_ADMIN,
        is_authenticated: bool = True,
        is_verified_jwt: bool = False,
    ):
        self.user_id = user_id
        self.email = email
        self.institution_id = institution_id
        
        # Normalize role string (handle case variations like institution_admin)
        role_str = str(role).strip().upper() if role else Role.INSTITUTE_OPERATOR
        if role_str in {"INSTITUTION_ADMIN", "INSTITUTE_ADMIN"}:
            self.role = Role.INSTITUTE_ADMIN
        elif role_str in {"INSTITUTION_OPERATOR", "INSTITUTE_OPERATOR", "OPERATOR"}:
            self.role = Role.INSTITUTE_OPERATOR
        elif role_str in ALL_ROLES:
            self.role = role_str
        else:
            self.role = Role.INSTITUTE_OPERATOR
        self.is_authenticated = is_authenticated
        self.is_verified_jwt = is_verified_jwt

    def is_central(self) -> bool:
        return self.role in CENTRAL_ROLES

    def can_upload(self) -> bool:
        return self.role in {Role.AICTE_ADMIN, Role.INSTITUTE_ADMIN, Role.INSTITUTE_OPERATOR}

    def can_resolve_anomalies(self) -> bool:
        return self.role in {Role.AICTE_ADMIN, Role.INSTITUTE_ADMIN}

    def can_export_reports(self) -> bool:
        return self.role in {Role.AICTE_ADMIN, Role.AICTE_ANALYST, Role.INSTITUTE_ADMIN, Role.AUDITOR}


# Primary synthetic demo institution ID & User ID (matches 001_synthetic_seed.sql)
DEFAULT_DEMO_INSTITUTION_ID = "11111111-1111-1111-1111-111111111111"
DEFAULT_DEMO_USER_ID = "33333333-3333-3333-3333-333333333333"


DEFAULT_DEV_JWT_SECRET = "APAARSetu-Development-JWT-Secret-2026-Key!"


def create_signed_jwt(payload: dict, secret: Optional[str] = None) -> str:
    """
    Creates an HS256-signed JWT token using SUPABASE_JWT_SECRET (or development seed).
    """
    signing_secret = secret or settings.SUPABASE_JWT_SECRET or DEFAULT_DEV_JWT_SECRET
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    sig = hmac.new(signing_secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")
    return f"{header_b64}.{payload_b64}.{sig_b64}"


def verify_supabase_jwt(token: str, secret: str, expected_audience: Optional[str] = "authenticated") -> dict:
    """
    Cryptographically verifies a Supabase HS256 JWT signature and validates expiry/audience.
    """
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed JWT token format.",
        )

    header_b64, payload_b64, sig_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected_sig = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()

    try:
        padded_sig = sig_b64 + "=" * ((4 - len(sig_b64) % 4) % 4)
        actual_sig = base64.urlsafe_b64decode(padded_sig)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT signature encoding.",
        )

    if not hmac.compare_digest(expected_sig, actual_sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT signature. Authentication verification failed.",
        )

    try:
        padded_payload = payload_b64 + "=" * ((4 - len(payload_b64) % 4) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded_payload))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT payload structure.",
        )

    # Validate Expiry (exp)
    exp = payload.get("exp")
    if exp is not None:
        if time.time() > float(exp):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has expired. Please re-authenticate.",
            )

    # Validate Audience (aud)
    if expected_audience:
        aud = payload.get("aud")
        if aud and aud != expected_audience:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token audience mismatch (expected '{expected_audience}').",
            )

    return payload


async def get_current_user_context(
    authorization: Optional[str] = Header(None),
    x_institution_id: Optional[str] = Header(None),
) -> AuthenticatedContext:
    """
    Server-side security boundary:
    1. In production, unauthenticated requests are strictly rejected.
    2. When Bearer tokens are present, validates structure and cryptographically verifies signature if secret configured.
    3. Rejects invalid schemes or malformed JWT structures with 401.
    4. Validates user IDs as UUIDs to guarantee database schema integrity.
    5. In local prototype mode, operates with clearly marked synthetic identity.
    """
    is_production = settings.ENVIRONMENT == "production"

    if authorization:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization scheme. Bearer token required.",
            )
        token = authorization[len("Bearer "):].strip()
        if not token or token in ("null", "undefined", "invalid_token"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token.",
            )

        parts = token.split(".")
        if len(parts) != 3:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed JWT token format.",
            )

        # 1. Cryptographic Verification if Secret is Configured
        if settings.SUPABASE_JWT_SECRET:
            payload = verify_supabase_jwt(
                token=token,
                secret=settings.SUPABASE_JWT_SECRET,
                expected_audience=settings.SUPABASE_JWT_AUDIENCE or "authenticated",
            )
            raw_sub = payload.get("sub")
            if not raw_sub:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token missing required subject claim ('sub').",
                )
            try:
                user_uuid = str(uuid.UUID(str(raw_sub)))
            except (ValueError, TypeError, AttributeError):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid user identity format in token: 'sub' must be a valid UUID.",
                )

            # Derive role from app_metadata or user_metadata if available
            app_meta = payload.get("app_metadata", {})
            user_role = app_meta.get("role") or payload.get("role", Role.INSTITUTE_ADMIN)
            user_inst = app_meta.get("institution_id") or payload.get("institution_id", DEFAULT_DEMO_INSTITUTION_ID)

            return AuthenticatedContext(
                user_id=user_uuid,
                email=payload.get("email", "verified_user@institution.edu"),
                institution_id=user_inst,
                role=user_role,
                is_authenticated=True,
                is_verified_jwt=True,
            )
        elif is_production:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server configuration error: SUPABASE_JWT_SECRET must be configured for production.",
            )

        # 2. Development / Test Mode: Structural Inspection with Strict UUID Validation
        try:
            padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
            payload = json.loads(base64.urlsafe_b64decode(padded))
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed JWT payload.",
            )

        raw_sub = payload.get("sub")
        if raw_sub:
            try:
                user_uuid = str(uuid.UUID(str(raw_sub)))
            except (ValueError, TypeError, AttributeError):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid user identity in token: 'sub' must be a valid UUID.",
                )
        else:
            user_uuid = DEFAULT_DEMO_USER_ID

        user_role = payload.get("role", Role.INSTITUTE_ADMIN)
        user_inst = payload.get("institution_id", DEFAULT_DEMO_INSTITUTION_ID)

        return AuthenticatedContext(
            user_id=user_uuid,
            email=payload.get("email", "registrar@delhi-tech.edu.synthetic"),
            institution_id=user_inst,
            role=user_role,
            is_authenticated=True,
            is_verified_jwt=False,
        )

    # In Production, unauthenticated access is forbidden
    if is_production:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Demo authentication is disabled in production.",
        )

    # Local prototype mode context (explicit synthetic institutional access)
    return AuthenticatedContext(
        user_id=DEFAULT_DEMO_USER_ID,
        email="registrar@delhi-tech.edu.synthetic",
        institution_id=DEFAULT_DEMO_INSTITUTION_ID,
        role=Role.INSTITUTE_ADMIN,
        is_authenticated=False,
        is_verified_jwt=False,
    )


def require_role(context: AuthenticatedContext, allowed_roles: Set[str]) -> None:
    """Enforces specific role privileges."""
    if context.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: Operation requires one of the following roles: {', '.join(sorted(allowed_roles))}.",
        )


def enforce_institution_access(context: AuthenticatedContext, target_institution_id: str) -> None:
    """
    Multi-tenant isolation barrier:
    Institutional staff cannot view, edit, or export records belonging to other institutions.
    """
    if not context.is_central() and str(context.institution_id) != str(target_institution_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cross-institution data access is prohibited.",
        )
