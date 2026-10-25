import os
import re
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load .env file from backend root if it exists
backend_dir = Path(__file__).resolve().parent.parent.parent
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


def mask_sensitive_url(url: str) -> str:
    """Masks database passwords and tokens in connection URLs for safe logging."""
    if not url:
        return "<EMPTY>"
    return re.sub(r"://([^:@]+):([^@]+)@", r"://\1:********@", url)


class Settings:
    def __init__(self):
        self.ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").lower()
        self.TESTING: bool = os.getenv("TESTING", "false").lower() in ("true", "1", "yes")

        # Database Configuration
        self.DATABASE_URL: str = os.getenv("DATABASE_URL", "").strip()

        # Upload constraints
        self.MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", "5242880")) # 5MB
        self.MAX_UPLOAD_ROWS: int = int(os.getenv("MAX_UPLOAD_ROWS", "10000"))

        # CORS Origins
        raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173")
        self.CORS_ORIGINS: List[str] = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

        # Supabase Auth Configuration (Future / Integration)
        self.SUPABASE_PROJECT_URL: str = os.getenv("SUPABASE_PROJECT_URL", "").strip()
        self.SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "").strip()
        self.SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "").strip()
        self.SUPABASE_JWT_AUDIENCE: str = os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated")

        # Cryptographic Keys (AES-256-GCM & HMAC-SHA-256)
        self.AES_ENCRYPTION_KEY: str = os.getenv("AES_ENCRYPTION_KEY", "").strip()
        self.HMAC_SEARCH_KEY: str = os.getenv("HMAC_SEARCH_KEY", "").strip()

    def get_database_url_or_fail(self) -> str:
        """Returns the configured DATABASE_URL or raises a clear configuration error without exposing credentials."""
        if not self.DATABASE_URL:
            if self.TESTING:
                # In isolated test environments only
                return "sqlite+pysqlite:///:memory:"
            raise ValueError(
                "CRITICAL CONFIGURATION ERROR: DATABASE_URL is not set. "
                "APAARSetu strictly requires a PostgreSQL/Supabase database connection. "
                "Please configure your Supabase connection string in backend/.env "
                "(see backend/.env.example for details)."
            )
        return self.DATABASE_URL


settings = Settings()

