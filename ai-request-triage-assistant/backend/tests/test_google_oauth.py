import pytest
import base64
import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_google_auth_config():
    response = client.get("/api/auth/google/config")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "auth_uri" in data
    assert "scopes" in data
    assert data["mode"] == "hybrid"


def test_google_auth_success():
    payload = {
        "email": "test.googleuser@gmail.com",
        "name": "Google User",
        "google_id": "google-123456",
        "avatar_url": "https://example.com/avatar.png",
    }
    response = client.post("/api/auth/google", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["email"] == "test.googleuser@gmail.com"
    assert data["user"]["name"] == "Google User"
    assert data["token"].startswith("tok-g-")


def test_google_auth_with_jwt_token():
    claims = {
        "email": "jwt.user@gmail.com",
        "name": "JWT Google User",
        "picture": "https://example.com/jwt.png",
        "sub": "sub-987654",
    }
    encoded_payload = base64.urlsafe_b64encode(json.dumps(claims).encode("utf-8")).decode("utf-8").rstrip("=")
    fake_jwt = f"header.{encoded_payload}.signature"

    payload = {
        "email": "",
        "name": "",
        "id_token": fake_jwt,
    }
    response = client.post("/api/auth/google", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["email"] == "jwt.user@gmail.com"
    assert data["user"]["name"] == "JWT Google User"


def test_google_auth_invalid_email():
    payload = {
        "email": "not-an-email",
        "name": "Invalid User",
    }
    response = client.post("/api/auth/google", json=payload)
    assert response.status_code == 400
    assert "valid Google / Gmail address is required" in response.json()["detail"]


def test_verify_google_credentials_wrong_password():
    # admin@triage.ai has password AdminPassword123!
    payload = {
        "email": "admin@triage.ai",
        "password": "WrongPassword999!",
    }
    response = client.post("/api/auth/google/verify-credentials", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert "Wrong password" in data["detail"]


def test_verify_google_credentials_correct_password():
    payload = {
        "email": "admin@triage.ai",
        "password": "AdminPassword123!",
    }
    response = client.post("/api/auth/google/verify-credentials", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert "verified" in data["detail"].lower()


def test_google_auth_rejects_wrong_password():
    payload = {
        "email": "admin@triage.ai",
        "name": "Admin User",
        "password": "WrongPassword999!",
    }
    response = client.post("/api/auth/google", json=payload)
    assert response.status_code == 401
    assert "Wrong password" in response.json()["detail"]
