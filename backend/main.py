"""
APAARSetu FastAPI Entry Point
Preserves compatibility with: python -m uvicorn main:app --reload
from the backend/ directory, delegating directly to app.main:app.
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app

__all__ = ["app"]

if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
