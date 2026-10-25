import logging
from typing import Generator, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings, mask_sensitive_url

logger = logging.getLogger("apaarsetu.database")

_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        db_url = settings.get_database_url_or_fail()
        masked_url = mask_sensitive_url(db_url)
        logger.info(f"Initializing database engine with URL: {masked_url}")

        if db_url.startswith("sqlite"):
            # Isolated test environment only
            _engine = create_engine(
                db_url,
                connect_args={"check_same_thread": False},
            )
        else:
            # PostgreSQL / Supabase
            _engine = create_engine(
                db_url,
                pool_pre_ping=True,       # Detects dropped connections gracefully
                pool_recycle=300,         # Recycles idle pooler connections every 5 mins
                pool_size=5,
                max_overflow=10,
            )
    return _engine


def get_session_factory():
    global _SessionLocal
    if _SessionLocal is None:
        engine = get_engine()
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _SessionLocal


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for yielding transactional database sessions."""
    session_factory = get_session_factory()
    db = session_factory()
    try:
        yield db
    finally:
        db.close()


def check_db_ready() -> Tuple[bool, str]:
    """
    Checks whether the database is responsive.
    Returns (True, "operational") or (False, error_message).
    Never exposes passwords or sensitive credentials in error messages.
    """
    try:
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True, "Database connection operational"
    except Exception as exc:
        safe_msg = str(exc)
        # Strip potential password strings if any slipped through
        if "@" in safe_msg and "://" in safe_msg:
            safe_msg = mask_sensitive_url(safe_msg)
        return False, f"Database connectivity check failed: {safe_msg}"

