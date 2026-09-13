import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Paper,
  AppBar,
  Toolbar,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  CircularProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import HubIcon from '@mui/icons-material/Hub';
import EmailIcon from '@mui/icons-material/Email';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BoltIcon from '@mui/icons-material/Bolt';
import CheckIcon from '@mui/icons-material/Check';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import LayersIcon from '@mui/icons-material/Layers';
import MemoryIcon from '@mui/icons-material/Memory';
import TuneIcon from '@mui/icons-material/Tune';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SensorsIcon from '@mui/icons-material/Sensors';
import SendIcon from '@mui/icons-material/Send';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CodeIcon from '@mui/icons-material/Code';

import ThemeToggle from './ThemeToggle';
import ScrollReveal from './ScrollReveal';
import { useColorMode } from '../ThemeContext';

const WEBHOOK_PRESETS = [
  {
    id: 'cloudwatch',
    name: '🚨 AWS CloudWatch Alarm',
    channel: 'AWS SNS / CloudWatch Alert',
    badge: 'P1 Infrastructure',
    badgeColor: '#ef4444',
    endpoint: 'POST /api/webhooks/incoming?source=cloudwatch',
    headers: {
      'Content-Type': 'application/json',
      'X-Amz-Sns-Topic-Arn': 'arn:aws:sns:us-east-1:1094827:prod-critical-alarms',
      'X-Amz-Sns-Message-Type': 'Notification',
    },
    rawPayload: {
      alarm_name: 'Checkout_API_504_Gateway_Timeout_Spike',
      alarm_state: 'ALARM',
      severity: 'CRITICAL',
      affected_service: 'api-checkout-cluster-us-east-1',
      threshold: '504 error rate > 5% for 3m (Actual: 42.8%)',
      timestamp: '2026-09-13T17:35:10Z',
      message: 'CRITICAL: Checkout API returning 504 Gateway Timeouts on Visa/Mastercard payments. 840+ customer transactions halted in past 5 minutes. Direct revenue loss in progress.',
    },
    extracted: {
      category: 'Technical',
      priority: 'Urgent',
      priorityReason: 'Production checkout outage causing direct monetary loss and blocking active customer payments.',
      owner: 'Engineering',
      entities: ['Checkout API', '504 Gateway Timeout', '840+ failed transactions', 'Visa/Mastercard'],
      triageSummary: 'Critical payment gateway 504 outage halting checkout transactions with active revenue loss.',
    },
  },
  {
    id: 'stripe',
    name: '💳 Stripe Chargeback Dispute',
    channel: 'Stripe Webhooks API',
    badge: 'Financial Risk',
    badgeColor: '#f59e0b',
    endpoint: 'POST /api/webhooks/stripe?event=charge.dispute.created',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': 't=1726249122,v1=9f82c6109e20a4b7c88',
      'X-Stripe-Event': 'charge.dispute.created',
    },
    rawPayload: {
      event_type: 'charge.dispute.created',
      dispute_id: 'dp_1N9x82Km40vL',
      disputed_amount_cents: 1420000,
      currency: 'usd',
      reason: 'subscription_rate_mismatch',
      evidence_due_date: '2026-09-19T23:59:59Z',
      customer_email: 'sarah.jenkins@apexdynamics.co',
      notes: 'Customer disputed charge of $14,200 citing agreed contract rate of $8,500 on invoice #INV-889.',
    },
    extracted: {
      category: 'Billing',
      priority: 'High',
      priorityReason: 'Active Stripe chargeback dispute with 6-day legal evidence window and contract rate variance.',
      owner: 'Finance',
      entities: ['$14,200 Dispute', 'Invoice #INV-889', 'sarah.jenkins@apexdynamics.co', 'Evidence Due Sep 19'],
      triageSummary: 'Stripe chargeback dispute for $14,200 due to contract rate mismatch. Evidence submission deadline active.',
    },
  },
  {
    id: 'slack',
    name: '💬 Slack VIP Escalation',
    channel: 'Slack Events API / Bot',
    badge: 'VIP Strategic Chat',
    badgeColor: '#8b5cf6',
    endpoint: 'POST /api/integrations/slack/events',
    headers: {
      'Content-Type': 'application/json',
      'X-Slack-Signature': 'v0=a23b49c01827419df82',
      'X-Slack-Request-Timestamp': '1726249140',
    },
    rawPayload: {
      type: 'event_callback',
      event: {
        type: 'app_mention',
        channel: '#enterprise-vip-apex',
        user: 'U04981XZP (Marcus Vance, CTO)',
        account_tier: 'Strategic Tier-1 ($250k ARR)',
        text: '@TriageBot URGENT: Our single sign-on SSO stopped working after the 9 AM maintenance. 120 employees locked out of payroll system!',
      },
    },
    extracted: {
      category: 'Technical',
      priority: 'Urgent',
      priorityReason: 'Tier-1 enterprise CTO reporting complete employee lockout from business-critical payroll portal.',
      owner: 'Engineering',
      entities: ['SSO Lockout', 'Marcus Vance (CTO)', '120 employees', 'Strategic Tier-1 ($250k ARR)'],
      triageSummary: 'Tier-1 client CTO reporting mission-critical SSO lockout blocking 120 employees from payroll.',
    },
  },
  {
    id: 'zendesk',
    name: '📈 Zendesk 250-Seat Expansion',
    channel: 'Zendesk Omnichannel API',
    badge: 'Sales Expansion',
    badgeColor: '#0ea5e9',
    endpoint: 'POST /api/inbound/zendesk/tickets',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer zd_tok_live_9941a',
      'X-Zendesk-Ticket-Id': 'ZD-99412',
    },
    rawPayload: {
      ticket_id: 'ZD-99412',
      organization: 'Enterprise Global (2,500 staff)',
      submitter_email: 'elena.rostova@enterpriseglobal.com',
      subject: 'Executive Approval: Company-wide 250-seat rollout',
      body: 'Our pilot team has completed their evaluation and leadership approved purchasing 250 enterprise seats next quarter. Please send over volume tier contract, custom onboarding schedule, and SOC-2 report.',
    },
    extracted: {
      category: 'Sales',
      priority: 'Medium',
      priorityReason: 'High-probability enterprise seat expansion requiring custom volume quotes and enterprise contract terms.',
      owner: 'Sales Team',
      entities: ['250 Enterprise Seats', 'Enterprise Global', 'SOC-2 Report Request', 'Volume Pricing'],
      triageSummary: 'High-value expansion opportunity for 250 seats requesting volume pricing and SOC-2 documentation.',
    },
  },
];

const STUDIO_PRESETS = [
  {
    id: 'outage',
    title: '🚨 Payment Gateway 504 Outage',
    badge: 'P1 Urgent',
    color: '#ef4444',
    category: 'Technical',
    priority: 'Urgent',
    owner: 'Engineering',
    ownerColor: '#3b82f6',
    text: 'URGENT: Our checkout API is failing with 504 Gateway Timeouts on all Visa & Mastercard transactions. Over $28,000 in customer transactions have failed in the last 45 minutes! We need an on-call engineer right now.',
    summary: 'Critical payment gateway 504 outage halting Visa & Mastercard checkout and causing direct revenue loss.',
    priority_reason: 'Direct enterprise revenue loss, blocked checkouts, and customer churn risk.',
    draft_response: 'Hi team, We have flagged this as an Urgent P1 blocker. Our senior engineering on-call has been paged immediately and is actively inspecting the gateway connection pool.',
  },
  {
    id: 'dispute',
    title: '💳 Invoice Overcharge Dispute',
    badge: 'High Priority',
    color: '#f59e0b',
    category: 'Billing',
    priority: 'High',
    owner: 'Finance',
    ownerColor: '#10b981',
    text: 'Hello, our latest monthly statement charges us $14,200 for 100 seats, but our executed SLA contract specifies a locked enterprise rate of $8,500. Please credit our account before our quarterly audit.',
    summary: 'Invoice discrepancy of $5,700 over contracted $8,500 rate with upcoming quarterly audit deadline.',
    priority_reason: 'Contractual discrepancy threatening account renewal and finance audit escalation.',
    draft_response: 'Hello, Thank you for bringing this contract rate variance to our attention. I have escalated this directly to our billing lead to apply the $5,700 credit adjustment to your invoice immediately.',
  },
  {
    id: 'enterprise',
    title: '📈 250-Seat Enterprise Expansion',
    badge: 'Sales Expansion',
    color: '#8b5cf6',
    category: 'Sales',
    priority: 'Medium',
    owner: 'Sales Team',
    ownerColor: '#8b5cf6',
    text: 'Hi there! We are currently piloting with 15 users and our executive board approved expanding across 250 seats next quarter. Please send over volume discount tiers, SOC-2 compliance package, and custom onboarding terms.',
    summary: 'High-value enterprise expansion for 250 seats requesting custom volume pricing and SOC-2 documentation.',
    priority_reason: 'Significant ARR pipeline opportunity requiring executive sales alignment.',
    draft_response: 'Hi, That is fantastic news! We are excited to support your company-wide expansion. I have connected our Strategic Accounts Director to provide our volume pricing model and SOC-2 compliance docs.',
  },
  {
    id: 'gdpr',
    title: '⚖️ GDPR Right-to-be-Forgotten',
    badge: 'Compliance',
    color: '#0ea5e9',
    category: 'General Inquiry',
    priority: 'High',
    owner: 'Client Success',
    ownerColor: '#0ea5e9',
    text: 'Formal Data Subject Request: In compliance with GDPR Article 17 and CCPA, please permanently purge all personally identifiable information, session history, and email archives associated with user ID usr-9942.',
    summary: 'Formal GDPR Art. 17 / CCPA right-to-be-forgotten request for account and activity purge for user ID usr-9942.',
    priority_reason: 'Statutory compliance deadline with potential regulatory exposure if not fulfilled within SLA.',
    draft_response: 'Hello, We have received your formal Data Subject Request under GDPR/CCPA. Our privacy operations team has initiated the data scrub protocol for user ID usr-9942 and will provide a certificate of deletion within 48 hours.',
  },
];

function computeLocalTriage(text) {
  const lower = (text || '').toLowerCase();
  if (lower.includes('504') || lower.includes('outage') || lower.includes('down') || lower.includes('crash') || lower.includes('fail')) {
    return {
      summary: 'System incident causing service degradation or gateway failure.',
      category: 'Technical',
      priority: 'Urgent',
      priority_reason: 'High customer impact, service availability threat, and operational disruption.',
      assigned_owner: 'Engineering',
      draft_response: 'Hello, We have flagged this issue with our engineering on-call team. We are actively investigating logs and telemetry to restore service as quickly as possible.',
    };
  }
  if (lower.includes('invoice') || lower.includes('bill') || lower.includes('charge') || lower.includes('rate') || lower.includes('refund')) {
    return {
      summary: 'Billing inquiry regarding invoice discrepancy, contract rate, or charge adjustment.',
      category: 'Billing',
      priority: 'High',
      priority_reason: 'Financial discrepancy with immediate client accounting deadlines.',
      assigned_owner: 'Finance',
      draft_response: 'Hello, Thank you for contacting our finance team. We are reviewing your billing ledger against your contracted terms and will follow up with an updated statement shortly.',
    };
  }
  if (lower.includes('seat') || lower.includes('pricing') || lower.includes('expansion') || lower.includes('enterprise') || lower.includes('pilot')) {
    return {
      summary: 'Commercial inquiry regarding seat expansion, volume licensing, and enterprise terms.',
      category: 'Sales',
      priority: 'Medium',
      priority_reason: 'Expansion pipeline opportunity requiring enterprise proposal preparation.',
      assigned_owner: 'Sales Team',
      draft_response: 'Hi, Thank you for reaching out! We would be delighted to assist with your expansion. A senior enterprise account executive has been assigned and will share pricing details shortly.',
    };
  }
  return {
    summary: text.slice(0, 120) + (text.length > 120 ? '...' : ''),
    category: 'General Inquiry',
    priority: 'Medium',
    priority_reason: 'Inbound client inquiry requiring standard team coordination and triage.',
    assigned_owner: 'Client Success',
    draft_response: 'Hello, Thank you for contacting support. We have received your inquiry and our client success team is actively reviewing your request.',
  };
}

export default function LandingPage({
  onLaunchWorkspace,
  onOpenAuthModal,
  currentUser,
  onLogout,
}) {
  const { isDark } = useColorMode();
  const [activeDemoTab, setActiveDemoTab] = useState('technical');
  const [aiStudioOpen, setAiStudioOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('outage');
  const [studioText, setStudioText] = useState(STUDIO_PRESETS[0].text);
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioStep, setStudioStep] = useState(0);
  const [studioResult, setStudioResult] = useState(STUDIO_PRESETS[0]);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Inbound Webhook Simulator State
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [selectedWebhookId, setSelectedWebhookId] = useState('cloudwatch');
  const [dispatchingWebhook, setDispatchingWebhook] = useState(false);
  const [webhookDispatched, setWebhookDispatched] = useState(false);
  const [webhookLatency, setWebhookLatency] = useState(142);
  const [copiedWebhookPayload, setCopiedWebhookPayload] = useState(false);

  const activeWebhook = WEBHOOK_PRESETS.find((w) => w.id === selectedWebhookId) || WEBHOOK_PRESETS[0];

  const handleDispatchWebhook = () => {
    setDispatchingWebhook(true);
    setWebhookDispatched(false);
    setTimeout(() => {
      setDispatchingWebhook(false);
      setWebhookDispatched(true);
      setWebhookLatency(Math.floor(Math.random() * 65) + 115);
    }, 450);
  };

  const handleCopyWebhookPayload = (payload) => {
    navigator.clipboard.writeText(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
    setCopiedWebhookPayload(true);
    setTimeout(() => setCopiedWebhookPayload(false), 2000);
  };

  const handleTransferToStudio = (webhook) => {
    const textToTransfer =
      webhook.rawPayload.message ||
      webhook.rawPayload.notes ||
      webhook.rawPayload.body ||
      (webhook.rawPayload.event && webhook.rawPayload.event.text) ||
      '';
    setStudioText(textToTransfer);
    const triage = computeLocalTriage(textToTransfer);
    setStudioResult({
      title: webhook.name,
      ...triage,
      category: webhook.extracted.category,
      priority: webhook.extracted.priority,
      priority_reason: webhook.extracted.priorityReason,
      assigned_owner: webhook.extracted.owner,
      draft_response: `Hi, Thank you for contacting our team. We have ingested your event payload and our ${webhook.extracted.owner} team has been routed with priority SLA.`,
    });
    setWebhookModalOpen(false);
    setAiStudioOpen(true);
  };

  // Scroll tracking states
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activePipelineStep, setActivePipelineStep] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;

      setScrollProgress(scrolled);
      setHasScrolled(winScroll > 20);
      setShowBackToTop(winScroll > 450);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    setStudioText(preset.text);
    setStudioResult(preset);
  };

  const handleRunStudioAnalysis = async (customText) => {
    const textToAnalyze = (customText || studioText).trim();
    if (!textToAnalyze) return;

    setStudioLoading(true);
    setStudioStep(1);

    const timer1 = setTimeout(() => setStudioStep(2), 250);
    const timer2 = setTimeout(() => setStudioStep(3), 550);
    const timer3 = setTimeout(() => setStudioStep(4), 850);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_text: textToAnalyze }),
      });

      if (res.ok) {
        const data = await res.json();
        setStudioResult(data);
      } else {
        setStudioResult(computeLocalTriage(textToAnalyze));
      }
    } catch {
      setStudioResult(computeLocalTriage(textToAnalyze));
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setStudioStep(4);
      setTimeout(() => setStudioLoading(false), 300);
    }
  };

  const handleCopyDraft = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const demoScenarios = {
    technical: {
      title: 'Production SSO Outage',
      sender: 'Marcus Vance (CTO, Apex Dynamics)',
      channel: 'Emergency Chat',
      text: 'URGENT: Our production SSO login portal has been completely unresponsive since 9:00 AM EST. None of our 120 employees can log in, and our monthly payroll processing is completely halted. Seeing 504 Gateway Timeouts!',
      summary: 'Production SSO gateway failure returning 504 timeouts, halting payroll operations for 120 employees.',
      category: 'Technical',
      priority: 'Urgent',
      priorityColor: '#ef4444',
      owner: 'Engineering',
      ownerColor: '#3b82f6',
      draftSnippet: 'Hi Marcus, We understand this is a mission-critical blocker halting your team payroll. Our engineering on-call has been paged immediately to restore the SSO gateway.',
    },
    billing: {
      title: 'Invoice Dispute & Overcharge',
      sender: 'Sarah Jenkins (Director of Finance)',
      channel: 'Email (billing@)',
      text: 'Hello, I just reviewed invoice #INV-2024-889 and noticed we were billed $14,200 instead of our contracted $8,500 rate. Please issue a corrected invoice before our CFO freezes renewals.',
      summary: 'Erroneous $14,200 invoice charge disputed against agreed $8,500 contract rate with CFO renewal deadline.',
      category: 'Billing',
      priority: 'High',
      priorityColor: '#f59e0b',
      owner: 'Finance',
      ownerColor: '#10b981',
      draftSnippet: 'Hi Sarah, Thank you for flagging the discrepancy on invoice #889. I have forwarded this to our senior billing specialist to issue a corrected invoice immediately.',
    },
    sales: {
      title: 'Enterprise 250-Seat Expansion',
      sender: 'Elena Rostova (VP Operations)',
      channel: 'Website Form',
      text: 'We are planning to expand company-wide across 250 seats next quarter. Could someone send over volume pricing, SOC-2 compliance docs, and schedule a leadership demo?',
      summary: 'Expansion inquiry for 250 enterprise seats requesting volume pricing, SOC-2 report, and product demo.',
      category: 'Sales',
      priority: 'Medium',
      priorityColor: '#0ea5e9',
      owner: 'Sales Team',
      ownerColor: '#8b5cf6',
      draftSnippet: 'Hi Elena, We are thrilled to hear your pilot team loves the platform! I have connected our Enterprise Solutions Director to schedule your demo and share our SOC-2 report.',
    },
    gdpr: {
      title: 'GDPR Right-to-be-Forgotten',
      sender: 'Dr. Klaus Weber (Data Protection Officer)',
      channel: 'Compliance Form',
      text: 'Formal Data Subject Request: In compliance with GDPR Article 17 and CCPA, please permanently purge all personally identifiable information and session history for user ID usr-9942.',
      summary: 'Statutory compliance data purge request under GDPR Art. 17 requiring 48h SLA response.',
      category: 'General Inquiry',
      priority: 'High',
      priorityColor: '#0ea5e9',
      owner: 'Client Success',
      ownerColor: '#0ea5e9',
      draftSnippet: 'Hello Dr. Weber, We have received your formal Data Subject Request. Our privacy operations team has initiated the data purge protocol and will issue a certificate of deletion within 48 hours.',
    },
  };

  const currentDemo = demoScenarios[activeDemoTab] || demoScenarios.technical;

  const pipelineStages = [
    {
      step: '01',
      title: 'Inbound Ingestion',
      subtitle: 'Omnichannel Connectors',
      icon: <MoveToInboxIcon sx={{ fontSize: 28 }} />,
      color: '#3b82f6',
      desc: 'Raw inputs from email threads, webhooks, Zendesk tickets, or live chats are sanitized and tokenized.',
      detail: 'Supports JSON payloads, plain text, and Gmail IMAP/SMTP polling with automatic deduplication.',
    },
    {
      step: '02',
      title: 'Gemini Intent Extraction',
      subtitle: 'Cognitive Reasoning',
      icon: <MemoryIcon sx={{ fontSize: 28 }} />,
      color: '#8b5cf6',
      desc: 'Deep linguistic parsing separates urgent business implications from client panic and filler noise.',
      detail: 'LangGraph state extracts core issue, affected entities, and quantifiable financial or operational loss.',
    },
    {
      step: '03',
      title: 'Risk & Urgency Scoring',
      subtitle: 'Defensible SLA Matrix',
      icon: <SecurityIcon sx={{ fontSize: 28 }} />,
      color: '#ef4444',
      desc: 'Grades requests into Urgent, High, Medium, or Low with transparent, audit-ready reasoning.',
      detail: 'Evaluates production blockers, legal deadlines, executive escalation, or contract terms.',
    },
    {
      step: '04',
      title: 'Deterministic Routing',
      subtitle: 'Multi-Team Dispatch',
      icon: <HubIcon sx={{ fontSize: 28 }} />,
      color: '#10b981',
      desc: 'Directs the inquiry to Engineering, Finance, Sales, or Client Success with zero hallucination.',
      detail: 'Eliminates cross-department ticket ping-pong and guarantees clear ownership from second one.',
    },
    {
      step: '05',
      title: 'Empathetic Auto-Draft',
      subtitle: 'Gmail SMTP Ready',
      icon: <EmailIcon sx={{ fontSize: 28 }} />,
      color: '#ec4899',
      desc: 'Generates context-aware, empathetic first replies ready for 1-click human approval or auto-dispatch.',
      detail: 'Configurable between Safe Simulation Mode and authenticated live Google SMTP delivery.',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: isDark ? '#080c14' : '#f8fafc',
        color: isDark ? '#f8fafc' : '#0f172a',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top Scroll Progress Indicator */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 3.5,
          zIndex: 2000,
          backgroundColor: 'transparent',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${scrollProgress}%`,
            background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
            boxShadow: '0 0 10px rgba(139, 92, 246, 0.7)',
            transition: 'width 0.1s ease-out',
          }}
        />
      </Box>

      {/* Top Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: hasScrolled
            ? isDark
              ? 'rgba(8, 12, 20, 0.92)'
              : 'rgba(255, 255, 255, 0.92)'
            : isDark
            ? 'rgba(8, 12, 20, 0.65)'
            : 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(24px)',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.07)',
          boxShadow: hasScrolled
            ? isDark
              ? '0 12px 32px -10px rgba(0, 0, 0, 0.65)'
              : '0 12px 30px -10px rgba(0, 0, 0, 0.08)'
            : 'none',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          py: hasScrolled ? 0.3 : 0.8,
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1.5px',
            background: hasScrolled
              ? 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), rgba(168, 85, 247, 0.6), rgba(236, 72, 153, 0.5), transparent)'
              : 'transparent',
            backgroundSize: '200% 100%',
            animation: 'headerShimmer 6s linear infinite',
          },
          '@keyframes headerShimmer': {
            '0%': { backgroundPosition: '0% 0%' },
            '100%': { backgroundPosition: '200% 0%' },
          },
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0, sm: 1 } }}>
            {/* Logo with Animated Glow & Live Beacon */}
            <Box
              onClick={() => scrollToSection('overview')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'transform 0.25s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            >
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%)',
                  backgroundSize: '200% 200%',
                  animation: 'logoGradient 6s ease infinite alternate',
                  color: '#fff',
                  p: 0.9,
                  borderRadius: 2.2,
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: isDark
                    ? '0 4px 18px rgba(124, 58, 237, 0.45)'
                    : '0 4px 14px rgba(37, 99, 235, 0.35)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    transform: 'rotate(-6deg) scale(1.08)',
                    boxShadow: '0 6px 24px rgba(236, 72, 153, 0.55)',
                  },
                  '@keyframes logoGradient': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '100%': { backgroundPosition: '100% 50%' },
                  },
                }}
              >
                <SmartToyIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="800"
                    sx={{
                      color: isDark ? '#ffffff' : '#0f172a',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2,
                    }}
                  >
                    AI Request Triage
                  </Typography>
                  <Box
                    sx={{
                      px: 0.8,
                      py: 0.15,
                      borderRadius: 1.5,
                      fontSize: '0.62rem',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      color: '#10b981',
                      display: { xs: 'none', sm: 'inline-flex' },
                      alignItems: 'center',
                      gap: 0.4,
                    }}
                  >
                    <Box
                      sx={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        animation: 'liveDot 1.5s ease-in-out infinite',
                        '@keyframes liveDot': {
                          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                          '50%': { opacity: 0.4, transform: 'scale(0.7)' },
                        },
                      }}
                    />
                    LIVE
                  </Box>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                  }}
                >
                  LangGraph • Google Gemini 2.0
                </Typography>
              </Box>
            </Box>

            {/* Desktop Capsule Navigation Links */}
            <Stack
              direction="row"
              spacing={0.8}
              alignItems="center"
              sx={{
                display: { xs: 'none', md: 'flex' },
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                p: 0.6,
                borderRadius: 50,
                border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              {[
                { label: 'Overview', target: 'overview' },
                { label: 'Live Demo', target: 'interactive-demo' },
                { label: 'Pipeline', target: 'pipeline' },
                { label: 'Comparison', target: 'comparison' },
                { label: 'Capabilities', target: 'capabilities' },
                { label: 'FAQ', target: 'faq' },
              ].map((link) => (
                <Box
                  key={link.target}
                  onClick={() => scrollToSection(link.target)}
                  sx={{
                    px: 1.8,
                    py: 0.6,
                    borderRadius: 50,
                    cursor: 'pointer',
                    userSelect: 'none',
                    position: 'relative',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.16)' : 'rgba(37, 99, 235, 0.09)',
                      transform: 'translateY(-1px)',
                      '& .nav-text': {
                        color: isDark ? '#c084fc' : '#2563eb',
                      },
                    },
                  }}
                >
                  <Typography
                    className="nav-text"
                    variant="body2"
                    sx={{
                      color: isDark ? '#cbd5e1' : '#475569',
                      fontWeight: 600,
                      fontSize: '0.84rem',
                      letterSpacing: '-0.01em',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {link.label}
                  </Typography>
                </Box>
              ))}
            </Stack>

            {/* Actions & User State */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ThemeToggle size="small" />

              {currentUser ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip
                    avatar={<Avatar src={currentUser.avatar_url}>{currentUser.name[0]}</Avatar>}
                    label={currentUser.name}
                    variant="outlined"
                    size="small"
                    sx={{
                      color: isDark ? '#f8fafc' : '#0f172a',
                      borderColor: isDark ? '#475569' : '#cbd5e1',
                      fontWeight: 600,
                      display: { xs: 'none', sm: 'inline-flex' },
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={onLaunchWorkspace}
                    startIcon={<ArrowForwardIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      fontWeight: 700,
                      borderRadius: 2.2,
                      px: 2.2,
                      textTransform: 'none',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(124, 58, 237, 0.5)',
                      },
                    }}
                  >
                    Open Workspace
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="small"
                    onClick={onLogout}
                    sx={{
                      borderColor: isDark ? '#475569' : '#cbd5e1',
                      color: isDark ? '#cbd5e1' : '#64748b',
                      textTransform: 'none',
                      borderRadius: 2,
                    }}
                  >
                    Logout
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1.2}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="small"
                    onClick={onOpenAuthModal}
                    sx={{
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      color: isDark ? '#f8fafc' : '#334155',
                      borderRadius: 2.2,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2,
                      py: 0.6,
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isDark ? '#60a5fa' : '#2563eb',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={onOpenAuthModal}
                    startIcon={
                      <FlashOnIcon
                        sx={{
                          animation: 'sparkle 2.2s ease-in-out infinite',
                          '@keyframes sparkle': {
                            '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                            '50%': { transform: 'scale(1.25) rotate(12deg)', opacity: 0.85 },
                          },
                        }}
                      />
                    }
                    sx={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%)',
                      backgroundSize: '200% 200%',
                      animation: 'launchGradient 5s ease infinite alternate',
                      fontWeight: 700,
                      borderRadius: 2.2,
                      textTransform: 'none',
                      px: 2.5,
                      py: 0.7,
                      boxShadow: isDark
                        ? '0 4px 18px rgba(124, 58, 237, 0.45)'
                        : '0 4px 16px rgba(37, 99, 235, 0.35)',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(236, 72, 153, 0.55)',
                      },
                      '@keyframes launchGradient': {
                        '0%': { backgroundPosition: '0% 50%' },
                        '100%': { backgroundPosition: '100% 50%' },
                      },
                    }}
                  >
                    Launch App
                  </Button>
                </Stack>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 1500,
            animation: 'fadeInUp 0.3s ease-out',
            '@keyframes fadeInUp': {
              from: { opacity: 0, transform: 'translateY(16px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Tooltip title="Back to top" arrow placement="left">
            <IconButton
              onClick={scrollToTop}
              sx={{
                background: isDark
                  ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                  : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                width: 46,
                height: 46,
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 30px rgba(124, 58, 237, 0.55)',
                },
              }}
            >
              <KeyboardArrowUpIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* HERO SECTION */}
      <Box
        id="overview"
        sx={{
          pt: { xs: 8, md: 13 },
          pb: { xs: 8, md: 12 },
          background: isDark
            ? 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59, 130, 246, 0.22), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139, 92, 246, 0.15), transparent 60%)'
            : 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99, 102, 241, 0.12), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(236, 72, 153, 0.08), transparent 60%)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Animated Radar Pulse Badge */}
          <ScrollReveal direction="down" duration={600}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.2,
                px: 2,
                py: 0.8,
                borderRadius: 50,
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(124, 58, 237, 0.08)',
                border: isDark ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid rgba(124, 58, 237, 0.25)',
                color: isDark ? '#c084fc' : '#7c3aed',
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '0.04em',
                mb: 3.5,
                boxShadow: isDark ? '0 0 20px rgba(139, 92, 246, 0.2)' : '0 2px 10px rgba(124, 58, 237, 0.1)',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: -4,
                    left: -4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    opacity: 0.5,
                    animation: 'radarPing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
                  },
                  '@keyframes radarPing': {
                    '0%': { transform: 'scale(0.8)', opacity: 0.8 },
                    '75%, 100%': { transform: 'scale(2.2)', opacity: 0 },
                  },
                }}
              />
              <span>✦ NEXT-GEN TRIAGE ENGINE • GEMINI & LANGGRAPH</span>
            </Box>
          </ScrollReveal>

          {/* Main Hero Headline */}
          <ScrollReveal direction="up" delay={100} duration={800}>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.035em',
                lineHeight: { xs: 1.15, md: 1.1 },
                fontSize: { xs: '2.5rem', sm: '3.6rem', md: '4.4rem' },
                color: isDark ? '#ffffff' : '#0f172a',
                mb: 3,
                maxWidth: 1020,
                mx: 'auto',
              }}
            >
              Turn Chaotic Client Inquiries into{' '}
              <Box
                component="span"
                sx={{
                  background: isDark
                    ? 'linear-gradient(135deg, #60a5fa 0%, #c084fc 50%, #f472b6 100%)'
                    : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                }}
              >
                Instant Action & Replies
              </Box>
            </Typography>
          </ScrollReveal>

          {/* Hero Subtitle */}
          <ScrollReveal direction="up" delay={200} duration={800}>
            <Typography
              variant="h6"
              sx={{
                color: isDark ? '#94a3b8' : '#475569',
                maxWidth: 820,
                mx: 'auto',
                mb: 5,
                fontWeight: 400,
                fontSize: { xs: '1rem', md: '1.2rem' },
                lineHeight: 1.65,
              }}
            >
              An enterprise cognitive engine that digests messy emails, chats, Zendesk tickets, and webhook payloads.
              Extracts core intent, computes defensible urgency, routes to exact teams, and synthesizes empathetic replies in seconds.
            </Typography>
          </ScrollReveal>

          {/* Action CTAs */}
          <ScrollReveal direction="up" delay={300} duration={800}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2.5}
              justifyContent="center"
              alignItems="center"
              sx={{ mb: 7 }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => setAiStudioOpen(true)}
                startIcon={<AutoAwesomeIcon sx={{ color: '#fbcfe8' }} />}
                endIcon={<FlashOnIcon sx={{ color: '#fef08a' }} />}
                sx={{
                  py: 1.8,
                  px: 4,
                  fontSize: '1.08rem',
                  fontWeight: 800,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
                  boxShadow: isDark
                    ? '0 8px 32px rgba(139, 92, 246, 0.45)'
                    : '0 8px 24px rgba(139, 92, 246, 0.3)',
                  textTransform: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #f43f5e 0%, #7c3aed 50%, #2563eb 100%)',
                    boxShadow: '0 12px 36px rgba(236, 72, 153, 0.55)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                ⚡ Try Live AI Triage Studio
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={() => setWebhookModalOpen(true)}
                startIcon={
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 2px 10px rgba(99, 102, 241, 0.45)',
                      animation: 'iconPulse 3s ease-in-out infinite',
                      '@keyframes iconPulse': {
                        '0%, 100%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.08)' },
                      },
                    }}
                  >
                    <HubIcon sx={{ fontSize: 18 }} />
                  </Box>
                }
                endIcon={
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.7,
                      px: 1.3,
                      py: 0.35,
                      borderRadius: 50,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      color: '#10b981',
                      boxShadow: '0 0 12px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        boxShadow: '0 0 8px #10b981',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: -3,
                          left: -3,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          opacity: 0.6,
                          animation: 'radarPing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
                        },
                        '@keyframes radarPing': {
                          '0%': { transform: 'scale(0.8)', opacity: 0.8 },
                          '75%, 100%': { transform: 'scale(2.4)', opacity: 0 },
                        },
                      }}
                    />
                    <span>LIVE</span>
                  </Box>
                }
                sx={{
                  py: 1.5,
                  px: 3.2,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  borderRadius: 3,
                  borderColor: isDark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(124, 58, 237, 0.3)',
                  color: isDark ? '#ffffff' : '#0f172a',
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
                  backdropFilter: 'blur(20px)',
                  textTransform: 'none',
                  boxShadow: isDark
                    ? '0 0 0 1.5px rgba(139, 92, 246, 0.35), 0 8px 30px -4px rgba(0, 0, 0, 0.5), 0 0 20px rgba(124, 58, 237, 0.2)'
                    : '0 0 0 1.5px rgba(124, 58, 237, 0.25), 0 8px 24px -4px rgba(124, 58, 237, 0.12), 0 0 16px rgba(124, 58, 237, 0.08)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                    animation: 'shimmerSweep 4.5s infinite ease-in-out',
                  },
                  '@keyframes shimmerSweep': {
                    '0%': { left: '-100%' },
                    '20%': { left: '120%' },
                    '100%': { left: '120%' },
                  },
                  '&:hover': {
                    borderColor: isDark ? '#a855f7' : '#7c3aed',
                    backgroundColor: isDark ? 'rgba(25, 33, 58, 0.95)' : '#ffffff',
                    transform: 'translateY(-2px)',
                    boxShadow: isDark
                      ? '0 0 0 2px rgba(168, 85, 247, 0.6), 0 12px 36px -4px rgba(0, 0, 0, 0.65), 0 0 30px rgba(139, 92, 246, 0.45)'
                      : '0 0 0 2px rgba(124, 58, 237, 0.45), 0 12px 32px -4px rgba(124, 58, 237, 0.25), 0 0 24px rgba(124, 58, 237, 0.18)',
                  },
                }}
              >
                Inbound Webhook Simulator
              </Button>
            </Stack>
          </ScrollReveal>

          {/* Micro Trust Pills */}
          <ScrollReveal direction="fade" delay={400} duration={800}>
            <Stack
              direction="row"
              spacing={{ xs: 1.5, sm: 3 }}
              justifyContent="center"
              alignItems="center"
              flexWrap="wrap"
              sx={{ gap: 1.5, color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.85rem', fontWeight: 500 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                <span>Sub-second Gemini 2.0 Triage</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                <span>LangGraph Deterministic Nodes</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                <span>Zero Data Retention</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                <span>Safe SMTP Simulation Mode</span>
              </Box>
            </Stack>
          </ScrollReveal>
        </Container>
      </Box>

      {/* METRICS BANNER (Staggered Scroll Reveal) */}
      <Container maxWidth="lg" sx={{ mt: -4, mb: 10, position: 'relative', zIndex: 2 }}>
        <Paper
          elevation={0}
          sx={{
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            boxShadow: isDark
              ? '0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.1)'
              : '0 20px 40px -10px rgba(0, 0, 0, 0.08)',
            borderRadius: 4,
            p: { xs: 3, md: 4 },
          }}
        >
          <Grid container spacing={3} alignItems="center">
            {[
              {
                stat: '99.4%',
                label: 'Routing Accuracy',
                desc: 'Deterministic multi-team mapping',
                color: '#3b82f6',
                delay: 0,
              },
              {
                stat: '< 1.5s',
                label: 'Average Triage Speed',
                desc: 'End-to-end intent & response',
                color: '#10b981',
                delay: 100,
              },
              {
                stat: '4 Teams',
                label: 'Target Units',
                desc: 'Eng, Sales, Finance, CS',
                color: '#8b5cf6',
                delay: 200,
              },
              {
                stat: '100%',
                label: 'Webhook Reliability',
                desc: 'Zero packet or ticket loss',
                color: '#f59e0b',
                delay: 300,
              },
            ].map((item, idx) => (
              <Grid item xs={6} md={3} key={idx}>
                <ScrollReveal direction="up" delay={item.delay} duration={600}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography
                      variant="h3"
                      fontWeight="900"
                      sx={{
                        color: item.color,
                        letterSpacing: '-0.03em',
                        fontSize: { xs: '2rem', md: '2.8rem' },
                        lineHeight: 1.1,
                        mb: 0.5,
                      }}
                    >
                      {item.stat}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      fontWeight="700"
                      sx={{
                        color: isDark ? '#f8fafc' : '#0f172a',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontSize: '0.78rem',
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDark ? '#94a3b8' : '#64748b',
                        display: 'block',
                        mt: 0.3,
                      }}
                    >
                      {item.desc}
                    </Typography>
                  </Box>
                </ScrollReveal>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>

      {/* INTERACTIVE DEMO PREVIEW (Scroll Triggered) */}
      <Container maxWidth="lg" id="interactive-demo" sx={{ scrollMarginTop: 90, mb: 14 }}>
        <ScrollReveal direction="up" duration={700}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Chip
              label="REAL-WORLD SIMULATOR"
              size="small"
              sx={{
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                color: isDark ? '#60a5fa' : '#2563eb',
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                mb: 1.5,
              }}
            />
            <Typography variant="h3" fontWeight="800" sx={{ letterSpacing: '-0.02em', mb: 1 }}>
              Inspect the AI Triage Engine in Action
            </Typography>
            <Typography variant="body1" sx={{ color: isDark ? '#94a3b8' : '#64748b', maxWidth: 640, mx: 'auto' }}>
              Switch between production crisis scenarios and observe how LangGraph extracts structured attributes from raw text.
            </Typography>
          </Box>
        </ScrollReveal>

        {/* Tab Switchers */}
        <ScrollReveal direction="fade" delay={150}>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1.5, mb: 4 }}>
            {[
              { id: 'technical', label: '🔴 Technical Outage', color: '#ef4444' },
              { id: 'billing', label: '🟠 Billing Dispute', color: '#f59e0b' },
              { id: 'sales', label: '🟣 Enterprise Expansion', color: '#8b5cf6' },
              { id: 'gdpr', label: '🔵 GDPR Compliance', color: '#0ea5e9' },
            ].map((tab) => {
              const active = activeDemoTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant={active ? 'contained' : 'outlined'}
                  size="medium"
                  onClick={() => setActiveDemoTab(tab.id)}
                  sx={{
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 2.5,
                    py: 1,
                    backgroundColor: active
                      ? isDark
                        ? '#3b82f6'
                        : '#2563eb'
                      : isDark
                      ? 'rgba(30, 41, 59, 0.5)'
                      : '#ffffff',
                    borderColor: active ? 'transparent' : isDark ? '#334155' : '#cbd5e1',
                    color: active ? '#ffffff' : isDark ? '#cbd5e1' : '#475569',
                    boxShadow: active ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: active
                        ? '#1d4ed8'
                        : isDark
                        ? 'rgba(51, 65, 85, 0.7)'
                        : '#f1f5f9',
                    },
                  }}
                >
                  {tab.label}
                </Button>
              );
            })}
          </Box>
        </ScrollReveal>

        {/* Window Shell */}
        <ScrollReveal direction="zoom" delay={200} duration={800}>
          <Paper
            elevation={0}
            sx={{
              textAlign: 'left',
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: isDark
                ? '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(59, 130, 246, 0.12)'
                : '0 25px 50px -15px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Window Header */}
            <Box
              sx={{
                px: 3,
                py: 2,
                backgroundColor: isDark ? '#090d16' : '#f8fafc',
                borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981' }} />
                <Typography
                  variant="caption"
                  sx={{
                    ml: 1.5,
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                >
                  langgraph-triage-node • {currentDemo.title}
                </Typography>
              </Box>

              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedPreset(activeDemoTab);
                  setStudioText(currentDemo.text);
                  setStudioResult(currentDemo);
                  setAiStudioOpen(true);
                }}
                endIcon={<AutoAwesomeIcon fontSize="small" />}
                sx={{
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  color: isDark ? '#cbd5e1' : '#475569',
                  textTransform: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: 1.8,
                  py: 0.3,
                  '&:hover': {
                    borderColor: '#8b5cf6',
                    color: isDark ? '#fff' : '#0f172a',
                    backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.08)',
                  },
                }}
              >
                Inspect in Live Studio ↗
              </Button>
            </Box>

            <Grid container>
              {/* Left Column: Raw Message */}
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRight: { md: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0' },
                  borderBottom: { xs: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0', md: 'none' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDark ? '#94a3b8' : '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 700,
                    }}
                  >
                    Inbound Client Message
                  </Typography>
                  <Chip
                    label={currentDemo.channel}
                    size="small"
                    sx={{
                      fontSize: '0.7rem',
                      height: 22,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                      color: isDark ? '#94a3b8' : '#64748b',
                    }}
                  />
                </Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="700"
                  sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1.5 }}
                >
                  {currentDemo.sender}
                </Typography>
                <Box
                  sx={{
                    p: 2.5,
                    backgroundColor: isDark ? 'rgba(8, 12, 20, 0.7)' : '#f8fafc',
                    borderRadius: 2.5,
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                    fontFamily: 'monospace',
                    fontSize: '0.86rem',
                    lineHeight: 1.7,
                    color: isDark ? '#cbd5e1' : '#334155',
                    minHeight: 160,
                  }}
                >
                  "{currentDemo.text}"
                </Box>
              </Grid>

              {/* Right Column: AI Triage Output */}
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  p: { xs: 3, md: 4 },
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : '#fafbfc',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark ? '#94a3b8' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 700,
                  }}
                >
                  LangGraph State Machine Extraction
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 1.5, mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    size="small"
                    label={`Priority: ${currentDemo.priority}`}
                    sx={{
                      backgroundColor: currentDemo.priorityColor,
                      color: '#fff',
                      fontWeight: 800,
                      boxShadow: `0 2px 8px ${currentDemo.priorityColor}55`,
                    }}
                  />
                  <Chip
                    size="small"
                    label={`Category: ${currentDemo.category}`}
                    variant="outlined"
                    sx={{
                      color: isDark ? '#e2e8f0' : '#334155',
                      borderColor: isDark ? '#475569' : '#cbd5e1',
                      backgroundColor: isDark ? 'transparent' : '#ffffff',
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    size="small"
                    label={`Route: ${currentDemo.owner}`}
                    sx={{
                      backgroundColor: currentDemo.ownerColor,
                      color: '#fff',
                      fontWeight: 700,
                      boxShadow: `0 2px 8px ${currentDemo.ownerColor}55`,
                    }}
                  />
                </Stack>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                    EXECUTIVE BRIEFING
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDark ? '#e2e8f0' : '#1e293b',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      mt: 0.3,
                    }}
                  >
                    {currentDemo.summary}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    backgroundColor: isDark ? 'rgba(8, 12, 20, 0.85)' : '#ffffff',
                    borderRadius: 2.5,
                    border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
                    fontSize: '0.86rem',
                    color: isDark ? '#93c5fd' : '#1d4ed8',
                    position: 'relative',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                    <BoltIcon sx={{ fontSize: 16, color: '#ec4899' }} />
                    <Typography
                      variant="caption"
                      fontWeight="700"
                      sx={{
                        color: isDark ? '#f472b6' : '#db2777',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      AI Auto-Synthesized First Reply
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, color: isDark ? '#cbd5e1' : '#334155' }}>
                    "{currentDemo.draftSnippet}"
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </ScrollReveal>
      </Container>

      {/* INTERACTIVE 5-STAGE ORCHESTRATION PIPELINE (Scroll Triggered) */}
      <Box
        id="pipeline"
        sx={{
          py: { xs: 8, md: 14 },
          backgroundColor: isDark ? '#05080f' : '#f1f5f9',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <ScrollReveal direction="up" duration={700}>
            <Box sx={{ textAlign: 'center', mb: 7 }}>
              <Chip
                label="LANGGRAPH PIPELINE ARCHITECTURE"
                size="small"
                sx={{
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.08)',
                  color: isDark ? '#c084fc' : '#7c3aed',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.08em',
                  mb: 1.5,
                }}
              />
              <Typography variant="h3" fontWeight="800" sx={{ letterSpacing: '-0.02em', mb: 1.5 }}>
                How the Autonomous Triage Graph Works
              </Typography>
              <Typography variant="body1" sx={{ color: isDark ? '#94a3b8' : '#64748b', maxWidth: 660, mx: 'auto' }}>
                Every inbound inquiry flows through a multi-stage deterministic state graph.
                Inspect each node in the execution graph below:
              </Typography>
            </Box>
          </ScrollReveal>

          {/* Pipeline Stage Cards (Horizontal on Desktop) */}
          <Grid container spacing={2.5}>
            {pipelineStages.map((stage, idx) => {
              const isSelected = activePipelineStep === idx;
              return (
                <Grid item xs={12} sm={6} md={2.4} key={stage.step}>
                  <ScrollReveal direction="up" delay={idx * 120} duration={600}>
                    <Card
                      onClick={() => setActivePipelineStep(idx)}
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(30, 41, 59, 0.85)'
                            : '#ffffff'
                          : isDark
                          ? '#0b101b'
                          : '#ffffff',
                        border: isSelected
                          ? `2px solid ${stage.color}`
                          : isDark
                          ? '1px solid rgba(255, 255, 255, 0.07)'
                          : '1px solid #e2e8f0',
                        borderRadius: 3.5,
                        p: 1,
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        transform: isSelected ? 'translateY(-6px)' : 'none',
                        boxShadow: isSelected
                          ? `0 12px 28px -4px ${stage.color}40`
                          : isDark
                          ? 'none'
                          : '0 2px 10px rgba(0, 0, 0, 0.03)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: stage.color,
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2.5,
                              backgroundColor: `${stage.color}18`,
                              color: stage.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {stage.icon}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              color: isDark ? '#64748b' : '#94a3b8',
                              fontSize: '0.8rem',
                            }}
                          >
                            {stage.step}
                          </Typography>
                        </Box>

                        <Typography
                          variant="subtitle1"
                          fontWeight="800"
                          sx={{ color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1.2, mb: 0.5 }}
                        >
                          {stage.title}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            color: stage.color,
                            fontWeight: 700,
                            display: 'block',
                            mb: 1.5,
                            textTransform: 'uppercase',
                            fontSize: '0.68rem',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {stage.subtitle}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            color: isDark ? '#94a3b8' : '#64748b',
                            fontSize: '0.8rem',
                            lineHeight: 1.55,
                          }}
                        >
                          {stage.desc}
                        </Typography>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                </Grid>
              );
            })}
          </Grid>

          {/* Animated Real-Time Pipeline Stream Visualizer */}
          <ScrollReveal direction="up" delay={200} duration={700}>
            <Paper
              elevation={0}
              sx={{
                mt: 4.5,
                p: { xs: 2.5, md: 3 },
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: isDark ? 'rgba(11, 16, 28, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: isDark ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid #e2e8f0',
                boxShadow: isDark
                  ? '0 16px 40px -10px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.12)'
                  : '0 16px 36px -10px rgba(0, 0, 0, 0.08)',
              }}
            >
              {/* Top ambient glow line */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 35%, #ec4899 70%, #10b981 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmerBorder 4s linear infinite',
                  '@keyframes shimmerBorder': {
                    '0%': { backgroundPosition: '0% 0%' },
                    '100%': { backgroundPosition: '200% 0%' },
                  },
                }}
              />

              {/* Status Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: -3.5,
                        left: -3.5,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        opacity: 0.6,
                        animation: 'telemetryPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                      },
                      '@keyframes telemetryPulse': {
                        '0%': { transform: 'scale(0.8)', opacity: 0.8 },
                        '70%, 100%': { transform: 'scale(2.2)', opacity: 0 },
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      color: isDark ? '#f1f5f9' : '#0f172a',
                      textTransform: 'uppercase',
                      fontSize: '0.78rem',
                    }}
                  >
                    AUTONOMOUS PIPELINE TELEMETRY • REAL-TIME EXECUTION FLOW
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.4,
                      borderRadius: 2,
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10b981',
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                  >
                    LATENCY: ~1.24s
                  </Box>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.4,
                      borderRadius: 2,
                      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(124, 58, 237, 0.08)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      color: isDark ? '#c084fc' : '#7c3aed',
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                  >
                    TOKENS: ZERO-LEAK
                  </Box>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.4,
                      borderRadius: 2,
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: isDark ? '#60a5fa' : '#2563eb',
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                  >
                    STATE: PERSISTED
                  </Box>
                </Stack>
              </Box>

              {/* Visual Stream Track with Traveling Packet Light */}
              <Box
                sx={{
                  position: 'relative',
                  py: 2,
                  px: { xs: 1, md: 3 },
                  backgroundColor: isDark ? 'rgba(6, 10, 18, 0.6)' : '#f8fafc',
                  borderRadius: 3,
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0',
                  overflow: 'hidden',
                }}
              >
                {/* Horizontal Flow Line */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '5%',
                    right: '5%',
                    height: 2,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                    transform: 'translateY(-50%)',
                    zIndex: 0,
                  }}
                >
                  {/* Glowing Animated Traveling Packet */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -4,
                      width: 60,
                      height: 10,
                      borderRadius: 10,
                      background: 'linear-gradient(90deg, transparent, #8b5cf6, #3b82f6, #10b981)',
                      boxShadow: '0 0 16px #8b5cf6',
                      animation: 'travelPacket 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                      '@keyframes travelPacket': {
                        '0%': { left: '-10%', opacity: 0 },
                        '20%': { opacity: 1 },
                        '80%': { opacity: 1 },
                        '100%': { left: '105%', opacity: 0 },
                      },
                    }}
                  />
                </Box>

                {/* Animated Stage Nodes along the track */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ position: 'relative', zIndex: 1 }}
                >
                  {[
                    { tag: '01', name: 'Raw Payload', color: '#3b82f6', icon: '📥' },
                    { tag: '02', name: 'Intent State', color: '#8b5cf6', icon: '🧠' },
                    { tag: '03', name: 'Urgency SLA', color: '#ef4444', icon: '⚡' },
                    { tag: '04', name: 'Team Route', color: '#10b981', icon: '🎯' },
                    { tag: '05', name: 'Safe Dispatch', color: '#ec4899', icon: '📨' },
                  ].map((node, i) => (
                    <Box
                      key={node.tag}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.8,
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: 34, sm: 42 },
                          height: { xs: 34, sm: 42 },
                          borderRadius: '50%',
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          border: `2px solid ${node.color}`,
                          boxShadow: `0 0 14px ${node.color}55`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: { xs: '0.85rem', sm: '1.1rem' },
                          transition: 'all 0.3s ease',
                          animation: `pulseGlow 2.5s ease-in-out infinite ${i * 0.5}s`,
                          '@keyframes pulseGlow': {
                            '0%, 100%': { transform: 'scale(1)', boxShadow: `0 0 8px ${node.color}35` },
                            '50%': { transform: 'scale(1.08)', boxShadow: `0 0 20px ${node.color}80` },
                          },
                        }}
                      >
                        {node.icon}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: { xs: '0.62rem', sm: '0.74rem' },
                          color: isDark ? '#cbd5e1' : '#475569',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {node.name}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              {/* Bottom Human-Readable Live Flow Summary */}
              <Box
                sx={{
                  mt: 2,
                  px: 2,
                  py: 1.2,
                  borderRadius: 2,
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(241, 245, 249, 0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  overflowX: 'auto',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark ? '#60a5fa' : '#2563eb',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                  }}
                >
                  ⚡ LIVE WORKFLOW:
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <span>1. Client Message Received</span>
                  <span style={{ color: isDark ? '#64748b' : '#94a3b8' }}>➔</span>
                  <span style={{ color: '#8b5cf6' }}>2. AI Analyzes Urgency</span>
                  <span style={{ color: isDark ? '#64748b' : '#94a3b8' }}>➔</span>
                  <span style={{ color: '#ef4444' }}>3. Flagged as High Priority</span>
                  <span style={{ color: isDark ? '#64748b' : '#94a3b8' }}>➔</span>
                  <span style={{ color: '#10b981' }}>4. Assigned to Engineering</span>
                  <span style={{ color: isDark ? '#64748b' : '#94a3b8' }}>➔</span>
                  <span style={{ color: '#ec4899' }}>5. Empathetic Reply Drafted & Dispatched</span>
                </Typography>
              </Box>
            </Paper>
          </ScrollReveal>
        </Container>
      </Box>

      {/* BEFORE VS AFTER COMPARISON SECTION */}
      <Container maxWidth="lg" id="comparison" sx={{ py: { xs: 8, md: 14 } }}>
        <ScrollReveal direction="up" duration={700}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip
              label="OPERATIONAL TRANSFORMATION"
              size="small"
              sx={{
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                color: isDark ? '#34d399' : '#059669',
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                mb: 1.5,
              }}
            />
            <Typography variant="h3" fontWeight="800" sx={{ letterSpacing: '-0.02em', mb: 1.5 }}>
              The Old Way vs. The AI Triage Way
            </Typography>
            <Typography variant="body1" sx={{ color: isDark ? '#94a3b8' : '#64748b', maxWidth: 660, mx: 'auto' }}>
              See the measurable impact of replacing manual inbox scanning with deterministic LangGraph orchestration.
            </Typography>
          </Box>
        </ScrollReveal>

        <Grid container spacing={4} alignItems="stretch">
          {/* Left: The Old Way */}
          <Grid item xs={12} md={6}>
            <ScrollReveal direction="left" delay={100} duration={700}>
              <Card
                sx={{
                  height: '100%',
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.04)' : '#fff5f5',
                  border: isDark ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid #fecaca',
                  borderRadius: 4,
                  p: { xs: 3, md: 4 },
                  position: 'relative',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CloseOutlinedIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="800" sx={{ color: '#ef4444' }}>
                      Traditional Manual Triage
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                      Chaos, human error, and SLA breaches
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={2}>
                  {[
                    '4 to 8 hours delayed first response while tickets sit in unassigned queues',
                    'Tickets bounced repeatedly between Eng, Sales, and Support due to confusion',
                    'Subjective urgency guesses without defensible contract or revenue logic',
                    'Support staff forced to write standard repetitive responses from scratch',
                    'Unstructured emails and chats lead to lost critical enterprise bug reports',
                  ].map((text, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <CloseOutlinedIcon sx={{ color: '#ef4444', fontSize: 18, mt: 0.3, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.6 }}>
                        {text}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </ScrollReveal>
          </Grid>

          {/* Right: The AI Triage Way */}
          <Grid item xs={12} md={6}>
            <ScrollReveal direction="right" delay={150} duration={700}>
              <Card
                sx={{
                  height: '100%',
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : '#f0fdf4',
                  border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #bbf7d0',
                  borderRadius: 4,
                  p: { xs: 3, md: 4 },
                  position: 'relative',
                  boxShadow: isDark
                    ? '0 10px 30px rgba(16, 185, 129, 0.15)'
                    : '0 10px 30px rgba(16, 185, 129, 0.08)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(16, 185, 129, 0.18)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="800" sx={{ color: '#10b981' }}>
                      AI Request Triage Assistant
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                      Deterministic, sub-second, and automated
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={2}>
                  {[
                    'Sub-1.5 second turnaround from inbound ingestion to prioritized summary',
                    '99.4% deterministic routing directly to the responsible team lead',
                    'Transparent risk justifications referencing contract SLAs & business impact',
                    'Context-aware empathetic drafts pre-generated for instant 1-click dispatch',
                    '100% audit logging, cross-session memory, and live webhook simulator',
                  ].map((text, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <CheckIcon sx={{ color: '#10b981', fontSize: 18, mt: 0.3, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.6, fontWeight: 500 }}>
                        {text}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </ScrollReveal>
          </Grid>
        </Grid>
      </Container>

      {/* BENTO GRID OF ENTERPRISE CAPABILITIES */}
      <Container maxWidth="lg" id="capabilities" sx={{ pb: { xs: 8, md: 14 } }}>
        <ScrollReveal direction="up" duration={700}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip
              label="ENTERPRISE ARSENAL"
              size="small"
              sx={{
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                color: isDark ? '#60a5fa' : '#2563eb',
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                mb: 1.5,
              }}
            />
            <Typography variant="h3" fontWeight="800" sx={{ letterSpacing: '-0.02em', mb: 1.5 }}>
              Engineered for Mission-Critical Operations
            </Typography>
            <Typography variant="body1" sx={{ color: isDark ? '#94a3b8' : '#64748b', maxWidth: 640, mx: 'auto' }}>
              Built with modular robustness to scale effortlessly across high-velocity customer organizations.
            </Typography>
          </Box>
        </ScrollReveal>

        <Grid container spacing={3}>
          {/* Card 1 (Large Bento, 8 Cols) */}
          <Grid item xs={12} md={8}>
            <ScrollReveal direction="up" delay={0} duration={600}>
              <Card
                sx={{
                  backgroundColor: isDark ? '#0e1524' : '#ffffff',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  borderRadius: 4,
                  height: '100%',
                  p: 3.5,
                  boxShadow: isDark ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#3b82f6',
                  },
                }}
              >
                <Box sx={{ color: '#3b82f6', mb: 2 }}>
                  <SpeedIcon sx={{ fontSize: 36 }} />
                </Box>
                <Typography variant="h5" fontWeight="800" sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
                  Omnichannel Ingestion & Instant Summarization
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.7, mb: 2 }}>
                  Extracts core business implications into a concise 1-2 sentence briefing. Removes emotional client panic,
                  technical jargon, and irrelevant signatures so teams can act instantly.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                  <Chip size="small" label="REST API" variant="outlined" />
                  <Chip size="small" label="Gmail Sync" variant="outlined" />
                  <Chip size="small" label="Zendesk Webhooks" variant="outlined" />
                  <Chip size="small" label="Live Chat Feeds" variant="outlined" />
                </Stack>
              </Card>
            </ScrollReveal>
          </Grid>

          {/* Card 2 (Small Bento, 4 Cols) */}
          <Grid item xs={12} md={4}>
            <ScrollReveal direction="up" delay={100} duration={600}>
              <Card
                sx={{
                  backgroundColor: isDark ? '#0e1524' : '#ffffff',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  borderRadius: 4,
                  height: '100%',
                  p: 3.5,
                  boxShadow: isDark ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#f59e0b',
                  },
                }}
              >
                <Box sx={{ color: '#f59e0b', mb: 2 }}>
                  <SecurityIcon sx={{ fontSize: 36 }} />
                </Box>
                <Typography variant="h5" fontWeight="800" sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
                  Urgency Justification
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.7 }}>
                  Computes concrete risk levels (Urgent, High, Medium, Low) paired with defensible rationale based on revenue,
                  contract terms, and user counts.
                </Typography>
              </Card>
            </ScrollReveal>
          </Grid>

          {/* Card 3 (Small Bento, 4 Cols) */}
          <Grid item xs={12} md={4}>
            <ScrollReveal direction="up" delay={200} duration={600}>
              <Card
                sx={{
                  backgroundColor: isDark ? '#0e1524' : '#ffffff',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  borderRadius: 4,
                  height: '100%',
                  p: 3.5,
                  boxShadow: isDark ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#10b981',
                  },
                }}
              >
                <Box sx={{ color: '#10b981', mb: 2 }}>
                  <HubIcon sx={{ fontSize: 36 }} />
                </Box>
                <Typography variant="h5" fontWeight="800" sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
                  Deterministic Routing
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.7 }}>
                  Routes directly to responsible units: Engineering, Finance, Sales Team, or Client Success with zero hallucination.
                </Typography>
              </Card>
            </ScrollReveal>
          </Grid>

          {/* Card 4 (Large Bento, 8 Cols) */}
          <Grid item xs={12} md={8}>
            <ScrollReveal direction="up" delay={300} duration={600}>
              <Card
                sx={{
                  backgroundColor: isDark ? '#0e1524' : '#ffffff',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  borderRadius: 4,
                  height: '100%',
                  p: 3.5,
                  boxShadow: isDark ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#ec4899',
                  },
                }}
              >
                <Box sx={{ color: '#ec4899', mb: 2 }}>
                  <EmailIcon sx={{ fontSize: 36 }} />
                </Box>
                <Typography variant="h5" fontWeight="800" sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
                  Gmail SMTP & Safe Simulation Engine
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.7, mb: 2 }}>
                  Auto-drafts empathetic first replies ready to review, customize, and transmit. Supports both live Google SMTP App Password
                  delivery and Safe Simulation Mode for zero-risk sandboxing.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                  <Chip size="small" label="Safe Simulation Mode" sx={{ backgroundColor: '#10b98120', color: '#10b981', fontWeight: 700 }} />
                  <Chip size="small" label="TLS / SSL Encrypted" variant="outlined" />
                  <Chip size="small" label="Multi-Account Dispatch" variant="outlined" />
                </Stack>
              </Card>
            </ScrollReveal>
          </Grid>
        </Grid>
      </Container>

      {/* INTERACTIVE FAQ ACCORDION (Scroll Triggered) */}
      <Box
        id="faq"
        sx={{
          py: { xs: 8, md: 12 },
          backgroundColor: isDark ? '#05080f' : '#f8fafc',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
        }}
      >
        <Container maxWidth="md">
          <ScrollReveal direction="up" duration={700}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Chip
                label="FREQUENTLY ASKED QUESTIONS"
                size="small"
                sx={{
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.08)',
                  color: isDark ? '#c084fc' : '#7c3aed',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.08em',
                  mb: 1.5,
                }}
              />
              <Typography variant="h3" fontWeight="800" sx={{ letterSpacing: '-0.02em', mb: 1.5 }}>
                Questions & Architecture Answers
              </Typography>
              <Typography variant="body1" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                Everything you need to know about the AI Request Triage engine.
              </Typography>
            </Box>
          </ScrollReveal>

          <Stack spacing={2}>
            {[
              {
                q: 'How does the triage engine guarantee deterministic routing?',
                a: 'The engine uses a structured LangGraph state machine where nodes enforce validated schema constraints. Even if free-form LLM text is returned, a deterministic fallback normalization layer ensures target owners are strictly mapped to Engineering, Finance, Sales Team, or Client Success.',
              },
              {
                q: 'Can we test email dispatch without actually sending emails to clients?',
                a: 'Yes! The platform includes a dedicated "Safe Simulation Mode" toggle. When active, all response drafts are fully processed, formatted, and audited as realistic mock transmissions without touching real email inboxes.',
              },
              {
                q: 'Is my Gemini API key stored securely?',
                a: 'Your Gemini API key is stored exclusively in your local browser storage (localStorage) or can be provided via server environment variables (.env). It is never logged or leaked.',
              },
              {
                q: 'How does the system handle real-time inbound webhooks?',
                a: 'The backend provides dedicated /api/inbox endpoints and an interactive Webhook Simulator (Scenario C). You can simulate Stripe payment errors, GitHub issue triggers, Zendesk tickets, or custom JSON webhooks with zero packet loss.',
              },
            ].map((faq, idx) => (
              <ScrollReveal direction="up" delay={idx * 100} duration={600} key={idx}>
                <Accordion
                  sx={{
                    backgroundColor: isDark ? '#0e1524' : '#ffffff',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                    borderRadius: '16px !important',
                    boxShadow: 'none',
                    '&::before': { display: 'none' },
                    overflow: 'hidden',
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: isDark ? '#94a3b8' : '#64748b' }} />}>
                    <Typography variant="subtitle1" fontWeight="700" sx={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                      {faq.q}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.7 }}>
                      {faq.a}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </ScrollReveal>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* FOOTER CALL TO ACTION */}
      <Box
        sx={{
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          py: { xs: 8, md: 12 },
          backgroundColor: isDark ? '#04070d' : '#f1f5f9',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="md">
          <ScrollReveal direction="up" duration={700}>
            <Typography variant="h3" fontWeight="900" sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 2, letterSpacing: '-0.02em' }}>
              Ready to automate your client inquiry triage?
            </Typography>
            <Typography variant="body1" sx={{ color: isDark ? '#94a3b8' : '#64748b', mb: 3, maxWidth: 620, mx: 'auto', lineHeight: 1.65 }}>
              Sign in with the pre-configured admin account to test automated triage, Gmail dispatch, dynamic scenario generation, and webhook feeds.
            </Typography>

            <Typography variant="caption" sx={{ display: 'block', color: isDark ? '#475569' : '#94a3b8', fontSize: '0.8rem' }}>
              © 2026 AI Request Triage Assistant • Built for Node Solutions / Stage Two Challenge
            </Typography>
          </ScrollReveal>
        </Container>
      </Box>

      {/* AI TRIAGE STUDIO INTERACTIVE MODAL */}
      <Dialog
        open={aiStudioOpen}
        onClose={() => {
          setAiStudioOpen(false);
          setStudioLoading(false);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            backgroundImage: isDark
              ? 'radial-gradient(ellipse at top, rgba(124, 58, 237, 0.15), transparent 70%)'
              : 'none',
            border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #e2e8f0',
            borderRadius: 3,
            color: isDark ? '#f8fafc' : '#0f172a',
            boxShadow: isDark
              ? '0 25px 60px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(139, 92, 246, 0.2)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2.5,
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
              }}
            >
              <AutoAwesomeIcon sx={{ color: '#ffffff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="800" sx={{ color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1.2 }}>
                Live AI Triage Studio
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                Test real-time intent extraction, urgency grading, and auto-draft synthesis
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => {
              setAiStudioOpen(false);
              setStudioLoading(false);
            }}
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              '&:hover': {
                color: isDark ? '#ffffff' : '#0f172a',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#fafafa' }}>
          {/* Preset Selector Chips */}
          <Box sx={{ mb: 2.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: isDark ? '#94a3b8' : '#64748b',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                mb: 1,
              }}
            >
              Select a real-world scenario preset or type below:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {STUDIO_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <Chip
                    key={preset.id}
                    label={preset.title}
                    clickable
                    onClick={() => handleSelectPreset(preset)}
                    variant={isSelected ? 'filled' : 'outlined'}
                    sx={{
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(139, 92, 246, 0.25)'
                          : 'rgba(124, 58, 237, 0.12)'
                        : isDark
                        ? 'rgba(30, 41, 59, 0.5)'
                        : '#ffffff',
                      borderColor: isSelected
                        ? isDark
                          ? '#a855f7'
                          : '#7c3aed'
                        : isDark
                        ? '#334155'
                        : '#cbd5e1',
                      color: isSelected
                        ? isDark
                          ? '#f1f5f9'
                          : '#6d28d9'
                        : isDark
                          ? '#cbd5e1'
                          : '#475569',
                      fontWeight: isSelected ? 700 : 500,
                      '&:hover': {
                        backgroundColor: isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(124, 58, 237, 0.18)',
                        borderColor: '#a855f7',
                      },
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          {/* Editable Inquiry Text Area */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Client Inbound Message
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                {studioText.length} characters
              </Typography>
            </Box>
            <TextField
              multiline
              rows={3}
              fullWidth
              value={studioText}
              onChange={(e) => {
                setSelectedPreset(null);
                setStudioText(e.target.value);
              }}
              placeholder="Paste any customer email, Zendesk ticket, chat snippet, or webhook payload..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  borderRadius: 2,
                  border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                  '& fieldset': { border: 'none' },
                  '&:hover': {
                    backgroundColor: isDark ? '#243248' : '#ffffff',
                    borderColor: isDark ? '#475569' : '#94a3b8',
                  },
                  '&.Mui-focused': {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    boxShadow: '0 0 0 2px #8b5cf6',
                  },
                },
              }}
            />
          </Box>

          {/* Action Trigger Button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button
              variant="contained"
              onClick={() => handleRunStudioAnalysis(studioText)}
              disabled={studioLoading || !studioText.trim()}
              startIcon={studioLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <FlashOnIcon />}
              sx={{
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
                color: '#ffffff',
                fontWeight: 700,
                textTransform: 'none',
                px: 3,
                py: 1.1,
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #f43f5e 0%, #7c3aed 50%, #2563eb 100%)',
                },
              }}
            >
              {studioLoading ? 'AI Triage In Progress...' : 'Run Instant AI Analysis ⚡'}
            </Button>

            <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontStyle: 'italic' }}>
              ⚡ Powered by LangGraph State Machine & Gemini
            </Typography>
          </Box>

          {/* Pipeline Execution Stages */}
          {studioLoading && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#ffffff',
                border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #e2e8f0',
                borderRadius: 2,
              }}
            >
              <Typography variant="caption" sx={{ color: '#8b5cf6', fontWeight: 700, display: 'block', mb: 1.5 }}>
                LANGGRAPH PIPELINE EXECUTION:
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
                {[
                  { step: 1, label: '1. Inbound Parsing' },
                  { step: 2, label: '2. Urgency Scoring' },
                  { step: 3, label: '3. Team Routing' },
                  { step: 4, label: '4. Empathetic Reply' },
                ].map((item) => {
                  const isActive = studioStep >= item.step;
                  return (
                    <Box
                      key={item.step}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: isActive ? '#8b5cf6' : isDark ? '#64748b' : '#94a3b8',
                        fontSize: '0.78rem',
                        fontWeight: isActive ? 700 : 400,
                      }}
                    >
                      {isActive ? (
                        <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      ) : (
                        <CircularProgress size={12} sx={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                      )}
                      <span>{item.label}</span>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          )}

          {/* Results Display */}
          {studioResult && !studioLoading && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                borderRadius: 2.5,
                boxShadow: isDark ? 'none' : '0 4px 16px -2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
                <Chip
                  size="small"
                  label={`Priority: ${studioResult.priority || 'Medium'}`}
                  sx={{
                    backgroundColor:
                      (studioResult.priority || '').toLowerCase() === 'urgent'
                        ? '#ef4444'
                        : (studioResult.priority || '').toLowerCase() === 'high'
                        ? '#f59e0b'
                        : '#0ea5e9',
                    color: '#ffffff',
                    fontWeight: 700,
                  }}
                />
                <Chip
                  size="small"
                  label={`Category: ${studioResult.category || 'General Inquiry'}`}
                  variant="outlined"
                  sx={{
                    borderColor: isDark ? '#475569' : '#cbd5e1',
                    color: isDark ? '#e2e8f0' : '#334155',
                    backgroundColor: isDark ? 'transparent' : '#ffffff',
                  }}
                />
                <Chip
                  size="small"
                  label={`Route: ${studioResult.assigned_owner || studioResult.owner || 'Client Success'}`}
                  sx={{
                    backgroundColor:
                      (studioResult.assigned_owner || studioResult.owner || '').includes('Eng')
                        ? '#3b82f6'
                        : (studioResult.assigned_owner || studioResult.owner || '').includes('Finance')
                        ? '#10b981'
                        : (studioResult.assigned_owner || studioResult.owner || '').includes('Sales')
                        ? '#8b5cf6'
                        : '#0ea5e9',
                    color: '#ffffff',
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1, lineHeight: 1.5 }}>
                <strong style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Summary: </strong>
                {studioResult.summary}
              </Typography>

              {studioResult.priority_reason && (
                <Typography
                  variant="caption"
                  sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block', mb: 2, fontStyle: 'italic' }}
                >
                  <strong>Risk Factor: </strong> {studioResult.priority_reason}
                </Typography>
              )}

              {/* Response Draft Box */}
              <Box
                sx={{
                  p: 2,
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#f8fafc',
                  borderRadius: 2,
                  border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                  position: 'relative',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase' }}>
                    ✦ AI Auto-Drafted Empathetic Response
                  </Typography>
                  <Button
                    size="small"
                    startIcon={copiedDraft ? <DoneIcon fontSize="small" sx={{ color: '#10b981' }} /> : <ContentCopyIcon fontSize="small" />}
                    onClick={() => handleCopyDraft(studioResult.draft_response || studioResult.draftSnippet)}
                    sx={{
                      color: copiedDraft ? '#10b981' : isDark ? '#94a3b8' : '#64748b',
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      py: 0.2,
                      px: 1,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                        color: isDark ? '#fff' : '#0f172a',
                      },
                    }}
                  >
                    {copiedDraft ? 'Copied to Clipboard!' : 'Copy Draft'}
                  </Button>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: isDark ? '#cbd5e1' : '#334155',
                    fontStyle: 'normal',
                    lineHeight: 1.6,
                    fontSize: '0.86rem',
                  }}
                >
                  "{studioResult.draft_response || studioResult.draftSnippet}"
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Launch Workspace CTA in dialog */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(37, 99, 235, 0.06)',
              border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: 2,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight="700" sx={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                Want to dispatch responses directly via Gmail & track tickets live?
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                Access the full dashboard with bulk webhook simulator, manual override controls, and audit trails.
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => {
                setAiStudioOpen(false);
                currentUser ? onLaunchWorkspace() : onOpenAuthModal();
              }}
              endIcon={<ArrowForwardIcon />}
              sx={{
                whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
              }}
            >
              {currentUser ? 'Enter Workspace' : 'Sign In to Dispatch'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* OMNICHANNEL INBOUND WEBHOOK SIMULATOR MODAL */}
      <Dialog
        open={webhookModalOpen}
        onClose={() => {
          setWebhookModalOpen(false);
          setDispatchingWebhook(false);
          setWebhookDispatched(false);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: isDark ? '#0b0f19' : '#ffffff',
            backgroundImage: isDark
              ? 'radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.15), transparent 60%), radial-gradient(ellipse at bottom left, rgba(236, 72, 153, 0.1), transparent 50%)'
              : 'none',
            border: isDark ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid #e2e8f0',
            borderRadius: 3.5,
            color: isDark ? '#f8fafc' : '#0f172a',
            boxShadow: isDark
              ? '0 25px 70px -12px rgba(0, 0, 0, 0.8), 0 0 45px rgba(99, 102, 241, 0.25)'
              : '0 25px 60px -12px rgba(15, 23, 42, 0.18)',
            overflow: 'hidden',
          },
        }}
      >
        {/* Title Bar */}
        <DialogTitle
          sx={{
            m: 0,
            p: 2.5,
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDark ? 'rgba(8, 12, 20, 0.95)' : '#ffffff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.2,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                color: '#ffffff',
              }}
            >
              <HubIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" fontWeight="800" sx={{ color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1.2 }}>
                  Omnichannel Webhook & Inbound Stream Simulator
                </Typography>
                <Chip
                  size="small"
                  label="LIVE TEST HARNESS"
                  sx={{
                    height: 20,
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                Simulate real-world inbound payloads, inspect raw JSON schemas, and observe LangGraph deterministic intent extraction
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => {
              setWebhookModalOpen(false);
              setDispatchingWebhook(false);
              setWebhookDispatched(false);
            }}
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              '&:hover': {
                color: isDark ? '#ffffff' : '#0f172a',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 }, backgroundColor: isDark ? 'rgba(8, 12, 20, 0.65)' : '#f8fafc' }}>
          {/* Preset Selector Tabs */}
          <Box sx={{ mb: 2.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: isDark ? '#94a3b8' : '#64748b',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                mb: 1.2,
              }}
            >
              Select Inbound Event Protocol:
            </Typography>
            <Stack direction="row" spacing={1.2} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {WEBHOOK_PRESETS.map((preset) => {
                const isSelected = selectedWebhookId === preset.id;
                return (
                  <Chip
                    key={preset.id}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <span>{preset.name}</span>
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{
                            px: 0.8,
                            py: 0.2,
                            borderRadius: 1,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            backgroundColor: isSelected
                              ? (isDark ? 'rgba(255, 255, 255, 0.18)' : '#ffffff')
                              : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'),
                            color: isSelected
                              ? (isDark ? '#ffffff' : '#4338ca')
                              : 'text.secondary',
                          }}
                        >
                          {preset.badge}
                        </Typography>
                      </Box>
                    }
                    clickable
                    onClick={() => {
                      setSelectedWebhookId(preset.id);
                      setWebhookDispatched(false);
                    }}
                    variant={isSelected ? 'filled' : 'outlined'}
                    sx={{
                      py: 2.2,
                      px: 0.8,
                      borderRadius: 2.5,
                      fontWeight: isSelected ? 800 : 500,
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(99, 102, 241, 0.22)' : 'rgba(99, 102, 241, 0.1)')
                        : (isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff'),
                      borderColor: isSelected
                        ? (isDark ? '#818cf8' : '#6366f1')
                        : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1'),
                      color: isSelected ? (isDark ? '#e0e7ff' : '#3730a3') : 'text.primary',
                      boxShadow: isSelected
                        ? '0 0 16px rgba(99, 102, 241, 0.35)'
                        : 'none',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        borderColor: isSelected ? '#818cf8' : (isDark ? 'rgba(255, 255, 255, 0.25)' : '#94a3b8'),
                      },
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          {/* Split Screen Inspector: Left = Raw Webhook, Right = Extracted Cognitive Triage */}
          <Grid container spacing={2.5}>
            {/* Left Column: Raw Inbound Webhook Payload */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.2,
                  height: '100%',
                  borderRadius: 3,
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : '#ffffff',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 4px 16px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CodeIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                    <Typography variant="subtitle2" fontWeight="800" sx={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                      Raw HTTP Request & Payload
                    </Typography>
                  </Box>
                  <Tooltip title={copiedWebhookPayload ? 'Copied!' : 'Copy raw JSON'}>
                    <Button
                      size="small"
                      variant="outlined"
                      color={copiedWebhookPayload ? 'success' : 'inherit'}
                      onClick={() => handleCopyWebhookPayload(activeWebhook.rawPayload)}
                      startIcon={copiedWebhookPayload ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                      sx={{ borderRadius: 1.8, fontSize: '0.72rem', textTransform: 'none', py: 0.2, px: 1, borderColor: 'divider' }}
                    >
                      {copiedWebhookPayload ? 'Copied' : 'Copy JSON'}
                    </Button>
                  </Tooltip>
                </Box>

                {/* HTTP Endpoint Pill */}
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    mb: 1.5,
                    borderRadius: 2,
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.45)' : '#f1f5f9',
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    color: isDark ? '#93c5fd' : '#2563eb',
                    border: isDark ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{activeWebhook.endpoint}</span>
                  <Chip size="small" label="HTTPS" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }} />
                </Box>

                {/* JSON Code Box */}
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 2,
                    borderRadius: 2.2,
                    backgroundColor: isDark ? '#050811' : '#0f172a',
                    color: '#e2e8f0',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '0.78rem',
                    lineHeight: 1.55,
                    overflowX: 'auto',
                    flexGrow: 1,
                    maxHeight: 280,
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <code>{JSON.stringify(activeWebhook.rawPayload, null, 2)}</code>
                </Box>

                {/* Dispatch Trigger Bar */}
                <Box sx={{ mt: 2, pt: 1.5, borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleDispatchWebhook}
                    disabled={dispatchingWebhook}
                    startIcon={dispatchingWebhook ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 18px rgba(139, 92, 246, 0.45)',
                      },
                    }}
                  >
                    {dispatchingWebhook ? 'Dispatching Webhook...' : '⚡ Fire Webhook Event'}
                  </Button>

                  {webhookDispatched && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                        HTTP 200 OK ({webhookLatency}ms)
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Right Column: Cognitive Triage & Intent Extraction */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.2,
                  height: '100%',
                  borderRadius: 3,
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : '#ffffff',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 4px 16px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />
                    <Typography variant="subtitle2" fontWeight="800" sx={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                      LangGraph Cognitive Triage
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label="Zero Hallucination"
                    sx={{
                      height: 20,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#ede9fe',
                      color: isDark ? '#c084fc' : '#6d28d9',
                    }}
                  />
                </Box>

                {/* Classification Chips */}
                <Grid container spacing={1.2} sx={{ mb: 2 }}>
                  <Grid item xs={4}>
                    <Box sx={{ p: 1.2, borderRadius: 2, backgroundColor: isDark ? '#050811' : '#f8fafc', border: '1px solid', borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.65rem', fontWeight: 700, display: 'block' }}>
                        CATEGORY
                      </Typography>
                      <Chip size="small" label={activeWebhook.extracted.category} color="primary" sx={{ mt: 0.5, fontWeight: 700, height: 22, fontSize: '0.72rem' }} />
                    </Box>
                  </Grid>

                  <Grid item xs={4}>
                    <Box sx={{ p: 1.2, borderRadius: 2, backgroundColor: isDark ? '#050811' : '#f8fafc', border: '1px solid', borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.65rem', fontWeight: 700, display: 'block' }}>
                        ROUTED TO
                      </Typography>
                      <Chip
                        size="small"
                        icon={activeWebhook.extracted.owner === 'Engineering' ? <EngineeringIcon sx={{ fontSize: 13 }} /> : activeWebhook.extracted.owner === 'Finance' ? <AccountBalanceIcon sx={{ fontSize: 13 }} /> : <TrendingUpIcon sx={{ fontSize: 13 }} />}
                        label={activeWebhook.extracted.owner}
                        color={activeWebhook.extracted.owner === 'Engineering' ? 'error' : activeWebhook.extracted.owner === 'Finance' ? 'warning' : 'info'}
                        variant="outlined"
                        sx={{ mt: 0.5, fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={4}>
                    <Box sx={{ p: 1.2, borderRadius: 2, backgroundColor: isDark ? '#050811' : '#f8fafc', border: '1px solid', borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.65rem', fontWeight: 700, display: 'block' }}>
                        SLA URGENCY
                      </Typography>
                      <Chip
                        size="small"
                        label={activeWebhook.extracted.priority}
                        sx={{
                          mt: 0.5,
                          fontWeight: 800,
                          height: 22,
                          fontSize: '0.72rem',
                          backgroundColor: activeWebhook.extracted.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: activeWebhook.extracted.priority === 'Urgent' ? '#f87171' : '#fbbf24',
                          border: activeWebhook.extracted.priority === 'Urgent' ? '1px solid #ef4444' : '1px solid #f59e0b',
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>

                {/* Key Entities Detected Cloud */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#8b5cf6', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 0.8, fontSize: '0.7rem' }}>
                    ✦ Semantic Named Entities Extracted:
                  </Typography>
                  <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', gap: 0.8 }}>
                    {activeWebhook.extracted.entities.map((entity, i) => (
                      <Chip
                        key={i}
                        size="small"
                        label={entity}
                        sx={{
                          backgroundColor: isDark ? 'rgba(139, 92, 246, 0.14)' : '#f5f3ff',
                          color: isDark ? '#c084fc' : '#6d28d9',
                          border: isDark ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid #ddd6fe',
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          height: 22,
                        }}
                      />
                    ))}
                  </Stack>
                </Box>

                {/* Urgency Justification Box */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: isDark ? 'rgba(37, 99, 235, 0.1)' : '#eff6ff',
                    border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #bfdbfe',
                    mb: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: isDark ? '#93c5fd' : '#1d4ed8', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 0.4 }}>
                    Defensible SLA Urgency Reasoning:
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#dbeafe' : '#1e3a8a', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    {activeWebhook.extracted.priorityReason}
                  </Typography>
                </Box>

                {/* Executive Summary */}
                <Box sx={{ mb: 2, flexGrow: 1 }}>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.4 }}>
                    Executive Briefing:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.84rem', lineHeight: 1.55 }}>
                    {activeWebhook.extracted.triageSummary}
                  </Typography>
                </Box>

                {/* Action Controls */}
                <Box sx={{ mt: 'auto', pt: 1.5, borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #f1f5f9' }}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="medium"
                    onClick={() => handleTransferToStudio(activeWebhook)}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      py: 1.2,
                      borderRadius: 2.2,
                      textTransform: 'none',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
                      boxShadow: '0 4px 18px rgba(139, 92, 246, 0.4)',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 22px rgba(236, 72, 153, 0.55)',
                      },
                    }}
                  >
                    ⚡ Transfer to Live AI Triage Studio →
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
