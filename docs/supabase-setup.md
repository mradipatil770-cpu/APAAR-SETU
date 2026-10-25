# Supabase PostgreSQL Setup & Configuration Guide

This guide explains how to connect APAARSetu to your Supabase project, execute migrations, configure pooling, and verify the persistent database.

---

## 1. Where to Find Supabase Project Credentials

1. Sign in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (or click **New project** to create one).
3. In the left navigation bar, click the **Settings** gear icon (or **Project Settings**).
4. Go to **Database**:
   - Scroll down to the **Connection string** section.
   - Select the **URI** tab.
   - You will see two connection modes:
     - **Session mode (Port 5432)**: Direct connection.
     - **Transaction mode (Port 6543)**: Supavisor connection pooler.

---

## 2. Supported Connection Methods & IPv4/IPv6 Considerations

### A. Recommended: Transaction Pooler (Port 6543)
Many local internet service providers, campus networks, and residential connections do not have IPv6 enabled. Supabase direct connections (`db.xxx.supabase.co:5432`) resolve only to IPv6 addresses on free tier projects.

The **Supabase Pooler** (`aws-0-[region].pooler.supabase.com:6543`) provides full IPv4 compatibility and connection recycling.

**Format for APAARSetu `backend/.env`**:
```env
DATABASE_URL=postgresql+psycopg://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### B. Session Pooler / Direct Connection (Port 5432)
If your network supports IPv6 or you are connecting from an IPv6 cloud environment:
```env
DATABASE_URL=postgresql+psycopg://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require
```

> **Important**:
> 1. Use the driver prefix `postgresql+psycopg://` so SQLAlchemy uses the Psycopg 3 driver.
> 2. Replace `[YOUR-PASSWORD]` with your actual database password.
> 3. If your password contains special characters (like `@`, `:`, `/`), URL-encode them.
> 4. Keep this value **strictly** inside `backend/.env`. Never commit it to git.

---

## 3. Applying Migrations in the Supabase SQL Editor

1. In your Supabase Dashboard, click **SQL Editor** from the left sidebar.
2. Click **New query**.
3. Open [`database/migrations/001_initial_schema.sql`](../database/migrations/001_initial_schema.sql) in your code editor.
4. Copy and paste the entire script into the Supabase SQL editor and click **Run**.
5. You should see `Success. No rows returned`.
6. Go to **Table Editor** in the left sidebar and confirm all 10 tables exist:
   - `institutions`, `users`, `programmes`, `approved_intakes`, `data_uploads`, `students`, `enrolments`, `validation_issues`, `anomaly_cases`, `audit_logs`.

---

## 4. Seeding Synthetic Prototype Data

1. Open a new query in the Supabase **SQL Editor**.
2. Copy and paste the contents of [`database/seed/001_synthetic_seed.sql`](../database/seed/001_synthetic_seed.sql) and click **Run**.
3. This creates:
   - Institution `AICTE-ENG-001` (Delhi Institute of Engineering & Technology)
   - Institution `AICTE-ENG-002` (Pune Technological University)
   - Programmes: `CSE`, `ECE`, `MECH`
   - Approved Intakes for `2026-27` (`CSE`: 5 seats, `ECE`: 60 seats, `MECH`: 60 seats).

---

## 5. Verifying Database Connectivity

Start the FastAPI backend with your configured `.env`:
```powershell
cd D:\APPAR-SETU\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload
```

Test the readiness endpoint:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/ready" | ConvertTo-Json
```
**Expected Response**:
```json
{
  "status": "ready",
  "database": "connected",
  "message": "Database connection operational"
}
```

---

## 6. Row Level Security (RLS) Inspection

All 10 tables have Row Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

To inspect the active policies in Supabase:
1. Go to **Authentication** -> **Policies** in the Supabase Dashboard.
2. Confirm the defined policies:
   - `authenticated_read_programmes`
   - `institution_isolate_students`
   - `institution_isolate_anomalies`

FastAPI connects to the PostgreSQL database with server-side credentials and enforces institution isolation on every query at the application tier. The RLS policies serve as defense-in-depth against unauthorized client-side direct access.

---

## 7. Safe Reset Procedure (Clearing Prototype Uploads Only)

To clear demo records without dropping your database schema or institutions:
```sql
TRUNCATE TABLE 
    audit_logs,
    anomaly_cases,
    validation_issues,
    enrolments,
    students,
    data_uploads
CASCADE;
```

