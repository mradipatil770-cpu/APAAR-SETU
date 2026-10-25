import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func
from app.database.base import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Uuid(as_uuid=False), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now())

    programmes = relationship("Programme", back_populates="institution", cascade="all, delete-orphan")
    intakes = relationship("ApprovedIntake", back_populates="institution", cascade="all, delete-orphan")
    uploads = relationship("DataUpload", back_populates="institution", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=False), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    institution_id = Column(Uuid(as_uuid=False), ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True)
    role = Column(String(50), nullable=False, default="INSTITUTE_OPERATOR")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now())


class Programme(Base):
    __tablename__ = "programmes"

    id = Column(Uuid(as_uuid=False), primary_key=True, default=generate_uuid)
    institution_id = Column(Uuid(as_uuid=False), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now())

    institution = relationship("Institution", back_populates="programmes")
    __table_args__ = (UniqueConstraint("institution_id", "code", name="uq_institution_programme"),)


class ApprovedIntake(Base):
    __tablename__ = "approved_intakes"

    id = Column(Uuid(as_uuid=False), primary_key=True, default=generate_uuid)
    institution_id = Column(Uuid(as_uuid=False), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    programme_id = Column(Uuid(as_uuid=False), ForeignKey("programmes.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(20), nullable=False)
    approved_intake = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now())

    institution = relationship("Institution", back_populates="intakes")
    __table_args__ = (UniqueConstraint("institution_id", "programme_id", "academic_year", name="uq_institution_programme_year"),)


class DataUpload(Base):
    __tablename__ = "data_uploads"

    id = Column(Uuid(as_uuid=False), primary_key=True, default=generate_uuid)
    institution_id = Column(Uuid(as_uuid=False), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_hash = Column(String(64), nullable=True)
    total_rows = Column(Integer, nullable=False, default=0)
    accepted_rows = Column(Integer, nullable=False, default=0)
    rejected_rows = Column(Integer, nullable=False, default=0)
    issue_count = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="COMPLETED")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now(), index=True)

    institution = relationship("Institution", back_populates="uploads")
    issues = relationship("ValidationIssue", back_populates="upload", cascade="all, delete-orphan")
    anomalies = relationship("AnomalyCase", back_populates="upload", cascade="all, delete-orphan")
    enrolments = relationship("Enrolment", back_populates="upload", cascade="all, delete-orphan")
    staging_rows = relationship("StagingRow", back_populates="upload", cascade="all, delete-orphan")


class StagingRow(Base):
    __tablename__ = "staging_rows"

    id = Column(Uuid(as_uuid=False), primary_key=True, default=generate_uuid)
    upload_id = Column(Uuid(as_uuid=False), ForeignKey("data_uploads.id", ondelete="CASCADE"), nullable=False, index=True)
    row_number = Column(Integer, nullable=False)
    student_ref = Column(String(100), nullable=False)
    apaar_lookup_hash = Column(String(64), nullable=True)
    programme_code = Column(String(50), nullable=False)
    academic_year = Column(String(20), nullable=False)
    category = Column(String(50), nullable=True)
    validation_status = Column(String(20), nullable=False, default="PENDING")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now())

    upload = relationship("DataUpload", back_populates="staging_rows")


class Student(Base):
    __tablename__ = "students"

    id = Column(Uuid(as_uuid=False), primary_key=True, default=generate_uuid)
    institution_id = Column(Uuid(as_uuid=False), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_ref = Column(String(100), nullable=False)
    apaar_id = Column(String(20), nullable=True, index=True) # Masked display version: XXXXXXXX1234
    
    # Cryptographic protection (Priority 4)
    apaar_encrypted = Column(Text, nullable=True)          # AES-256-GCM ciphertext base64
    apaar_nonce = Column(String(32), nullable=True)        # 96-bit random nonce base64
    apaar_lookup_hash = Column(String(64), nullable=True, index=True) # Keyed HMAC-SHA-256 token
    apaar_key_version = Column(String(10), default="v1")
    
    category = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now())

    enrolments = relationship("Enrolment", back_populates="student", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("institution_id", "student_ref", name="uq_institution_student_ref"),)


class Enrolment(Base):
    __tablename__ = "enrolments"

    id = Column(Uuid(as_uuid=False), primary_key=True, default=generate_uuid)
    upload_id = Column(Uuid(as_uuid=False), ForeignKey("data_uploads.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Uuid(as_uuid=False), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    institution_id = Column(Uuid(as_uuid=False), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    programme_id = Column(Uuid(as_uuid=False), ForeignKey("programmes.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(20), nullable=False)
    enrolment_status = Column(String(50), nullable=False, default="VALID")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now())

    upload = relationship("DataUpload", back_populates="enrolments")
    student = relationship("Student", back_populates="enrolments")
    __table_args__ = (UniqueConstraint("student_id", "programme_id", "academic_year", name="uq_student_programme_year"),)


class ValidationIssue(Base):
    __tablename__ = "validation_issues"

    id = Column(Uuid(as_uuid=False), primary_key=True, default=generate_uuid)
    upload_id = Column(Uuid(as_uuid=False), ForeignKey("data_uploads.id", ondelete="CASCADE"), nullable=False, index=True)
    row_number = Column(Integer, nullable=False)
    student_ref = Column(String(100), nullable=True)
    apaar_id = Column(String(20), nullable=True) # Masked display version
    issue_code = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False, default="ERROR")
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now())

    upload = relationship("DataUpload", back_populates="issues")


class AnomalyCase(Base):
    __tablename__ = "anomaly_cases"

    id = Column(Uuid(as_uuid=False), primary_key=True, default=generate_uuid)
    upload_id = Column(Uuid(as_uuid=False), ForeignKey("data_uploads.id", ondelete="CASCADE"), nullable=False)
    institution_id = Column(Uuid(as_uuid=False), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_ref = Column(String(100), nullable=True)
    apaar_id = Column(String(20), nullable=True) # Masked display version
    issue_code = Column(String(50), nullable=False)
    explanation = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="OPEN", index=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now())

    upload = relationship("DataUpload", back_populates="anomalies")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Uuid(as_uuid=False), primary_key=True, default=generate_uuid)
    institution_id = Column(Uuid(as_uuid=False), ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(Uuid(as_uuid=False), nullable=True)
    actor_role = Column(String(50), default="INSTITUTE_ADMIN")
    target_id = Column(String(100), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    status = Column(String(20), default="SUCCESS")
    details = Column(Text, nullable=True)
    correlation_id = Column(String(100), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now())

    @validates("user_id")
    def validate_user_id(self, key, value):
        if value is None:
            return None
        try:
            return str(uuid.UUID(str(value)))
        except (ValueError, TypeError, AttributeError):
            raise ValueError(f"Invalid UUID for audit log actor: '{value}'. Audit records require a valid UUID format or None.")

    @validates("institution_id")
    def validate_institution_id(self, key, value):
        if value is None:
            return None
        try:
            return str(uuid.UUID(str(value)))
        except (ValueError, TypeError, AttributeError):
            raise ValueError(f"Invalid UUID for audit log institution: '{value}'. Audit records require a valid UUID format or None.")


class VerificationRequest(Base):
    __tablename__ = "verification_requests"

    id = Column(Uuid(as_uuid=False), primary_key=True, default=generate_uuid)
    institution_id = Column(Uuid(as_uuid=False), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_ref = Column(String(100), nullable=False, index=True)
    requester_org = Column(String(255), nullable=False)
    requester_email = Column(String(255), nullable=False)
    purpose = Column(String(100), nullable=False)
    scope = Column(String(100), nullable=False, default="ENROLMENT_STATUS")
    consent_ref = Column(String(100), nullable=True)
    consent_status = Column(String(50), nullable=False, default="STUDENT_CONSENT_VERIFIED")
    status = Column(String(50), nullable=False, default="PENDING", index=True)
    decision_notes = Column(Text, nullable=True)
    decided_by = Column(Uuid(as_uuid=False), nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now())

    institution = relationship("Institution")
