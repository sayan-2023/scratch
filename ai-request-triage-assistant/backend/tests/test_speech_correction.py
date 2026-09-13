import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.speech_service import heuristic_speech_cleanup, correct_and_rewrite_speech_query

client = TestClient(app)


def test_heuristic_speech_cleanup_acronyms():
    """Verify offline heuristic fixes common speech recognition slips and acronyms."""
    raw = "what is the sla target for p1 incident"
    cleaned = heuristic_speech_cleanup(raw)
    assert "SLA" in cleaned
    assert "P1" in cleaned
    assert cleaned.endswith("?")
    assert cleaned.startswith("What")


def test_heuristic_speech_cleanup_domain_terms():
    """Verify domain terms like 504 error, langgraph, and webhooks are polished."""
    raw = "how do langgraph process webhook when 504 error occurs"
    cleaned = heuristic_speech_cleanup(raw)
    assert "LangGraph" in cleaned
    assert "Webhook" in cleaned
    assert "504 Gateway Timeout" in cleaned


@patch("app.speech_service.ChatGoogleGenerativeAI")
def test_speech_correction_with_gemini(mock_chat):
    """Verify Gemini AI speech correction returns polished rewritten text."""
    mock_instance = MagicMock()
    mock_instance.invoke.return_value = MagicMock(
        content="How does the LangGraph cognitive pipeline handle inbound Webhook events during a 504 Gateway Timeout?"
    )
    mock_chat.return_value = mock_instance

    res = correct_and_rewrite_speech_query(
        text="how does lang graph cognitive pipeline handel webhook during 504 error",
        api_key="mock_key_123",
        context="website_guide",
    )
    assert res.corrected_text.startswith("How does")
    assert "LangGraph" in res.corrected_text
    assert res.changes_made is True
    assert res.latency_ms >= 0


@patch("app.speech_service.ChatGoogleGenerativeAI")
def test_speech_correction_endpoint_api(mock_chat):
    """Verify POST /api/ai/correct-speech-query endpoint works end-to-end."""
    mock_instance = MagicMock()
    mock_instance.invoke.return_value = MagicMock(
        content="What is the SLA target for P1 urgent downtime, and who gets paged?"
    )
    mock_chat.return_value = mock_instance

    payload = {
        "text": "what is the sla for p1 urgent downtime and who gets paged",
        "context": "workspace",
    }
    response = client.post("/api/ai/correct-speech-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "corrected_text" in data
    assert "SLA" in data["corrected_text"]
    assert "P1" in data["corrected_text"]
    assert data["changes_made"] is True
    assert data["latency_ms"] >= 0

