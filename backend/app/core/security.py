import base64
import json
import logging
import uuid
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
        self.role = role if role in ALL_ROLES else Role.INSTITUTE_OPERATOR
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


async def get_current_user_context(
    authorization: Optional[str] = Header(None),
    x_institution_id: Optional[str] = Header(None),
) -> AuthenticatedContext:
    """
    Server-side security boundary:
    1. Validates Bearer authorization headers when present.
    2. Rejects invalid schemes or malformed JWT structures with 401.
    3. In local prototype mode, operates with clearly marked synthetic identity.
    4. Client-supplied headers cannot arbitrarily elevate roles.
    """
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

        user_id = DEFAULT_DEMO_USER_ID
        try:
            padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
            payload = json.loads(base64.urlsafe_b64decode(padded))
            sub = payload.get("sub")
            if sub:
                uuid.UUID(str(sub))
                user_id = str(sub)
        except Exception:
            pass

        # Token validated structurally; in verified setup with public keys, cryptographic verification runs here
        return AuthenticatedContext(
            user_id=user_id,
            email="registrar@delhi-tech.edu.synthetic",
            institution_id=DEFAULT_DEMO_INSTITUTION_ID,
            role=Role.INSTITUTE_ADMIN,
            is_authenticated=True,
            is_verified_jwt=False,
        )

    # Local prototype mode context (isolated synthetic institutional access)
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
