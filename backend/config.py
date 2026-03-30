# ============================================
# TimeForge Backend — Configuration
# ============================================

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    SECRET_KEY: str = "timeforge-dev-key-change-in-production"
    DATABASE_URL: str = "sqlite:///./timeforge.db"
    GEMINI_API_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_HOURS: int = 72
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
