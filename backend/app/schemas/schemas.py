from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------
# Validation Issues
# ---------------------------------------------------------
class ValidationIssueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    upload_id: str
    row_number: int
    student_ref: Optional[str] = None
    apaar_id: Optional[str] = None
    issue_code: str
    severity: str
    explanation: str
    created_at: datetime


# ---------------------------------------------------------
# Uploads
# ---------------------------------------------------------
class UploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    institution_id: str
    filename: str
    total_rows: int
    accepted_rows: int
    rejected_rows: int
    issue_count: int
    status: str
    created_at: datetime


class UploadDetailResponse(UploadResponse):
    issues: List[ValidationIssueResponse] = []


# ---------------------------------------------------------
# Anomalies
# ---------------------------------------------------------
class AnomalyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    upload_id: str
    institution_id: str
    student_ref: Optional[str] = None
    apaar_id: Optional[str] = None
    issue_code: str
    explanation: str
    status: str
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime


class ResolveAnomalyRequest(BaseModel):
    resolution_notes: str = Field(..., min_length=3, max_length=1000)
    status: str = Field("RESOLVED", pattern="^(RESOLVED|IGNORED)$")


# ---------------------------------------------------------
# Dashboard
# ---------------------------------------------------------
class ProgrammeIntakeStat(BaseModel):
    programme_code: str
    programme_name: str
    academic_year: str
    approved_intake: int
    enrolled_count: int
    is_exceeded: bool


class DashboardStats(BaseModel):
    institution_id: str
    institution_name: str
    total_processed_records: int
    total_accepted_records: int
    total_rejected_records: int
    open_anomaly_count: int
    intake_discrepancy_count: int
    latest_uploads: List[UploadResponse]
    programme_stats: List[ProgrammeIntakeStat]


class AdminDashboardStats(BaseModel):
    total_institutions: int
    total_uploads: int
    total_processed_records: int
    total_accepted_records: int
    total_open_anomalies: int
    institution_summaries: List[dict]


# ---------------------------------------------------------
# Authentication & User Profile
# ---------------------------------------------------------
class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=4, max_length=128)


class LoginResponse(BaseModel):
    user_id: str
    email: str
    role: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    access_token: str
    token_type: str = "Bearer"


class UserProfileResponse(BaseModel):
    user_id: str
    email: str
    role: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    is_authenticated: bool
    is_central: bool


# ---------------------------------------------------------
# Central AICTE Oversight
# ---------------------------------------------------------
class CentralDashboardStats(BaseModel):
    total_institutions: int
    total_programmes: int
    total_processed_records: int
    total_accepted_records: int
    total_rejected_records: int
    total_approved_intake: int
    national_utilization_pct: float
    total_open_anomalies: int
    total_cross_institution_duplicates: int
    latest_uploads: List[UploadResponse]
    programme_breakdown: List[dict]


class InstitutionDirectoryItem(BaseModel):
    id: str
    code: str
    name: str
    programme_count: int
    approved_intake: int
    enrolled_count: int
    utilization_pct: float
    open_anomalies: int
    latest_upload_at: Optional[datetime] = None


class CrossInstitutionCandidateResponse(BaseModel):
    apaar_lookup_hash: str
    masked_apaar: str
    student_count: int
    institutions: List[str]
    student_refs: List[str]
    academic_years: List[str]
    risk_level: str


# ---------------------------------------------------------
# Academic Verification Requests
# ---------------------------------------------------------
class VerificationCreateRequest(BaseModel):
    institution_id: str
    student_ref: str = Field(..., min_length=1, max_length=100)
    requester_org: str = Field(..., min_length=2, max_length=255)
    requester_email: str = Field(..., min_length=5, max_length=255)
    purpose: str = Field(..., min_length=3, max_length=100)
    scope: str = Field("ENROLMENT_STATUS", max_length=100)
    consent_ref: Optional[str] = Field(None, max_length=100)


class VerificationDecisionRequest(BaseModel):
    status: str = Field(..., pattern="^(APPROVED|CONFIRMED|REJECTED)$")
    decision_notes: str = Field(..., min_length=3, max_length=1000)


class VerificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    institution_id: str
    institution_name: Optional[str] = None
    student_ref: str
    requester_org: str
    requester_email: str
    purpose: str
    scope: str
    consent_ref: Optional[str] = None
    consent_status: str
    status: str
    decision_notes: Optional[str] = None
    decided_at: Optional[datetime] = None
    created_at: datetime

