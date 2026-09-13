import datetime
from typing import Dict, Any, Optional
from starlette.requests import Request
from starlette.responses import Response
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import create_access_token, generate_csrf_token, verify_password, hash_password
from app.core.exceptions import UnauthorizedError, ForbiddenError, ValidationError
from app.core.logging import logger
from app.db.models import User
from app.services.audit_service import audit_service

class AuthService:
    @staticmethod
    def login(email: str, password: str, db: Session, client_ip: Optional[str] = None) -> Dict[str, Any]:
        """
        Authenticates a bank officer using email and password.
        Compares password with salted password hash stored in database.
        """
        normalized_email = email.lower().strip()
        user = db.query(User).filter(User.email == normalized_email).first()

        # Generic authentication error to prevent username enumeration
        if not user or not user.password_hash:
            logger.warning(f"Failed login attempt for {normalized_email} from IP {client_ip}")
            raise UnauthorizedError("Invalid bank officer email or password.")

        if not verify_password(password, user.password_hash):
            logger.warning(f"Password mismatch for user {user.email} from IP {client_ip}")
            raise UnauthorizedError("Invalid bank officer email or password.")

        if not user.is_active:
            raise ForbiddenError("Bank officer account has been deactivated. Please contact security administration.")

        # Update last login timestamp
        user.last_login_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        db.refresh(user)

        # Generate JWT session token
        jwt_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
        csrf_token = generate_csrf_token()

        audit_service.log_event(
            db=db,
            action="USER_LOGIN_PASSWORD",
            entity_type="User",
            user_id=user.id,
            entity_id=user.id,
            metadata={"email": user.email, "role": user.role},
            ip_address=client_ip
        )

        return {
            "token": jwt_token,
            "csrf_token": csrf_token,
            "user": user
        }

    @staticmethod
    def demo_login(role: str, db: Session, client_ip: Optional[str] = None) -> Dict[str, Any]:
        """
        Demo mode helper for evaluation of the demo bank officer account.
        """
        demo_email = "darshak@gmail.com"
        user = db.query(User).filter(User.email == demo_email).first()
        if not user:
            # Create demo account if not yet seeded
            user = User(
                email=demo_email,
                full_name="Darshak K. Bisane",
                password_hash=hash_password("123321123"),
                role="bank_officer",
                is_active=True,
                avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=DarshakBisane",
                last_login_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.last_login_at = datetime.datetime.now(datetime.timezone.utc)
            db.commit()
            db.refresh(user)

        jwt_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
        csrf_token = generate_csrf_token()

        audit_service.log_event(
            db=db,
            action="USER_LOGIN_DEMO",
            entity_type="User",
            user_id=user.id,
            entity_id=user.id,
            metadata={"email": user.email, "role": user.role},
            ip_address=client_ip
        )

        return {
            "token": jwt_token,
            "csrf_token": csrf_token,
            "user": user
        }

    @staticmethod
    def set_session_cookie(response: Response, token: str):
        response.set_cookie(
            key=settings.COOKIE_NAME,
            value=token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )

    @staticmethod
    def clear_session_cookie(response: Response):
        response.delete_cookie(
            key=settings.COOKIE_NAME,
            path="/"
        )

auth_service = AuthService()

