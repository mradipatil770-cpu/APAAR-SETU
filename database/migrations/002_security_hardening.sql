-- =============================================================================
-- Migration: 002_security_hardening.sql
-- Description: Security hardening, cryptographic field encryption support,
--              HMAC lookup indexing, and audit trail enhancements.
-- Safe & Additive: Preserves all existing data in Supabase PostgreSQL.
-- =============================================================================

-- 1. Add Cryptographic & Privacy-Preserving Columns to Students
ALTER TABLE students 
    ADD COLUMN IF NOT EXISTS apaar_encrypted TEXT NULL,
    ADD COLUMN IF NOT EXISTS apaar_nonce VARCHAR(32) NULL,
    ADD COLUMN IF NOT EXISTS apaar_lookup_hash VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS apaar_key_version VARCHAR(10) DEFAULT 'v1';

-- 2. Indexes for Blind HMAC Lookup (Fast duplicate matching without plaintext exposure)
CREATE INDEX IF NOT EXISTS idx_students_lookup_hash ON students(apaar_lookup_hash);
CREATE INDEX IF NOT EXISTS idx_students_inst_lookup ON students(institution_id, apaar_lookup_hash);

-- 3. Enhance Audit Logs for Comprehensive Compliance & Attribution
ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS actor_role VARCHAR(50) DEFAULT 'INSTITUTE_ADMIN',
    ADD COLUMN IF NOT EXISTS target_id VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'SUCCESS',
    ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(100) NULL;

CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_correlation ON audit_logs(correlation_id);

-- 4. Temporary Staging Table for Batch Ingestion (Auto-cleared after persistence)
CREATE TABLE IF NOT EXISTS staging_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES data_uploads(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    student_ref VARCHAR(100) NOT NULL,
    apaar_lookup_hash VARCHAR(64) NULL,
    programme_code VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    category VARCHAR(50) NULL,
    validation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staging_upload ON staging_rows(upload_id);

-- 5. Enable RLS on Staging Table
ALTER TABLE staging_rows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_staging') THEN
        CREATE POLICY authenticated_read_staging ON staging_rows
            FOR ALL TO authenticated
            USING (upload_id IN (SELECT id FROM data_uploads WHERE institution_id = (auth.jwt() ->> 'institution_id')::uuid));
    END IF;
END $$;

