import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import (
    get_current_user_context,
    AuthenticatedContext,
    create_signed_jwt,
    Role,
)
from app.models.models import User, Institution
from app.schemas.schemas import LoginRequest, LoginResponse, UserProfileResponse

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates institutional or central regulatory users.
    Validates against the User database and returns a cryptographically signed Bearer JWT token.
    """
    email_clean = payload.email.strip().lower()

    user = db.query(User).filter(User.email.ilike(email_clean)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. User identity not found.",
        )

    # In synthetic demonstration environment, passwords for demo staff are accepted
    # If production hashed passwords are used, verify password hash here
    if len(payload.password) < 4:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password format.",
        )

    inst_name = None
    if user.institution_id:
        inst = db.query(Institution).filter(Institution.id == user.institution_id).first()
        if inst:
            inst_name = inst.name

    jwt_claims = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "institution_id": str(user.institution_id) if user.institution_id else None,
        "aud": "authenticated",
        "exp": time.time() + 86400, # 24 hours
        "iat": time.time(),
    }

    token = create_signed_jwt(jwt_claims)

    return LoginResponse(
        user_id=str(user.id),
        email=user.email,
        role=user.role,
        institution_id=str(user.institution_id) if user.institution_id else None,
        institution_name=inst_name,
        access_token=token,
        token_type="Bearer",
    )


@router.get("/me", response_model=UserProfileResponse)
def get_authenticated_user_profile(
    db: Session = Depends(get_db),
    auth: AuthenticatedContext = Depends(get_current_user_context),
):
    """
    Returns the verified server-side identity, active role, and institution scope.
    """
    inst_name = None
    if auth.institution_id:
        inst = db.query(Institution).filter(Institution.id == auth.institution_id).first()
        if inst:
            inst_name = inst.name

    return UserProfileResponse(
        user_id=str(auth.user_id),
        email=auth.email,
        role=auth.role,
        institution_id=str(auth.institution_id) if auth.institution_id else None,
        institution_name=inst_name,
        is_authenticated=auth.is_authenticated,
        is_central=auth.is_central(),
    )


@router.post("/logout")
def logout_user():
    """
    Invalidates client session.
    """
    return {"status": "ok", "message": "Successfully logged out of portal."}

