import logging
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.firebase import verify_firebase_token
from app.dependencies.db import get_db
from app.models.user import User

logger = logging.getLogger("uvicorn.error")
security = HTTPBearer(auto_error=True)


def get_current_user_claims(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )
    return verify_firebase_token(credentials.credentials)



def get_current_user(
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db),
) -> User:
    firebase_uid = claims.get("uid") or claims.get("sub")

    if not firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing UID",
        )

    email = claims.get("email")
    email_clean = email.strip().lower() if email else None

    name = (
        claims.get("name")
        or claims.get("display_name")
        or (email_clean.split("@")[0] if email_clean else "Customer")
    )

    phone = claims.get("phone_number")

    # Resolve authoritative role from verified Firebase custom claims
    is_claim_admin = (
        claims.get("role") == "admin"
        or claims.get("admin") is True
    )
    token_role = "admin" if is_claim_admin else "customer"

    # Firebase UID is the primary identity lookup.
    user = db.scalar(
        select(User).where(User.firebase_uid == firebase_uid)
    )

    if not user and email_clean:
        # Check whether this email already exists.
        user = db.scalar(
            select(User).where(
                User.email == email_clean
            )
        )

        if user:
            # Link existing account only after verifying that
            # the Firebase identity is authorized to claim it.
            # For an existing account, require verified email.
            if claims.get("email_verified") is not True:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Email verification required to link account.",
                )

            if user.firebase_uid and user.firebase_uid != firebase_uid:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email is already linked to another Firebase account.",
                )

            user.firebase_uid = firebase_uid

            if name and user.name in ("Customer", ""):
                user.name = name

            if phone and not user.phone:
                user.phone = phone

            if user.role != token_role:
                user.role = token_role

            db.commit()
            db.refresh(user)
            return user

    if not user:
        # Create a new user only when no matching account exists.
        user = User(
            firebase_uid=firebase_uid,
            email=email_clean,
            name=name,
            phone=phone,
            role=token_role,
        )

        db.add(user)

        try:
            db.commit()
            db.refresh(user)

        except IntegrityError:
            db.rollback()

            # Handle simultaneous requests creating the same user.
            user = db.scalar(
                select(User).where(
                    User.firebase_uid == firebase_uid
                )
            )

            if not user and email_clean:
                user = db.scalar(
                    select(User).where(
                        User.email == email_clean
                    )
                )

            if not user:
                raise

        return user

    # Update basic profile information and keep role in sync.
    modified = False

    if user.role != token_role:
        user.role = token_role
        modified = True

    if email_clean and user.email != email_clean:
        # Do not silently transfer an email already owned by another user.
        existing_email_user = db.scalar(
            select(User).where(
                User.email == email_clean,
                User.id != user.id,
            )
        )

        if existing_email_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already belongs to another account.",
            )

        user.email = email_clean
        modified = True

    if name and user.name in ("Customer", ""):
        user.name = name
        modified = True

    if phone and not user.phone:
        user.phone = phone
        modified = True

    if modified:
        db.commit()
        db.refresh(user)

    return user

def require_admin(
    credentials: HTTPAuthorizationCredentials = Security(security),
    claims: dict = Depends(get_current_user_claims),
    user: User = Depends(get_current_user),
) -> User:
    # Strictly check Firebase custom claims with revocation verification for admin operations
    admin_claims = claims
    if credentials and credentials.credentials:
        admin_claims = verify_firebase_token(credentials.credentials, check_revoked=True)

    is_claim_admin = (
        admin_claims.get("role") == "admin"
        or admin_claims.get("admin") is True
    )

    if not is_claim_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin access required. Please re-authenticate if claims were recently granted.",
        )

    return user


# Alias for dependency consistency
get_current_admin = require_admin
