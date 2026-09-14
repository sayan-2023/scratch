import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_routes_prioritized():
    # Health endpoint returns JSON healthy
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_spa_static_serving_root():
    # Root / returns 200 OK HTML
    res = client.get("/")
    assert res.status_code == 200
    assert "html" in res.headers.get("content-type", "")


def test_spa_static_serving_oauth_popup():
    # /oauth-google.html returns the OAuth template
    res = client.get("/oauth-google.html")
    assert res.status_code == 200
    assert "Google" in res.text or "oauth" in res.text.lower()
