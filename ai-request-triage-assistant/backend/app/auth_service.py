import hashlib
import json
import logging
import os
import secrets
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

from app.models import (
    User,
    UserPublic,
    UserHistoryItem,
    TriageOutput,
    SendEmailRequest,
    EmailAccount,
)
from app.email_service import (
    send_email_message,
    send_welcome_email_message,
    send_password_reset_email_message,
    get_env_accounts,
)

logger = logging.getLogger("triage_backend.auth")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
USERS_FILE = DATA_DIR / "users_store.json"
HISTORY_FILE = DATA_DIR / "history_store.json"
RESET_TOKENS_FILE = DATA_DIR / "reset_tokens.json"

SALT = "triage-assistant-secure-salt-2026"


def _ensure_data_dir():
    """Ensure data directory exists."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def hash_password(password: str) -> str:
    """Computes salted SHA-256 hash for password."""
    return hashlib.sha256(f"{SALT}:{password}".encode("utf-8")).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Verifies plain password against stored hash."""
    return hash_password(password) == hashed


# ==============================================================================
# Users Store & CRUD
# ==============================================================================

DEFAULT_ADMIN_EMAIL = "admin@triage.ai"
DEFAULT_ADMIN_PASSWORD = "AdminPassword123!"

DEFAULT_ADMIN_USER = User(
    id="usr-admin-01",
    email=DEFAULT_ADMIN_EMAIL,
    name="Admin User",
    password_hash=hash_password(DEFAULT_ADMIN_PASSWORD),
    role="Admin",
    avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
    created_at="2026-01-01 00:00:00",
)


def load_users() -> List[User]:
    """Loads all registered users, initializing default admin if missing."""
    _ensure_data_dir()
    if not USERS_FILE.exists():
        save_users([DEFAULT_ADMIN_USER])
        return [DEFAULT_ADMIN_USER]

    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            users = [User(**item) for item in data]
            # Ensure admin exists
            if not any(u.email.lower() == DEFAULT_ADMIN_EMAIL.lower() for u in users):
                users.append(DEFAULT_ADMIN_USER)
                save_users(users)
            return users
    except Exception as exc:
        logger.warning(f"Failed to read users store, reinitializing: {exc}")
        save_users([DEFAULT_ADMIN_USER])
        return [DEFAULT_ADMIN_USER]


def save_users(users: List[User]):
    """Saves user list to JSON."""
    _ensure_data_dir()
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump([u.model_dump() for u in users], f, indent=2)


def get_user_by_email_or_id(query: str) -> Optional[User]:
    """Finds user by email or user ID (case-insensitive)."""
    clean = query.strip().lower()
    for u in load_users():
        if u.email.lower() == clean or u.id.lower() == clean:
            return u
    return None


def authenticate_user(email_or_username: str, password: str) -> Optional[User]:
    """Authenticates credentials against stored users."""
    user = get_user_by_email_or_id(email_or_username)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def register_user(name: str, email: str, password: str) -> User:
    """Registers a new user account."""
    clean_email = email.strip().lower()
    if get_user_by_email_or_id(clean_email):
        raise ValueError(f"An account with email '{clean_email}' already exists.")

    new_user = User(
        id=f"usr-{uuid.uuid4().hex[:6]}",
        email=clean_email,
        name=name.strip(),
        password_hash=hash_password(password),
        role="User",
        avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={name.strip()}",
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    users = load_users()
    users.append(new_user)
    save_users(users)
    return new_user


def authenticate_google_user(
    email: str,
    name: str,
    avatar_url: Optional[str] = None,
    google_id: Optional[str] = None,
) -> Tuple[User, bool]:
    """Handles Google OAuth login, creating user if first time. Returns (user, is_new_user)."""
    clean_email = email.strip().lower()
    user = get_user_by_email_or_id(clean_email)
    if user:
        # Update avatar if provided
        if avatar_url and user.avatar_url != avatar_url:
            user.avatar_url = avatar_url
            users = load_users()
            users = [user if u.id == user.id else u for u in users]
            save_users(users)
        return user, False

    # Create new user via Google Sign-In
    random_pw = secrets.token_urlsafe(16)
    new_user = User(
        id=f"usr-g-{uuid.uuid4().hex[:6]}",
        email=clean_email,
        name=name.strip(),
        password_hash=hash_password(random_pw),
        role="User",
        avatar_url=avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={name.strip()}",
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    users = load_users()
    users.append(new_user)
    save_users(users)
    return new_user, True


# ==============================================================================
# Password Reset Tokens
# ==============================================================================

def _load_reset_tokens() -> Dict[str, dict]:
    _ensure_data_dir()
    if not RESET_TOKENS_FILE.exists():
        return {}
    try:
        with open(RESET_TOKENS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_reset_tokens(tokens: Dict[str, dict]):
    _ensure_data_dir()
    with open(RESET_TOKENS_FILE, "w", encoding="utf-8") as f:
        json.dump(tokens, f, indent=2)


def generate_reset_code(email: str) -> str:
    """Generates a 6-digit numeric verification code for password reset."""
    clean_email = email.strip().lower()
    user = get_user_by_email_or_id(clean_email)
    if not user:
        raise ValueError(f"No account found with email '{clean_email}'.")

    code = f"{secrets.randbelow(900000) + 100000}"  # 6-digit code e.g. 849204
    tokens = _load_reset_tokens()
    tokens[clean_email] = {
        "code": code,
        "expires_at": (datetime.now() + timedelta(minutes=30)).isoformat(),
    }
    _save_reset_tokens(tokens)
    return code


def verify_reset_code(email: str, reset_code: str) -> bool:
    """Verifies that the reset code is valid and active without consuming it."""
    clean_email = email.strip().lower()
    tokens = _load_reset_tokens()
    record = tokens.get(clean_email)
    if not record:
        raise ValueError("No active password reset request found. Please request a new code.")

    if record.get("code") != reset_code.strip():
        raise ValueError("Invalid verification code. Please check your email and try again.")

    expires_at = datetime.fromisoformat(record["expires_at"])
    if datetime.now() > expires_at:
        del tokens[clean_email]
        _save_reset_tokens(tokens)
        raise ValueError("Verification code has expired. Please request a new one.")

    return True


def verify_and_reset_password(email: str, reset_code: str, new_password: str) -> bool:
    """Verifies reset code and updates password."""
    clean_email = email.strip().lower()
    tokens = _load_reset_tokens()
    record = tokens.get(clean_email)
    if not record:
        raise ValueError("No active password reset request found. Please request a new code.")

    if record.get("code") != reset_code.strip():
        raise ValueError("Invalid verification code. Please check your email or request a new code.")

    expires_at = datetime.fromisoformat(record["expires_at"])
    if datetime.now() > expires_at:
        del tokens[clean_email]
        _save_reset_tokens(tokens)
        raise ValueError("Verification code has expired. Please request a new one.")

    # Update password
    users = load_users()
    updated = False
    for u in users:
        if u.email.lower() == clean_email:
            u.password_hash = hash_password(new_password)
            updated = True
            break

    if updated:
        save_users(users)
        del tokens[clean_email]
        _save_reset_tokens(tokens)
        return True
    return False


# ==============================================================================
# Persistent Session History across Logouts
# ==============================================================================

def _load_history_store() -> Dict[str, list]:
    _ensure_data_dir()
    if not HISTORY_FILE.exists():
        return {}
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_history_store(store: Dict[str, list]):
    _ensure_data_dir()
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(store, f, indent=2)


def get_user_history(user_id: str) -> List[UserHistoryItem]:
    """Retrieves all past triage history for a specific user ID."""
    store = _load_history_store()
    items = store.get(user_id, [])
    try:
        return [UserHistoryItem(**item) for item in items]
    except Exception as exc:
        logger.warning(f"Error parsing history items for {user_id}: {exc}")
        return []


def save_user_history_item(
    user_id: str,
    text: str,
    result: TriageOutput,
) -> UserHistoryItem:
    """Appends a triage result to the user's permanent history."""
    item = UserHistoryItem(
        id=f"hist-{uuid.uuid4().hex[:6]}",
        user_id=user_id,
        text=text,
        result=result,
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    store = _load_history_store()
    user_items = store.get(user_id, [])
    # Add new history item at the top
    user_items = [item.model_dump()] + user_items
    store[user_id] = user_items
    _save_history_store(store)
    return item


def clear_user_history(user_id: str) -> bool:
    """Clears history for a user."""
    store = _load_history_store()
    if user_id in store:
        store[user_id] = []
        _save_history_store(store)
    return True


# ==============================================================================
# Welcome Email & Login Notifications
# ==============================================================================

def send_welcome_email(
    user_email: str,
    user_name: str,
    signup_method: str = "Google OAuth",
    accounts: Optional[List[EmailAccount]] = None,
) -> Dict[str, Any]:
    """
    Sends a dedicated, branded welcome onboarding email upon 1st-time account creation.
    Dispatches live email via Gmail SMTP if a dispatcher account with App Password is available.
    Gracefully falls back to simulation mode without failing the user registration.
    """
    try:
        res = send_welcome_email_message(
            to_email=user_email,
            user_name=user_name,
            signup_method=signup_method,
            accounts=accounts,
        )
        logger.info(f"Welcome email result for {user_email}: {res.get('message')}")
        return res
    except Exception as exc:
        logger.warning(f"Could not dispatch welcome email to {user_email}: {exc}", exc_info=True)
        return {
            "success": False,
            "is_simulation": True,
            "error": str(exc),
            "message": f"Welcome email could not be delivered: {str(exc)}",
        }


def send_login_notification_email(
    user_email: str,
    user_name: str,
    auth_method: str = "Password",
    accounts: Optional[List[EmailAccount]] = None,
) -> Dict[str, Any]:
    """
    Sends a security notification / thank-you email upon subsequent logins.
    Uses live SMTP delivery if dispatcher accounts are configured, otherwise simulation.
    """
    now_str = datetime.now().strftime("%B %d, %Y at %I:%M %p UTC")
    subject = "Security Notice: Successful Login to AI Request Triage Assistant"
    body = (
        f"Hello {user_name},\n\n"
        f"Thank you for logging in to AI Request Triage Assistant!\n\n"
        f"A new session was successfully authenticated:\n"
        f"• Account: {user_email}\n"
        f"• Authentication Method: {auth_method}\n"
        f"• Timestamp: {now_str}\n"
        f"• Status: Authorized\n\n"
        f"You now have access to automated client request triage, prioritization, "
        f"department routing, and client response generation.\n\n"
        f"If you did not perform this login, please reset your password immediately or alert your system administrator.\n\n"
        f"Warm regards,\n"
        f"AI Request Triage Assistant Team\n"
    )

    env_accs = get_env_accounts()
    client_accs = accounts or []
    all_accs = client_accs + [a for a in env_accs if not any(c.email.lower() == a.email.lower() for c in client_accs)]
    has_live_sender = any(bool(a.app_password and a.app_password.strip()) for a in all_accs)

    try:
        payload = SendEmailRequest(
            to_emails=[user_email],
            subject=subject,
            body=body,
            assigned_owner="Client Success",
            accounts=all_accs,
            simulate=not has_live_sender,
        )
        res = send_email_message(payload)
        logger.info(f"Dispatched login notification email for {user_email} (live={not payload.simulate})")
        return {
            "success": True,
            "is_simulation": payload.simulate,
            "sent_from": res.sent_from,
            "message": res.message,
        }
    except Exception as exc:
        logger.warning(f"Could not dispatch login notification email: {exc}")
        return {
            "success": True,
            "is_simulation": True,
            "error": str(exc),
            "message": f"Login notification email queued (SMTP offline: {exc})",
        }


def send_password_reset_email(
    user_email: str,
    user_name: str,
    code: str,
    accounts: Optional[List[EmailAccount]] = None,
) -> Dict[str, Any]:
    """Dispatches a password reset verification code email via live SMTP or simulation."""
    return send_password_reset_email_message(
        to_email=user_email,
        user_name=user_name,
        code=code,
        accounts=accounts,
    )


