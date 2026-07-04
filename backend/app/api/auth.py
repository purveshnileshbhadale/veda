import json
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserProfileUpdate
from app.services.auth_service import AuthService
from app.core.security import get_current_user, require_admin
from app.models.user import User, UserRole
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/auth", tags=["Authentication"])

KEYS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "api_keys.json")

class APIKeys(BaseModel):
    gemini: Optional[str] = None
    groq: Optional[str] = None
    openrouter: Optional[str] = None
    deepseek: Optional[str] = None

def load_keys() -> dict:
    try:
        if os.path.exists(KEYS_FILE):
            with open(KEYS_FILE) as f:
                return json.load(f)
    except:
        pass
    return {}

def save_keys(keys: dict):
    os.makedirs(os.path.dirname(KEYS_FILE), exist_ok=True)
    with open(KEYS_FILE, "w") as f:
        json.dump(keys, f)

def get_active_keys() -> dict:
    from app.config import get_settings
    settings = get_settings()
    saved = load_keys()
    return {
        "gemini": saved.get("gemini") or settings.GEMINI_API_KEY,
        "groq": saved.get("groq") or settings.GROQ_API_KEY,
        "openrouter": saved.get("openrouter") or settings.OPENROUTER_API_KEY,
        "deepseek": saved.get("deepseek") or settings.DEEPSEEK_API_KEY,
    }

@router.post("/register", response_model=TokenResponse)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        result = await service.register(data)
        from app.config import get_settings
        s = get_settings()
        if s.DEVELOPER_BOOTSTRAP_USERNAME and data.username == s.DEVELOPER_BOOTSTRAP_USERNAME:
            from sqlalchemy import select
            r = await db.execute(select(User).where(User.username == data.username))
            u = r.scalar_one_or_none()
            if u:
                u.role = UserRole.DEVELOPER
                await db.commit()
                await db.refresh(u)
                from app.schemas.user import UserResponse
                result.user = UserResponse.model_validate(u)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        return await service.login(data.username, data.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    try:
        return await service.update_profile(current_user.id, data.model_dump(exclude_none=True))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/auto-login", response_model=TokenResponse)
async def auto_login(db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        return await service.auto_login()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

class PromoteRequest(BaseModel):
    username: str
    role: str = "developer"

@router.post("/promote")
async def promote_user(
    data: PromoteRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{data.username}' not found")
    if data.role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=400, detail=f"Invalid role. Valid: {[r.value for r in UserRole]}")
    old_role = user.role.value
    user.role = UserRole(data.role)
    await db.commit()
    return {"message": f"Promoted '{data.username}' from {old_role} -> {data.role}"}

class UserAdminResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: str
    last_login: Optional[str] = None

@router.get("/users", response_model=List[UserAdminResponse])
async def list_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [
        UserAdminResponse(
            id=u.id, email=u.email, username=u.username,
            full_name=u.full_name, role=u.role.value,
            is_active=u.is_active, is_verified=u.is_verified,
            created_at=u.created_at.isoformat() if u.created_at else "",
            last_login=u.last_login.isoformat() if u.last_login else None,
        )
        for u in users
    ]

@router.get("/keys")
async def get_keys(current_user: User = Depends(get_current_user)):
    saved = load_keys()
    # Return which providers have keys (not the keys themselves from this endpoint)
    active = get_active_keys()
    return {
        "configured": {k: bool(v) for k, v in active.items()},
        "providers": list(active.keys()),
    }

@router.put("/keys")
async def save_api_keys(
    keys: APIKeys,
    current_user: User = Depends(get_current_user),
):
    current = load_keys()
    for k, v in keys.model_dump(exclude_none=True).items():
        if v:
            current[k] = v
    save_keys(current)
    return {"status": "saved"}
