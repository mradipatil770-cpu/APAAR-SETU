# APAARSetu — Production Deployment Guide (Render + Vercel + Supabase)

This guide provides step-by-step instructions for deploying the **APAARSetu** platform:
- **Backend (FastAPI)**: Hosted on **Render** (Free / Standard Tier)
- **Frontend (React + Vite)**: Hosted on **Vercel** (Free / Pro Tier)
- **Database & Authentication**: Hosted on **Supabase** (PostgreSQL)

---

## 1. Architecture & Communication Flow

```
[ Browser / Client ]
        │
        ▼
[ Vercel CDN ]  ───► Serves React 18 SPA (https://your-app.vercel.app)
        │
        ▼ (HTTPS REST API calls with JWT Bearer Token)
[ Render Web Service ] ───► FastAPI Backend (https://your-backend.onrender.com)
        │
        ▼ (Encrypted PostgreSQL Connection via Pooler Port 6543)
[ Supabase Cloud ] ───► PostgreSQL Database + Supabase Auth
```

---

## 2. Step 1: Deploy Backend on Render

### Method A: Using Render Blueprint (Fastest)

1. Push your repository to **GitHub** or **GitLab**.
2. Log in to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** and select **Blueprint**.
4. Connect your `APPAR-SETU` repository.
5. Render will detect `render.yaml` automatically.
6. When prompted for environment variables, fill in your Supabase credentials:
   - `DATABASE_URL`: Your Supabase connection string with pooled port 6543 (e.g., `postgresql+psycopg://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require`)
   - `AES_ENCRYPTION_KEY`: A 64-character hex key (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)
   - `HMAC_SEARCH_KEY`: A 64-character hex key (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)
   - `SUPABASE_PROJECT_URL`: `https://[REF].supabase.co`
   - `SUPABASE_ANON_KEY`: Your Supabase public anonymous key
   - `SUPABASE_JWT_SECRET`: Your Supabase JWT secret from Project Settings -> API
7. Click **Apply**. Render will build and deploy your service.

---

### Method B: Manual Web Service Setup on Render

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Select your GitHub repository.
4. Configure the settings:
   - **Name**: `apaarsetu-backend` (or your preferred name)
   - **Region**: Choose closest region (e.g., `Singapore` or `Oregon`)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. Click **Advanced** and set **Health Check Path**: `/api/v1/health`.
6. Add the following **Environment Variables**:

| Variable Key | Recommended Value | Note |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` | Matches tested runtime |
| `ENVIRONMENT` | `production` | Enables production security checks |
| `TESTING` | `false` | Disables in-memory SQLite mocks |
| `DATABASE_URL` | `postgresql+psycopg://postgres.[REF]:[PWD]@...:6543/postgres?sslmode=require` | Supabase Pooler URI |
| `AES_ENCRYPTION_KEY` | `64-character hex string` | Field-level encryption |
| `HMAC_SEARCH_KEY` | `64-character hex string` | Blind-index search |
| `CORS_ORIGIN_REGEX` | `^https:\/\/.*\.vercel\.app$` | Permits all Vercel previews & production |
| `SUPABASE_PROJECT_URL` | `https://[REF].supabase.co` | Supabase Project URL |
| `SUPABASE_ANON_KEY` | `[YOUR_ANON_KEY]` | Supabase Anonymous Key |
| `SUPABASE_JWT_SECRET` | `[YOUR_JWT_SECRET]` | Supabase JWT Secret |
| `SUPABASE_JWT_AUDIENCE` | `authenticated` | Default JWT audience |

7. Click **Create Web Service**.
8. Once deployed, note your Render backend URL (e.g., `https://apaarsetu-backend.onrender.com`).

---

## 3. Step 2: Deploy Frontend on Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository (`APPAR-SETU`).
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend` (or leave as root; both are supported via root `vercel.json`).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://your-backend.onrender.com` | Your live Render backend URL (without trailing slash) |
| `VITE_SUPABASE_URL` | `https://[REF].supabase.co` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | `[YOUR_ANON_KEY]` | Supabase Public Anonymous Key |

6. Click **Deploy**.
7. Vercel will install dependencies, run the Vite build, and generate a live URL (e.g., `https://apaarsetu.vercel.app`).

---

## 4. Step 3: Verify the Live Deployment

### 1. Test Backend Health & Readiness
Open in your browser or run in terminal:
```bash
curl https://your-backend.onrender.com/api/v1/health
# Expected: {"status": "ok", "service": "apaarsetu", "version": "0.1.0", "timestamp": "..."}

curl https://your-backend.onrender.com/api/v1/ready
# Expected: {"status": "ready", "database": "connected", ...}
```

### 2. Test Frontend
1. Open your Vercel URL: `https://your-app.vercel.app`
2. Verify that:
   - Top banner shows `भारत सरकार | शिक्षा मंत्रालय` with language & font toggles.
   - Header shows graduation cap, navigation, and `[Login]` / `[Register Institution]` buttons.
   - Hero banner loads with high-resolution campus photo and clean typography.
   - Feature cards load and interactive buttons route to the Login / Registration modal.
3. Test authentication using a synthetic persona or by registering a new test institution.

---

## 5. Troubleshooting & FAQ

- **Render Cold Starts on Free Tier**: Render's free tier spins down after 15 minutes of inactivity. The first request after idle may take 30–50 seconds to boot up. The frontend shows a non-intrusive loading state.
- **CORS Blocked**: If you connect a custom domain to Vercel (e.g. `https://apaarsetu.gov.in`), add your custom domain to `CORS_ORIGINS` in your Render Environment Variables (comma-separated):
  ```
  CORS_ORIGINS=https://apaarsetu.gov.in,https://www.apaarsetu.gov.in
  ```
- **Database Connection Refused**: Ensure you are using Supabase's **Connection Pooler** on port `6543` with `?sslmode=require` rather than the direct port `5432` to avoid exhausting connection limits in serverless/container environments.

