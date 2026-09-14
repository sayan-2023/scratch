import os
import logging
from typing import List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

import uuid
import random
import json
import base64
from datetime import datetime

from app.models import (
    TriageInput,
    TriageOutput,
    SampleRequest,
    SampleCreateInput,
    GenerateSampleInput,
    InboxMessage,
    WebhookIngestInput,
    InboxSimulationRequest,
    SendEmailRequest,
    SendEmailResponse,
    TestEmailAccountRequest,
    TestEmailAccountResponse,
    EmailAccount,
    UserPublic,
    LoginRequest,
    RegisterRequest,
    GoogleAuthRequest,
    VerifyGoogleCredentialsRequest,
    ForgotPasswordRequest,
    VerifyResetCodeRequest,
    ResetPasswordRequest,
    AuthResponse,
    SaveEmailConfigRequest,
    UserHistoryItem,
    SaveHistoryRequest,
    EnhanceTextInput,
    EnhanceTextOutput,
    ToneDraftInput,
    ToneDraftOutput,
    SwarmOrchestrateInput,
    SwarmOrchestrateOutput,
    MultimodalChatRequest,
    MultimodalChatResponse,
    KnowledgeBaseDocument,
    SpeechCorrectionRequest,
    SpeechCorrectionResponse,
)
from app.speech_service import correct_and_rewrite_speech_query
from app.rag_service import (
    run_multimodal_rag_chat,
    get_knowledge_base_documents,
)
from app.mock_data import (
    MOCK_REQUESTS,
    get_all_samples,
    get_sample_by_id,
    create_sample,
    add_sample,
    delete_sample,
    reset_samples_to_default,
    get_all_inbox_messages,
    add_inbox_message,
    update_inbox_message,
    delete_inbox_message,
    clear_inbox_messages,
)
from app.agent import (
    run_triage,
    generate_dynamic_scenario,
    enhance_and_anonymize_text,
    generate_tone_draft,
    orchestrate_swarm,
)
from app.email_service import (
    send_email_message,
    test_gmail_smtp,
    get_env_accounts,
    save_stored_email_accounts,
)
from app.auth_service import (
    authenticate_user,
    register_user,
    authenticate_google_user,
    verify_google_credentials,
    generate_reset_code,
    verify_reset_code,
    verify_and_reset_password,
    get_user_history,
    save_user_history_item,
    clear_user_history,
    send_login_notification_email,
    send_welcome_email,
    send_password_reset_email,
    send_password_changed_email,
    get_user_by_email_or_id,
)

from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(_backend_dir / ".env")
load_dotenv(_backend_dir.parent / ".env")
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("triage_backend")

app = FastAPI(
    title="AI Request Triage Assistant API",
    description="Backend service utilizing FastAPI, LangGraph, and Google Gemini to triage client requests.",
    version="1.0.0",
)

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint indicating service availability and API key configuration status."""
    has_env_key = bool((os.getenv("GEMINI_API_KEY") or "").strip().strip("'\"").strip())
    return {
        "status": "healthy",
        "service": "AI Request Triage Assistant",
        "has_configured_api_key": has_env_key,
    }


@app.get("/api/samples", response_model=List[SampleRequest], tags=["Samples"])
def get_sample_requests():
    """Returns curated mock requests for quick 1-click testing in the UI."""
    return get_all_samples()


@app.post("/api/samples", response_model=SampleRequest, status_code=status.HTTP_201_CREATED, tags=["Samples"])
def create_custom_sample(payload: SampleCreateInput):
    """Creates and persists a new custom preset scenario."""
    return create_sample(payload)


@app.delete("/api/samples/{sample_id}", tags=["Samples"])
def remove_sample_endpoint(sample_id: str):
    """Deletes a sample preset by ID."""
    success = delete_sample(sample_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample preset with ID '{sample_id}' not found."
        )
    return {"status": "deleted", "id": sample_id}


@app.post("/api/samples/reset", response_model=List[SampleRequest], tags=["Samples"])
def reset_samples_endpoint():
    """Resets the presets back to the original 5 default enterprise scenarios."""
    return reset_samples_to_default()


@app.post("/api/samples/generate", response_model=SampleRequest, tags=["Samples"])
def generate_sample_endpoint(payload: GenerateSampleInput):
    """Uses Google Gemini structured output to dynamically generate a new authentic scenario."""
    try:
        sample = generate_dynamic_scenario(
            category=payload.category,
            priority=payload.priority,
            industry=payload.industry,
            api_key=payload.api_key,
        )
        # Automatically persist it so it shows in the UI presets immediately
        add_sample(sample)
        return sample
    except ValueError as val_err:
        logger.warning(f"Configuration or validation error during scenario generation: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        logger.error(f"Failed to generate dynamic scenario: {exc}", exc_info=True)
        err_msg = str(exc)
        if "API_KEY_INVALID" in err_msg or "403" in err_msg:
            detail = "The provided Gemini API key appears invalid or expired."
        elif "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
            detail = "Gemini API rate limit exceeded. Please wait a moment."
        else:
            detail = f"Failed to generate scenario: {err_msg}"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )


# ==============================================================================
# Inbound Live Feed & Webhook Ingestion Endpoints (Scenario C)
# ==============================================================================

@app.get("/api/inbox", response_model=List[InboxMessage], tags=["Inbox & Webhooks"])
def list_inbox_messages():
    """Returns all inbound webhook and live customer inquiries."""
    return get_all_inbox_messages()


@app.post("/api/inbox/webhook", response_model=InboxMessage, tags=["Inbox & Webhooks"])
def ingest_webhook_message(payload: WebhookIngestInput):
    """Ingests an external webhook event or customer inquiry."""
    msg_id = f"wh-{uuid.uuid4().hex[:6]}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    triage_result = None
    status_val = "pending"
    if payload.auto_triage:
        try:
            triage_result = run_triage(
                request_text=payload.body,
                api_key=payload.api_key,
            )
            status_val = "triaged"
        except Exception as exc:
            logger.warning(f"Auto-triage during webhook ingestion failed: {exc}")

    msg = InboxMessage(
        id=msg_id,
        source=payload.source,
        sender=payload.sender,
        channel=payload.channel or "Webhook",
        subject=payload.subject,
        body=payload.body,
        timestamp=now_str,
        status=status_val,
        triage_result=triage_result,
    )
    return add_inbox_message(msg)


@app.post("/api/inbox/simulate", response_model=InboxMessage, tags=["Inbox & Webhooks"])
def simulate_inbound_event(payload: InboxSimulationRequest):
    """Injects a realistic simulated webhook event (Stripe dispute, Zendesk ticket, etc.)."""
    simulations = {
        "stripe_chargeback": {
            "source": "Stripe Webhook",
            "sender": "notifications@stripe.com (re: Dispute dp_9104)",
            "channel": "Payment Webhook",
            "subject": "Chargeback Warning: Account Disputed $3,800.00",
            "body": (
                "Notification from Stripe: Dispute dp_9104 has been raised by cardholder for $3,800.00. "
                "Reason: Unrecognized transaction. Please provide invoice proof and service fulfillment logs "
                "before Friday 5:00 PM EST to prevent automatic forfeiture."
            ),
        },
        "zendesk_outage": {
            "source": "Zendesk P1 Ticket",
            "sender": "Kavita Raman (Director of Engineering, AlphaCloud)",
            "channel": "Support Webhook",
            "subject": "[P1-INCIDENT] Database Connection Pool Exhaustion",
            "body": (
                "CRITICAL ALERT: Our integration service is receiving HTTP 500 across all endpoints. "
                "Your database connection pool appears exhausted after your 2:00 PM deployment. "
                "Our automated test suites are failing and production ingest is backed up by 50,000 events."
            ),
        },
        "contact_form": {
            "source": "Website Contact Form",
            "sender": "Brian Kelly (VP Technology, Vanguard Retail)",
            "channel": "Website Form",
            "subject": "Enterprise Evaluation & Custom Architecture Review",
            "body": (
                "Hi, We are looking to replace our legacy customer triage system with an LLM-powered solution. "
                "We handle roughly 8,000 customer inquiries per day. Could we set up a discovery call with your "
                "solutions engineering team this Thursday or Friday?"
            ),
        },
        "security_inquiry": {
            "source": "Security Portal",
            "sender": "Liam O'Connor (InfoSec Compliance, Global Logistics)",
            "channel": "Security Portal",
            "subject": "Vendor Security Assessment Questionnaire (SOC-2 Type II)",
            "body": (
                "Good day, We are conducting our annual third-party risk assessment. Please provide your latest "
                "SOC-2 Type II report, pentest summary from the past 12 months, and details regarding your data "
                "encryption at rest and in transit."
            ),
        },
    }

    selected = payload.scenario_type
    if selected == "random" or selected not in simulations:
        selected = random.choice(list(simulations.keys()))

    data = simulations[selected]
    msg_id = f"sim-{uuid.uuid4().hex[:6]}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    triage_result = None
    status_val = "pending"
    if payload.auto_triage:
        try:
            triage_result = run_triage(
                request_text=data["body"],
                api_key=payload.api_key,
            )
            status_val = "triaged"
        except Exception as exc:
            logger.warning(f"Auto-triage during simulation failed: {exc}")

    msg = InboxMessage(
        id=msg_id,
        source=data["source"],
        sender=data["sender"],
        channel=data["channel"],
        subject=data["subject"],
        body=data["body"],
        timestamp=now_str,
        status=status_val,
        triage_result=triage_result,
    )
    return add_inbox_message(msg)


@app.delete("/api/inbox/{item_id}", tags=["Inbox & Webhooks"])
def delete_inbox_item(item_id: str):
    """Deletes a message from the inbound queue."""
    if not delete_inbox_message(item_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inbox message not found")
    return {"status": "deleted", "id": item_id}


@app.delete("/api/inbox", tags=["Inbox & Webhooks"])
def clear_all_inbox():
    """Clears all messages from the inbound inbox queue."""
    clear_inbox_messages()
    return {"status": "cleared"}



@app.post("/api/triage", response_model=TriageOutput, tags=["Triage"])
def triage_request(payload: TriageInput):
    """Processes an unstructured client request using the LangGraph AI triage agent."""
    if not payload.request_text or len(payload.request_text.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request text must be at least 5 characters long."
        )

    try:
        result = run_triage(
            request_text=payload.request_text.strip(),
            api_key=payload.api_key.strip() if payload.api_key else None,
        )
        return result
    except ValueError as val_err:
        logger.warning(f"Configuration or validation error: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        logger.error(f"Error during triage pipeline: {exc}", exc_info=True)
        # Check for common Gemini quota / auth error strings
        err_msg = str(exc)
        if "API_KEY_INVALID" in err_msg or "403" in err_msg:
            detail = "The provided Gemini API key appears invalid or expired. Please check your key at https://aistudio.google.com/app/apikey"
        elif "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
            detail = "Gemini API rate limit exceeded. Please wait a moment or use another free API key."
        else:
            detail = f"AI Triage error: {err_msg}"

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )


@app.post("/api/ai/enhance-text", response_model=EnhanceTextOutput, tags=["AI Capabilities"])
def enhance_text_endpoint(payload: EnhanceTextInput):
    """
    Advanced AI endpoint:
    Detects and scrubs sensitive PII (credit cards, SSNs, secrets, phone numbers)
    and uses Gemini to restructure the inquiry into an executive-grade incident briefing.
    """
    if not payload.text or len(payload.text.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text must be at least 5 characters long."
        )
    try:
        return enhance_and_anonymize_text(
            text=payload.text.strip(),
            api_key=payload.api_key.strip() if payload.api_key else None,
        )
    except Exception as exc:
        logger.error(f"Error in enhance_text_endpoint: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enhance text: {exc}"
        )


@app.post("/api/ai/tone-draft", response_model=ToneDraftOutput, tags=["AI Capabilities"])
def tone_draft_endpoint(payload: ToneDraftInput):
    """
    Advanced AI endpoint:
    Synthesizes a response draft tailored to a specific audience tone
    (empathetic, executive, concise).
    """
    if not payload.request_text or len(payload.request_text.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request text must be at least 5 characters long."
        )
    try:
        return generate_tone_draft(
            request_text=payload.request_text.strip(),
            tone=payload.tone,
            summary=payload.summary,
            assigned_owner=payload.assigned_owner,
            priority=payload.priority,
            api_key=payload.api_key.strip() if payload.api_key else None,
        )
    except Exception as exc:
        logger.error(f"Error in tone_draft_endpoint: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate tone draft: {exc}"
        )


@app.post("/api/ai/swarm-orchestrate", response_model=SwarmOrchestrateOutput, tags=["AI Capabilities"])
def swarm_orchestrate_endpoint(payload: SwarmOrchestrateInput):
    """
    Nova Autonomous Multi-Agent Swarm Orchestrator:
    Executes collaborative 4-agent LangGraph workflow with Gemini GenAI:
    1. Triage & Categorization Engine (Urgency, Sentiment, Churn Risk)
    2. Security & PII Sanitizer (Scans credentials, tokens, PII)
    3. LangGraph Cognitive Router (Department dispatch & SLA timeline)
    4. Gemini 2.5 Multi-Agent Synthesis (Executive tailored resolution drafting)
    """
    if not payload.text or len(payload.text.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incident or inquiry text must be at least 5 characters long."
        )

    try:
        return orchestrate_swarm(
            text=payload.text.strip(),
            scenario_title=payload.scenario_title,
            api_key=payload.api_key.strip() if payload.api_key else None,
        )
    except Exception as exc:
        logger.error(f"Error in swarm_orchestrate_endpoint: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Swarm orchestration failed: {exc}"
        )


@app.post("/api/send-email", response_model=SendEmailResponse, tags=["Email"])
def send_email_endpoint(payload: SendEmailRequest):
    """
    Transmits an approved triage response to client recipients via Gmail SMTP.
    Supports multi-account routing, custom recipient lists, and simulation mode.
    """
    try:
        response = send_email_message(payload)
        return response
    except ValueError as val_err:
        logger.warning(f"Email delivery validation error: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        logger.error(f"Unexpected email delivery failure: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transmit email: {str(exc)}",
        )


@app.post("/api/email/test", response_model=TestEmailAccountResponse, tags=["Email"])
def test_email_endpoint(payload: TestEmailAccountRequest):
    """Verifies Gmail SMTP connectivity and App Password credentials."""
    result = test_gmail_smtp(email=payload.email, app_password=payload.app_password)
    return TestEmailAccountResponse(
        success=result["success"],
        message=result["message"],
        details=result.get("details"),
    )


@app.get("/api/email/config", tags=["Email"])
def get_email_config():
    """Returns any pre-configured server Gmail accounts with masked passwords."""
    env_accounts = get_env_accounts()
    safe_accounts = []
    for acc in env_accounts:
        safe_accounts.append({
            "email": acc.email,
            "department": acc.department,
            "display_name": acc.display_name,
            "is_default": acc.is_default,
            "has_app_password": bool(acc.app_password),
        })
    return {"configured_accounts": safe_accounts}


@app.post("/api/email/config", tags=["Email"])
def save_email_config_endpoint(payload: SaveEmailConfigRequest):
    """Persists server-side configured Gmail dispatcher accounts."""
    save_stored_email_accounts(payload.accounts)
    return {
        "success": True,
        "message": f"Successfully saved {len(payload.accounts)} Gmail accounts to server storage.",
        "configured_accounts": [
            {
                "email": acc.email,
                "department": acc.department,
                "display_name": acc.display_name,
                "is_default": acc.is_default,
                "has_app_password": bool(acc.app_password),
            }
            for acc in payload.accounts
        ],
    }


# ==============================================================================
# Authentication & User Management Endpoints
# ==============================================================================

@app.post("/api/auth/login", response_model=AuthResponse, tags=["Authentication"])
def login_endpoint(payload: LoginRequest):
    """Authenticates credentials, generates session token, and dispatches login security email."""
    user = authenticate_user(payload.email_or_username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/user ID or password. Please check your credentials.",
        )

    # Dispatch security notification email
    email_status = send_login_notification_email(user.email, user.name, "Password")

    token = f"tok-{uuid.uuid4().hex}"
    public_user = UserPublic(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
    )
    return AuthResponse(
        success=True,
        token=token,
        user=public_user,
        message=f"Welcome back, {user.name}! A security confirmation has been dispatched to {user.email}.",
        is_new_user=False,
        email_status=email_status,
    )


@app.post("/api/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
def register_endpoint(payload: RegisterRequest):
    """Creates a new account, generates session token, and dispatches welcome email."""
    try:
        user = register_user(payload.name, payload.email, payload.password)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )

    # Persist accounts if client provided them
    if payload.accounts:
        save_stored_email_accounts(payload.accounts)

    # Send dedicated Welcome Email to new user
    email_status = send_welcome_email(
        user_email=user.email,
        user_name=user.name,
        signup_method="Email & Password",
        accounts=payload.accounts,
    )

    token = f"tok-{uuid.uuid4().hex}"
    public_user = UserPublic(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
    )
    email_note = f" Welcome email dispatched to {user.email}." if email_status.get("success") else ""
    return AuthResponse(
        success=True,
        token=token,
        user=public_user,
        message=f"Account created successfully! Welcome to AI Request Triage, {user.name}.{email_note}",
        is_new_user=True,
        email_status=email_status,
    )


def _extract_google_claims(id_token: Optional[str]) -> dict:
    """Safely extracts claims from Google OAuth JWT ID token if provided."""
    if not id_token or not isinstance(id_token, str):
        return {}
    try:
        parts = id_token.split(".")
        if len(parts) >= 2:
            import base64
            padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
            raw = base64.urlsafe_b64decode(padded.encode("utf-8"))
            return json.loads(raw.decode("utf-8"))
    except Exception:
        pass
    return {}


@app.get("/api/auth/google/config", tags=["Authentication"])
def google_auth_config_endpoint():
    """Returns Google OAuth public configuration and client status."""
    google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    return {
        "success": True,
        "client_id": google_client_id,
        "auth_uri": "https://accounts.google.com/o/oauth2/v2/auth",
        "scopes": ["openid", "email", "profile"],
        "has_cloud_client_id": bool(google_client_id),
        "mode": "hybrid",
    }


@app.post("/api/auth/google/verify-credentials", tags=["Authentication"])
def verify_google_credentials_endpoint(payload: VerifyGoogleCredentialsRequest):
    """Verifies Google Account password against account records."""
    is_valid, error_msg, user = verify_google_credentials(payload.email, payload.password)
    if not is_valid:
        return {
            "valid": False,
            "detail": error_msg or "Wrong password. Try again or click Forgot password to reset it.",
            "is_new": user is None,
        }
    return {
        "valid": True,
        "detail": "Credentials verified successfully.",
        "is_new": user is None,
        "name": user.name if user else None,
        "email": payload.email.strip().lower(),
    }


@app.post("/api/auth/google", response_model=AuthResponse, tags=["Authentication"])
def google_auth_endpoint(payload: GoogleAuthRequest):
    """Authenticates via Google OAuth / Gmail sign-in with automatic account resolution and welcome email."""
    # Persist accounts if client provided them
    if payload.accounts:
        save_stored_email_accounts(payload.accounts)

    # If id_token passed, attempt decoding claims
    claims = _extract_google_claims(payload.id_token)

    resolved_email = (payload.email or claims.get("email") or "").strip().lower()
    resolved_name = (payload.name or claims.get("name") or resolved_email.split("@")[0]).strip()
    resolved_avatar = payload.avatar_url or claims.get("picture")
    resolved_google_id = payload.google_id or claims.get("sub")

    if not resolved_email or "@" not in resolved_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid Google / Gmail address is required for Google OAuth.",
        )

    try:
        user, is_new = authenticate_google_user(
            email=resolved_email,
            name=resolved_name,
            avatar_url=resolved_avatar,
            google_id=resolved_google_id,
            password=payload.password,
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(val_err),
        )

    if is_new:
        # First-time user signup with OAuth: send rich welcome email!
        email_status = send_welcome_email(
            user_email=user.email,
            user_name=user.name,
            signup_method="Google OAuth",
            accounts=payload.accounts,
        )
        msg = f"Signed up via Google as {user.name} ({user.email}). Welcome email dispatched to your inbox!"
    else:
        # Returning user login: send login security notice
        email_status = send_login_notification_email(
            user_email=user.email,
            user_name=user.name,
            auth_method="Google OAuth",
            accounts=payload.accounts,
        )
        msg = f"Signed in via Google as {user.name} ({user.email})."

    token = f"tok-g-{uuid.uuid4().hex}"
    public_user = UserPublic(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
    )
    return AuthResponse(
        success=True,
        token=token,
        user=public_user,
        message=msg,
        is_new_user=is_new,
        email_status=email_status,
    )


@app.post("/api/auth/forgot-password", tags=["Authentication"])
def forgot_password_endpoint(payload: ForgotPasswordRequest):
    """Generates a 6-digit verification code and emails it to the user."""
    try:
        user = get_user_by_email_or_id(payload.email)
        code = generate_reset_code(payload.email)
        email_status = None
        if user:
            email_status = send_password_reset_email(user.email, user.name, code, payload.accounts)
        return {
            "success": True,
            "message": f"A 6-digit verification code has been dispatched to {payload.email}.",
            "email_status": email_status,
        }
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err),
        )


@app.post("/api/auth/verify-code", tags=["Authentication"])
def verify_code_endpoint(payload: VerifyResetCodeRequest):
    """Verifies that the provided 6-digit verification code is valid for the email account."""
    try:
        verify_reset_code(payload.email, payload.reset_code)
        return {
            "success": True,
            "message": "Verification code confirmed successfully! You may now enter your new password.",
        }
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )


@app.post("/api/auth/reset-password", tags=["Authentication"])
def reset_password_endpoint(payload: ResetPasswordRequest):
    """Verifies reset code and updates account password, then dispatches a congratulatory confirmation email."""
    try:
        user = get_user_by_email_or_id(payload.email)
        success = verify_and_reset_password(payload.email, payload.reset_code, payload.new_password)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to reset password. Please verify your email and code.",
            )

        email_status = None
        if user:
            email_status = send_password_changed_email(user.email, user.name, payload.accounts)

        return {
            "success": True,
            "message": "Congratulations! Your new password has been successfully set. A confirmation email has been dispatched.",
            "email_status": email_status,
        }
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )


# ==============================================================================
# Persistent Session History Endpoints (Cross-Session)
# ==============================================================================

@app.get("/api/history", response_model=List[UserHistoryItem], tags=["Session History"])
def get_history_endpoint(user_id: str = "usr-admin-01"):
    """Retrieves all past triage session activity for the user, persistent across logouts."""
    return get_user_history(user_id)


@app.post("/api/history", response_model=UserHistoryItem, status_code=status.HTTP_201_CREATED, tags=["Session History"])
def save_history_endpoint(payload: SaveHistoryRequest, user_id: str = "usr-admin-01"):
    """Appends a completed triage execution to the user's permanent history store."""
    return save_user_history_item(user_id, payload.text, payload.result)


@app.delete("/api/history", tags=["Session History"])
def clear_history_endpoint(user_id: str = "usr-admin-01"):
    """Clears triage session history for the specified user."""
    clear_user_history(user_id)
    return {"status": "cleared", "user_id": user_id}


# ==============================================================================
# Multimodal RAG Chatbot Endpoints
# ==============================================================================

@app.post("/api/chat/multimodal-rag", response_model=MultimodalChatResponse, tags=["Multimodal RAG Chatbot"])
def chat_multimodal_rag_endpoint(payload: MultimodalChatRequest):
    """
    Submits a multimodal inquiry (text prompt + optional image/document data) to Nova.
    Retrieves grounded enterprise knowledge modules and synthesizes an authoritative response with citations.
    """
    try:
        response = run_multimodal_rag_chat(
            message=payload.message,
            image_data=payload.image_data,
            file_name=payload.file_name,
            conversation_history=payload.conversation_history,
            api_key=payload.api_key,
            mode=payload.mode,
        )
        return response
    except Exception as err:
        logger.error(f"Error in multimodal RAG chat endpoint: {err}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multimodal RAG processing failed: {str(err)}",
        )


@app.get("/api/chat/knowledge-base", response_model=List[KnowledgeBaseDocument], tags=["Multimodal RAG Chatbot"])
def get_knowledge_base_endpoint():
    """
    Returns the indexed enterprise operational knowledge base modules for inspection and transparency.
    """
    return get_knowledge_base_documents()


# ==============================================================================
# Speech Recognition & Query Auto-Correction Endpoints
# ==============================================================================

@app.post("/api/ai/correct-speech-query", response_model=SpeechCorrectionResponse, tags=["AI Speech & Enhancements"])
def correct_speech_query_endpoint(payload: SpeechCorrectionRequest):
    """
    Auto-corrects grammar, spelling mistakes, phonetic recognition slips, and domain terminology
    from raw microphone speech input and rewrites it into a clean, well-formatted query.
    """
    try:
        result = correct_and_rewrite_speech_query(
            text=payload.text,
            api_key=payload.api_key,
            context=payload.context,
        )
        return result
    except Exception as exc:
        logger.error(f"Error in speech query correction endpoint: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech query auto-correction failed: {str(exc)}",
        )




# ==============================================================================
# Production Static SPA Frontend Serving
# ==============================================================================

_candidate_dist_paths = [
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
    Path("/app/frontend/dist"),
    Path(__file__).resolve().parent.parent / "dist",
]

_frontend_dist = next((p for p in _candidate_dist_paths if p.is_dir()), None)

if _frontend_dist:
    logger.info(f"Mounting production frontend build from: {_frontend_dist}")
    _assets_dir = _frontend_dist / "assets"
    if _assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(_assets_dir)), name="assets")

    @app.get("/oauth-google.html", include_in_schema=False)
    def serve_oauth_popup():
        popup_file = _frontend_dist / "oauth-google.html"
        if popup_file.is_file():
            return FileResponse(popup_file)
        raise HTTPException(status_code=404, detail="OAuth popup template not found")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        if (
            full_path.startswith("api/")
            or full_path.startswith("docs")
            or full_path.startswith("openapi.json")
            or full_path == "health"
        ):
            raise HTTPException(status_code=404, detail="Endpoint not found")

        target_file = _frontend_dist / full_path
        if target_file.is_file():
            return FileResponse(target_file)

        index_file = _frontend_dist / "index.html"
        if index_file.is_file():
            return FileResponse(index_file)

        raise HTTPException(status_code=404, detail="Frontend index.html not found")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)


