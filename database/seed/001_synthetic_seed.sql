-- =============================================================================
-- Seed Data: 001_synthetic_seed.sql
-- Description: Synthetic Institutions, Programmes, and Approved Intakes
-- NOTE: ALL DATA IS STRICTLY SYNTHETIC AND FOR LOCAL DEMO/TESTING ONLY.
-- =============================================================================

-- Seed Synthetic Institutions
INSERT INTO institutions (id, code, name)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'AICTE-ENG-001', 'Delhi Institute of Engineering & Technology (Synthetic)'),
    ('22222222-2222-2222-2222-222222222222', 'AICTE-ENG-002', 'Pune Technological University (Synthetic)')
ON CONFLICT (code) DO NOTHING;

-- Seed Synthetic Staff Users
INSERT INTO users (id, email, institution_id, role)
VALUES 
    ('33333333-3333-3333-3333-333333333333', 'demo_admin@delhi-tech.edu.synthetic', '11111111-1111-1111-1111-111111111111', 'institution_admin')
ON CONFLICT (email) DO NOTHING;

-- Seed Programmes for AICTE-ENG-001
INSERT INTO programmes (id, institution_id, code, name)
VALUES 
    ('44444444-4444-4444-4444-444444440001', '11111111-1111-1111-1111-111111111111', 'CSE', 'Computer Science and Engineering'),
    ('44444444-4444-4444-4444-444444440002', '11111111-1111-1111-1111-111111111111', 'ECE', 'Electronics and Communication Engineering'),
    ('44444444-4444-4444-4444-444444440003', '11111111-1111-1111-1111-111111111111', 'MECH', 'Mechanical Engineering')
ON CONFLICT (institution_id, code) DO NOTHING;

-- Seed Approved Intakes for 2026-27 (AICTE-ENG-001)
-- Note: CSE intake is set to 5 so our demo upload easily demonstrates intake warnings/discrepancies!
INSERT INTO approved_intakes (id, institution_id, programme_id, academic_year, approved_intake)
VALUES 
    ('55555555-5555-5555-5555-555555550001', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444440001', '2026-27', 5),
    ('55555555-5555-5555-5555-555555550002', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444440002', '2026-27', 60),
    ('55555555-5555-5555-5555-555555550003', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444440003', '2026-27', 60)
ON CONFLICT (institution_id, programme_id, academic_year) DO NOTHING;

