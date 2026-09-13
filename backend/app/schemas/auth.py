from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "bank_officer"
    avatar_url: Optional[str] = None
    is_active: bool = True

class UserResponse(UserBase):
    id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    last_login_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UserRoleUpdate(BaseModel):
    role: str = Field(..., description="Role: bank_officer, reviewer, admin")

class UserStatusUpdate(BaseModel):
    is_active: bool

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    csrf_token: str

class AuthMeResponse(BaseModel):
    user: UserResponse
    csrf_token: str

