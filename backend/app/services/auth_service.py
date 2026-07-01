from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, UserProfile, UserRole
from app.schemas.user import UserCreate
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from datetime import datetime, timedelta
import uuid

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: UserCreate) -> dict:
        existing = await self.db.execute(
            select(User).where((User.email == data.email) | (User.username == data.username))
        )
        if existing.scalar_one_or_none():
            raise ValueError("Email or username already registered")
        
        user = User(
            id=uuid.uuid4(),
            email=data.email,
            username=data.username,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            institution=data.institution,
            department=data.department,
        )
        self.db.add(user)
        
        profile = UserProfile(
            id=uuid.uuid4(),
            user_id=user.id,
        )
        self.db.add(profile)
        await self.db.flush()
        
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role.value,
                "institution": user.institution,
                "department": user.department,
                "research_interests": user.research_interests,
                "is_verified": user.is_verified,
                "created_at": user.created_at,
            }
        }

    async def login(self, email: str, password: str) -> dict:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")
        
        if not user.is_active:
            raise ValueError("Account is deactivated")
        
        user.last_login = datetime.utcnow()
        await self.db.flush()
        
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role.value,
                "institution": user.institution,
                "department": user.department,
                "research_interests": user.research_interests,
                "avatar_url": user.avatar_url,
                "is_verified": user.is_verified,
                "created_at": user.created_at,
            }
        }

    async def get_user(self, user_id: uuid.UUID) -> User:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")
        return user

    async def update_profile(self, user_id: uuid.UUID, data: dict) -> User:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")
        
        for key, value in data.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        
        await self.db.flush()
        return user

    async def auto_login(self) -> dict:
        result = await self.db.execute(select(User).order_by(User.created_at).limit(1))
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                id=uuid.uuid4(),
                email="local@veda.app",
                username="local",
                hashed_password=hash_password("local"),
                full_name="Local User",
                institution="Local Machine",
            )
            self.db.add(user)
            profile = UserProfile(
                id=uuid.uuid4(),
                user_id=user.id,
            )
            self.db.add(profile)
            await self.db.flush()
        
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role.value,
                "institution": user.institution,
                "department": user.department,
                "research_interests": user.research_interests,
                "avatar_url": user.avatar_url,
                "is_verified": user.is_verified,
                "created_at": user.created_at,
            }
        }
