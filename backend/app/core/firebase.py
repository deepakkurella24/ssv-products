import json
import logging
import os
import firebase_admin
from fastapi import HTTPException, status
from firebase_admin import auth as fb_auth, credentials

from app.core.config import settings

logger = logging.getLogger("uvicorn.error")
_initialized = False


def init_firebase() -> None:
    global _initialized
    if _initialized:
        return

    # Check if default app is already initialized
    try:
        firebase_admin.get_app()
        _initialized = True
        return
    except ValueError:
        pass

    try:
        if settings.FIREBASE_SERVICE_ACCOUNT_JSON and settings.FIREBASE_SERVICE_ACCOUNT_JSON.strip():
            cred_data = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
            cred = credentials.Certificate(cred_data)
            firebase_admin.initialize_app(cred)
            _initialized = True
            logger.info("Firebase Admin initialized using FIREBASE_SERVICE_ACCOUNT_JSON.")
            return

        cred_path = os.path.abspath(settings.FIREBASE_CREDENTIALS_PATH)
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            _initialized = True
            logger.info("Firebase Admin initialized using credentials file: %s", cred_path)
            return

        # Attempt default application credentials if available, or log notice
        try:
            firebase_admin.initialize_app()
            _initialized = True
            logger.info("Firebase Admin initialized using Application Default Credentials.")
        except Exception as e:
            logger.warning(
                "Notice: Firebase credentials not found at %s. Firebase authentication will fail until configured: %s",
                cred_path,
                e,
            )
    except Exception as exc:
        logger.error("Failed to initialize Firebase Admin SDK: %s", exc)
        raise RuntimeError(f"Firebase initialization failed: {exc}") from exc


def verify_firebase_token(token: str, check_revoked: bool = False) -> dict:
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    try:
        # verify_id_token validates expiration, issuer, audience, and signature
        decoded_claims = fb_auth.verify_id_token(token, check_revoked=check_revoked)
        return decoded_claims
    except fb_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please refresh your session.",
        )
    except fb_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please re-authenticate.",
        )
    except fb_auth.UserDisabledError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account has been disabled.",
        )
    except fb_auth.InvalidIdTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {exc}",
        )
    except Exception as exc:
        logger.error("Error during Firebase token verification: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. Invalid or unverified token.",
        ) from exc
