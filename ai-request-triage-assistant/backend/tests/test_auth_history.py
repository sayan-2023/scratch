import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import CategoryEnum, PriorityEnum, OwnerEnum, TriageOutput

client = TestClient(app)


def test_admin_login_success():
    payload = {
        "email_or_username": "admin@triage.ai",
        "password": "AdminPassword123!",
    }
    res = client.post("/api/auth/login", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["user"]["email"] == "admin@triage.ai"
    assert data["user"]["role"] == "Admin"
    assert "token" in data


def test_login_invalid_credentials():
    payload = {
        "email_or_username": "admin@triage.ai",
        "password": "WrongPassword999!",
    }
    res = client.post("/api/auth/login", json=payload)
    assert res.status_code == 401
    assert "Invalid email" in res.json()["detail"]


def test_register_and_google_auth():
    import uuid
    rand_id = uuid.uuid4().hex[:6]
    email = f"user_{rand_id}@cyberdyne.com"

    # 1. Register new user
    reg_payload = {
        "name": "Sarah Connor",
        "email": email,
        "password": "Resistance2026!",
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["name"] == "Sarah Connor"

    # Duplicate register should fail
    dup_res = client.post("/api/auth/register", json=reg_payload)
    assert dup_res.status_code == 400

    # 2. Google OAuth sign-in
    g_payload = {
        "name": "Alex Mercer",
        "email": f"alex_{rand_id}@gmail.com",
        "google_id": f"google-{rand_id}",
        "avatar_url": "https://example.com/avatar.jpg",
    }
    g_res = client.post("/api/auth/google", json=g_payload)
    assert g_res.status_code == 200
    g_data = g_res.json()
    assert f"alex_{rand_id}@gmail.com" in g_data["user"]["email"]


def test_forgot_and_reset_password_flow():
    import uuid
    rand_id = uuid.uuid4().hex[:6]
    email = f"reset_user_{rand_id}@cyberdyne.com"

    # Pre-register user
    client.post("/api/auth/register", json={
        "name": "Reset Tester",
        "email": email,
        "password": "InitialPassword123!",
    })

    # 1. Request reset code
    res = client.post("/api/auth/forgot-password", json={"email": email})
    assert res.status_code == 200
    code = res.json()["code"]
    assert len(code) == 6

    # 2. Reset password
    reset_res = client.post(
        "/api/auth/reset-password",
        json={
            "email": email,
            "reset_code": code,
            "new_password": "NewSecretPassword2026!",
        },
    )
    assert reset_res.status_code == 200

    # 3. Log in with new password
    login_res = client.post(
        "/api/auth/login",
        json={
            "email_or_username": email,
            "password": "NewSecretPassword2026!",
        },
    )
    assert login_res.status_code == 200
    assert login_res.json()["user"]["name"] == "Reset Tester"


def test_persistent_user_history():
    user_id = "usr-test-history-user"

    # 1. Initially empty or existing
    res = client.get(f"/api/history?user_id={user_id}")
    assert res.status_code == 200

    # 2. Save triage item
    triage_payload = {
        "text": "Our payment gateway keeps failing with 504 errors.",
        "result": {
            "summary": "Gateway 504 outage blocking transactions",
            "category": "Technical",
            "priority": "Urgent",
            "priority_reason": "Direct revenue loss and checkout blocked",
            "assigned_owner": "Engineering",
            "draft_response": "We have escalated this to on-call immediately.",
            "processing_time_ms": 120.5,
        },
    }
    save_res = client.post(f"/api/history?user_id={user_id}", json=triage_payload)
    assert save_res.status_code == 201
    item_id = save_res.json()["id"]

    # 3. Retrieve history and assert persistence
    hist_res = client.get(f"/api/history?user_id={user_id}")
    assert hist_res.status_code == 200
    items = hist_res.json()
    assert any(i["id"] == item_id for i in items)
    assert items[0]["result"]["category"] == "Technical"

    # 4. Clear history
    del_res = client.delete(f"/api/history?user_id={user_id}")
    assert del_res.status_code == 200
    assert len(client.get(f"/api/history?user_id={user_id}").json()) == 0
