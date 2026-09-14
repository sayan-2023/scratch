# Free Cloud Deployment Guide: AI Request Triage Assistant

This guide provides step-by-step instructions to deploy the entire full-stack **AI Request Triage Assistant** (React Frontend + FastAPI Backend + LangGraph Multi-Agent Swarm + Google OAuth) to a **100% free cloud platform**.

---

## Architecture Overview

The application is containerized with a **multi-stage production Dockerfile**:
- **Frontend**: Compiles React 18 + Vite into optimized static bundles (`dist/`).
- **Backend**: FastAPI runs Uvicorn on the assigned cloud `$PORT`, serving:
  - All API routes (`/api/*`, `/health`, `/docs`)
  - The compiled React SPA on `/` and client routes
  - The standalone Google OAuth authentication popup template (`/oauth-google.html`)
- **Single Public URL**: Both frontend and backend share the exact same domain, eliminating CORS errors and cross-origin popup restrictions.

---

## Option 1: Deploy on Render.com (Recommended • 100% Free)

**Render** provides 750 free instance hours per month, automatic HTTPS (SSL), continuous deployment on `git push`, and free custom domains.

### Step 1: Create a Free Render Account
1. Go to [https://render.com](https://render.com) and sign up with your GitHub account (`sayan-2023`).

### Step 2: Create a New Web Service
1. On the Render Dashboard, click **New +** → **Web Service**.
2. Select **Build and deploy from a Git repository** and click **Next**.
3. Choose your repository: `sayan-2023/scratch` (or click *Configure account* to grant access if not listed).
4. Configure the service settings:
   - **Name**: `nova-ai-triage-sayan` *(Important: subdomains on onrender.com are globally unique worldwide. Using `nova-ai-triage-sayan` guarantees your dedicated URL)*
   - **Region**: Choose your closest region (e.g. *Frankfurt, EU* or *Oregon, US*)
   - **Branch**: `main`
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `./Dockerfile` (Render detects this automatically)
   - **Instance Type**: **Free** ($0/month)

### Step 3: Add Environment Variables
Under the **Environment Variables** section on Render, add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `your_gemini_api_key_here` | Required for Gemini 2.5 Flash AI Swarm & Vision OCR |
| `PORT` | `8000` | Optional (Render injects `$PORT` automatically) |

*(Optional email credentials if you wish to use Gmail SMTP in production)*:
| Key | Value |
| :--- | :--- |
| `GMAIL_USER` | `your_gmail_address@gmail.com` |
| `GMAIL_APP_PASSWORD` | `your_16_char_app_password` |

### Step 4: Click "Create Web Service"
* Render will clone your GitHub repo, execute the Docker build, compile the React UI, and launch FastAPI.
* In ~2-3 minutes, your dedicated service will be live at:
  ```text
  https://nova-ai-triage-sayan.onrender.com
  ```
* **Health Check Endpoint**: `https://nova-ai-triage-sayan.onrender.com/health`

---

## Option 2: Deploy on Koyeb (Free Nano Tier)

**Koyeb** offers a free nano web service tier with continuous deployment:
1. Go to [https://app.koyeb.com](https://app.koyeb.com) and sign in with GitHub.
2. Click **Create Service** → **GitHub**.
3. Select `sayan-2023/scratch`.
4. Choose **Dockerfile** builder.
5. In **Environment variables**, set `GEMINI_API_KEY`.
6. Click **Deploy**. Your app will be live at `https://<your-app-name>.koyeb.app`.

---

## Option 3: Deploy on Hugging Face Spaces (Always Free • 16 GB RAM)

**Hugging Face Spaces** provides 2 vCPU + 16 GB RAM for free:
1. Go to [https://huggingface.co/spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Select **Docker** SDK → **Blank**.
3. Choose **Public** or **Private** and click **Create Space**.
4. In Space Settings → **Variables and secrets**, add `GEMINI_API_KEY`.
5. Push the repository to the Hugging Face Space git remote or connect GitHub via GitHub Actions.

---

## Testing the Production Container Locally (Optional)

If you have Docker installed on your machine, you can test the production container locally:

```bash
# 1. Build the Docker image from repo root
docker build -t ai-request-triage .

# 2. Run the container locally on port 8000
docker run -p 8000:8000 -e GEMINI_API_KEY="your_api_key" ai-request-triage

# 3. Access in browser
open http://localhost:8000
```

