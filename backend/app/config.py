from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional, List
import os

class Settings(BaseSettings):
    APP_NAME: str = "VEDA"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"
    
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/veda.db"
    DATABASE_SYNC_URL: str = "sqlite:///./data/veda.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    SECRET_KEY: str = "veda-desktop-secret-key-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours for desktop
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Free AI Providers - configure which ones you want to use
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    DEEPSEEK_API_KEY: Optional[str] = None
    
    # Default AI provider (gemini, groq, openrouter, deepseek)
    AI_PROVIDER: str = "groq"
    
    # Provider-specific models
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    OPENROUTER_MODEL: str = "mistralai/mixtral-8x7b-instruct"
    DEEPSEEK_MODEL: str = "deepseek-chat"
    
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    VECTOR_STORE_PATH: str = "./data/vector_store"
    
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".txt", ".md", ".csv", ".json", ".bib", ".docx"]
    
    CORS_ORIGINS: str = '["http://localhost:3000","http://127.0.0.1:3000"]'

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()
