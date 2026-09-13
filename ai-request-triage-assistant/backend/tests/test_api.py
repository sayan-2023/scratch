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


def test_triage_missing_key_graceful_handling():
    # Calling triage without key should return a clean 400 or handled error, not crash
    response = client.post("/api/triage", json={"request_text": "Our servers are crashing and we cannot access invoices."})
    # If no GEMINI_API_KEY is present in env, it raises 400 with helpful message
    if response.status_code != 200:
        assert response.status_code in (400, 500)
        assert "Gemini" in response.json()["detail"] or "API key" in response.json()["detail"]

