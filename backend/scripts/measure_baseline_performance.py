"""
Measures baseline latency of critical database endpoints against live Supabase PostgreSQL.
"""
import time
import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from fastapi.testclient import TestClient
from app.main import app

def measure():
    print("=" * 70)
    print("MEASURING BASELINE DATABASE API LATENCY (LIVE SUPABASE)")
    print("=" * 70)

    with TestClient(app) as client:
        # Login Central Director
        t0 = time.perf_counter()
        login_res = client.post("/api/v1/auth/login", json={"email": "aicte_director@aicte-india.org.synthetic", "password": "demo_password_2026"})
        t_login = (time.perf_counter() - t0) * 1000
        central_token = login_res.json()["access_token"]
        central_headers = {"Authorization": f"Bearer {central_token}"}
        print(f"1. Login latency: {t_login:.1f} ms")

        # Central Dashboard
        t0 = time.perf_counter()
        dash_res = client.get("/api/v1/aicte/dashboard", headers=central_headers)
        t_dash = (time.perf_counter() - t0) * 1000
        print(f"2. Central Dashboard (/api/v1/aicte/dashboard): {t_dash:.1f} ms (Status: {dash_res.status_code})")

        # Institutions Directory
        t0 = time.perf_counter()
        inst_res = client.get("/api/v1/aicte/institutions", headers=central_headers)
        t_inst = (time.perf_counter() - t0) * 1000
        print(f"3. Institutions Directory (/api/v1/aicte/institutions): {t_inst:.1f} ms (Status: {inst_res.status_code})")

        # Intake Summary
        t0 = time.perf_counter()
        intake_res = client.get("/api/v1/aicte/intake-summary", headers=central_headers)
        t_intake = (time.perf_counter() - t0) * 1000
        print(f"4. Intake Summary (/api/v1/aicte/intake-summary): {t_intake:.1f} ms (Status: {intake_res.status_code})")

        # Login Institutional Admin
        login_inst = client.post("/api/v1/auth/login", json={"email": "demo_admin@delhi-tech.edu.synthetic", "password": "demo_password_2026"})
        inst_token = login_inst.json()["access_token"]
        inst_headers = {"Authorization": f"Bearer {inst_token}"}

        # Institutional Dashboard
        t0 = time.perf_counter()
        idash_res = client.get("/api/v1/institution/dashboard", headers=inst_headers)
        t_idash = (time.perf_counter() - t0) * 1000
        print(f"5. Institutional Dashboard (/api/v1/institution/dashboard): {t_idash:.1f} ms (Status: {idash_res.status_code})")

        # Verifications list
        t0 = time.perf_counter()
        verif_res = client.get("/api/v1/verifications", headers=inst_headers)
        t_verif = (time.perf_counter() - t0) * 1000
        print(f"6. Verification Ledger (/api/v1/verifications): {t_verif:.1f} ms (Status: {verif_res.status_code})")

        # Transfers list
        t0 = time.perf_counter()
        trans_res = client.get("/api/v1/transfers", headers=inst_headers)
        t_trans = (time.perf_counter() - t0) * 1000
        print(f"7. Transfer Ledger (/api/v1/transfers): {t_trans:.1f} ms (Status: {trans_res.status_code})")

if __name__ == "__main__":
    measure()

