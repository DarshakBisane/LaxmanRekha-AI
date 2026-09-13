import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_NAME: str = "LaxmanRekha AI"
    APP_VERSION: str = "1.0.0"
    SECRET_KEY: str = "default_dev_secret_key_change_in_production_32_bytes_min"
    JWT_SECRET_KEY: str = "default_jwt_secret_key_change_in_production_32_bytes_min"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    DATABASE_URL: str = "postgresql+psycopg://neondb_owner:npg_3zCgxBjpq8hb@ep-hidden-cherry-aec3remn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"
    DIRECT_DATABASE_URL: str = ""

    UPSTASH_REDIS_REST_URL: str = ""
    UPSTASH_REDIS_REST_TOKEN: str = ""

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_NAME: str = "laxmanrekha_session"

    MAX_UPLOAD_MB: int = 10
    MAX_DOCUMENTS_PER_CASE: int = 5
    DEMO_MODE: bool = True

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        if not self.ALLOWED_ORIGINS:
            return ["http://localhost:5173"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()
