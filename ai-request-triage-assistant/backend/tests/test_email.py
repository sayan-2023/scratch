import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.models import EmailAccount, SendEmailRequest
from app.email_service import (
    parse_recipient_emails,
    clean_app_password,
    select_sender_account,
    build_mime_message,
)

client = TestClient(app)


def test_parse_recipient_emails():
    # Single email
    assert parse_recipient_emails("user@example.com") == ["user@example.com"]

    # Comma-separated
    result = parse_recipient_emails("user1@example.com, user2@example.com; user3@test.co")
    assert result == ["user1@example.com", "user2@example.com", "user3@test.co"]

    # List format with duplicates and invalid strings
    raw = ["alpha@test.com", "not-an-email", "beta@test.com", "alpha@test.com"]
    assert parse_recipient_emails(raw) == ["alpha@test.com", "beta@test.com"]


def test_clean_app_password():
    assert clean_app_password("abcd efgh ijkl mnop") == "abcdefghijklmnop"
    assert clean_app_password("  1234 5678  ") == "12345678"
    assert clean_app_password("") == ""


def test_select_sender_account_routing():
    accounts = [
        EmailAccount(email="general@gmail.com", department="Default", is_default=True),
        EmailAccount(email="sales@gmail.com", department="Sales Team"),
        EmailAccount(email="tech@gmail.com", department="Engineering"),
        EmailAccount(email="finance@gmail.com", department="Finance"),
    ]

    # Explicit override takes precedence
    chosen = select_sender_account("tech@gmail.com", "Sales Team", accounts)
    assert chosen.email == "tech@gmail.com"

    # Department routing
    sales_acc = select_sender_account(None, "Sales Team", accounts)
    assert sales_acc.email == "sales@gmail.com"

    eng_acc = select_sender_account(None, "Engineering", accounts)
    assert eng_acc.email == "tech@gmail.com"

    # Fallback to default
    unknown_acc = select_sender_account(None, "Unknown Dept", accounts)
    assert unknown_acc.email == "general@gmail.com"


def test_build_mime_message():
    acc = EmailAccount(
        email="support@mycompany.com",
        display_name="Triage Support",
        department="Client Success",
    )
    msg = build_mime_message(
        sender_account=acc,
        to_emails=["client1@example.com", "client2@example.com"],
        subject="Ticket #102 Update",
        body="Hello, we are investigating your issue.",
        department="Client Success",
    )

    assert "Triage Support" in msg["From"]
    assert "support@mycompany.com" in msg["From"]
    assert msg["To"] == "client1@example.com, client2@example.com"
    assert msg["Subject"] == "Ticket #102 Update"
    assert msg.is_multipart()


def test_api_send_email_simulation():
    payload = {
        "to_emails": ["client@example.com"],
        "subject": "Test Dispatch",
        "body": "This is a test notification message.",
        "assigned_owner": "Engineering",
        "simulate": True,
        "accounts": [
            {
                "email": "ops@gmail.com",
                "department": "Engineering",
                "is_default": True,
            }
        ],
    }

    response = client.post("/api/send-email", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["is_simulation"] is True
    assert data["sent_from"] == "ops@gmail.com"
    assert "client@example.com" in data["sent_to"]


def test_api_send_email_multiple_recipients():
    payload = {
        "to_emails": ["manager@corp.com, dev@corp.com"],
        "subject": "Critical Alert Update",
        "body": "Fix has been deployed.",
        "simulate": True,
    }

    response = client.post("/api/send-email", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["sent_to"]) == 2
    assert "manager@corp.com" in data["sent_to"]
    assert "dev@corp.com" in data["sent_to"]


def test_api_send_email_validation_failure():
    # Empty recipient list
    response = client.post(
        "/api/send-email",
        json={"to_emails": [], "subject": "Test", "body": "Hello"},
    )
    assert response.status_code in (400, 422)

    # Invalid email address
    response = client.post(
        "/api/send-email",
        json={"to_emails": ["not-an-email"], "subject": "Test", "body": "Hello"},
    )
    assert response.status_code == 400
    assert "recipient email address" in response.json()["detail"]


@patch("smtplib.SMTP")
def test_api_send_email_real_smtp_mock(mock_smtp):
    mock_server = MagicMock()
    mock_smtp.return_value = mock_server

    payload = {
        "to_emails": ["customer@example.com"],
        "subject": "Urgent Outage Update",
        "body": "We are resolving the SSO issue.",
        "assigned_owner": "Engineering",
        "simulate": False,
        "accounts": [
            {
                "email": "eng@gmail.com",
                "app_password": "abcd efgh ijkl mnop",
                "department": "Engineering",
                "is_default": True,
            }
        ],
    }

    response = client.post("/api/send-email", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["is_simulation"] is False
    assert data["sent_from"] == "eng@gmail.com"

    # Verify SMTP calls
    mock_server.ehlo.assert_called()
    mock_server.starttls.assert_called()
    mock_server.login.assert_called_with("eng@gmail.com", "abcdefghijklmnop")
    mock_server.send_message.assert_called()
    mock_server.quit.assert_called()


def test_api_email_config():
    response = client.get("/api/email/config")
    assert response.status_code == 200
    data = response.json()
    assert "configured_accounts" in data


def test_api_send_email_live_missing_app_password_raises_400():
    # Attempting to send live email (simulate=False) without app password should raise 400
    payload = {
        "to_emails": ["duttasayan453@gmail.com"],
        "subject": "Testing Live Delivery",
        "body": "This should fail without app password.",
        "simulate": False,
        "accounts": [
            {
                "email": "sayandutta.ec2025@gmail.com",
                "app_password": "",
                "department": "Default",
                "is_default": True,
            }
        ],
    }
    response = client.post("/api/send-email", json=payload)
    assert response.status_code == 400
    assert "Google App Password" in response.json()["detail"]

