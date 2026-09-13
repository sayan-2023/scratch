import os
import logging
from typing import List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.models import (
    TriageInput,
    TriageOutput,
    SampleRequest,
    SendEmailRequest,
    SendEmailResponse,
    TestEmailAccountRequest,
    TestEmailAccountResponse,
    EmailAccount,
)
from app.mock_data import MOCK_REQUESTS
from app.agent import run_triage
from app.email_service import (
    send_email_message,
    test_gmail_smtp,
    get_env_accounts,
)

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
    has_env_key = bool(os.getenv("GEMINI_API_KEY"))
    return {
        "status": "healthy",
        "service": "AI Request Triage Assistant",
        "has_configured_api_key": has_env_key,
    }


@app.get("/api/samples", response_model=List[SampleRequest], tags=["Samples"])
def get_sample_requests():
    """Returns curated mock requests for quick 1-click testing in the UI."""
    return MOCK_REQUESTS


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

