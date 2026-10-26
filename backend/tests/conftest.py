import os
import pytest
from pathlib import Path

# Ensure TESTING environment variable is set
os.environ["TESTING"] = "true"
os.environ["ENVIRONMENT"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import sys
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.models.models import Institution, Programme, ApprovedIntake, User, Student, VerificationRequest

# In-memory SQLite engine strictly isolated for local automated tests
TEST_DB_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Creates database schema and seeds base synthetic testing institutions and programmes."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Seed primary test institution
    inst = Institution(
        id="11111111-1111-1111-1111-111111111111",
        code="AICTE-ENG-001",
        name="Delhi Institute of Engineering & Technology (Synthetic)",
    )
    # Seed secondary test institution for cross-tenant testing
    inst2 = Institution(
        id="22222222-2222-2222-2222-222222222222",
        code="AICTE-ENG-002",
        name="Pune Technological University (Synthetic)",
    )
    # Seed pending verification institution
    inst_pending = Institution(
        id="88888888-8888-8888-8888-888888880001",
        code="AICTE-WEST-2026-88",
        name="Sardar Vallabhbhai Regional Institute of Technology (Pending)",
        status="PENDING_VERIFICATION",
    )
    db.add_all([inst, inst2, inst_pending])
    db.flush()

    # Seed programmes for AICTE-ENG-001
    cse = Programme(
        id="44444444-4444-4444-4444-444444440001",
        institution_id=inst.id,
        code="CSE",
        name="Computer Science and Engineering",
    )
    ece = Programme(
        id="44444444-4444-4444-4444-444444440002",
        institution_id=inst.id,
        code="ECE",
        name="Electronics and Communication Engineering",
    )
    mech = Programme(
        id="44444444-4444-4444-4444-444444440003",
        institution_id=inst.id,
        code="MECH",
        name="Mechanical Engineering",
    )
    db.add_all([cse, ece, mech])
    db.flush()

    # Seed approved intakes for 2026-27
    intake_cse = ApprovedIntake(
        id="55555555-5555-5555-5555-555555550001",
        institution_id=inst.id,
        programme_id=cse.id,
        academic_year="2026-27",
        approved_intake=5, # Small limit to test intake exceed logic
    )
    intake_ece = ApprovedIntake(
        id="55555555-5555-5555-5555-555555550002",
        institution_id=inst.id,
        programme_id=ece.id,
        academic_year="2026-27",
        approved_intake=60,
    )
    db.add_all([intake_cse, intake_ece])

    # Seed users for authentication tests
    u1 = User(
        id="33333333-3333-3333-3333-333333333333",
        email="demo_admin@delhi-tech.edu.synthetic",
        institution_id=inst.id,
        role="institution_admin",
    )
    u_aicte = User(
        id="44444444-4444-4444-4444-444444440000",
        email="aicte_director@aicte-india.org.synthetic",
        institution_id=None,
        role="AICTE_ADMIN",
    )
    db.add_all([u1, u_aicte])

    # Seed sample student and verification request
    student = Student(
        id="88888888-8888-8888-8888-888888880001",
        institution_id=inst.id,
        student_ref="STU-2026-001",
        apaar_id="999911112222",
        category="General",
    )
    db.add(student)
    db.flush()

    vr = VerificationRequest(
        id="77777777-7777-7777-7777-777777770001",
        institution_id=inst.id,
        student_ref="STU-2026-001",
        requester_org="National Research Council",
        requester_email="verifications@nrc.gov.in.synthetic",
        purpose="SCHOLARSHIP_VALIDATION",
        scope="ENROLMENT_STATUS",
        consent_ref="CONSENT-DOC-2026-8812",
        consent_status="STUDENT_CONSENT_VERIFIED",
        status="PENDING",
    )
    db.add(vr)

    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """Provides a transactional database session for each test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    """Provides a TestClient with dependency override for get_db."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

