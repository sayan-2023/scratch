import os
import time
from typing import Optional, TypedDict
from pathlib import Path
from dotenv import load_dotenv

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END

from app.models import (
    CategoryEnum,
    PriorityEnum,
    OwnerEnum,
    TriageAnalysis,
    TriageOutput,
    GeneratedSamplePromptSchema,
    SampleRequest,
)

# Explicitly load .env from backend/ and root directories
_agent_dir = Path(__file__).resolve().parent.parent
load_dotenv(_agent_dir / ".env")
load_dotenv(_agent_dir.parent / ".env")
load_dotenv()


class TriageState(TypedDict):
    """Internal state dictionary passed between LangGraph nodes."""
    request_text: str
    api_key: Optional[str]
    model_name: str
    summary: Optional[str]
    category: Optional[CategoryEnum]
    priority: Optional[PriorityEnum]
    priority_reason: Optional[str]
    assigned_owner: Optional[OwnerEnum]
    draft_response: Optional[str]
    error: Optional[str]


def get_llm(api_key: Optional[str] = None, model_name: str = "gemini-2.5-flash"):
    """Instantiate Google Gemini Chat model."""
    raw_key = api_key or os.getenv("GEMINI_API_KEY") or ""
    effective_key = raw_key.strip().strip("'\"").strip()
    if not effective_key:
        raise ValueError(
            "Google Gemini API key not found. Please provide it in the UI or set GEMINI_API_KEY in the environment."
        )
    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=effective_key,
        temperature=0.2,
    )


# ==============================================================================
# Node 1: Classify & Analyze Request
# ==============================================================================

CLASSIFIER_PROMPT = """You are an expert executive triage assistant for a professional services company.
Analyze the incoming client message thoroughly and extract structured information according to strict business guidelines.

Categories:
- "Sales": Inquiries about pricing, new enterprise plans, sales demos, upgrading seats, contract expansions.
- "Support": General product assistance, onboarding, account configuration, how-to questions, user setup.
- "Billing": Invoices, erroneous charges, pricing disputes, payment methods, credit memos, tax receipts.
- "Technical": Software downtime, outages, 500/504 errors, API bugs, authentication/SSO failures, security issues.
- "Other": General messages that do not belong to any of the above categories.

Priorities & Guidelines:
- "Urgent": Complete service outage, mission-critical operations blocked for users, severe security risk, or imminent threat of contract cancellation.
- "High": Significant monetary/invoice discrepancy, blocking issue affecting a key user/team, or tight business deadlines.
- "Medium": Standard feature inquiries, scheduled sales meetings, moderate business questions.
- "Low": Informational requests, how-to documentation, minor questions with no urgent deadline.

Routing Owners:
- "Engineering": Outages, server crashes, system bugs, technical integrations, infrastructure.
- "Finance": Invoices, overcharges, payment processing, billing discrepancies.
- "Sales Team": Enterprise pricing, sales demos, new prospect evaluations, contract upsells.
- "Client Success": Account onboarding, training, user retention, support questions, escalations.

Provide a concise 1-2 sentence summary, select the exact category, priority with a clear justification reason, and assigned owner.
"""


def classify_and_analyze_node(state: TriageState) -> dict:
    """LangGraph node: Analyzes the unstructured message into structured triage fields."""
    request_text = state["request_text"]
    api_key = state.get("api_key")
    model_name = state.get("model_name", "gemini-2.5-flash")

    llm = get_llm(api_key=api_key, model_name=model_name)
    structured_llm = llm.with_structured_output(TriageAnalysis)

    messages = [
        SystemMessage(content=CLASSIFIER_PROMPT),
        HumanMessage(content=f"Client Message:\n\"\"\"\n{request_text}\n\"\"\""),
    ]

    analysis: TriageAnalysis = structured_llm.invoke(messages)

    return {
        "summary": analysis.summary,
        "category": analysis.category,
        "priority": analysis.priority,
        "priority_reason": analysis.priority_reason,
        "assigned_owner": analysis.assigned_owner,
    }


# ==============================================================================
# Node 2: Draft Professional Response
# ==============================================================================

DRAFT_PROMPT = """You are a communications specialist writing a first response to a client on behalf of a professional services firm.
Your drafted response will be reviewed and sent by a team member.

Client Message:
\"\"\"{request_text}\"\"\"

Triage Assessment:
- Summary: {summary}
- Category: {category}
- Priority: {priority} (Reason: {priority_reason})
- Assigned Team: {assigned_owner}

Requirements for the drafted response:
1. Professional, empathetic, and reassuring tone.
2. Acknowledge the client's specific problem or request directly.
3. If urgent or high priority, assure them of prompt escalation to the {assigned_owner}.
4. Outline clear next steps (e.g. who is handling it, when they should expect a detailed update).
5. Include polite greeting and professional closing placeholders (e.g., [Your Name] / [Company Support Team]).
6. Keep it concise, natural, and ready for review and transmission.
"""


def draft_response_node(state: TriageState) -> dict:
    """LangGraph node: Drafts a context-aware professional initial response."""
    request_text = state["request_text"]
    api_key = state.get("api_key")
    model_name = state.get("model_name", "gemini-2.5-flash")

    llm = get_llm(api_key=api_key, model_name=model_name)

    prompt = DRAFT_PROMPT.format(
        request_text=request_text,
        summary=state.get("summary", "Client inquiry"),
        category=state.get("category", "General"),
        priority=state.get("priority", "Medium"),
        priority_reason=state.get("priority_reason", "Standard request"),
        assigned_owner=state.get("assigned_owner", "Support Team"),
    )

    response = llm.invoke([HumanMessage(content=prompt)])
    content = response.content
    if isinstance(content, list):
        content = "".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in content])

    return {"draft_response": str(content).strip()}


# ==============================================================================
# Build & Compile LangGraph StateMachine
# ==============================================================================

def create_triage_graph():
    """Constructs the executable LangGraph workflow."""
    workflow = StateGraph(TriageState)

    # Add Nodes
    workflow.add_node("classify_and_analyze", classify_and_analyze_node)
    workflow.add_node("draft_response", draft_response_node)

    # Add Edges (START -> Node 1 -> Node 2 -> END)
    workflow.add_edge(START, "classify_and_analyze")
    workflow.add_edge("classify_and_analyze", "draft_response")
    workflow.add_edge("draft_response", END)

    return workflow.compile()


# Singleton compiled graph
triage_app = create_triage_graph()


def run_triage(
    request_text: str,
    api_key: Optional[str] = None,
    model_name: str = "gemini-2.5-flash",
) -> TriageOutput:
    """Executes the complete LangGraph triage agent pipeline."""
    start_time = time.time()

    initial_state: TriageState = {
        "request_text": request_text,
        "api_key": api_key,
        "model_name": model_name,
        "summary": None,
        "category": None,
        "priority": None,
        "priority_reason": None,
        "assigned_owner": None,
        "draft_response": None,
        "error": None,
    }

    # Execute state graph
    final_state = triage_app.invoke(initial_state)

    duration_ms = round((time.time() - start_time) * 1000, 2)

    return TriageOutput(
        summary=final_state["summary"],
        category=final_state["category"],
        priority=final_state["priority"],
        priority_reason=final_state["priority_reason"],
        assigned_owner=final_state["assigned_owner"],
        draft_response=final_state["draft_response"],
        processing_time_ms=duration_ms,
    )


def generate_dynamic_scenario(
    category: Optional[CategoryEnum] = None,
    priority: Optional[PriorityEnum] = None,
    industry: Optional[str] = None,
    api_key: Optional[str] = None,
    model_name: str = "gemini-2.5-flash",
) -> SampleRequest:
    """Uses Gemini structured output to dynamically synthesize an authentic customer request scenario."""
    import uuid
    import random

    llm = get_llm(api_key=api_key, model_name=model_name)
    structured_llm = llm.with_structured_output(GeneratedSamplePromptSchema)

    industries = [
        "FinTech & Banking",
        "Healthcare & Telehealth",
        "E-Commerce & Retail Logistics",
        "Enterprise Cloud & DevOps",
        "LegalTech & Contract Management",
        "Cybersecurity & Threat Detection",
    ]
    chosen_industry = industry or random.choice(industries)

    target_category_str = (
        f"Target Category: {category.value}"
        if category
        else "Choose an authentic category (Sales, Support, Billing, Technical, or Other)"
    )
    target_priority_str = (
        f"Target Urgency: {priority.value}"
        if priority
        else "Choose an appropriate urgency level (Urgent, High, Medium, or Low)"
    )

    prompt = f"""You are a realistic customer inquiry simulator for enterprise business software.
Generate an authentic, unstructured incoming customer communication.

Industry Context: {chosen_industry}
{target_category_str}
{target_priority_str}

Guidelines:
- The inquiry should sound natural, slightly messy, and specific to the industry and situation.
- Include realistic specifics: timestamps, ticket or invoice numbers, impacted users, dollar figures, or emotional urgency where appropriate.
- Origin channel should be authentic (e.g. 'Email (billing@)', 'Live Chat / Emergency Helpdesk', 'Inbound Sales Contact Form', 'Customer Support Portal').
- Sender should look real: 'Full Name (Title, Company Name)'.
- The expected_category and expected_priority must accurately reflect the generated scenario.
"""

    messages = [
        SystemMessage(content=prompt),
        HumanMessage(content="Generate a fresh, realistic scenario preset now."),
    ]

    result: GeneratedSamplePromptSchema = structured_llm.invoke(messages)

    return SampleRequest(
        id=f"ai-{uuid.uuid4().hex[:6]}",
        title=result.title,
        channel=result.channel,
        sender=result.sender,
        text=result.text,
        expected_category=result.expected_category,
        expected_priority=result.expected_priority,
        is_custom=True,
    )


