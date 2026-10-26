-- =============================================================================
-- Migration: 004_institution_registration_and_transfers.sql
-- Description: Additive migration for Institution Self-Registration (Pending Verification),
--              Inter-Institutional Student Transfers, and Dual Enrolment Policy Review.
-- Safe & Additive: Preserves all existing tables and data in Supabase PostgreSQL.
-- =============================================================================

-- 1. Extend institutions table with registration status & contact metadata
ALTER TABLE institutions 
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS contact_designation VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS address TEXT NULL,
    ADD COLUMN IF NOT EXISTS institution_type VARCHAR(100) DEFAULT 'CENTRAL_STATE_AFFILIATED';

-- 2. Create student_transfers table for inter-institutional migration workflow
CREATE TABLE IF NOT EXISTS student_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    from_institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    to_institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_ref VARCHAR(100) NOT NULL,
    apaar_id_masked VARCHAR(20) NULL,
    transfer_reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_TRANSFER', -- PENDING_TRANSFER, APPROVED, REJECTED, COMPLETED, REQUIRES_POLICY_REVIEW
    remarks TEXT NULL,
    requested_by UUID NULL,
    decided_by UUID NULL,
    decided_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance and isolation
CREATE INDEX IF NOT EXISTS idx_transfers_from_inst ON student_transfers(from_institution_id, status);
CREATE INDEX IF NOT EXISTS idx_transfers_to_inst ON student_transfers(to_institution_id, status);
CREATE INDEX IF NOT EXISTS idx_transfers_student ON student_transfers(student_id);

-- 3. Extend enrolments table with policy review indicator (e.g., dual-degree review)
ALTER TABLE enrolments
    ADD COLUMN IF NOT EXISTS policy_review_status VARCHAR(50) NOT NULL DEFAULT 'NORMAL'; -- NORMAL, REQUIRES_POLICY_REVIEW, CLEARED

-- 4. Seed a demonstration Pending Institution for Central AICTE review workflow
INSERT INTO institutions (id, code, name, status, contact_name, contact_designation, contact_phone, state, address, institution_type)
VALUES (
    '88888888-8888-8888-8888-888888880001',
    'AICTE-WEST-2026-88',
    'Sardar Vallabhbhai Regional Institute of Technology',
    'PENDING_VERIFICATION',
    'Dr. Rajeshwar Sharma',
    'Principal & Head of Institution',
    '+91-9876543210',
    'Maharashtra',
    'Plot 14, MIDC Tech Park, Nagpur - 440028',
    'GOVERNMENT_AIDED'
)
ON CONFLICT (code) DO NOTHING;

-- Seed administrator for the pending institution
INSERT INTO users (id, email, institution_id, role)
VALUES (
    '88888888-8888-8888-8888-888888880002',
    'principal@svrit-nagpur.ac.in.synthetic',
    '88888888-8888-8888-8888-888888880001',
    'INSTITUTE_ADMIN'
)
ON CONFLICT (email) DO NOTHING;

-- 5. Seed a demonstration Student Transfer Request
-- Transfers STU-2026-003 from Delhi Tech to Pune Tech
DO $$
DECLARE
    v_student_id UUID;
BEGIN
    SELECT id INTO v_student_id 
    FROM students 
    WHERE student_ref = 'STU-2026-003' 
    LIMIT 1;

    IF v_student_id IS NOT NULL THEN
        INSERT INTO student_transfers (
            id, student_id, from_institution_id, to_institution_id, 
            student_ref, apaar_id_masked, transfer_reason, status, remarks
        )
        VALUES (
            '99999999-9999-9999-9999-999999990001',
            v_student_id,
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
            'STU-2026-003',
            'XXXX-XXXX-3344',
            'Parental government transfer relocation to western zone.',
            'PENDING_TRANSFER',
            'Duly verified NOC from parent institution attached.'
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

