import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from app.models import (
    CategoryEnum,
    PriorityEnum,
    SampleRequest,
    SampleCreateInput,
    InboxMessage,
)

# Immutable base reference seed data
DEFAULT_MOCK_REQUESTS: List[SampleRequest] = [
    SampleRequest(
        id="sample-1",
        title="Production SSO Outage (All Staff Blocked)",
        channel="Live Chat / Emergency Form",
        sender="Marcus Vance (CTO, Apex Dynamics)",
        text=(
            "URGENT: Our production SSO login portal has been completely unresponsive "
            "since 9:00 AM EST. None of our 120 employees can log in, and our monthly "
            "payroll processing is completely halted. We are seeing 504 Gateway Timeouts. "
            "Please escalate to your engineering on-call immediately!"
        ),
        expected_category=CategoryEnum.TECHNICAL,
        expected_priority=PriorityEnum.URGENT,
        is_custom=False,
    ),
    SampleRequest(
        id="sample-2",
        title="Disputed Overcharge on Invoice #889",
        channel="Email (billing@)",
        sender="Sarah Jenkins (Director of Finance, NexaCorp)",
        text=(
            "Hello, I just reviewed our latest invoice #INV-2024-889 and noticed we were "
            "billed $14,200 instead of our agreed contracted rate of $8,500. This is the second "
            "month in a row an erroneous surcharge has been added. Please issue a corrected "
            "invoice and credit memo before our CFO freezes account renewals on Friday."
        ),
        expected_category=CategoryEnum.BILLING,
        expected_priority=PriorityEnum.HIGH,
        is_custom=False,
    ),
    SampleRequest(
        id="sample-3",
        title="Enterprise Plan & Demo Inquiry (250 Seats)",
        channel="Website Inbound Form",
        sender="Elena Rostova (VP of Operations, Horizon Global)",
        text=(
            "Hi there! We are currently piloting your software with a small team of 10 and "
            "love the workflow. We are planning to expand company-wide across 250 seats next quarter. "
            "Could someone from your sales team send over enterprise volume pricing, a SOC-2 report, "
            "and schedule a 30-minute product demo with our leadership team next Tuesday?"
        ),
        expected_category=CategoryEnum.SALES,
        expected_priority=PriorityEnum.MEDIUM,
        is_custom=False,
    ),
    SampleRequest(
        id="sample-4",
        title="How-To: Setting Workspace Role Permissions",
        channel="Support Ticket",
        sender="David Cho (Project Manager, BlueSky Media)",
        text=(
            "Hi Support team, Hope you are having a nice week! We just hired two new interns and "
            "want to add them to our project board with read-only viewer permissions, but we can't "
            "seem to find the permission toggle in the team settings page. Could you point us to the "
            "relevant documentation or brief instructions on how to set this up? No rush at all."
        ),
        expected_category=CategoryEnum.SUPPORT,
        expected_priority=PriorityEnum.LOW,
        is_custom=False,
    ),
    SampleRequest(
        id="sample-5",
        title="Contract Cancellation Risk / Account Escalation",
        channel="Email (escalations@)",
        sender="Rachel Torres (VP of Customer Experience, PeakRetail)",
        text=(
            "We have been waiting for over two weeks for our custom data migration to be completed. "
            "Our kickoff was missed twice, and our executive team is losing confidence. If we don't have "
            "a dedicated meeting with our client success lead by tomorrow morning to resolve this roadmap, "
            "we will be forced to terminate our annual contract and request a full refund."
        ),
        expected_category=CategoryEnum.SUPPORT,
        expected_priority=PriorityEnum.URGENT,
        is_custom=False,
    ),
]

# File paths for dynamic persistence
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SAMPLES_FILE = DATA_DIR / "samples_store.json"
INBOX_FILE = DATA_DIR / "inbox_store.json"


def _ensure_data_dir():
    """Ensure data directory exists."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


# ==============================================================================
# Scenario B: Persistent Sample Store & CRUD Operations
# ==============================================================================

def get_all_samples() -> List[SampleRequest]:
    """Retrieves all sample requests from the persistent store, initializing with defaults if missing."""
    _ensure_data_dir()
    if not SAMPLES_FILE.exists():
        reset_samples_to_default()
        return DEFAULT_MOCK_REQUESTS

    try:
        with open(SAMPLES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            samples = [SampleRequest(**item) for item in data]
            # If for any reason the file is empty, fallback to defaults
            if not samples:
                return reset_samples_to_default()
            return samples
    except Exception:
        return DEFAULT_MOCK_REQUESTS


def get_sample_by_id(sample_id: str) -> Optional[SampleRequest]:
    """Finds a single sample by its unique ID."""
    samples = get_all_samples()
    for s in samples:
        if s.id == sample_id:
            return s
    return None


def create_sample(payload: SampleCreateInput) -> SampleRequest:
    """Creates and persists a new custom sample request."""
    _ensure_data_dir()
    sample = SampleRequest(
        id=f"custom-{uuid.uuid4().hex[:6]}",
        title=payload.title.strip(),
        channel=payload.channel.strip() or "Custom Preset",
        sender=payload.sender.strip(),
        text=payload.text.strip(),
        expected_category=payload.expected_category,
        expected_priority=payload.expected_priority,
        is_custom=True,
    )
    samples = get_all_samples()
    samples.append(sample)
    _save_samples(samples)
    return sample


def add_sample(sample: SampleRequest) -> SampleRequest:
    """Adds or replaces a SampleRequest in the store."""
    _ensure_data_dir()
    samples = get_all_samples()
    # Replace if ID exists, otherwise prepend or append
    existing_idx = next((i for i, s in enumerate(samples) if s.id == sample.id), None)
    if existing_idx is not None:
        samples[existing_idx] = sample
    else:
        samples.append(sample)
    _save_samples(samples)
    return sample


def delete_sample(sample_id: str) -> bool:
    """Deletes a sample by ID from the persistent store."""
    _ensure_data_dir()
    samples = get_all_samples()
    filtered = [s for s in samples if s.id != sample_id]
    if len(filtered) == len(samples):
        return False
    _save_samples(filtered)
    return True


def reset_samples_to_default() -> List[SampleRequest]:
    """Resets the persistent store back to the 5 baseline enterprise mock scenarios."""
    _ensure_data_dir()
    _save_samples(DEFAULT_MOCK_REQUESTS)
    return DEFAULT_MOCK_REQUESTS


def _save_samples(samples: List[SampleRequest]):
    """Internal helper to write samples to JSON."""
    _ensure_data_dir()
    with open(SAMPLES_FILE, "w", encoding="utf-8") as f:
        json.dump([s.model_dump() for s in samples], f, indent=2)


# Backwards compatibility: reference to dynamic list
class _MockRequestsProxy(list):
    """Proxy list to maintain backwards compatibility with `from app.mock_data import MOCK_REQUESTS`."""
    def __iter__(self):
        return iter(get_all_samples())

    def __len__(self):
        return len(get_all_samples())

    def __getitem__(self, index):
        return get_all_samples()[index]


MOCK_REQUESTS = _MockRequestsProxy()


# ==============================================================================
# Scenario C: Inbound Live / Simulated Webhook Message Queue
# ==============================================================================

# Seed messages for initial inbox experience
DEFAULT_INBOX_MESSAGES: List[InboxMessage] = [
    InboxMessage(
        id="inbox-msg-1",
        source="Stripe Webhook",
        sender="notifications@stripe.com (re: Dispute dp_9104)",
        channel="Payment Gateway Webhook",
        subject="Chargeback Warning: Account Disputed $3,800.00",
        body=(
            "Notification from Stripe: Dispute dp_9104 has been raised by cardholder for $3,800.00. "
            "Reason: Unrecognized transaction. Please provide invoice proof and service fulfillment logs "
            "before Friday 5:00 PM EST to prevent automatic forfeiture."
        ),
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="pending",
    ),
    InboxMessage(
        id="inbox-msg-2",
        source="Zendesk P1",
        sender="Kavita Raman (Director of Engineering, AlphaCloud)",
        channel="Support API Webhook",
        subject="[P1-INCIDENT] Database Connection Pool Exhaustion",
        body=(
            "CRITICAL ALERT: Our integration service is receiving HTTP 500 across all endpoints. "
            "Your database connection pool appears exhausted after your 2:00 PM deployment. "
            "Our automated test suites are failing and production ingest is backed up by 50,000 events."
        ),
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="pending",
    ),
    InboxMessage(
        id="inbox-msg-3",
        source="Website Form",
        sender="Brian Kelly (VP Technology, Vanguard Retail)",
        channel="Inbound Contact Form",
        subject="Enterprise Evaluation & Custom Architecture Review",
        body=(
            "Hi, We are looking to replace our legacy customer triage system with an LLM-powered solution. "
            "We handle roughly 8,000 customer inquiries per day. Could we set up a discovery call with your "
            "solutions engineering team this Thursday or Friday?"
        ),
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="pending",
    ),
]


def get_all_inbox_messages() -> List[InboxMessage]:
    """Retrieves all inbound webhook / live feed messages."""
    _ensure_data_dir()
    if not INBOX_FILE.exists():
        _save_inbox(DEFAULT_INBOX_MESSAGES)
        return DEFAULT_INBOX_MESSAGES

    try:
        with open(INBOX_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [InboxMessage(**item) for item in data]
    except Exception:
        return DEFAULT_INBOX_MESSAGES


def add_inbox_message(message: InboxMessage) -> InboxMessage:
    """Prepends a new inbound message to the top of the queue."""
    _ensure_data_dir()
    messages = get_all_inbox_messages()
    # Add to front of queue
    messages = [message] + [m for m in messages if m.id != message.id]
    _save_inbox(messages)
    return message


def update_inbox_message(message: InboxMessage) -> Optional[InboxMessage]:
    """Updates an existing inbox message (e.g. marking triaged)."""
    _ensure_data_dir()
    messages = get_all_inbox_messages()
    for idx, m in enumerate(messages):
        if m.id == message.id:
            messages[idx] = message
            _save_inbox(messages)
            return message
    return None


def delete_inbox_message(message_id: str) -> bool:
    """Deletes an inbox message by ID."""
    _ensure_data_dir()
    messages = get_all_inbox_messages()
    filtered = [m for m in messages if m.id != message_id]
    if len(filtered) == len(messages):
        return False
    _save_inbox(filtered)
    return True


def clear_inbox_messages() -> bool:
    """Clears all messages from the inbox queue."""
    _ensure_data_dir()
    _save_inbox([])
    return True


def _save_inbox(messages: List[InboxMessage]):
    """Internal helper to write inbox queue to JSON."""
    _ensure_data_dir()
    with open(INBOX_FILE, "w", encoding="utf-8") as f:
        json.dump([m.model_dump() for m in messages], f, indent=2)
