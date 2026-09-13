import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.models import CategoryEnum, PriorityEnum, OwnerEnum, TriageOutput
from app.auth_service import _load_reset_tokens

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
    assert "code" not in res.json()  # Verification code must NEVER be exposed in API preview

    # Retrieve code from secure backend token storage (which was dispatched to email)
    tokens = _load_reset_tokens()
    code = tokens[email.lower()]["code"]
    assert len(code) == 6

    # 2. Verify invalid code fails
    bad_verify = client.post(
        "/api/auth/verify-code",
        json={"email": email, "reset_code": "000000"},
    )
    assert bad_verify.status_code == 400

    # 3. Verify valid code succeeds
    good_verify = client.post(
        "/api/auth/verify-code",
        json={"email": email, "reset_code": code},
    )
    assert good_verify.status_code == 200
    assert good_verify.json()["success"] is True

    # 4. Reset password
    reset_res = client.post(
        "/api/auth/reset-password",
        json={
            "email": email,
            "reset_code": code,
            "new_password": "NewSecretPassword2026!",
        },
    )
    assert reset_res.status_code == 200
    assert reset_res.json()["success"] is True
    assert "congratulations" in reset_res.json()["message"].lower()
    assert reset_res.json()["email_status"] is not None

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


def test_first_time_register_dispatches_welcome_email():
    import uuid
    rand_id = uuid.uuid4().hex[:6]
    email = f"newuser_{rand_id}@company.com"

    reg_payload = {
        "name": "Devin Tester",
        "email": email,
        "password": "SecurePassword123!",
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["success"] is True
    assert data["is_new_user"] is True
    assert data["email_status"] is not None
    assert data["email_status"]["success"] is True
    assert email in data["email_status"]["sent_to"]
    assert "Welcome email" in data["email_status"]["message"]


def test_first_time_google_oauth_dispatches_welcome_email_and_subsequent_login_notice():
    import uuid
    rand_id = uuid.uuid4().hex[:6]
    email = f"oauth_user_{rand_id}@gmail.com"

    g_payload = {
        "name": "Jordan Lee",
        "email": email,
        "google_id": f"g-{rand_id}",
        "avatar_url": "https://api.dicebear.com/7.x/initials/svg?seed=Jordan",
    }

    # 1. First-time OAuth sign-in -> MUST be is_new_user=True with welcome email
    res1 = client.post("/api/auth/google", json=g_payload)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["success"] is True
    assert data1["is_new_user"] is True
    assert data1["email_status"] is not None
    assert data1["email_status"]["success"] is True
    assert email in data1["email_status"]["sent_to"]
    assert "Welcome email" in data1["email_status"]["message"]

    # 2. Subsequent OAuth login -> is_new_user=False with login notification
    res2 = client.post("/api/auth/google", json=g_payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["success"] is True
    assert data2["is_new_user"] is False
    assert data2["email_status"] is not None
    assert data2["email_status"]["success"] is True


from unittest.mock import patch, MagicMock

@patch("smtplib.SMTP")
def test_first_time_google_oauth_live_smtp_delivery(mock_smtp):
    mock_server = MagicMock()
    mock_smtp.return_value = mock_server

    import uuid
    rand_id = uuid.uuid4().hex[:6]
    email = f"live_user_{rand_id}@gmail.com"

    g_payload = {
        "name": "Live Recipient",
        "email": email,
        "google_id": f"g-live-{rand_id}",
        "accounts": [
            {
                "email": "dispatcher@gmail.com",
                "app_password": "abcd efgh ijkl mnop",
                "department": "Default",
                "is_default": True,
            }
        ],
    }

    res = client.post("/api/auth/google", json=g_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_new_user"] is True
    assert data["email_status"]["is_simulation"] is False
    assert data["email_status"]["sent_from"] == "dispatcher@gmail.com"
    assert email in data["email_status"]["sent_to"]

    # Verify SMTP was called to deliver the welcome message
    mock_server.login.assert_called_with("dispatcher@gmail.com", "abcdefghijklmnop")
    mock_server.send_message.assert_called()
    mock_server.quit.assert_called()


def test_email_config_endpoints_persistence():
    payload = {
        "accounts": [
            {
                "email": "auto_test_dispatcher@gmail.com",
                "app_password": "xxxx yyyy zzzz wwww",
                "department": "Engineering",
                "is_default": True,
            }
        ]
    }
    save_res = client.post("/api/email/config", json=payload)
    assert save_res.status_code == 200
    assert save_res.json()["success"] is True

    get_res = client.get("/api/email/config")
    assert get_res.status_code == 200
    accounts = get_res.json()["configured_accounts"]
    assert any(a["email"] == "auto_test_dispatcher@gmail.com" for a in accounts)

    # Clean up so test accounts don't leak into runtime
    client.post("/api/email/config", json={"accounts": []})


def test_forgot_password_live_smtp_delivery(monkeypatch):
    """Verifies that forgot-password delivers verification code via live SMTP without leaking code in response."""
    import smtplib
    mock_server = MagicMock()
    monkeypatch.setattr(smtplib, "SMTP", lambda host, port, timeout: mock_server)

    import uuid
    email = f"reset_live_{uuid.uuid4().hex[:6]}@example.com"
    # Pre-register user
    reg_res = client.post("/api/auth/register", json={
        "name": "Live Reset User",
        "email": email,
        "password": "Password123!",
    })
    assert reg_res.status_code == 201

    payload = {
        "email": email,
        "accounts": [
            {
                "email": "dispatcher@gmail.com",
                "app_password": "abcdefghijklmnop",
                "department": "Default",
                "is_default": True,
            }
        ],
    }

    res = client.post("/api/auth/forgot-password", json=payload)
    assert res.status_code == 200
    data = res.json()

    # CRITICAL: code must NOT be shown in API response preview
    assert "code" not in data
    assert data["success"] is True
    assert data["email_status"]["is_simulation"] is False
    assert data["email_status"]["sent_from"] == "dispatcher@gmail.com"
    assert email in data["email_status"]["sent_to"]

    # Verify SMTP handshake, authentication, and message delivery
    mock_server.login.assert_called_with("dispatcher@gmail.com", "abcdefghijklmnop")
    mock_server.send_message.assert_called()
    mock_server.quit.assert_called()


def test_reset_password_dispatches_congratulations_email_live_smtp(monkeypatch):
    """Verifies that reset-password delivers a congratulations email via live SMTP."""
    import smtplib
    mock_server = MagicMock()
    monkeypatch.setattr(smtplib, "SMTP", lambda host, port, timeout: mock_server)

    import uuid
    email = f"reset_congrats_{uuid.uuid4().hex[:6]}@example.com"
    # Pre-register user
    reg_res = client.post("/api/auth/register", json={
        "name": "Congrats User",
        "email": email,
        "password": "InitialPassword123!",
    })
    assert reg_res.status_code == 201

    # Request code
    res = client.post("/api/auth/forgot-password", json={"email": email})
    assert res.status_code == 200

    tokens = _load_reset_tokens()
    code = tokens[email.lower()]["code"]

    # Reset password with live dispatcher account
    reset_res = client.post("/api/auth/reset-password", json={
        "email": email,
        "reset_code": code,
        "new_password": "NewSecretPassword2026!",
        "accounts": [
            {
                "email": "dispatcher@gmail.com",
                "app_password": "abcdefghijklmnop",
                "department": "Default",
                "is_default": True,
            }
        ],
    })
    assert reset_res.status_code == 200
    data = reset_res.json()
    assert data["success"] is True
    assert "congratulations" in data["message"].lower()
    assert data["email_status"]["is_simulation"] is False
    assert data["email_status"]["sent_from"] == "dispatcher@gmail.com"
    assert email in data["email_status"]["sent_to"]

    # Verify SMTP was called
    mock_server.login.assert_called_with("dispatcher@gmail.com", "abcdefghijklmnop")
    mock_server.send_message.assert_called()
    mock_server.quit.assert_called()



