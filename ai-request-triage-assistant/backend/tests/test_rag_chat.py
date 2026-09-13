import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.rag_service import retrieve_relevant_knowledge, get_knowledge_base_documents, KNOWLEDGE_CORPUS

client = TestClient(app)


def test_get_knowledge_base_endpoint():
    """Verify knowledge base endpoint returns indexed enterprise modules."""
    response = client.get("/api/chat/knowledge-base")
    assert response.status_code == 200
    docs = response.json()
    assert len(docs) == len(KNOWLEDGE_CORPUS)
    ids = [d["id"] for d in docs]
    assert "KB-SLA-01" in ids
    assert "KB-ROUTE-02" in ids
    assert "KB-WEBHOOK-03" in ids
    assert "KB-CHURN-04" in ids
    assert "KB-DIAG-05" in ids


def test_hybrid_retrieval_ranking():
    """Verify retrieval engine maps query keywords to correct knowledge modules."""
    # Test SLA query
    sla_results = retrieve_relevant_knowledge("What is the response SLA for P1 urgent downtime?")
    assert len(sla_results) > 0
    assert sla_results[0].id == "KB-SLA-01"
    assert sla_results[0].score >= 0.7

    # Test Webhook query
    webhook_results = retrieve_relevant_knowledge("How do I handle AWS CloudWatch SNS webhooks?")
    assert len(webhook_results) > 0
    assert any(s.id == "KB-WEBHOOK-03" for s in webhook_results)

    # Test Stripe chargeback query
    billing_results = retrieve_relevant_knowledge("Customer filed a Stripe chargeback dispute for $3,000")
    assert len(billing_results) > 0
    assert any(s.id in ("KB-ROUTE-02", "KB-WEBHOOK-03", "KB-DIAG-05") for s in billing_results)


@patch("app.rag_service.ChatGoogleGenerativeAI")
def test_chat_multimodal_rag_endpoint_text_query(mock_chat):
    """Verify multimodal RAG chat endpoint with text query."""
    mock_instance = MagicMock()
    mock_instance.invoke.return_value = MagicMock(
        content="Based on our Enterprise SLA Matrix [KB-SLA-01], Urgent P1 issues must be addressed within 15 minutes."
    )
    mock_chat.return_value = mock_instance

    payload = {
        "message": "What is the turnaround SLA for urgent production outages and who gets notified?",
        "conversation_history": [],
    }
    response = client.post("/api/chat/multimodal-rag", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "KB-SLA-01" in data["reply"]
    assert "sources" in data
    assert len(data["sources"]) > 0
    assert "suggested_followups" in data
    assert len(data["suggested_followups"]) > 0
    assert data["latency_ms"] >= 0


@patch("app.rag_service.ChatGoogleGenerativeAI")
def test_chat_multimodal_rag_endpoint_with_image(mock_chat):
    """Verify multimodal RAG chat endpoint with an image data payload."""
    mock_instance = MagicMock()
    mock_instance.invoke.return_value = MagicMock(
        content="Visual diagnostics indicate an HTTP 504 Gateway Timeout error [KB-DIAG-05]. This routes to Engineering [KB-ROUTE-02]."
    )
    mock_chat.return_value = mock_instance

    # Minimal 1x1 transparent PNG as base64
    tiny_png_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

    payload = {
        "message": "Diagnose this error screenshot: server returning 504 Gateway Timeout during checkout.",
        "image_data": tiny_png_base64,
        "file_name": "screenshot_504.png",
        "conversation_history": [
            {"role": "user", "content": "Hi Nova!"},
            {"role": "assistant", "content": "Hello! I am ready to assist with enterprise triage."},
        ],
    }
    response = client.post("/api/chat/multimodal-rag", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert data["image_analysis"] is not None
    assert len(data["sources"]) > 0


@patch("app.rag_service.ChatGoogleGenerativeAI")
def test_chat_multimodal_rag_endpoint_website_guide_mode(mock_chat):
    """Verify website guide mode prioritizes platform documentation and returns website followups."""
    mock_instance = MagicMock()
    mock_instance.invoke.return_value = MagicMock(
        content="Welcome to the platform! The AI Request Triage Assistant operates via a LangGraph state graph [KB-AGENT-07]. You can test the Live AI Triage Studio on the home page [KB-PLATFORM-08]."
    )
    mock_chat.return_value = mock_instance

    payload = {
        "message": "How does this website work and where can I test the live features?",
        "mode": "website_guide",
        "conversation_history": [],
    }
    response = client.post("/api/chat/multimodal-rag", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "KB-PLATFORM-08" in data["reply"] or "KB-AGENT-07" in data["reply"]
    assert any(s["id"] in ("KB-PLATFORM-08", "KB-AGENT-07") for s in data["sources"])
    assert any("platform" in f.lower() or "langgraph" in f.lower() for f in data["suggested_followups"])


