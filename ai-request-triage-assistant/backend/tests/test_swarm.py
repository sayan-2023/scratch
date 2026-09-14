from unittest.mock import patch, MagicMock
from langchain_core.messages import AIMessage
from fastapi.testclient import TestClient
from app.main import app
from app.agent import orchestrate_swarm

client = TestClient(app)


def test_swarm_orchestration_heuristic_dynamic(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    # Test with AWS outage scenario text without external API key
    text = "URGENT: All EU-central cluster pods returning HTTP 504 Gateway Timeouts. Customer payments failing globally!"
    result = orchestrate_swarm(text, scenario_title="🚨 AWS 504 Gateway Outage")
    assert result.priority in ["P1 - Critical", "Urgent", "P2 - High"]
    assert result.urgency_score >= 80
    assert result.category == "Technical"
    assert "Engineering" in result.department or "DevOps" in result.department
    assert len(result.agent_traces) == 4
    assert len(result.draft_response) > 50
    assert result.confidence >= 90.0


def test_swarm_orchestrate_with_mocked_gemini():
    mock_json = """{
      "summary": "Critical API token leak detected on public GitHub snippet.",
      "category": "Technical",
      "priority": "P1 - Critical",
      "urgency_score": 98,
      "department": "Security & SecOps",
      "sla": "10 minutes",
      "sentiment_label": "Severe Security Alarm",
      "sentiment_score": -0.8,
      "churn_risk": "High",
      "key_entities": ["secret_key", "GitHub", "JWT"],
      "draft_response": "Our security operations center has mobilized to immediately revoke the exposed credential and initiate an audit.",
      "confidence": 99.2,
      "classifier_thought": "Severe threat detected. Immediate rotation required.",
      "security_thought": "Token isolated and perimeter quarantined.",
      "router_thought": "Dispatched to SecOps team.",
      "synthesis_thought": "Formulated critical incident escalation briefing."
    }"""
    
    with patch("app.agent.get_llm") as mock_get_llm:
        mock_llm_instance = MagicMock()
        mock_llm_instance.invoke.return_value = AIMessage(content=mock_json)
        mock_get_llm.return_value = mock_llm_instance

        payload = {
            "text": "Security alert: Production JWT signing key secret_key_test_token_99201992019920 was leaked on public GitHub repo.",
            "scenario_title": "🔐 Potential API Token Leak",
            "api_key": "dummy_test_key",
        }
        response = client.post("/api/ai/swarm-orchestrate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["priority"] == "P1 - Critical"
        assert data["urgency_score"] == 98
        assert data["department"] == "Security & SecOps"
        assert data["redacted_items_count"] >= 1
        assert "[REDACTED_API_KEY]" in data["sanitized_text"]
        assert len(data["agent_traces"]) == 4
        assert "security operations center" in data["draft_response"]


def test_swarm_custom_chaos_ticket(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    payload = {
        "text": "We need to upgrade our contract tier to 24/7 dedicated support for 500 seats with custom SLA guarantees.",
        "scenario_title": "Custom Ticket",
    }
    response = client.post("/api/ai/swarm-orchestrate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] in ["Sales", "Support"]
    assert data["urgency_score"] > 0
    assert len(data["draft_response"]) > 20
