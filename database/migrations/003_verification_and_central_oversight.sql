-- =============================================================================
-- Migration: 003_verification_and_central_oversight.sql
-- Description: Additive migration for Academic Verification Requests & Central AICTE Roles
-- Safe & Additive: Preserves all existing tables and data in Supabase PostgreSQL.
-- =============================================================================

-- 1. Create Controlled Verification Requests Table
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_ref VARCHAR(100) NOT NULL,
    requester_org VARCHAR(255) NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    purpose VARCHAR(100) NOT NULL,
    scope VARCHAR(100) NOT NULL DEFAULT 'ENROLMENT_STATUS',
    consent_ref VARCHAR(100) NULL,
    consent_status VARCHAR(50) NOT NULL DEFAULT 'STUDENT_CONSENT_VERIFIED',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    decision_notes TEXT NULL,
    decided_by UUID NULL,
    decided_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for Controlled Verification Lookups
CREATE INDEX IF NOT EXISTS idx_verifications_inst ON verification_requests(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_verifications_student ON verification_requests(student_ref);

-- 3. Seed Central AICTE Administration Users for Multi-Role Demonstrations
INSERT INTO users (id, email, institution_id, role)
VALUES 
    ('44444444-4444-4444-4444-444444440000', 'aicte_director@aicte-india.org.synthetic', NULL, 'AICTE_ADMIN'),
    ('55555555-5555-5555-5555-555555550000', 'analyst@aicte-india.org.synthetic', NULL, 'AICTE_ANALYST'),
    ('66666666-6666-6666-6666-666666660000', 'auditor@aicte-india.org.synthetic', NULL, 'AUDITOR')
ON CONFLICT (email) DO NOTHING;

-- 4. Seed Demonstration Verification Requests for Testing
INSERT INTO verification_requests (id, institution_id, student_ref, requester_org, requester_email, purpose, scope, consent_ref, consent_status, status)
VALUES
    ('77777777-7777-7777-7777-777777770001', '11111111-1111-1111-1111-111111111111', 'STU-2026-001', 'National Research Council', 'verifications@nrc.gov.in.synthetic', 'SCHOLARSHIP_VALIDATION', 'ENROLMENT_STATUS', 'CONSENT-DOC-2026-8812', 'STUDENT_CONSENT_VERIFIED', 'PENDING'),
    ('77777777-7777-7777-7777-777777770002', '11111111-1111-1111-1111-111111111111', 'STU-2026-002', 'TechGlobal Consulting Corp', 'hr-verify@techglobal.corp.synthetic', 'EMPLOYMENT_BACKGROUND_CHECK', 'ENROLMENT_STATUS', 'CONSENT-DOC-2026-9934', 'STUDENT_CONSENT_VERIFIED', 'PENDING')
ON CONFLICT (id) DO NOTHING;

