# Enterprise Multimodal RAG Chatbot: Knowledge Base & Architecture

This document defines the complete Knowledge Base and Multimodal Retrieval-Augmented Generation (RAG) specification for **Nova**, the AI Request Triage Assistant's intelligent companion.

---

## 1. Executive System Overview

Nova is an enterprise-grade, multimodal cognitive chatbot embedded directly into the AI Request Triage Assistant platform. It connects client inquiries, operational logs, system screenshots, and webhook events with Google Gemini 2.5 Flash and a verified enterprise knowledge corpus.

### Key Capabilities
- **Multimodal Visual Diagnostics**: Ingests and inspects screenshots of HTTP 500/502/504 errors, AWS CloudWatch graphs, Stripe dispute records, and terminal crash logs.
- **Context-Grounded RAG**: Every answer is grounded in authoritative enterprise operational protocols, with verifiable citations (`[KB-SLA-01]`, `[KB-ROUTE-02]`, etc.).
- **Deterministic Routing Alignment**: Aligns with the core LangGraph state machine driving Engineering, Finance, Sales, and Client Success departments.

---

## 2. Indexed Knowledge Base Corpus

Nova's retrieval engine indexes the following 7 core operational knowledge modules:

### Module 1: Enterprise SLA & Urgency Classification Matrix (`KB-SLA-01`)
| Priority Level | Target First-Response SLA | Escalation Target | Typical Triggers |
| :--- | :--- | :--- | :--- |
| **Urgent (P1)** | `< 15 minutes` | PagerDuty On-Call Lead + VP Eng | Active production downtime, checkout payment gateway failure, critical security exploit, data corruption, contract cancellation threat. |
| **High (P2)** | `< 1 hour` | Department Lead (Eng/Fin) | High monetary discrepancy (>$5,000), single-tenant service disruption, blocking integration bug for enterprise tier, impending SLA penalty. |
| **Medium (P3)** | `< 4 hours` | Standard Team Queue | Non-blocking feature bugs, invoice receipt requests, seat expansion requests, workflow setup inquiries. |
| **Low (P4)** | `< 24 hours` | Self-Service / Community | Documentation questions, general feedback, exploratory inquiries without deadline. |

**Escalation Policy**:
- If an Urgent (P1) incident is not acknowledged within 15 minutes, automated paging routes to the secondary executive on-call.
- Hourly status broadcasts are mandatory on public status pages until MTTR is reached.

---

### Module 2: Department Ownership & Routing Policies (`KB-ROUTE-02`)
The triage engine routes inquiries strictly to one of four enterprise units:

1. **Engineering (`OwnerEnum.ENGINEERING`)**:
   - System outages, 500 Internal Server Errors, 502 Bad Gateway, 504 Gateway Timeout.
   - Database connection pool exhaustion, memory leaks, latency spikes (>2000ms).
   - API authentication failures (OAuth, JWT expiry, invalid HMAC signatures).
   - Security vulnerabilities, DDoS attacks, CVE mitigations.

2. **Finance (`OwnerEnum.FINANCE`)**:
   - Invoicing errors, double-billing complaints, duplicate transaction disputes.
   - Stripe chargebacks (`charge.dispute.created`), merchant account holds.
   - Bank wire reconciliations, annual billing contracts, VAT/GST tax certificates.
   - Credit memo generation, refund approvals exceeding standard thresholds.

3. **Sales Team (`OwnerEnum.SALES_TEAM`)**:
   - New enterprise prospect demo requests, POC (Proof of Concept) trial requests.
   - Seat expansion inquiries (e.g. upgrading from 50 to 500 licenses).
   - Custom enterprise contract negotiations, SOC-2 compliance questionnaire reviews.
   - Feature tier migrations (Starter ➔ Enterprise Scale).

4. **Client Success (`OwnerEnum.CLIENT_SUCCESS`)**:
   - Post-sales onboarding friction, customer team training.
   - Workflow configuration, dashboard usage guidance.
   - Churn risk mitigation for accounts expressing frustration or dissatisfaction.
   - Quarterly business review (QBR) coordination.

---

### Module 3: Inbound Webhook & Simulator Specifications (`KB-WEBHOOK-03`)
Supported webhook providers and payload contracts:

- **AWS SNS / CloudWatch Alert**:
  - Endpoint: `POST /api/webhooks/incoming?source=cloudwatch`
  - Header validation: `X-Amz-Sns-Topic-Arn`, `X-Amz-Sns-Message-Type: Notification`.
  - Typical payload: `alarm_name`, `severity`, `threshold`, `affected_service`.
  - Severity mapping: `ALARM` with `CRITICAL` severity maps to **Urgent** priority and routes to **Engineering**.

- **Stripe Webhooks API**:
  - Endpoint: `POST /api/webhooks/incoming?source=stripe`
  - Event types: `charge.dispute.created`, `invoice.payment_failed`, `customer.subscription.deleted`.
  - Header validation: `Stripe-Signature` (HMAC SHA-256 with timestamp).
  - Triage rule: High dollar chargebacks (`> $2,500`) trigger **High** urgency and route to **Finance**.

- **PagerDuty Incident Webhook**:
  - Event: `incident.triggered`, `incident.escalated`.
  - Direct bridge to live triage queue with automatic duplicate alert suppression (5-minute rolling window).

- **Zendesk & Helpdesk Ingestion**:
  - Ingests raw customer tickets, extracts intent, strips PII/PHI, and computes sentiment score.

---

### Module 4: Sentiment Analytics & Churn Risk Engine (`KB-CHURN-04`)
- **Sentiment Scoring**:
  - Scaled continuously from `-1.0` (deeply frustrated/hostile) to `+1.0` (delighted/enthusiastic).
  - Neutral baseline: `-0.1` to `+0.2`.
  - Panicked/Angry: `< -0.5`.
- **Churn Risk Tiers**:
  - **Critical**: Explicit threat to terminate contract, mention of competitors, or legal escalation. Triggers immediate notification to Client Success Director.
  - **High**: Multiple unresolved complaints within 14 days, invoice dispute combined with product downtime.
  - **Moderate**: Mild dissatisfaction regarding feature release timeline or documentation clarity.
  - **Low**: Friendly inquiries, exploratory feedback, standard operational queries.

---

### Module 5: Multimodal Visual Diagnostics Handbook (`KB-DIAG-05`)
Nova's vision reasoning handles visual operational assets:

1. **HTTP 504 Gateway Timeout Screenshots**:
   - Visual markers: NGINX / Cloudflare default error page, `upstream request timeout`.
   - Root cause: Backend application pod deadlocked, slow database query holding connection pool, or microservice timeout.
   - Diagnosis recommendation: Check database active queries, scale backend pod replica count, inspect recent deployment diff.

2. **AWS CloudWatch Metric Graphs**:
   - Visual markers: Line graph spikes in CPU utilization (>95%), memory utilization saturation, or surge in HTTP 5xx responses.
   - Diagnosis recommendation: Check for auto-scaling group limits, inspect memory leak in recently deployed containers.

3. **Stripe & Invoice Dispute Screenshots**:
   - Visual markers: Disputed charge transaction ID, chargeback fee table, evidence due date countdown.
   - Diagnosis recommendation: Gather proof of service delivery, export transaction audit logs, dispatch to Finance immediately.

4. **Terminal / Pod Crash Logs**:
   - Visual markers: `OOMKilled` (exit code 137), `NullPointerException`, `ConnectionRefusedError: [Errno 111]`.
   - Diagnosis recommendation: Increase Kubernetes container memory limits, verify Redis/Postgres connection string and firewall security groups.

---

### Module 6: Email & SMTP Notification Guidelines (`KB-EMAIL-06`)
- **Simulation Mode**: Safe default mode. Previews outbound customer acknowledgement emails without connecting to live SMTP servers.
- **Live SMTP Dispatch**:
  - Requires Gmail App Password (16-character alphanumeric string generated via Google Account Security).
  - Host: `smtp.gmail.com`, Port: `587`, Security: `TLS (STARTTLS)`.
  - Supports multi-account rotation (Engineering Helpdesk, Billing Dept, Executive Triage).
  - Automatically synthesizes empathetic, executive, or concise drafts tailored to inquiry tone.

---

### Module 7: LangGraph Cognitive State Architecture (`KB-AGENT-07`)
- **Node 1: Classify & Analyze**: Deterministic extraction of Summary, Category, Priority, Urgency Reason, Assigned Owner, Sentiment, Churn Risk, Key Entities, and Suggested Questions.
- **Node 2: Synthesize Response Draft**: Employs tone guidelines (Empathetic, Executive, or Concise) with checkpoint commitments.
- **Fallback Mechanisms**: If the Gemini API key is missing or quota is exhausted, fallback deterministic heuristics guarantee continuous uptime with zero system crashes.

---

## 3. RAG Retrieval Mechanics

```
User Query + Optional Image
            │
            ▼
┌──────────────────────────────────────────────┐
│  Hybrid Token & BM25 Relevance Matcher       │
│  - Tokenizes input, strips stopwords         │
│  - Computes BM25 term frequency scores       │
│  - Ranks KB chunks (KB-SLA-01 .. KB-AGENT-07)│
│  - Filters top-k chunks above threshold      │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Multimodal Prompt Synthesis                 │
│  - Injects retrieved knowledge chunks        │
│  - Attaches base64 image (if uploaded)       │
│  - Mandates explicit [KB-XXX] citations      │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Google Gemini 2.5 Flash Generation          │
│  - Synthesizes grounded, accurate reply      │
│  - Extracts actionable follow-up suggestions │
│  - Formats markdown and code blocks          │
└──────────────────────────────────────────────┘
```

---

## 4. Multimodal Payload Schema

### Request Payload (`POST /api/chat/multimodal-rag`)
```json
{
  "message": "We have a 504 Gateway Timeout during peak checkout. What is our SLA and who should be paged?",
  "image_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "file_name": "cloudwatch_504_spike.png",
  "conversation_history": [
    { "role": "user", "content": "Hello" },
    { "role": "model", "content": "Hi! How can I assist you today?" }
  ]
}
```

### Response Payload
```json
{
  "reply": "Based on our Enterprise SLA Matrix [KB-SLA-01], a 504 Gateway Timeout impacting checkout operations is classified as **Urgent (P1)** with a mandatory first-response SLA of **< 15 minutes**...",
  "sources": [
    {
      "id": "KB-SLA-01",
      "title": "Enterprise SLA & Urgency Classification Matrix",
      "category": "SLA & Urgency",
      "score": 0.94,
      "snippet": "Urgent (P1): < 15 minutes target response. Active production downtime..."
    }
  ],
  "image_analysis": "Multimodal analysis confirms a sharp spike in HTTP 504 Gateway Timeout errors exceeding 42% threshold.",
  "suggested_followups": [
    "How do I page the On-Call Engineering Lead?",
    "What is the rollback procedure for recent deployments?",
    "How do I compose an executive status broadcast?"
  ],
  "latency_ms": 780
}
```

---

*Authored for AI Request Triage Assistant • Stage Two Implementation*

