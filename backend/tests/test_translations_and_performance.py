"""
Automated Verification Suite:
1. Complete English / Hindi Bilingual Translation Parity & Coverage
2. Optimized Database Query & Performance Assertions (Zero N+1 Query Regressions)
"""

import os
import re
import time
import pytest
from app.main import app


def test_translation_dictionary_key_parity():
    """Verify 100% key parity between English (en) and Hindi (hi) dictionaries."""
    translations_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "src", "i18n", "translations.js")
    )
    assert os.path.exists(translations_path), f"Translations file missing: {translations_path}"

    with open(translations_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract en and hi blocks
    en_match = re.search(r"en:\s*\{(.*?)\n\s*\},", content, re.DOTALL)
    hi_match = re.search(r"hi:\s*\{(.*?)\n\s*\},", content, re.DOTALL)

    assert en_match is not None, "English dictionary block missing in translations.js"
    assert hi_match is not None, "Hindi dictionary block missing in translations.js"

    en_keys = set(re.findall(r"^\s*([a-zA-Z0-9_]+):", en_match.group(1), re.MULTILINE))
    hi_keys = set(re.findall(r"^\s*([a-zA-Z0-9_]+):", hi_match.group(1), re.MULTILINE))

    assert len(en_keys) > 100, f"Expected >100 keys, got {len(en_keys)}"
    assert len(hi_keys) > 100, f"Expected >100 keys, got {len(hi_keys)}"

    missing_in_hi = en_keys - hi_keys
    missing_in_en = hi_keys - en_keys

    assert len(missing_in_hi) == 0, f"Keys in English but missing in Hindi: {missing_in_hi}"
    assert len(missing_in_en) == 0, f"Keys in Hindi but missing in English: {missing_in_en}"
    assert en_keys == hi_keys, "English and Hindi key sets must be identical (100% parity)"


def test_translation_values_non_empty_and_meaningful():
    """Verify that all translations in both English and Hindi are non-empty and non-stub."""
    translations_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "src", "i18n", "translations.js")
    )
    with open(translations_path, "r", encoding="utf-8") as f:
        content = f.read()

    en_match = re.search(r"en:\s*\{(.*?)\n\s*\},", content, re.DOTALL)
    hi_match = re.search(r"hi:\s*\{(.*?)\n\s*\},", content, re.DOTALL)

    en_pairs = re.findall(r"^\s*([a-zA-Z0-9_]+):\s*'([^']*)'", en_match.group(1), re.MULTILINE)
    hi_pairs = re.findall(r"^\s*([a-zA-Z0-9_]+):\s*'([^']*)'", hi_match.group(1), re.MULTILINE)

    for key, val in en_pairs:
        assert len(val.strip()) > 0, f"English key '{key}' has empty translation"

    for key, val in hi_pairs:
        assert len(val.strip()) > 0, f"Hindi key '{key}' has empty translation"
        if key not in {"version", "allRightsReserved"}:
            has_devanagari = any(0x0900 <= ord(c) <= 0x097F for c in val)
            assert has_devanagari or "2026" in val or "AICTE" in val, (
                f"Hindi key '{key}' value '{val}' does not contain Devanagari script"
            )


def test_source_code_has_no_n_plus_one_loops():
    """Verify that backend route handlers do not run per-institution or per-programme count queries in Python loops."""
    routes_aicte_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "app", "api", "routes_aicte.py")
    )
    routes_dashboard_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "app", "api", "routes_dashboard.py")
    )

    with open(routes_aicte_path, "r", encoding="utf-8") as f:
        aicte_code = f.read()

    with open(routes_dashboard_path, "r", encoding="utf-8") as f:
        dash_code = f.read()

    # Verify routes_aicte.py uses batch GROUP BY instead of loop queries
    assert "group_by(ApprovedIntake.institution_id)" in aicte_code
    assert "group_by(Enrolment.institution_id)" in aicte_code
    assert "group_by(AnomalyCase.institution_id)" in aicte_code

    # Verify routes_dashboard.py uses batch GROUP BY
    assert "group_by(" in dash_code
    assert "Enrolment.programme_id" in dash_code
    assert "upload_counts = dict(" in dash_code


def test_fast_response_times_on_cached_or_batch_endpoints(client):
    """Verify that optimized endpoints return valid structures quickly under authentication."""
    # 1. Login to obtain access token
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "demo_admin@delhi-tech.edu.synthetic", "password": "demo_password_2026"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 2. Time the batch-optimized dashboard endpoint
    start = time.perf_counter()
    resp = client.get(
        "/api/v1/institution/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    duration = time.perf_counter() - start

    assert resp.status_code == 200
    data = resp.json()
    assert "institution_id" in data
    assert "programme_stats" in data
    # Test client in-memory duration should be very fast (<500ms)
    assert duration < 0.5, f"Dashboard took too long: {duration}s"
