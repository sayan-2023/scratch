import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import CategoryEnum, PriorityEnum, OwnerEnum

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_get_sample_requests():
    response = client.get("/api/samples")
    assert response.status_code == 200
    samples = response.json()
    assert len(samples) >= 4
    categories = {s["expected_category"] for s in samples}
    assert "Technical" in categories
    assert "Billing" in categories
    assert "Sales" in categories
    assert "Support" in categories


def test_triage_empty_input_validation():
    # Should fail validation when request_text is empty or too short
    response = client.post("/api/triage", json={"request_text": "Hi"})
    assert response.status_code == 422 or response.status_code == 400


def test_triage_missing_key_graceful_handling(monkeypatch):
    # Calling triage without key should return a clean 400 or handled error, not crash
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    response = client.post("/api/triage", json={"request_text": "Our servers are crashing and we cannot access invoices."})
    # If no GEMINI_API_KEY is present in env, it raises 400 with helpful message
    if response.status_code != 200:
        assert response.status_code in (400, 500)
        assert "Gemini" in response.json()["detail"] or "API key" in response.json()["detail"]
    assert response.status_code in (400, 500)
    assert "Gemini" in response.json()["detail"] or "API key" in response.json()["detail"]


def test_samples_crud_and_reset():
    # 1. Create a custom sample
    create_payload = {
        "title": "Custom Test Scenario",
        "channel": "Live Chat",
        "sender": "Alice Tester (QA Lead)",
        "text": "Hello, our export to CSV button is disabled on the analytics dashboard.",
        "expected_category": "Technical",
        "expected_priority": "Medium",
    }
    create_res = client.post("/api/samples", json=create_payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["title"] == "Custom Test Scenario"
    assert created_data["is_custom"] is True
    sample_id = created_data["id"]

    # 2. Verify it shows in list
    list_res = client.get("/api/samples")
    assert list_res.status_code == 200
    all_ids = [s["id"] for s in list_res.json()]
    assert sample_id in all_ids

    # 3. Delete the created sample
    del_res = client.delete(f"/api/samples/{sample_id}")
    assert del_res.status_code == 200

    # 4. Verify it's no longer in list
    list_res2 = client.get("/api/samples")
    assert sample_id not in [s["id"] for s in list_res2.json()]

    # 5. Reset samples to default
    reset_res = client.post("/api/samples/reset")
    assert reset_res.status_code == 200
    assert len(reset_res.json()) == 5


def test_inbox_webhook_ingestion():
    # Test ingesting a webhook payload
    webhook_payload = {
        "source": "Zendesk Webhook",
        "sender": "customer-success@enterprise.com",
        "channel": "API Webhook",
        "subject": "System Latency Inquiry",
        "body": "We are noticing elevated response times over 4000ms on our US-East region API queries.",
        "auto_triage": False,
    }
    res = client.post("/api/inbox/webhook", json=webhook_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["source"] == "Zendesk Webhook"
    assert data["status"] == "pending"
    msg_id = data["id"]

    # Test listing inbox
    inbox_res = client.get("/api/inbox")
    assert inbox_res.status_code == 200
    inbox_items = inbox_res.json()
    assert any(item["id"] == msg_id for item in inbox_items)

    # Test deleting inbox item
    del_res = client.delete(f"/api/inbox/{msg_id}")
    assert del_res.status_code == 200


def test_inbox_simulate_event():
    # Test simulating a Stripe dispute event
    sim_payload = {
        "scenario_type": "stripe_chargeback",
        "auto_triage": False,
    }
    res = client.post("/api/inbox/simulate", json=sim_payload)
    assert res.status_code == 200
    data = res.json()
    assert "Stripe" in data["source"]
    assert "Dispute" in data["subject"] or "Chargeback" in data["subject"]


def test_ai_enhance_text_endpoint(monkeypatch):
    # Test PII scrubbing and enhancement with fast mock
    class MockLLM:
        def invoke(self, messages):
            class MockContent:
                content = "ENHANCED:\nCustomer card [REDACTED_CARD_****4444] needs urgent refund for $500.\nBULLETS:\n- Customer refund requested"
            return MockContent()
    monkeypatch.setattr("app.agent.get_llm", lambda **kwargs: MockLLM())
    raw_text = "Customer card 4111 2222 3333 4444 and phone 415-555-2671 needs urgent refund for $500."
    res = client.post("/api/ai/enhance-text", json={"text": raw_text})
    assert res.status_code == 200
    data = res.json()
    assert "enhanced_text" in data
    assert "4111 2222 3333 4444" not in data["enhanced_text"]
    assert data["redacted_items_count"] >= 1
    assert "bullet_points" in data


def test_ai_tone_draft_endpoint(monkeypatch):
    # Test tone-specific drafting endpoint with fast mock
    class MockLLM:
        def invoke(self, messages):
            class MockContent:
                content = "Executive Briefing: The payment gateway failure is actively under investigation by Senior Infrastructure."
            return MockContent()
    monkeypatch.setattr("app.agent.get_llm", lambda **kwargs: MockLLM())
    payload = {
        "request_text": "Our payment portal is down with 504 errors.",
        "summary": "Payment portal 504 gateway downtime.",
        "assigned_owner": "Engineering",
        "priority": "Urgent",
        "tone": "executive",
    }
    res = client.post("/api/ai/tone-draft", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["tone"] == "executive"
    assert "draft" in data
    assert len(data["draft"]) > 10



