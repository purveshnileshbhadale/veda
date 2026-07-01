from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.db.session import init_db
from app.api import auth, ai_assistant
import os, json

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

@app.on_event("startup")
async def startup():
    await init_db()

@app.get(f"{settings.API_PREFIX}/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION, "name": settings.APP_NAME}
