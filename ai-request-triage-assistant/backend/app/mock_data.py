from app.models import CategoryEnum, PriorityEnum, SampleRequest

MOCK_REQUESTS: list[SampleRequest] = [
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
    ),
]

