from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings
from app.db.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse, AuthMeResponse, UserResponse
from app.services.auth_service import auth_service
from app.api.deps import get_current_user, get_client_ip, check_rate_limit
from app.db.models import User
from app.core.security import generate_csrf_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse, summary="Bank Officer Secure Login")
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    _limiter = Depends(check_rate_limit(max_requests=20, window_seconds=60))
):
    """
    Authenticates an internal bank officer with email and password.
    Returns a signed JWT and sets an HttpOnly session cookie.
    """
    client_ip = get_client_ip(request)
    result = auth_service.login(
        email=payload.email,
        password=payload.password,
        db=db,
        client_ip=client_ip
    )
    auth_service.set_session_cookie(response, result["token"])

    return TokenResponse(
        access_token=result["token"],
        user=UserResponse.model_validate(result["user"]),
        csrf_token=result["csrf_token"]
    )

class DirectDemoLogin(BaseModel):
    role: str = "bank_officer"

@router.post("/demo-login", response_model=TokenResponse, summary="Demo mode authentication for evaluation")
def demo_login(
    payload: DirectDemoLogin,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Evaluation helper: authenticates the seeded demo bank officer (darshak@gmail.com).
    """
    client_ip = get_client_ip(request)
    result = auth_service.demo_login(role=payload.role, db=db, client_ip=client_ip)
    auth_service.set_session_cookie(response, result["token"])

    return TokenResponse(
        access_token=result["token"],
        user=UserResponse.model_validate(result["user"]),
        csrf_token=result["csrf_token"]
    )

@router.post("/logout", summary="Log out of current session")
def logout(response: Response, current_user: User = Depends(get_current_user)):
    auth_service.clear_session_cookie(response)
    return {"data": {"message": "Successfully logged out."}}

@router.get("/me", response_model=AuthMeResponse, summary="Retrieve current authenticated bank officer")
def get_me(current_user: User = Depends(get_current_user)):
    return AuthMeResponse(
        user=UserResponse.model_validate(current_user),
        csrf_token=generate_csrf_token()
    )

