"""
Applies migration 004_institution_registration_and_transfers.sql safely to Supabase PostgreSQL.
"""
import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from sqlalchemy import text
from app.database.session import get_engine

def apply_migration():
    migration_file = backend_path.parent / "database" / "migrations" / "004_institution_registration_and_transfers.sql"
    if not migration_file.exists():
        print(f"Error: Migration file not found: {migration_file}")
        sys.exit(1)
        
    print(f"Reading migration: {migration_file}")
    sql_content = migration_file.read_text(encoding="utf-8")
    
    print("Executing additive migration against Supabase PostgreSQL...")
    engine = get_engine()
    with engine.begin() as conn:
        conn.execute(text(sql_content))
    print("[SUCCESS] Migration 004 applied cleanly!")

if __name__ == "__main__":
    apply_migration()

