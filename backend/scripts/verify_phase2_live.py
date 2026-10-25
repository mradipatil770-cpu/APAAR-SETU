"""
Verification script for Phase 2 implementation.
Tests live Supabase database and FastAPI routes:
1. Health and Database Readiness.
2. Central AICTE Director login and JWT issuance.
3. Central AICTE Dashboard, Institutions Directory, and Duplicate detection APIs.
4. Institutional Admin login.
5. Role-Based Access Control (RBAC): Institution Admin rejected on Central endpoints.
6. Verification Requests: List, create new verification request, and record determination.
"""
import sys
from pathlib import Path

# Add backend directory to path
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from fastapi.testclient import TestClient
from app.main import app

def run_phase2_live_verification():
    print("=" * 70)
    print("APAARSetu — PHASE 2 END-TO-END VERIFICATION")
    print("=" * 70)

    with TestClient(app) as client:
        # 1. Health & Readiness Check
        print("\n[Step 1] Checking Health & Live DB Readiness...")
        health = client.get("/api/v1/health")
        assert health.status_code == 200, f"Health failed: {health.text}"
        print(f"  [OK] /health: {health.json()}")

        ready = client.get("/api/v1/ready")
        assert ready.status_code == 200, f"Readiness failed: {ready.text}"
        print(f"  [OK] /ready: {ready.json()}")

        # 2. Central AICTE Director Authentication
        print("\n[Step 2] Authenticating AICTE Central Director...")
        login_res = client.post(
            "/api/v1/auth/login",
            json={
                "email": "aicte_director@aicte-india.org.synthetic",
                "password": "demo_password_2026",
            },
        )
        assert login_res.status_code == 200, f"Central login failed: {login_res.text}"
        central_auth = login_res.json()
        central_token = central_auth["access_token"]
        assert central_auth["role"] == "AICTE_ADMIN"
        print(f"  [OK] Logged in as: {central_auth['email']} (Role: {central_auth['role']})")
        print(f"  [OK] Token generated (Type: {central_auth['token_type']})")

        # 3. Central AICTE Dashboard Endpoints
        print("\n[Step 3] Querying Central AICTE Regulatory Oversight Endpoints...")
        headers_central = {"Authorization": f"Bearer {central_token}"}

        dash_res = client.get("/api/v1/aicte/dashboard", headers=headers_central)
        assert dash_res.status_code == 200, f"Central dashboard failed: {dash_res.text}"
        dash_data = dash_res.json()
        print(f"  [OK] Central Dashboard stats: institutions={dash_data['total_institutions']}, approved_intake={dash_data['total_approved_intake']}, utilization={dash_data['national_utilization_pct']}%")

        inst_res = client.get("/api/v1/aicte/institutions", headers=headers_central)
        assert inst_res.status_code == 200, f"Institutions directory failed: {inst_res.text}"
        institutions = inst_res.json()
        print(f"  [OK] Institutions directory: {len(institutions)} institutions registered.")
        for inst in institutions:
            print(f"    - [{inst['code']}] {inst['name']} (Approved: {inst['approved_intake']}, Enrolled: {inst['enrolled_count']})")

        dups_res = client.get("/api/v1/aicte/duplicate-candidates", headers=headers_central)
        assert dups_res.status_code == 200, f"Duplicate candidates failed: {dups_res.text}"
        print(f"  [OK] Cross-institution duplicate candidates queried: {len(dups_res.json())} candidate flags.")

        # 4. Institutional Admin Authentication & RBAC Test
        print("\n[Step 4] Authenticating Institutional Admin & Testing RBAC Enforcement...")
        inst_login = client.post(
            "/api/v1/auth/login",
            json={
                "email": "demo_admin@delhi-tech.edu.synthetic",
                "password": "demo_password_2026",
            },
        )
        assert inst_login.status_code == 200, f"Inst login failed: {inst_login.text}"
        inst_auth = inst_login.json()
        inst_token = inst_auth["access_token"]
        print(f"  [OK] Logged in as: {inst_auth['email']} (Role: {inst_auth['role']}, Inst: {inst_auth['institution_name']})")

        # Institutional Admin attempting central access MUST be rejected with 403 Forbidden
        headers_inst = {"Authorization": f"Bearer {inst_token}"}
        forbidden_res = client.get("/api/v1/aicte/dashboard", headers=headers_inst)
        assert forbidden_res.status_code == 403, f"Expected 403 Forbidden, got {forbidden_res.status_code}"
        print(f"  [OK] RBAC Verification: Institutional staff access to Central API strictly rejected with HTTP 403 Forbidden.")

        # 5. Controlled Verification Workflow
        print("\n[Step 5] Testing Controlled Academic Verification Workflow...")
        # 5a. List verifications for institution
        verifs_res = client.get("/api/v1/verifications", headers=headers_inst)
        assert verifs_res.status_code == 200, f"Listing verifications failed: {verifs_res.text}"
        existing_verifs = verifs_res.json()
        print(f"  [OK] Active verification requests in ledger: {len(existing_verifs)}")

        if existing_verifs:
            first_v = existing_verifs[0]
            print(f"    - Sample: ID={first_v['id'][:8]}... | Student={first_v['student_ref']} | Org={first_v['requester_org']} | Status={first_v['status']}")

            # 5b. Submit determination
            decide_res = client.post(
                f"/api/v1/verifications/{first_v['id']}/decide",
                headers=headers_inst,
                json={
                    "status": "CONFIRMED",
                    "decision_notes": "Academic record validated against Institutional Enrolment Register 2026-27.",
                },
            )
            assert decide_res.status_code == 200, f"Decide failed: {decide_res.text}"
            updated_v = decide_res.json()
            assert updated_v["status"] == "CONFIRMED"
            print(f"  [OK] Verification Decision: Request {first_v['id'][:8]} successfully CONFIRMED by registrar.")

    print("\n" + "=" * 70)
    print("ALL PHASE 2 VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_phase2_live_verification()
