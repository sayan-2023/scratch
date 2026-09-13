from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class CategoryEnum(str, Enum):
    SALES = "Sales"
    SUPPORT = "Support"
    BILLING = "Billing"
    TECHNICAL = "Technical"
    OTHER = "Other"


class PriorityEnum(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"


class OwnerEnum(str, Enum):
    SALES_TEAM = "Sales Team"
    CLIENT_SUCCESS = "Client Success"
    FINANCE = "Finance"
    ENGINEERING = "Engineering"


class TriageAnalysis(BaseModel):
    """Structured analysis extracted from the unstructured client message."""
    summary: str = Field(
        description="A concise 1-2 sentence summary of what the client is asking or reporting."
    )
    category: CategoryEnum = Field(
        description="The primary category of the request: Sales, Support, Billing, Technical, or Other."
    )
    priority: PriorityEnum = Field(
        description="Urgency level: Low, Medium, High, or Urgent."
    )
    priority_reason: str = Field(
        description="A clear, brief explanation justifying why this priority was assigned."
    )
    assigned_owner: OwnerEnum = Field(
        description="The designated team responsible: Sales Team, Client Success, Finance, or Engineering."
    )


class TriageInput(BaseModel):
    """Request payload sent from the frontend."""
    request_text: str = Field(
        ...,
        min_length=5,
        description="The unstructured raw client message from email, chat, or form."
    )
    api_key: Optional[str] = Field(
        default=None,
        description="Optional Gemini API key passed from the frontend client."
    )


class TriageOutput(BaseModel):
    """Complete triage output returned to the frontend."""
    summary: str
    category: CategoryEnum
    priority: PriorityEnum
    priority_reason: str
    assigned_owner: OwnerEnum
    draft_response: str
    processing_time_ms: Optional[float] = None


class SampleRequest(BaseModel):
    """A pre-configured mock client message for easy 1-click testing."""
    id: str
    title: str
    channel: str
    sender: str
    text: str
    expected_category: CategoryEnum
    expected_priority: PriorityEnum
    is_custom: bool = Field(default=False, description="True if user-created or dynamically generated")


class SampleCreateInput(BaseModel):
    """Input payload to create a new custom preset scenario."""
    title: str = Field(..., min_length=2, description="Short title for scenario preset")
    channel: str = Field(default="Web Form", description="Origin channel e.g. Email, Chat, Form")
    sender: str = Field(..., min_length=2, description="Sender name & role/company")
    text: str = Field(..., min_length=5, description="Full unstructured request text")
    expected_category: CategoryEnum = Field(default=CategoryEnum.SUPPORT)
    expected_priority: PriorityEnum = Field(default=PriorityEnum.MEDIUM)


class GenerateSampleInput(BaseModel):
    """Input payload to request an AI-generated scenario."""
    category: Optional[CategoryEnum] = Field(default=None, description="Target category or None for random")
    priority: Optional[PriorityEnum] = Field(default=None, description="Target urgency or None for random")
    industry: Optional[str] = Field(default=None, description="Optional industry context e.g. Healthcare, Fintech, SaaS")
    api_key: Optional[str] = Field(default=None, description="Optional Gemini API key")


class GeneratedSamplePromptSchema(BaseModel):
    """Schema used by Gemini structured output for synthesizing realistic requests."""
    title: str = Field(description="Short descriptive scenario title, 3 to 6 words")
    channel: str = Field(description="Origin channel like 'Email (support@)', 'Live Chat / Emergency Form', 'Website Form'")
    sender: str = Field(description="Name, title, and company e.g. 'Marcus Vance (CTO, Apex Dynamics)'")
    text: str = Field(description="Authentic, realistic, unstructured client inquiry message body")
    expected_category: CategoryEnum = Field(description="Primary category")
    expected_priority: PriorityEnum = Field(description="Primary urgency level")


class InboxMessage(BaseModel):
    """Inbound message item in the live / simulated webhook queue."""
    id: str
    source: str = Field(default="Webhook", description="Source provider or origin: Zendesk, Stripe, Webhook, Form")
    sender: str
    channel: str = "Webhook"
    subject: Optional[str] = None
    body: str
    timestamp: str
    status: str = "pending"  # "pending" | "triaged"
    triage_result: Optional[TriageOutput] = None


class WebhookIngestInput(BaseModel):
    """Payload accepted by the live webhook ingestion endpoint."""
    source: str = Field(default="Webhook", description="Source provider e.g. Stripe, Zendesk, Web Form, Hubspot")
    sender: str = Field(default="Inbound Client", description="Sender name, email or identifier")
    channel: Optional[str] = Field(default="Webhook", description="Inbound communication channel")
    subject: Optional[str] = Field(default=None, description="Optional subject line")
    body: str = Field(..., min_length=5, description="Raw unstructured message body or payload text")
    auto_triage: bool = Field(default=False, description="Whether to automatically run triage upon ingestion")
    api_key: Optional[str] = Field(default=None, description="Optional Gemini API key for auto-triage")


class InboxSimulationRequest(BaseModel):
    """Request to inject a realistic simulated webhook event."""
    scenario_type: str = Field(
        default="random",
        description="Type of simulation: 'stripe_chargeback', 'zendesk_outage', 'contact_form', 'security_inquiry', or 'random'"
    )
    auto_triage: bool = Field(default=False)
    api_key: Optional[str] = None



class EmailAccount(BaseModel):
    """Configuration for a Gmail sender account."""
    email: str = Field(..., description="Gmail address (e.g. support@gmail.com)")
    app_password: Optional[str] = Field(
        default=None,
        description="16-character Google App Password for SMTP authentication"
    )
    department: Optional[str] = Field(
        default="Default",
        description="Department mapped to this account: 'Default', 'Sales Team', 'Engineering', 'Client Success', 'Finance'"
    )
    display_name: Optional[str] = Field(
        default=None,
        description="Display name for outgoing emails (e.g. 'Apex Support')"
    )
    is_default: bool = Field(
        default=False,
        description="Whether this is the fallback default sender"
    )


class SendEmailRequest(BaseModel):
    """Payload to trigger email transmission."""
    to_emails: List[str] = Field(
        ...,
        min_length=1,
        description="One or more recipient email addresses"
    )
    subject: str = Field(
        ...,
        min_length=1,
        description="Email subject line"
    )
    body: str = Field(
        ...,
        min_length=1,
        description="Draft email body (plain text or markdown)"
    )
    assigned_owner: Optional[str] = Field(
        default=None,
        description="Department owner determined by triage (e.g. 'Engineering', 'Sales Team')"
    )
    sender_email: Optional[str] = Field(
        default=None,
        description="Specific sender email to use if multiple accounts are configured"
    )
    accounts: Optional[List[EmailAccount]] = Field(
        default=None,
        description="List of configured Gmail sender accounts passed from client"
    )
    simulate: bool = Field(
        default=False,
        description="If True or if credentials are simulated, generates delivery logs without real SMTP dispatch"
    )


class SendEmailResponse(BaseModel):
    """Result of the email dispatch operation."""
    success: bool
    message: str
    sent_from: str
    sent_to: List[str]
    subject: str
    timestamp: str
    is_simulation: bool = False
    details: Optional[Dict[str, Any]] = None


class TestEmailAccountRequest(BaseModel):
    """Request payload to test SMTP authentication with Gmail."""
    email: str
    app_password: str


class TestEmailAccountResponse(BaseModel):
    """Response from testing Gmail SMTP authentication."""
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None


# ==============================================================================
# Authentication & Persistent Session History Models
# ==============================================================================

class User(BaseModel):
    """Internal user model including hashed credentials."""
    id: str
    email: str
    name: str
    password_hash: str
    role: str = "User"  # "Admin" | "User"
    avatar_url: Optional[str] = None
    created_at: str


class UserPublic(BaseModel):
    """Public user profile returned to the frontend."""
    id: str
    email: str
    name: str
    role: str
    avatar_url: Optional[str] = None
    created_at: str


class LoginRequest(BaseModel):
    """Credentials payload for logging in."""
    email_or_username: str = Field(..., min_length=3, description="User email address or user ID")
    password: str = Field(..., min_length=4, description="Account password")


class RegisterRequest(BaseModel):
    """Registration payload for new account creation."""
    name: str = Field(..., min_length=2, description="Full name or team handle")
    email: str = Field(..., min_length=5, description="Corporate email address")
    password: str = Field(..., min_length=6, description="Account password (min 6 characters)")
    accounts: Optional[List[EmailAccount]] = Field(default=None, description="Optional configured dispatcher accounts")


class GoogleAuthRequest(BaseModel):
    """Payload for Google OAuth / Gmail sign-in."""
    email: str
    name: str
    google_id: Optional[str] = None
    avatar_url: Optional[str] = None
    accounts: Optional[List[EmailAccount]] = Field(default=None, description="Optional configured dispatcher accounts")


class ForgotPasswordRequest(BaseModel):
    """Payload to initiate a password reset verification code."""
    email: str


class ResetPasswordRequest(BaseModel):
    """Payload to confirm password reset using verification code."""
    email: str
    reset_code: str
    new_password: str = Field(..., min_length=6, description="New password (min 6 characters)")


class AuthResponse(BaseModel):
    """Authentication result with session token and public profile."""
    success: bool
    token: str
    user: UserPublic
    message: str
    is_new_user: Optional[bool] = None
    email_status: Optional[Dict[str, Any]] = None


class SaveEmailConfigRequest(BaseModel):
    """Payload to persist server-configured Gmail accounts."""
    accounts: List[EmailAccount]


class UserHistoryItem(BaseModel):
    """Persistent triage activity item preserved across logins/logouts."""
    id: str
    user_id: str
    text: str
    result: TriageOutput
    timestamp: str


class SaveHistoryRequest(BaseModel):
    """Request to append a completed triage execution to user history."""
    text: str
    result: TriageOutput


