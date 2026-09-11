from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/sakleshpura_rides"

    # JWT Authentication
    JWT_SECRET: str = "change-me-in-production-use-a-real-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    ALLOWED_ORIGINS: str = "*"

    # Monitoring
    SENTRY_DSN: str = ""

    # App
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    GOOGLE_WEB_CLIENT_ID: str = "524688489029-h02hs91ufjcsu1l6805dks6l724o4klp.apps.googleusercontent.com"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if s.DATABASE_URL.startswith("postgresql://"):
        s.DATABASE_URL = s.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif s.DATABASE_URL.startswith("postgres://"):
        s.DATABASE_URL = s.DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    return s
