# AI Request Triage Assistant

A full-stack, AI-powered system that transforms unstructured incoming client inquiries (emails, chats, contact form submissions) into clear, prioritized, routed actions with auto-drafted professional responses.

Built for the **Node Solutions / Stage Two** challenge.

---

## Key Features & Specification Conformance

| Requirement | How It Is Solved |
| :--- | :--- |
| **Accept written request** | Interactive text area supporting messy emails, chat logs, and form messages + 5 realistic mock presets. |
| **Short summary** | Gemini extracts a 1–2 sentence executive summary highlighting the core issue. |
| **Category assignment** | Strictly categorizes into one of 5 buckets: `Sales`, `Support`, `Billing`, `Technical`, `Other`. |
| **Priority & Reason** | Computes urgency (`Low`, `Medium`, `High`, `Urgent`) along with a concrete business justification reason. |
| **Department routing** | Directs the request to exactly one owner: `Sales Team`, `Client Success`, `Finance`, or `Engineering`. |
| **Draft response** | Generates an empathetic, professional first response tailored to the client's problem, ready to review, edit, and send. |
| **User Interface** | Modern React + Material UI dashboard with color-coded chips, editable draft response, copy-to-clipboard, and session history log. |

---

## System Architecture

```
                      +-----------------------------+
                      | React + Material UI (Vite)  |
                      | http://localhost:5173       |
                      +--------------+--------------+
                                     |
                                     | HTTP POST /api/triage
                                     v
                      +-----------------------------+
                      |       FastAPI Backend       |
                      | http://localhost:8000       |
                      +--------------+--------------+
                                     |
                                     v
                 +---------------------------------------+
                 |          LangGraph StateGraph         |
                 |                                       |
                 |  [Node 1: Classify & Triage]          |
                 |  Structured Pydantic Extraction       |
                 |  (Summary, Category, Priority, Owner) |
                 |                   |                   |
                 |                   v                   |
                 |  [Node 2: Draft Response]             |
                 |  Context-Aware Client First Response  |
                 +-------------------+-------------------+
                                     |
                                     v
                           Google Gemini LLM
                       (gemini-2.5-flash / free)
```

---

## Tech Stack

* **Backend**:
  * **Framework**: FastAPI (high-performance Python API)
  * **Agent Orchestration**: LangGraph (`StateGraph`) & LangChain
  * **LLM Provider**: Google Gemini (`gemini-2.5-flash` or `gemini-1.5-flash`) via `langchain-google-genai`
  * **Validation**: Pydantic v2 with strict Enums
* **Frontend**:
  * **Framework**: React 18 + Vite
  * **UI Library**: Material UI (MUI v6) + Emotion
  * **Typography**: Plus Jakarta Sans & JetBrains Mono

---

## Quick Start Guide

### 1. Prerequisites
* Python 3.10+ (Tested on Python 3.14)
* Node.js 18+ (Tested on Node v22)
* A free Google Gemini API Key ([Get one free in 1 minute from Google AI Studio](https://aistudio.google.com/app/apikey))

### 2. Configure API Key
You have two convenient options:

* **Option A (Web UI - Recommended for quick testing)**:
  Launch the app and click the **"Configure API Key"** button in the top-right corner of the dashboard. Your key is saved locally in your browser.

* **Option B (.env file)**:
  Copy the example env file and add your key:
  ```bash
  cd backend
  cp .env.example .env
  # Add: GEMINI_API_KEY=AIzaSy...
  ```

### 3. Launch Both Services (One Command)
From the root directory:
```bash
./run.sh
```

This starts:
* **Frontend UI**: [http://localhost:5173](http://localhost:5173)
* **Backend API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## Manual Startup (Alternative)

If you prefer to run backend and frontend in separate terminal windows:

### Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

---

## Testing & Automated Verification

Run automated backend tests (verifying health checks, enum validation, sample endpoints, and error handling):

```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest tests/
```

---

## Video Walkthrough Guide (For Challenge Submission)

When recording your video walkthrough:
1. **Introduction (15s)**:
   - State the problem: High volume of manual incoming client emails causing triage delays and misrouting.
2. **Architecture (20s)**:
   - Explain the stack: FastAPI backend running a multi-step LangGraph state graph with Google Gemini, connected to a Material UI React interface.
3. **Live Demonstration (60-90s)**:
   - Click **Preset 1 (SSO Outage)**: Show how it instantly identifies **Urgent** priority, categorizes as **Technical**, routes to **Engineering**, and crafts an urgent escalation draft.
   - Click **Preset 2 (Invoice Discrepancy)**: Show routing to **Finance**, **Billing** category, and an empathetic billing review draft.
   - Click **Preset 3 (Enterprise 250 Seats Demo)**: Show routing to **Sales Team**, **Sales** category, and a friendly scheduling draft.
   - Demonstrate **Draft Editing & One-Click Copy**: Edit a sentence in the response box, click **"Copy Text"**, and click **"Approve & Send Draft"**.
   - Show the **Activity Log** in the right sidebar tracking past requests.

