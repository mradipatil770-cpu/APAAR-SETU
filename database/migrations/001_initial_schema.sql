-- =============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Core schema for APAARSetu Prototype (Supabase PostgreSQL)
-- Target: Supabase PostgreSQL (15+)
-- =============================================================================

-- Enable pgcrypto extension for gen_random_uuid() if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Institutions
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users (Mapping to institution staff / admin)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'institution_viewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Academic Programmes configured per Institution
CREATE TABLE IF NOT EXISTS programmes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_institution_programme UNIQUE (institution_id, code)
);

-- 4. Approved AICTE Intakes per Programme and Academic Year
CREATE TABLE IF NOT EXISTS approved_intakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    approved_intake INTEGER NOT NULL CHECK (approved_intake >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_institution_programme_year UNIQUE (institution_id, programme_id, academic_year)
);

-- 5. Data Upload Batches (Tracking CSV processing)
CREATE TABLE IF NOT EXISTS data_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    accepted_rows INTEGER NOT NULL DEFAULT 0,
    rejected_rows INTEGER NOT NULL DEFAULT 0,
    issue_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Students (Separated from enrolments to preserve academic identity history)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_ref VARCHAR(100) NOT NULL,
    apaar_id VARCHAR(20) NULL,
    category VARCHAR(50) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_institution_student_ref UNIQUE (institution_id, student_ref)
);

-- 7. Enrolments (Student registered in an academic year & programme)
CREATE TABLE IF NOT EXISTS enrolments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES data_uploads(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    enrolment_status VARCHAR(50) NOT NULL DEFAULT 'VALID',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_programme_year UNIQUE (student_id, programme_id, academic_year)
);

-- 8. Validation Issues (Row-level processing issues captured per upload)
CREATE TABLE IF NOT EXISTS validation_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES data_uploads(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    student_ref VARCHAR(100) NULL,
    apaar_id VARCHAR(20) NULL,
    issue_code VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'ERROR',
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Anomaly Cases (Human-in-the-loop review cases for discrepancies & duplicates)
CREATE TABLE IF NOT EXISTS anomaly_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES data_uploads(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_ref VARCHAR(100) NULL,
    apaar_id VARCHAR(20) NULL,
    issue_code VARCHAR(50) NOT NULL,
    explanation TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    resolution_notes TEXT NULL,
    resolved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Audit Logs (Operational audit trail for security & compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NULL REFERENCES institutions(id) ON DELETE SET NULL,
    user_id UUID NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_programmes_inst ON programmes(institution_id);
CREATE INDEX IF NOT EXISTS idx_intakes_inst_year ON approved_intakes(institution_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_uploads_inst ON data_uploads(institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_apaar ON students(apaar_id);
CREATE INDEX IF NOT EXISTS idx_enrolments_lookup ON enrolments(institution_id, programme_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_issues_upload ON validation_issues(upload_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_inst_status ON anomaly_cases(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_inst_time ON audit_logs(institution_id, created_at DESC);

-- =============================================================================
-- Row Level Security (RLS) Configuration
-- =============================================================================
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrolments ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note on RLS with FastAPI backend:
-- FastAPI connects to PostgreSQL using the connection string configured in DATABASE_URL.
-- In Supabase, the server connection (postgres/service role) bypasses RLS by design.
-- Therefore, backend application code enforces multi-tenant institution isolation on every query.
-- The RLS policies below protect tables if direct Supabase PostgREST client queries are ever attempted.

DO $$
BEGIN
    -- Policy for programmes viewable by authenticated users
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_programmes') THEN
        CREATE POLICY authenticated_read_programmes ON programmes
            FOR SELECT TO authenticated
            USING (institution_id = (auth.jwt() ->> 'institution_id')::uuid);
    END IF;

    -- Policy for students viewable by their institution
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'institution_isolate_students') THEN
        CREATE POLICY institution_isolate_students ON students
            FOR ALL TO authenticated
            USING (institution_id = (auth.jwt() ->> 'institution_id')::uuid)
            WITH CHECK (institution_id = (auth.jwt() ->> 'institution_id')::uuid);
    END IF;

    -- Policy for anomalies viewable by their institution
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'institution_isolate_anomalies') THEN
        CREATE POLICY institution_isolate_anomalies ON anomaly_cases
            FOR ALL TO authenticated
            USING (institution_id = (auth.jwt() ->> 'institution_id')::uuid)
            WITH CHECK (institution_id = (auth.jwt() ->> 'institution_id')::uuid);
    END IF;
END $$;

