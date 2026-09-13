from typing import List
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.schemas.auth import UserResponse, UserRoleUpdate, UserStatusUpdate
from app.api.deps import require_roles, get_client_ip
from app.core.exceptions import NotFoundError, ForbiddenError, ValidationError
from app.services.audit_service import audit_service

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse], summary="List all users (Admin only)")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    users = db.query(User).order_by(User.created_at).all()
    return [UserResponse.model_validate(u) for u in users]

@router.patch("/{user_id}/role", response_model=UserResponse, summary="Change user role (Admin only)")
def update_user_role(
    user_id: str,
    payload: UserRoleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    valid_roles = ["bank_officer", "reviewer", "admin"]
    if payload.role not in valid_roles:
        raise ValidationError(f"Invalid role '{payload.role}'. Allowed roles: {valid_roles}")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise NotFoundError(f"User {user_id} not found.")

    # Guard: Do not allow demoting the last admin
    if target_user.role == "admin" and payload.role != "admin":
        admin_count = db.query(User).filter(User.role == "admin", User.is_active == True).count()
        if admin_count <= 1:
            raise ForbiddenError("Cannot demote the last active administrator.")

    old_role = target_user.role
    target_user.role = payload.role
    db.commit()
    db.refresh(target_user)

    audit_service.log_event(
        db=db,
        action="ROLE_CHANGED",
        entity_type="User",
        user_id=current_user.id,
        entity_id=target_user.id,
        metadata={"target_email": target_user.email, "old_role": old_role, "new_role": payload.role},
        ip_address=get_client_ip(request)
    )

    return UserResponse.model_validate(target_user)

@router.patch("/{user_id}/status", response_model=UserResponse, summary="Activate or deactivate user (Admin only)")
def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise NotFoundError(f"User {user_id} not found.")

    if target_user.id == current_user.id and not payload.is_active:
        raise ForbiddenError("You cannot deactivate your own administrator account.")

    target_user.is_active = payload.is_active
    db.commit()
    db.refresh(target_user)

    audit_service.log_event(
        db=db,
        action="USER_STATUS_UPDATED",
        entity_type="User",
        user_id=current_user.id,
        entity_id=target_user.id,
        metadata={"target_email": target_user.email, "is_active": payload.is_active},
        ip_address=get_client_ip(request)
    )

    return UserResponse.model_validate(target_user)
