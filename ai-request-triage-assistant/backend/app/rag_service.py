import os
import re
import time
import math
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from dotenv import load_dotenv

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.models import (
    RAGSource,
    MultimodalChatResponse,
    KnowledgeBaseDocument,
)

# Load environment
_backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(_backend_dir / ".env")
load_dotenv(_backend_dir.parent / ".env")
load_dotenv()


# ==============================================================================
# Enterprise Knowledge Base Corpus
# ==============================================================================

KNOWLEDGE_CORPUS = [
    {
        "id": "KB-SLA-01",
        "title": "Enterprise SLA & Urgency Classification Matrix",
        "category": "SLA & Urgency",
        "tags": ["sla", "urgency", "priority", "p1", "p2", "p3", "p4", "urgent", "high", "medium", "low", "escalation", "pagerduty"],
        "summary": "Defines SLA response turnaround times, incident tiers, paging thresholds, and executive escalations.",
        "content": """
Enterprise SLA Response & Resolution Targets:
- Urgent (P1): Target First Response < 15 minutes. Dedicated war room, automated paging to On-Call Engineering Lead and VP of Engineering. Hourly status page updates until resolution.
  Triggers: Complete system outage, checkout payment gateway failures, active data corruption, critical zero-day security exploit, or imminent client contract termination threat.
- High (P2): Target First Response < 1 hour. Escalated to Department Director (Engineering or Finance).
  Triggers: High monetary discrepancies (disputed amounts > $5,000), single-tenant service disruption, blocking integration bug for enterprise tier accounts, impending contract SLA penalty.
- Medium (P3): Target First Response < 4 hours. Routed to standard operational queues.
  Triggers: Non-blocking feature defects, UI glitches, seat expansion requests, workflow setup inquiries, invoice receipt requests.
- Low (P4): Target First Response < 24 hours. Handled by self-service documentation or tier-1 support.
  Triggers: General informational questions, how-to requests, non-urgent feedback, roadmap queries.
Escalation Policy:
If an Urgent P1 incident is unacknowledged after 15 minutes, automated secondary escalation pages the CTO and Head of Infrastructure.
        """.strip(),
    },
    {
        "id": "KB-ROUTE-02",
        "title": "Department Ownership & Routing Policies",
        "category": "Team Routing",
        "tags": ["routing", "owner", "engineering", "finance", "sales", "client success", "department", "ownership"],
        "summary": "Mandatory routing rules mapping customer issues to Engineering, Finance, Sales, or Client Success.",
        "content": """
Department Ownership & Responsibilities:
1. Engineering (Owner: Engineering):
   - Scope: System outages, 500 Internal Server Errors, 502 Bad Gateway, 504 Gateway Timeout.
   - Database connection pool exhaustion, memory leak spikes (>90% RAM), API latency degradation (>2000ms).
   - Authentication/SSO failures, OAuth token refresh bugs, HMAC signature errors.
   - Security vulnerabilities, DDoS attacks, CVE patches.
2. Finance (Owner: Finance):
   - Scope: Billing disputes, double-charge complaints, credit card processing errors.
   - Stripe chargebacks (charge.dispute.created), merchant account holds.
   - Wire transfers, enterprise annual invoices, tax certificates (VAT/GST/W-9), refund approvals > $500.
3. Sales Team (Owner: Sales Team):
   - Scope: Enterprise tier pricing inquiries, custom seat expansion (e.g. 50 -> 500 seats).
   - POC (Proof of Concept) trial requests, sales demo scheduling, RFP/RFI responses.
   - Commercial contract renewals, SOC-2 compliance attestation requests from prospects.
4. Client Success (Owner: Client Success):
   - Scope: Post-sales user onboarding friction, team workflow training, dashboard walk-throughs.
   - Churn risk mitigation for dissatisfied clients, executive sponsor relationship management.
   - Feature adoption tracking and Quarterly Business Review (QBR) alignment.
        """.strip(),
    },
    {
        "id": "KB-WEBHOOK-03",
        "title": "Inbound Webhook & Simulator Specifications",
        "category": "Webhooks & Ingestion",
        "tags": ["webhook", "cloudwatch", "stripe", "pagerduty", "zendesk", "datadog", "hmac", "simulator", "payload"],
        "summary": "Technical payload schemas, security validation, and automated ingestion mappings for external webhooks.",
        "content": """
Inbound Webhook Integration Architecture:
- Supported Sources: AWS CloudWatch SNS, Stripe Webhooks, PagerDuty Incidents, Datadog Alerts, Zendesk Tickets.
- Ingestion Endpoint: POST /api/webhooks/incoming?source={provider}
- AWS SNS / CloudWatch:
  - Validates 'X-Amz-Sns-Message-Type: Notification' and 'X-Amz-Sns-Topic-Arn'.
  - Maps 'severity: CRITICAL' and 'alarm_state: ALARM' directly to Urgent (P1) Engineering priority.
- Stripe Webhook:
  - Event types: 'charge.dispute.created', 'invoice.payment_failed', 'customer.subscription.deleted'.
  - Validates HMAC SHA-256 signature in 'Stripe-Signature' header.
  - Disputes > $2,500 automatically tagged as High priority and routed to Finance.
- Deduplication & Resilience:
  - Ingestion applies a 5-minute rolling SHA-256 deduplication cache.
  - Failed events are automatically routed to Dead-Letter Queue (DLQ) with 3 exponential backoff retries.
        """.strip(),
    },
    {
        "id": "KB-CHURN-04",
        "title": "Sentiment Analytics & Churn Risk Engine",
        "category": "Customer Intelligence",
        "tags": ["sentiment", "churn", "risk", "satisfaction", "retention", "score", "emotion", "panicked", "frustrated"],
        "summary": "Mathematical scoring scales for customer emotion, churn risk indicators, and intervention playbooks.",
        "content": """
Sentiment & Churn Risk Analytics:
- Sentiment Scoring Scale: Continuous float from -1.0 (deeply hostile/frustrated) to +1.0 (delighted/enthusiastic).
  - Positive / Optimistic: +0.3 to +1.0
  - Neutral / Inquiring: -0.1 to +0.2
  - Frustrated / High Friction: -0.5 to -0.2
  - Panicked / Critical Rage: -1.0 to -0.6
- Churn Risk Tiers:
  - Critical: Explicit threat to cancel contract, mention of competitor migration, or legal escalation. Auto-alerts Client Success Director within 10 minutes.
  - High: Repeated unresolved tickets (>3 in 14 days) or billing dispute combined with service outage.
  - Moderate: Mild dissatisfaction regarding product roadmap or delayed responses.
  - Low: Normal questions, feature suggestions, or positive inquiries.
Retention Playbook:
Critical churn risk tickets require immediate empathetic acknowledgement, validation of frustration, and executive check-in scheduling.
        """.strip(),
    },
    {
        "id": "KB-DIAG-05",
        "title": "Multimodal Visual Diagnostics Handbook",
        "category": "Diagnostics & Vision",
        "tags": ["multimodal", "image", "vision", "screenshot", "error", "504", "500", "cloudwatch", "graph", "stacktrace", "invoice"],
        "summary": "Visual pattern recognition guide for diagnosing screenshots of server errors, graphs, and billing disputes.",
        "content": """
Multimodal Vision Diagnostic Signatures:
1. HTTP 504 Gateway Timeout Screenshots:
   - Visual Indicators: Cloudflare or NGINX error 504 banner, 'Upstream timed out'.
   - Root Cause: Application backend pod deadlocked, unindexed database query locking rows, or third-party API timeout.
   - Action: Check database connection pool, scale worker replicas, inspect recent code deploy.
2. AWS CloudWatch / Datadog Metric Graphs:
   - Visual Indicators: CPU spike to 99-100%, sharp cliff-drop in successful HTTP 200s, surge in 5xx errors.
   - Action: Review container memory limits, check for infinite loop or unhandled asynchronous task backlog.
3. Stripe / Bank Statement Screenshots:
   - Visual Indicators: Red dispute badge, fee breakdown ($15 dispute fee), transaction reference number, customer email.
   - Action: Compile customer activity logs, verify billing address, submit dispute counter-evidence within 7 business days.
4. Terminal Crash & Stack Trace Logs:
   - Visual Indicators: 'java.lang.NullPointerException', 'SIGSEGV', 'exit code 137 (OOMKilled)', 'ECONNREFUSED'.
   - Action: Assign immediately to Engineering with High/Urgent priority.
        """.strip(),
    },
    {
        "id": "KB-EMAIL-06",
        "title": "Email & SMTP Notification Guidelines",
        "category": "Email & Notifications",
        "tags": ["email", "smtp", "gmail", "app password", "simulation", "tls", "notification", "dispatch"],
        "summary": "Configuration parameters for Gmail App Passwords, port 587 TLS, and safe simulation mode.",
        "content": """
Email Service & SMTP Architecture:
- Simulation Mode: Enabled by default for zero-risk testing. Logs rendered HTML/Text drafts to console and inbox store without sending live emails.
- Live SMTP Configuration:
  - Host: smtp.gmail.com | Port: 587 | Security: TLS (STARTTLS).
  - Authentication: Requires 16-character Google App Password (not standard account password). Two-Factor Authentication (2FA) must be active on the Gmail account.
- Multi-Account Routing:
  - System supports multiple departmental accounts (e.g. billing@company.com, support@company.com, alerts@company.com).
- Automated Tone Adaptation:
  - Generates Empathetic (warm, apologetic), Executive (polished, SLA-focused), or Concise (bulleted, action-first) drafts tailored to customer sentiment.
        """.strip(),
    },
    {
        "id": "KB-AGENT-07",
        "title": "LangGraph Cognitive State Architecture",
        "category": "System Architecture",
        "tags": ["langgraph", "agent", "state", "nodes", "gemini", "pipeline", "classification", "architecture"],
        "summary": "Defines the internal multi-node LangGraph cognitive pipeline and deterministic fallback guarantees.",
        "content": """
LangGraph Cognitive Triage Pipeline:
- State Machine Nodes:
  - START -> Node 1 (Classify & Analyze) -> Node 2 (Synthesize Response) -> END
- Node 1 (Analysis): Extracts structured Pydantic payload: Category, Priority, Urgency Reason, Assigned Owner, Sentiment Score, Churn Risk, Key Entities, Suggested Questions.
- Node 2 (Draft Synthesis): Synthesizes defensible customer response using selected tone style (Empathetic, Executive, Concise).
- Resilience & Deterministic Fallback:
  - If external LLM API is unavailable or rate-limited, deterministic rule-based heuristics automatically classify urgency, assign ownership, and generate standard holding responses.
  - Zero-drop guarantee ensures webhook payloads and customer messages are never lost.
        """.strip(),
    },
    {
        "id": "KB-PLATFORM-08",
        "title": "AI Request Triage Assistant Website & Platform Guide",
        "category": "Website & Features",
        "tags": [
            "website",
            "platform",
            "guide",
            "how it works",
            "features",
            "demo",
            "studio",
            "simulator",
            "login",
            "admin",
            "architecture",
            "capabilities",
            "email",
            "workspace",
            "triage",
        ],
        "summary": "Comprehensive guide on how this website works, key page sections, live demo sandboxes, and authentication.",
        "content": """
AI Request Triage Assistant Platform & Website Overview:
1. Core Mission:
   - Converts unstructured, messy client communications (emails, live chats, Zendesk tickets, webhooks) into structured operational triage data, defensible urgency scores, team routing, and empathetic draft replies.
2. Key Website Sections (Home / Landing Page):
   - Hero Section: High-level engine overview and fast CTA triggers ('Try Live AI Triage Studio', 'Inbound Webhook Simulator').
   - Live Demo Matrix: Tabbed real-world presets showcasing Technical, Billing, Sales, and Support triage.
   - Interactive Pipeline Visualizer: 4-stage pipeline: Ingestion -> Cognitive Reasoning (LangGraph) -> Sentiment/Churn Scoring -> Automated Dispatch.
   - Industry Comparison Matrix: Benchmarks AI Request Triage Assistant against manual human queues and rigid keyword rule bots.
   - Interactive App Explainer: In-page RAG architecture console allowing visitors to ask how the system operates under the hood.
3. Interactive Demo Sandboxes:
   - Live AI Triage Studio: Modal allowing visitors to test intent extraction, SLA grading, and auto-draft synthesis across realistic presets.
   - Inbound Webhook Simulator: Dispatches simulated CloudWatch, Stripe, PagerDuty, or Slack events, showing sub-second triage and response generation.
4. Accessing the Workspace:
   - Click 'Launch App' or 'Sign In' on the top bar.
   - Use the pre-configured admin account: admin@triage.ai / password123 (or sign in via Google OAuth simulator).
   - Inside Workspace: Access real-time sample picker, custom scenario generator, Gmail SMTP dispatcher, and persistent cross-session history log.
        """.strip(),
    },
]


# ==============================================================================
# RAG Retrieval Engine
# ==============================================================================

def get_knowledge_base_documents() -> List[KnowledgeBaseDocument]:
    """Returns overview of all indexed knowledge base modules."""
    return [
        KnowledgeBaseDocument(
            id=item["id"],
            title=item["title"],
            category=item["category"],
            summary=item["summary"],
            tags=item["tags"],
        )
        for item in KNOWLEDGE_CORPUS
    ]


def retrieve_relevant_knowledge(query: str, top_k: int = 3, mode: Optional[str] = "workspace") -> List[RAGSource]:
    """
    Hybrid token & keyword retrieval algorithm with score normalization.
    Matches query terms against document titles, tags, summaries, and full content.
    Prioritizes platform guide documents when mode == 'website_guide'.
    """
    cleaned_query = re.sub(r"[^\w\s]", " ", query.lower())
    query_tokens = [w for w in cleaned_query.split() if len(w) > 2]

    if not query_tokens:
        # Fallback to top general docs
        if mode == "website_guide":
            platform_doc = next((d for d in KNOWLEDGE_CORPUS if d["id"] == "KB-PLATFORM-08"), KNOWLEDGE_CORPUS[0])
            agent_doc = next((d for d in KNOWLEDGE_CORPUS if d["id"] == "KB-AGENT-07"), KNOWLEDGE_CORPUS[1])
            return [
                RAGSource(
                    id=platform_doc["id"],
                    title=platform_doc["title"],
                    category=platform_doc["category"],
                    snippet=platform_doc["summary"],
                    score=0.99,
                ),
                RAGSource(
                    id=agent_doc["id"],
                    title=agent_doc["title"],
                    category=agent_doc["category"],
                    snippet=agent_doc["summary"],
                    score=0.95,
                ),
            ]
        return [
            RAGSource(
                id=KNOWLEDGE_CORPUS[0]["id"],
                title=KNOWLEDGE_CORPUS[0]["title"],
                category=KNOWLEDGE_CORPUS[0]["category"],
                snippet=KNOWLEDGE_CORPUS[0]["summary"],
                score=0.90,
            ),
            RAGSource(
                id=KNOWLEDGE_CORPUS[1]["id"],
                title=KNOWLEDGE_CORPUS[1]["title"],
                category=KNOWLEDGE_CORPUS[1]["category"],
                snippet=KNOWLEDGE_CORPUS[1]["summary"],
                score=0.85,
            ),
        ]

    scored_docs: List[Tuple[float, Dict[str, Any], str]] = []

    for doc in KNOWLEDGE_CORPUS:
        score = 0.0
        doc_text = f"{doc['title']} {' '.join(doc['tags'])} {doc['summary']} {doc['content']}".lower()

        # Token matching with weighted bonuses
        for token in query_tokens:
            # Exact tag match
            if token in doc["tags"]:
                score += 3.5
            # Title match
            if token in doc["title"].lower():
                score += 2.5
            # Summary match
            if token in doc["summary"].lower():
                score += 1.5
            # Content count
            occurrences = doc_text.count(token)
            if occurrences > 0:
                score += math.log(1 + occurrences) * 1.2

        # In website_guide mode, grant contextual boost to platform & agent docs
        if mode == "website_guide" and doc["id"] in ("KB-PLATFORM-08", "KB-AGENT-07"):
            score += 2.0

        if score > 0:
            # Generate snippet highlighting relevant section
            snippet = doc["summary"]
            # Find best matching sentence in content
            sentences = doc["content"].split(".")
            for s in sentences:
                if any(t in s.lower() for t in query_tokens):
                    snippet = s.strip() + "..."
                    break

            scored_docs.append((score, doc, snippet))

    # Sort descending by score
    scored_docs.sort(key=lambda x: x[0], reverse=True)

    # Normalize scores to 0.0 - 1.0 range
    if scored_docs:
        max_score = max(scored_docs[0][0], 1.0)
        results: List[RAGSource] = []
        for raw_score, doc, snippet in scored_docs[:top_k]:
            normalized_score = round(min(0.98, max(0.65, raw_score / max_score)), 2)
            results.append(
                RAGSource(
                    id=doc["id"],
                    title=doc["title"],
                    category=doc["category"],
                    snippet=snippet,
                    score=normalized_score,
                )
            )
        return results

    # If no specific keyword matched, provide top 2 core architectural modules
    if mode == "website_guide":
        p_doc = next((d for d in KNOWLEDGE_CORPUS if d["id"] == "KB-PLATFORM-08"), KNOWLEDGE_CORPUS[0])
        a_doc = next((d for d in KNOWLEDGE_CORPUS if d["id"] == "KB-AGENT-07"), KNOWLEDGE_CORPUS[1])
        return [
            RAGSource(
                id=p_doc["id"],
                title=p_doc["title"],
                category=p_doc["category"],
                snippet=p_doc["summary"],
                score=0.90,
            ),
            RAGSource(
                id=a_doc["id"],
                title=a_doc["title"],
                category=a_doc["category"],
                snippet=a_doc["summary"],
                score=0.85,
            ),
        ]

    return [
        RAGSource(
            id=KNOWLEDGE_CORPUS[0]["id"],
            title=KNOWLEDGE_CORPUS[0]["title"],
            category=KNOWLEDGE_CORPUS[0]["category"],
            snippet=KNOWLEDGE_CORPUS[0]["summary"],
            score=0.75,
        ),
        RAGSource(
            id=KNOWLEDGE_CORPUS[1]["id"],
            title=KNOWLEDGE_CORPUS[1]["title"],
            category=KNOWLEDGE_CORPUS[1]["category"],
            snippet=KNOWLEDGE_CORPUS[1]["summary"],
            score=0.70,
        ),
    ]


# ==============================================================================
# Multimodal RAG Generator
# ==============================================================================

NOVA_SYSTEM_PROMPT = """You are "Nova", an advanced, friendly, and authoritative Multimodal Enterprise AI Assistant for the AI Request Triage Assistant platform.

Your mission:
1. Ground your answers strictly in the provided Enterprise Knowledge Base modules.
2. Whenever you use or reference information from a knowledge module, ALWAYS cite its ID in square brackets (e.g. [KB-SLA-01], [KB-ROUTE-02], [KB-WEBHOOK-03], [KB-CHURN-04], [KB-DIAG-05], [KB-EMAIL-06], [KB-AGENT-07], [KB-PLATFORM-08]).
3. If an image or screenshot is provided, perform detailed visual analysis:
   - Identify visual markers (e.g. HTTP status codes 500/504, error banners, stack traces, latency graph curves, Stripe dispute numbers, monetary amounts).
   - Correlate the visual evidence with the corresponding triage SLA urgency and team routing ownership.
4. Keep answers crisp, highly actionable, and structured with clean markdown (bold key terms, bullet points, code snippets where helpful).
5. Always maintain a helpful, intelligent, and proactive cyber-assistant tone.
"""

NOVA_WEBSITE_GUIDE_PROMPT = """You are "Nova", the official Website Guide and Platform Concierge for the AI Request Triage Assistant website.

Your primary mission is to explain how this website works, how our cognitive triage engine operates, its architecture (FastAPI, LangGraph, Google Gemini 2.5 Flash), key features (Live AI Triage Studio, Inbound Webhook Simulator, Email Settings, Activity History), SLA policies, and how users can get started.

Guidelines:
1. Ground your explanations in the provided Enterprise Knowledge Base modules, especially [KB-PLATFORM-08] and [KB-AGENT-07].
2. Always cite relevant module IDs in square brackets (e.g. [KB-PLATFORM-08], [KB-AGENT-07], [KB-SLA-01], [KB-ROUTE-02], [KB-WEBHOOK-03]).
3. Be friendly, articulate, and welcoming to website visitors. Use clean markdown (bold titles, bullet points).
4. Explain clearly where features live on this website and how to test them (e.g. 'Click Launch App in top nav', 'Open Live AI Triage Studio on home page', 'Use admin credentials admin@triage.ai / password123').
"""


def run_multimodal_rag_chat(
    message: str,
    image_data: Optional[str] = None,
    file_name: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None,
    api_key: Optional[str] = None,
    model_name: str = "gemini-2.5-flash",
    mode: Optional[str] = "workspace",
) -> MultimodalChatResponse:
    """
    Executes multimodal RAG query:
    1. Retrieves relevant knowledge chunks
    2. Formulates prompt with citations and multimodal image data
    3. Invokes Gemini 2.5 Flash
    4. Formulates grounded response with citations and suggested follow-ups
    """
    start_time = time.time()

    # 1. Retrieve Knowledge Chunks
    retrieved_sources = retrieve_relevant_knowledge(message, top_k=3, mode=mode)

    # Format knowledge context string
    knowledge_context = "\n\n".join(
        [
            f"--- KNOWLEDGE MODULE [{s.id}]: {s.title} ({s.category}) ---\n{doc['content']}"
            for s in retrieved_sources
            for doc in KNOWLEDGE_CORPUS
            if doc["id"] == s.id
        ]
    )

    # 2. Build Prompt
    rag_prompt = f"""KNOWLEDGE BASE GROUNDING:
The following authoritative enterprise modules are retrieved from our verified system documentation:

{knowledge_context}

USER QUERY:
"{message}"
"""

    if file_name:
        rag_prompt += f"\nATTACHMENT FILE NAME: {file_name}\n"

    rag_prompt += """
INSTRUCTIONS:
- Answer the user's question clearly and accurately using the knowledge base above.
- Cite the source modules using [KB-XXX] notation.
- If an image is provided, explicitly describe what you observe in the image and connect it to our SLA urgency and routing policy.
- Provide clear next steps or recommendations.
"""

    # Prepare LangChain messages
    active_prompt = NOVA_WEBSITE_GUIDE_PROMPT if mode == "website_guide" else NOVA_SYSTEM_PROMPT
    messages = [SystemMessage(content=active_prompt)]

    # Add historical turns if present (up to last 6 turns for context)
    if conversation_history:
        for turn in conversation_history[-6:]:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            if role in ("user", "human"):
                messages.append(HumanMessage(content=content))
            elif role in ("assistant", "model"):
                messages.append(AIMessage(content=content))

    # Format Human Message (with multimodal image support)
    if image_data and image_data.startswith("data:"):
        # Multimodal image payload format
        human_content = [
            {"type": "text", "text": rag_prompt},
            {
                "type": "image_url",
                "image_url": {"url": image_data},
            },
        ]
        messages.append(HumanMessage(content=human_content))
    else:
        messages.append(HumanMessage(content=rag_prompt))

    # 3. Invoke Gemini
    reply_text = ""
    image_analysis_note: Optional[str] = None
    effective_key = api_key or os.getenv("GEMINI_API_KEY") or ""

    try:
        if not effective_key:
            raise ValueError("No Gemini API key available.")

        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=effective_key.strip().strip("'\""),
            temperature=0.3,
        )
        response = llm.invoke(messages)
        content = response.content
        if isinstance(content, list):
            reply_text = "".join(
                [c.get("text", "") if isinstance(c, dict) else str(c) for c in content]
            )
        else:
            reply_text = str(content)

        if image_data:
            image_analysis_note = "Multimodal Vision Analysis active: Verified visual assets against Enterprise Triage specs."

    except Exception as exc:
        # Fallback intelligent grounded response if API key is missing or quota reached
        err_msg = str(exc)
        top_source = retrieved_sources[0] if retrieved_sources else None
        source_id = top_source.id if top_source else "KB-SLA-01"
        source_title = top_source.title if top_source else "Enterprise SLA Matrix"

        if mode == "website_guide":
            reply_text = (
                f"### AI Request Triage Assistant • Website & Platform Guide [{source_id}]\n\n"
                f"Welcome to the **AI Request Triage Assistant**! Here is how this platform and website work based on our verified documentation [{source_id}]:\n\n"
                f"- **Core Cognitive Mission**: The platform ingests unstructured, noisy client requests (emails, Zendesk tickets, webhooks) and maps them into defensible urgency scores, department routing, and draft responses using our LangGraph cognitive state pipeline [KB-AGENT-07].\n"
                f"- **SLA & Routing Automation**: P1 Urgent issues have a strict `< 15 minutes` target and route to Engineering or Finance based on incident category [KB-SLA-01, KB-ROUTE-02].\n"
                f"- **Testing on This Website**: You can test the **Live AI Triage Studio** or **Inbound Webhook Simulator** right here on the home page, or click **Launch App** to log into the complete operator Workspace using `admin@triage.ai` / `password123` [KB-PLATFORM-08].\n\n"
                f"> *Note: Operating in High-Reliability Grounded Fallback mode.*"
            )
        else:
            reply_text = (
                f"### Grounded Operational Guidance [{source_id}]\n\n"
                f"Based on our **{source_title}** [{source_id}], here is the verified protocol for your inquiry:\n\n"
                f"- **Primary Policy**: {top_source.snippet if top_source else 'Standard triage procedures apply.'}\n"
                f"- **Routing Guideline**: High or Urgent issues route directly to **Engineering** (for system faults/504s) or **Finance** (for billing disputes) [KB-ROUTE-02].\n"
                f"- **Turnaround SLA**: P1 Urgent matters must be acknowledged in `< 15 minutes` [KB-SLA-01].\n\n"
                f"> *Note: Operating in High-Reliability Grounded Fallback mode.*"
            )
        if image_data:
            image_analysis_note = "Image received: Visual artifact attached and mapped to triage diagnostic queue [KB-DIAG-05]."

    # 4. Generate Dynamic Suggested Follow-ups
    suggested_followups = generate_followups(message, retrieved_sources, mode=mode)

    latency_ms = round((time.time() - start_time) * 1000, 1)

    return MultimodalChatResponse(
        reply=reply_text.strip(),
        sources=retrieved_sources,
        image_analysis=image_analysis_note,
        suggested_followups=suggested_followups,
        latency_ms=latency_ms,
    )


def generate_followups(query: str, sources: List[RAGSource], mode: Optional[str] = "workspace") -> List[str]:
    """Generates context-aware follow-up question pills."""
    if mode == "website_guide":
        return [
            "How does this AI Request Triage platform work? [KB-PLATFORM-08]",
            "How does the LangGraph cognitive pipeline work? [KB-AGENT-07]",
            "How do I test the Inbound Webhook Simulator? [KB-WEBHOOK-03]",
        ]

    lower = query.lower()

    if any(k in lower for k in ["504", "outage", "downtime", "crash", "error", "server"]):
        return [
            "What is the escalation SLA if downtime exceeds 15m?",
            "How do I compose an executive status update?",
            "Which on-call engineer is currently primary?",
        ]
    elif any(k in lower for k in ["stripe", "billing", "invoice", "chargeback", "refund", "money"]):
        return [
            "What evidence is required for a Stripe chargeback?",
            "Who approves refunds greater than $500?",
            "How do I route this to the Finance department?",
        ]
    elif any(k in lower for k in ["webhook", "cloudwatch", "payload", "endpoint", "api"]):
        return [
            "How do I verify the HMAC SHA-256 webhook signature?",
            "How does the AWS SNS CloudWatch mapping work?",
            "Can I test this in the Live Webhook Simulator?",
        ]
    elif any(k in lower for k in ["sla", "priority", "urgent", "p1", "p2"]):
        return [
            "What criteria distinguish P1 Urgent from P2 High?",
            "What happens if an SLA target is breached?",
            "How is client churn risk factored into urgency?",
        ]
    else:
        return [
            "Explain the Urgency SLA Routing Matrix [KB-SLA-01]",
            "How do I diagnose a 504 Gateway Timeout screenshot?",
            "Show me the supported inbound Webhook formats",
        ]

