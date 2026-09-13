import React, { useState } from 'react';
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
  Divider,
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
import ForumIcon from '@mui/icons-material/Forum';
import CodeIcon from '@mui/icons-material/Code';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PsychologyIcon from '@mui/icons-material/Psychology';
import DoneIcon from '@mui/icons-material/Done';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import ThemeToggle from './ThemeToggle';
import { useColorMode } from '../ThemeContext';

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
  };

  const currentDemo = demoScenarios[activeDemoTab];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: isDark ? '#0b0f19' : '#f8fafc',
        color: isDark ? '#f8fafc' : '#0f172a',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Top Navigation */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: isDark ? 'rgba(11, 15, 25, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  color: '#fff',
                  p: 1,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                }}
              >
                <SmartToyIcon />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{
                    color: isDark ? '#ffffff' : '#0f172a',
                    letterSpacing: '-0.02em',
                  }}
                >
                  AI Request Triage Assistant
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  Powered by LangGraph & Google Gemini
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Theme Mode Toggle (Outside Landing Page) */}
              <ThemeToggle size="small" />

              {currentUser ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip
                    avatar={<Avatar src={currentUser.avatar_url}>{currentUser.name[0]}</Avatar>}
                    label={currentUser.name}
                    variant="outlined"
                    sx={{
                      color: isDark ? '#f8fafc' : '#0f172a',
                      borderColor: isDark ? '#475569' : '#cbd5e1',
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={onLaunchWorkspace}
                    startIcon={<ArrowForwardIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      fontWeight: 600,
                      borderRadius: 2,
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
                    }}
                  >
                    Logout
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={onOpenAuthModal}
                    sx={{
                      borderColor: isDark ? '#475569' : '#cbd5e1',
                      color: isDark ? '#f8fafc' : '#334155',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isDark ? '#94a3b8' : '#94a3b8',
                      },
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={onOpenAuthModal}
                    startIcon={<FlashOnIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      fontWeight: 700,
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 2.5,
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
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

      {/* HERO SECTION */}
      <Box
        sx={{
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 12 },
          background: isDark
            ? 'radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.18), transparent 60%)'
            : 'radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.1), rgba(248, 250, 252, 0.9) 60%)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <Chip
            icon={<AutoAwesomeIcon sx={{ color: isDark ? '#c084fc !important' : '#7c3aed !important' }} />}
            label="AI-POWERED CLIENT INQUIRY ORCHESTRATION 2.0"
            sx={{
              backgroundColor: isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(124, 58, 237, 0.08)',
              color: isDark ? '#c084fc' : '#7c3aed',
              borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(124, 58, 237, 0.25)',
              fontWeight: 700,
              fontSize: '0.8rem',
              py: 2,
              px: 1,
              mb: 3,
            }}
            variant="outlined"
          />

          <Typography
            variant="h2"
            fontWeight="900"
            sx={{
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              fontSize: { xs: '2.5rem', md: '4rem' },
              color: isDark ? '#ffffff' : '#0f172a',
              mb: 3,
            }}
          >
            Turn Unstructured Client Inquiries into{' '}
            <Box
              component="span"
              sx={{
                background: isDark
                  ? 'linear-gradient(135deg, #60a5fa 0%, #c084fc 100%)'
                  : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Prioritized Action & Response Drafts
            </Box>
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: isDark ? '#94a3b8' : '#475569',
              maxWidth: 800,
              mx: 'auto',
              mb: 5,
              fontWeight: 400,
              lineHeight: 1.6,
            }}
          >
            A full-stack, enterprise triage engine that digests chaotic emails, chats, webhooks, and form submissions.
            Automatically categorizes issues, justifies urgency, routes to exact team owners, and drafts empathetic replies in seconds.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} justifyContent="center" alignItems="center" sx={{ mb: 8 }}>
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
              onClick={currentUser ? onLaunchWorkspace : onOpenAuthModal}
              endIcon={<ArrowForwardIcon />}
              sx={{
                py: 1.8,
                px: 3.5,
                fontSize: '1.05rem',
                fontWeight: 600,
                borderRadius: 2.5,
                borderColor: isDark ? '#475569' : '#cbd5e1',
                color: isDark ? '#f8fafc' : '#0f172a',
                backgroundColor: isDark ? 'transparent' : '#ffffff',
                textTransform: 'none',
                boxShadow: isDark ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                '&:hover': {
                  borderColor: isDark ? '#94a3b8' : '#94a3b8',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
                },
              }}
            >
              {currentUser ? 'Enter Live Workspace' : 'Launch Workspace (Sign In)'}
            </Button>
          </Stack>

          {/* METRICS STRIP */}
          <Paper
            elevation={0}
            sx={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#ffffff',
              backdropFilter: 'blur(16px)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              boxShadow: isDark
                ? '0 10px 30px rgba(0, 0, 0, 0.3)'
                : '0 10px 30px -10px rgba(0, 0, 0, 0.06)',
              borderRadius: 4,
              p: 3,
              mb: 8,
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={6} md={3}>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#3b82f6' }}>
                  99.4%
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Routing Accuracy
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#10b981' }}>
                  &lt; 1.5s
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Average Triage Speed
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#8b5cf6' }}>
                  4 Teams
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Eng, Sales, Fin, CS
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#f59e0b' }}>
                  100%
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Zero Data-Loss Webhooks
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* INTERACTIVE DEMO PREVIEW */}
          <Box id="interactive-demo" sx={{ scrollMarginTop: 100 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
              <Button
                variant={activeDemoTab === 'technical' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setActiveDemoTab('technical')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                }}
              >
                🔴 Technical Outage
              </Button>
              <Button
                variant={activeDemoTab === 'billing' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setActiveDemoTab('billing')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                }}
              >
                🟠 Billing Dispute
              </Button>
              <Button
                variant={activeDemoTab === 'sales' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setActiveDemoTab('sales')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                }}
              >
                🔵 250-Seat Enterprise
              </Button>
            </Box>

            <Paper
              elevation={0}
              sx={{
                textAlign: 'left',
                backgroundColor: isDark ? '#161f30' : '#ffffff',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px -10px rgba(0,0,0,0.08)',
              }}
            >
              {/* Window Header */}
              <Box
                sx={{
                  px: 3,
                  py: 1.8,
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981' }} />
                <Typography
                  variant="caption"
                  sx={{
                    ml: 2,
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                >
                  AI Triage Pipeline • {currentDemo.title}
                </Typography>
              </Box>

              <Grid container>
                {/* Left: Incoming Request */}
                <Grid item xs={12} md={6} sx={{ p: 3, borderRight: { md: isDark ? '1px solid #334155' : '1px solid #e2e8f0' } }}>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Incoming Client Message
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="700" sx={{ color: isDark ? '#f8fafc' : '#0f172a', mt: 0.5, mb: 1 }}>
                    {currentDemo.sender}
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
                      borderRadius: 2,
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0',
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      lineHeight: 1.6,
                      color: isDark ? '#cbd5e1' : '#334155',
                      minHeight: 140,
                    }}
                  >
                    "{currentDemo.text}"
                  </Box>
                </Grid>

                {/* Right: AI Output */}
                <Grid item xs={12} md={6} sx={{ p: 3, backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#fafafa' }}>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    LangGraph State Extracted Output
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
                    <Chip
                      size="small"
                      label={`Priority: ${currentDemo.priority}`}
                      sx={{ backgroundColor: currentDemo.priorityColor, color: '#fff', fontWeight: 700 }}
                    />
                    <Chip
                      size="small"
                      label={`Category: ${currentDemo.category}`}
                      variant="outlined"
                      sx={{
                        color: isDark ? '#e2e8f0' : '#334155',
                        borderColor: isDark ? '#475569' : '#cbd5e1',
                        backgroundColor: isDark ? 'transparent' : '#ffffff',
                      }}
                    />
                    <Chip
                      size="small"
                      label={`Route: ${currentDemo.owner}`}
                      sx={{ backgroundColor: currentDemo.ownerColor, color: '#fff', fontWeight: 600 }}
                    />
                  </Stack>

                  <Typography variant="body2" sx={{ color: isDark ? '#e2e8f0' : '#1e293b', mb: 1.5, fontSize: '0.85rem' }}>
                    <strong>Summary:</strong> {currentDemo.summary}
                  </Typography>

                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
                      borderRadius: 2,
                      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                      fontSize: '0.8rem',
                      color: isDark ? '#93c5fd' : '#1d4ed8',
                    }}
                  >
                    <strong>Auto-Drafted Response:</strong> "{currentDemo.draftSnippet}"
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* 4 FEATURE PILLARS */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="overline"
            sx={{
              color: isDark ? '#60a5fa' : '#2563eb',
              fontWeight: 700,
              letterSpacing: '0.1em',
            }}
          >
            ENTERPRISE CAPABILITIES
          </Typography>
          <Typography
            variant="h3"
            fontWeight="800"
            sx={{
              letterSpacing: '-0.02em',
              mt: 1,
              color: isDark ? '#f8fafc' : '#0f172a',
            }}
          >
            Engineered for Modern Operations
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                backgroundColor: isDark ? '#111827' : '#ffffff',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                borderRadius: 3,
                height: '100%',
                boxShadow: isDark ? 'none' : '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: '#3b82f6', mb: 2 }}><SpeedIcon fontSize="large" /></Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
                  Instant Summarization
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.6 }}>
                  Extracts core business implications into a concise 1-2 sentence briefing, removing customer noise and emotional panic.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                backgroundColor: isDark ? '#111827' : '#ffffff',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                borderRadius: 3,
                height: '100%',
                boxShadow: isDark ? 'none' : '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: '#f59e0b', mb: 2 }}><SecurityIcon fontSize="large" /></Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
                  Urgency Justification
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.6 }}>
                  Computes concrete risk levels (Urgent, High, Med, Low) with defensible business justification reasons.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                backgroundColor: isDark ? '#111827' : '#ffffff',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                borderRadius: 3,
                height: '100%',
                boxShadow: isDark ? 'none' : '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: '#10b981', mb: 2 }}><HubIcon fontSize="large" /></Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
                  Deterministic Routing
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.6 }}>
                  Maps directly to responsible internal owners (Engineering, Finance, Sales Team, Client Success) with zero guessing.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                backgroundColor: isDark ? '#111827' : '#ffffff',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                borderRadius: 3,
                height: '100%',
                boxShadow: isDark ? 'none' : '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: '#8b5cf6', mb: 2 }}><EmailIcon fontSize="large" /></Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
                  Email Dispatch
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.6 }}>
                  Auto-drafts empathetic first replies ready to review, customize, and transmit directly via Gmail SMTP or Safe Simulation.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* FOOTER CALL TO ACTION */}
      <Box
        sx={{
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          py: 8,
          backgroundColor: isDark ? '#070a12' : '#f1f5f9',
          textAlign: 'center',
          transition: 'background-color 0.3s ease',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight="800" sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 2 }}>
            Ready to streamline your client operations?
          </Typography>
          <Typography variant="body1" sx={{ color: isDark ? '#94a3b8' : '#64748b', mb: 4 }}>
            Sign in with the pre-configured admin account to test automated triage, Gmail dispatch, dynamic scenario generation, and webhook feeds.
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 4, color: isDark ? '#64748b' : '#94a3b8' }}>
            © 2026 AI Request Triage Assistant • Built for Node Solutions / Stage Two Challenge
          </Typography>
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
                        ? isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(124, 58, 237, 0.12)'
                        : isDark ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
                      borderColor: isSelected
                        ? isDark ? '#a855f7' : '#7c3aed'
                        : isDark ? '#334155' : '#cbd5e1',
                      color: isSelected
                        ? isDark ? '#f1f5f9' : '#6d28d9'
                        : isDark ? '#cbd5e1' : '#475569',
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
                        color: isActive ? '#8b5cf6' : (isDark ? '#64748b' : '#94a3b8'),
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
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block', mb: 2, fontStyle: 'italic' }}>
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
                      color: copiedDraft ? '#10b981' : (isDark ? '#94a3b8' : '#64748b'),
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
    </Box>
  );
}
