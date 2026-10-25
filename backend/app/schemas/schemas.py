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

