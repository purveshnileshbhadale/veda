import json
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserProfileUpdate
from app.services.auth_service import AuthService
from app.core.security import get_current_user
from app.models.user import User
from pydantic import BaseModel

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
        return await service.register(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        return await service.login(data.email, data.password)
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
