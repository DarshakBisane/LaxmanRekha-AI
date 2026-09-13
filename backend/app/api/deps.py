from typing import Optional, List, Callable
from fastapi import Depends, Request, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.core.config import settings
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedError, ForbiddenError
from app.services.redis_service import redis_service

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    token = None
    # 1. Check Authorization Bearer Header
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()
    
    # 2. Check HttpOnly Cookie
    if not token:
        token = request.cookies.get(settings.COOKIE_NAME)

    if not token:
        raise UnauthorizedError("Authentication token is missing. Please sign in.")

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token payload.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedError("User account not found.")

    if not user.is_active:
        raise ForbiddenError("User account has been deactivated. Please contact an administrator.")

    return user

def require_roles(allowed_roles: List[str]) -> Callable:
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenError(
                f"Action requires one of the following roles: {', '.join(allowed_roles)}. Your role is '{current_user.role}'."
            )
        return current_user
    return role_checker

def check_rate_limit(max_requests: int = 60, window_seconds: int = 60) -> Callable:
    def limiter(request: Request):
        ip = get_client_ip(request)
        path = request.url.path
        key = f"{ip}:{path}"
        if not redis_service.check_rate_limit(key, max_requests, window_seconds):
            raise ForbiddenError("Rate limit exceeded for this endpoint. Please wait before retrying.")
    return limiter
