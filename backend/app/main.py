from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.db.session import init_db, SyncSessionLocal
from app.api import auth, ai_assistant, conversations
from app.models.user import User, UserRole
from app.core.security import hash_password
import os, json, uuid

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="VEDA - Research Paper Writing Assistant",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=json.loads(settings.CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("./data/uploads", exist_ok=True)

app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(ai_assistant.router, prefix=settings.API_PREFIX)
app.include_router(conversations.router, prefix=settings.API_PREFIX)

@app.on_event("startup")
async def startup():
    await init_db()
    db = SyncSessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            from datetime import datetime
            admin = User(
                id=str(uuid.uuid4()),
                username="admin",
                email="admin@veda.local",
                hashed_password=hash_password("admin123"),
                full_name="Admin",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow(),
            )
            db.add(admin)
            db.commit()
            print("Created default admin user (admin / admin123)")
        elif settings.ADMIN_BOOTSTRAP_USERNAME and settings.ADMIN_BOOTSTRAP_PASSWORD:
            existing = db.query(User).filter(User.role == UserRole.ADMIN).first()
            if not existing:
                from datetime import datetime
                admin = User(
                    id=str(uuid.uuid4()),
                    username=settings.ADMIN_BOOTSTRAP_USERNAME,
                    email=settings.ADMIN_BOOTSTRAP_EMAIL or f"{settings.ADMIN_BOOTSTRAP_USERNAME}@veda.local",
                    hashed_password=hash_password(settings.ADMIN_BOOTSTRAP_PASSWORD),
                    full_name="Admin",
                    role=UserRole.ADMIN,
                    is_active=True,
                    is_verified=True,
                    created_at=datetime.utcnow(),
                )
                db.add(admin)
                db.commit()
                print(f"Bootstrapped admin user: {settings.ADMIN_BOOTSTRAP_USERNAME}")
    finally:
        db.close()

@app.get(f"{settings.API_PREFIX}/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION, "name": settings.APP_NAME}
