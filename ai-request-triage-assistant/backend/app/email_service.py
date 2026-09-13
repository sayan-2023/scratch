import os
import re
import json
import logging
import smtplib
import socket
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid
from typing import List, Optional, Tuple, Dict, Any

from pathlib import Path

from app.models import EmailAccount, SendEmailRequest, SendEmailResponse

logger = logging.getLogger("triage_backend.email")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
EMAIL_CONFIG_FILE = DATA_DIR / "email_config.json"

GMAIL_SMTP_HOST = "smtp.gmail.com"
GMAIL_SMTP_PORT = 587
GMAIL_SSL_PORT = 465


def load_stored_email_accounts() -> List[EmailAccount]:
    """Loads dispatcher accounts saved in backend/data/email_config.json."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not EMAIL_CONFIG_FILE.exists():
        return []
    try:
        with open(EMAIL_CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return [EmailAccount(**item) for item in data]
            return []
    except Exception as exc:
        logger.warning(f"Could not read {EMAIL_CONFIG_FILE}: {exc}")
        return []


def save_stored_email_accounts(accounts: List[EmailAccount]):
    """Persists dispatcher accounts to backend/data/email_config.json."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(EMAIL_CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump([acc.model_dump() for acc in accounts], f, indent=2)


def clean_app_password(raw_password: str) -> str:
    """Removes spaces commonly copied with 16-character Google App Passwords."""
    return re.sub(r"\s+", "", raw_password or "")


def is_valid_email(email: str) -> bool:
    """Basic regex validation for email strings."""
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    return bool(re.match(pattern, email.strip()))


def parse_recipient_emails(raw_input: Any) -> List[str]:
    """Parses single string, comma-separated string, or list of emails into a validated list."""
    candidates = []
    if isinstance(raw_input, list):
        for item in raw_input:
            if isinstance(item, str):
                for part in re.split(r"[,;]+", item):
                    p = part.strip()
                    if p:
                        candidates.append(p)
    elif isinstance(raw_input, str):
        for part in re.split(r"[,;]+", raw_input):
            p = part.strip()
            if p:
                candidates.append(p)

    valid_emails = [e for e in candidates if is_valid_email(e)]
    return list(dict.fromkeys(valid_emails))  # Deduplicate while preserving order


def get_env_accounts() -> List[EmailAccount]:
    """Extracts any pre-configured Gmail accounts from backend storage and environment."""
    accounts: List[EmailAccount] = []

    # 1. Check persistent server storage
    stored = load_stored_email_accounts()
    for acc in stored:
        if not any(a.email.lower() == acc.email.lower() for a in accounts):
            accounts.append(acc)

    # 2. Check GMAIL_ACCOUNTS JSON string
    raw_json = os.getenv("GMAIL_ACCOUNTS")
    if raw_json:
        try:
            parsed = json.loads(raw_json)
            if isinstance(parsed, list):
                for acc in parsed:
                    if not any(a.email.lower() == acc.get("email", "").lower() for a in accounts):
                        accounts.append(EmailAccount(**acc))
        except Exception as err:
            logger.warning(f"Could not parse GMAIL_ACCOUNTS from env: {err}")

    # 3. Check standard single GMAIL_USER / GMAIL_APP_PASSWORD
    user = os.getenv("GMAIL_USER") or os.getenv("GMAIL_EMAIL")
    pw = os.getenv("GMAIL_APP_PASSWORD") or os.getenv("GMAIL_PASSWORD")
    if user and not any(a.email.lower() == user.lower() for a in accounts):
        accounts.append(
            EmailAccount(
                email=user,
                app_password=pw,
                department="Default",
                display_name=os.getenv("GMAIL_SENDER_NAME", "Triage Operations"),
                is_default=(len(accounts) == 0),
            )
        )

    return accounts


def select_sender_account(
    requested_sender: Optional[str],
    department: Optional[str],
    available_accounts: List[EmailAccount],
) -> Optional[EmailAccount]:
    """Selects the best sender account based on explicit selection or department routing."""
    if not available_accounts:
        return None

    # 1. If an exact sender email is specified
    if requested_sender:
        clean_req = requested_sender.strip().lower()
        for acc in available_accounts:
            if acc.email.strip().lower() == clean_req:
                return acc

    # 2. Match department (e.g. Sales Team, Engineering, Finance, Client Success)
    if department:
        dep_clean = department.strip().lower()
        for acc in available_accounts:
            if acc.department and acc.department.strip().lower() == dep_clean:
                return acc
            # Also partial department matching (e.g. "sales" matches "Sales Team")
            if acc.department and (
                acc.department.strip().lower() in dep_clean
                or dep_clean in acc.department.strip().lower()
            ):
                return acc

    # 3. Default account
    for acc in available_accounts:
        if acc.is_default:
            return acc

    # 4. Fallback to first available
    return available_accounts[0]


def build_mime_message(
    sender_account: EmailAccount,
    to_emails: List[str],
    subject: str,
    body: str,
    department: Optional[str] = None,
) -> MIMEMultipart:
    """Builds a multipart MIME message with both plain text and styled HTML."""
    msg = MIMEMultipart("alternative")
    display_name = sender_account.display_name or sender_account.email.split("@")[0].replace(".", " ").title()
    msg["From"] = f'"{display_name}" <{sender_account.email}>'
    msg["To"] = ", ".join(to_emails)
    msg["Subject"] = subject
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="triage.assistant")

    # Clean plain text
    plain_text = f"{body.strip()}\n\n---\nTransmitted via AI Request Triage Assistant\nDepartment: {department or sender_account.department or 'Operations'}"

    # Rich HTML version
    body_paragraphs = "".join(f"<p style='margin-bottom: 14px; line-height: 1.6;'>{line.strip()}</p>" for line in body.strip().split("\n") if line.strip())
    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc; padding: 20px; }}
  .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }}
  .header {{ background: #2563eb; color: #ffffff; padding: 18px 24px; }}
  .header h2 {{ margin: 0; font-size: 18px; font-weight: 600; }}
  .badge {{ display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 3px 8px; border-radius: 4px; font-size: 11px; margin-top: 6px; font-weight: 500; }}
  .content {{ padding: 24px; font-size: 15px; }}
  .footer {{ padding: 16px 24px; background: #f1f5f9; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h2>Client Communication</h2>
    <span class="badge">Routed to: {department or sender_account.department or 'Operations'}</span>
  </div>
  <div class="content">
    {body_paragraphs}
  </div>
  <div class="footer">
    Sent via <strong>AI Request Triage Assistant</strong> • Dispatcher: {sender_account.email}
  </div>
</div>
</body>
</html>"""

    part_text = MIMEText(plain_text, "plain", "utf-8")
    part_html = MIMEText(html_content, "html", "utf-8")
    msg.attach(part_text)
    msg.attach(part_html)

    return msg


def send_email_message(request: SendEmailRequest) -> SendEmailResponse:
    """Dispatches an email through Gmail SMTP or simulation mode."""
    # 1. Validate recipients
    valid_recipients = parse_recipient_emails(request.to_emails)
    if not valid_recipients:
        raise ValueError("At least one valid recipient email address (e.g. client@example.com) is required.")

    # 2. Gather accounts
    env_accounts = get_env_accounts()
    client_accounts = request.accounts or []
    all_accounts = client_accounts + [a for a in env_accounts if not any(c.email.lower() == a.email.lower() for c in client_accounts)]

    # 3. Select sender
    sender = select_sender_account(
        requested_sender=request.sender_email,
        department=request.assigned_owner,
        available_accounts=all_accounts,
    )

    now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # If simulation mode is explicitly requested
    if request.simulate:
        sender_email = sender.email if sender else (request.sender_email or "triage-simulation@gmail.com")
        logger.info(f"Simulating email transmission from {sender_email} to {valid_recipients}")
        return SendEmailResponse(
            success=True,
            message=f"Simulation Complete: Draft response was simulated to {', '.join(valid_recipients)} via {sender_email}. (NOTE: No real email was delivered because Safe Simulation Mode was active).",
            sent_from=sender_email,
            sent_to=valid_recipients,
            subject=request.subject,
            timestamp=now_iso,
            is_simulation=True,
            details={
                "department": request.assigned_owner,
                "recipient_count": len(valid_recipients),
                "simulation_note": "Safe Simulation Mode is enabled. Switch to Live Delivery in Gmail Settings to send real emails.",
            },
        )

    # Real Live Delivery Mode: Must have a valid sender and App Password
    if not sender:
        raise ValueError(
            "No Gmail dispatcher account configured. Please click 'Configure Gmail' in the top navbar and add your Gmail address and Google App Password."
        )

    if not sender.app_password or sender.app_password.strip() == "":
        raise ValueError(
            f"Cannot send live email from '{sender.email}': Google App Password is required. "
            "Gmail requires a 16-character Google App Password (not your normal Google account password) to authenticate with SMTP. "
            "Generate one at: https://myaccount.google.com/apppasswords"
        )

    # Real Gmail SMTP dispatch
    app_pwd = clean_app_password(sender.app_password)
    msg = build_mime_message(
        sender_account=sender,
        to_emails=valid_recipients,
        subject=request.subject,
        body=request.body,
        department=request.assigned_owner,
    )

    try:
        logger.info(f"Connecting to {GMAIL_SMTP_HOST}:{GMAIL_SMTP_PORT} for sender {sender.email}...")
        server = smtplib.SMTP(GMAIL_SMTP_HOST, GMAIL_SMTP_PORT, timeout=12)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(sender.email.strip(), app_pwd)
        server.send_message(msg)
        server.quit()

        logger.info(f"Successfully transmitted email to {valid_recipients} via Gmail SMTP.")
        return SendEmailResponse(
            success=True,
            message=f"Live email transmitted successfully to {', '.join(valid_recipients)} from {sender.email}!",
            sent_from=sender.email,
            sent_to=valid_recipients,
            subject=request.subject,
            timestamp=now_iso,
            is_simulation=False,
            details={
                "department": request.assigned_owner,
                "message_id": msg["Message-ID"],
                "recipients_delivered": len(valid_recipients),
            },
        )

    except smtplib.SMTPAuthenticationError as auth_err:
        logger.error(f"Gmail SMTP authentication failed for {sender.email}: {auth_err}")
        err_code = getattr(auth_err, "smtp_code", 535)
        raise ValueError(
            f"Gmail Authentication Failed ({err_code}) for '{sender.email}'. "
            "Please ensure you are using a 16-character Google App Password (not your standard Google account password). "
            "Google requires 2-Step Verification to be turned on before generating App Passwords."
        )
    except smtplib.SMTPRecipientsRefused as recip_err:
        logger.error(f"Recipients refused by Gmail: {recip_err}")
        raise ValueError(f"Gmail refused the recipient address: {recip_err}")
    except (socket.timeout, TimeoutError):
        logger.error("Gmail SMTP connection timed out.")
        raise ValueError("Connection to Gmail SMTP server (smtp.gmail.com:587) timed out. Please check network connectivity.")
    except Exception as exc:
        logger.error(f"Unexpected error sending email via Gmail SMTP: {exc}", exc_info=True)
        raise ValueError(f"Failed to transmit email via Gmail SMTP: {str(exc)}")


def test_gmail_smtp(email: str, app_password: str) -> Dict[str, Any]:
    """Tests Gmail SMTP connection and credentials."""
    if not is_valid_email(email):
        return {
            "success": False,
            "message": "Invalid email format. Please provide a valid Gmail address (e.g. yourname@gmail.com).",
        }

    pwd = clean_app_password(app_password)
    if not pwd or len(pwd) < 8:
        return {
            "success": False,
            "message": "Google App Password is required. Please generate a 16-character App Password at myaccount.google.com/apppasswords.",
        }

    try:
        server = smtplib.SMTP(GMAIL_SMTP_HOST, GMAIL_SMTP_PORT, timeout=10)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(email.strip(), pwd)
        server.quit()
        return {
            "success": True,
            "message": f"Successfully authenticated with Gmail SMTP for {email}!",
        }
    except smtplib.SMTPAuthenticationError as auth_err:
        return {
            "success": False,
            "message": f"Authentication failed: Google rejected credentials for '{email}'. Verify that 2-Step Verification is active and you're using a 16-character Google App Password.",
        }
    except (socket.timeout, TimeoutError):
        return {
            "success": False,
            "message": "Connection to smtp.gmail.com:587 timed out. Please check network/firewall permissions.",
        }
    except Exception as err:
        return {
            "success": False,
            "message": f"SMTP test failed: {str(err)}",
        }


def build_welcome_mime_message(
    sender_account: EmailAccount,
    to_email: str,
    user_name: str,
    signup_method: str = "Google OAuth",
) -> MIMEMultipart:
    """Builds a rich, styled HTML and plain-text welcome email for new user onboarding."""
    msg = MIMEMultipart("alternative")
    display_name = sender_account.display_name or "AI Request Triage Assistant"
    msg["From"] = f'"{display_name}" <{sender_account.email}>'
    msg["To"] = to_email
    msg["Subject"] = f"Welcome to AI Request Triage Assistant, {user_name}!"
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="triage.assistant")

    now_str = datetime.now().strftime("%B %d, %Y at %I:%M %p UTC")

    plain_text = (
        f"Hello {user_name},\n\n"
        f"Welcome to AI Request Triage Assistant! Your account has been successfully initialized.\n\n"
        f"Account Details:\n"
        f"• Email: {to_email}\n"
        f"• Authentication Method: {signup_method}\n"
        f"• Registration Date: {now_str}\n"
        f"• Access Level: Authorized User\n\n"
        f"Core Capabilities Unlocked:\n"
        f"1. Automated AI Triage: Powered by LangGraph & Google Gemini to extract intent, summarize context, and assign urgency.\n"
        f"2. Department Auto-Routing: Intelligently routes inquiries to Engineering, Finance, Sales Team, or Client Success.\n"
        f"3. 1-Click Gmail Response Dispatch: Review auto-generated empathetic responses and transmit them directly to clients.\n"
        f"4. Real-Time Inbound Feed: Live webhook ingestion for Zendesk, Stripe disputes, web forms, and custom webhooks.\n\n"
        f"To get started, visit your dashboard at: http://localhost:5173\n\n"
        f"Warm regards,\n"
        f"AI Request Triage Assistant Team\n"
    )

    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #0f172a; padding: 24px 12px; margin: 0; }}
  .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }}
  .header {{ background: linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%); color: #ffffff; padding: 32px 28px; text-align: center; }}
  .header h1 {{ margin: 0 0 8px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }}
  .header p {{ margin: 0; font-size: 14px; opacity: 0.9; }}
  .badge {{ display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 9999px; font-size: 12px; margin-top: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }}
  .content {{ padding: 32px 28px; font-size: 15px; line-height: 1.6; color: #334155; }}
  .greeting {{ font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }}
  .info-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0; }}
  .info-box table {{ width: 100%; border-collapse: collapse; }}
  .info-box td {{ padding: 6px 0; font-size: 14px; }}
  .info-box td.label {{ color: #64748b; font-weight: 500; width: 40%; }}
  .info-box td.val {{ color: #0f172a; font-weight: 600; }}
  .feature-grid {{ margin: 24px 0; }}
  .feature-item {{ margin-bottom: 16px; display: flex; align-items: flex-start; }}
  .feature-icon {{ background: #eff6ff; color: #2563eb; border-radius: 6px; padding: 6px 10px; font-weight: 700; font-size: 13px; margin-right: 12px; }}
  .feature-text strong {{ color: #0f172a; display: block; margin-bottom: 2px; }}
  .feature-text span {{ color: #64748b; font-size: 13px; line-height: 1.4; }}
  .cta-box {{ text-align: center; margin: 28px 0 12px 0; }}
  .cta-btn {{ display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }}
  .footer {{ padding: 20px 28px; background: #f1f5f9; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>AI Request Triage Assistant</h1>
    <p>Autonomous Client Request Prioritization &amp; Response Dispatch</p>
    <span class="badge">Account Activated</span>
  </div>
  <div class="content">
    <div class="greeting">Welcome aboard, {user_name}!</div>
    <p>Thank you for signing up for <strong>AI Request Triage Assistant</strong>. Your new account is active and ready to streamline incoming inquiries with state-of-the-art AI.</p>
    
    <div class="info-box">
      <table>
        <tr>
          <td class="label">Registered Email:</td>
          <td class="val">{to_email}</td>
        </tr>
        <tr>
          <td class="label">Authentication:</td>
          <td class="val">{signup_method}</td>
        </tr>
        <tr>
          <td class="label">Activated At:</td>
          <td class="val">{now_str}</td>
        </tr>
        <tr>
          <td class="label">Status:</td>
          <td class="val" style="color: #16a34a;">Authorized Active</td>
        </tr>
      </table>
    </div>

    <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 12px;">What you can do right now:</h3>
    <div class="feature-grid">
      <div class="feature-item">
        <div class="feature-icon">01</div>
        <div class="feature-text">
          <strong>Intelligent AI Triage</strong>
          <span>Analyze messy, unstructured client emails with LangGraph and Gemini for instant urgency assessment.</span>
        </div>
      </div>
      <div class="feature-item">
        <div class="feature-icon">02</div>
        <div class="feature-text">
          <strong>Multi-Department Auto-Routing</strong>
          <span>Route tickets automatically to Engineering, Finance, Sales Team, or Client Success.</span>
        </div>
      </div>
      <div class="feature-item">
        <div class="feature-icon">03</div>
        <div class="feature-text">
          <strong>1-Click Gmail Response Dispatch</strong>
          <span>Review contextual, empathetic first responses and send them directly through your Gmail account.</span>
        </div>
      </div>
      <div class="feature-item">
        <div class="feature-icon">04</div>
        <div class="feature-text">
          <strong>Live Inbound Feed &amp; Webhooks</strong>
          <span>Ingest external webhooks from Stripe disputes, Zendesk P1 tickets, and website contact forms.</span>
        </div>
      </div>
    </div>

    <div class="cta-box">
      <a href="http://localhost:5173" class="cta-btn">Launch Workspace Dashboard &rarr;</a>
    </div>
  </div>
  <div class="footer">
    Sent by <strong>AI Request Triage Assistant</strong> &bull; Dispatcher: {sender_account.email}<br>
    If you did not create this account, please contact your workspace administrator.
  </div>
</div>
</body>
</html>"""

    part_text = MIMEText(plain_text, "plain", "utf-8")
    part_html = MIMEText(html_content, "html", "utf-8")
    msg.attach(part_text)
    msg.attach(part_html)
    return msg


def send_welcome_email_message(
    to_email: str,
    user_name: str,
    signup_method: str = "Google OAuth",
    accounts: Optional[List[EmailAccount]] = None,
) -> Dict[str, Any]:
    """
    Transmits a welcome email to a new user.
    Attempts live delivery via Gmail SMTP if any sender account with an App Password is provided/stored.
    Falls back gracefully to simulation mode with clear diagnostics if no App Password exists.
    """
    env_accounts = get_env_accounts()
    client_accounts = accounts or []
    all_accounts = client_accounts + [a for a in env_accounts if not any(c.email.lower() == a.email.lower() for c in client_accounts)]

    live_sender = None
    for acc in all_accounts:
        if acc.app_password and acc.app_password.strip():
            live_sender = acc
            break

    now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Live delivery mode if sender with App Password is available
    if live_sender:
        clean_pwd = clean_app_password(live_sender.app_password)
        msg = build_welcome_mime_message(
            sender_account=live_sender,
            to_email=to_email,
            user_name=user_name,
            signup_method=signup_method,
        )
        try:
            logger.info(f"Connecting to {GMAIL_SMTP_HOST}:{GMAIL_SMTP_PORT} to send welcome email from {live_sender.email} to {to_email}...")
            server = smtplib.SMTP(GMAIL_SMTP_HOST, GMAIL_SMTP_PORT, timeout=12)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(live_sender.email.strip(), clean_pwd)
            server.send_message(msg)
            server.quit()

            logger.info(f"Live welcome email delivered successfully to {to_email} via {live_sender.email}")
            return {
                "success": True,
                "is_simulation": False,
                "sent_to": [to_email],
                "sent_from": live_sender.email,
                "subject": msg["Subject"],
                "timestamp": now_iso,
                "message": f"Welcome email sent to {to_email} from {live_sender.email}!",
            }
        except Exception as exc:
            logger.warning(f"SMTP delivery of welcome email failed ({exc}). Falling back to simulation.", exc_info=True)
            return {
                "success": True,
                "is_simulation": True,
                "sent_to": [to_email],
                "sent_from": live_sender.email,
                "live_delivery_error": str(exc),
                "timestamp": now_iso,
                "message": f"Welcome email simulated for {to_email} (SMTP offline: {exc}).",
            }

    # Simulation mode fallback if no App Password is configured yet
    fallback_sender = (all_accounts[0].email if all_accounts else "welcome@triage.ai")
    logger.info(f"Simulating welcome email transmission to {to_email} via {fallback_sender}")
    return {
        "success": True,
        "is_simulation": True,
        "sent_to": [to_email],
        "sent_from": fallback_sender,
        "timestamp": now_iso,
        "message": f"Welcome email simulated for {to_email}. (To receive live emails in your inbox, add a Gmail App Password in Configure Gmail).",
    }

