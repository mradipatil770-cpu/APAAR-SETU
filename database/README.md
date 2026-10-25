# APAARSetu Database Setup & Migrations (Supabase PostgreSQL)

This directory contains the versioned database schema migrations and synthetic seed procedures for the APAARSetu prototype.

---

## 1. Supabase Connection Overview

Supabase provides two primary ways to connect to PostgreSQL:

1. **Transaction Pooler (Port 6543 - Recommended)**:
   - Uses Supavisor connection pooling.
   - Ideal for IPv4 environments (such as typical home/college Wi-Fi) and containerized backends.
   - Connection URL Format:
     ```text
     postgresql+psycopg://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
     ```
2. **Session Pooler / Direct Connection (Port 5432)**:
   - Requires IPv6 support or direct networking.
   - Port 5432 session pooler format:
     ```text
     postgresql+psycopg://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
     ```

> **Security Rule**: Never commit the real connection string or database password into git. Place it strictly in `backend/.env`.

---

## 2. Applying Migrations via Supabase Dashboard SQL Editor

1. Open your Supabase Project at [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor** in the left sidebar.
3. Click **New query**.
4. Paste the full contents of `database/migrations/001_initial_schema.sql` and click **Run**.
5. Verify that 10 tables are created under the `public` schema:
   - `institutions`, `users`, `programmes`, `approved_intakes`, `data_uploads`, `students`, `enrolments`, `validation_issues`, `anomaly_cases`, `audit_logs`.

---

## 3. Seeding Synthetic Prototype Data

After the initial schema is created:
1. In the Supabase **SQL Editor**, open another **New query**.
2. Paste the contents of `database/seed/001_synthetic_seed.sql` and click **Run**.
3. This creates:
   - 2 synthetic institutions (`AICTE-ENG-001`, `AICTE-ENG-002`)
   - 1 demo staff user
   - 3 academic programmes (`CSE`, `ECE`, `MECH`)
   - Approved intake limits for `2026-27` (e.g., CSE approved intake = 5)

---

## 4. Safe Reset Procedure (Prototype Data Only)

If you need to wipe uploaded test records without deleting table definitions or unrelated Supabase configuration:

```sql
-- TRUNCATE prototype transaction tables only (preserves institutions & programmes)
TRUNCATE TABLE 
    audit_logs,
    anomaly_cases,
    validation_issues,
    enrolments,
    students,
    data_uploads
CASCADE;
```

To perform a complete teardown of APAARSetu prototype tables:
```sql
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS anomaly_cases CASCADE;
DROP TABLE IF EXISTS validation_issues CASCADE;
DROP TABLE IF EXISTS enrolments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS data_uploads CASCADE;
DROP TABLE IF EXISTS approved_intakes CASCADE;
DROP TABLE IF EXISTS programmes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS institutions CASCADE;
```

