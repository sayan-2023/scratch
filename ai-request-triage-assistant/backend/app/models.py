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

