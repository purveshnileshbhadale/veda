from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
import uuid

class UserCreate(BaseModel):
    email: Optional[str] = None
    username: str
    password: str = Field(..., max_length=72)
    full_name: Optional[str] = None
    institution: Optional[str] = None
    department: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str = Field(..., max_length=72)

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    role: str
    institution: Optional[str]
    department: Optional[str]
    research_interests: List[str] = []
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    institution: Optional[str] = None
    department: Optional[str] = None
    research_interests: Optional[List[str]] = None
    website: Optional[str] = None
    github: Optional[str] = None
    orcid: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
