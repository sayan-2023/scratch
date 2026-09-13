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

export default function LandingPage({
  onLaunchWorkspace,
  onOpenAuthModal,
  currentUser,
  onLogout,
}) {
  const [activeDemoTab, setActiveDemoTab] = useState('technical');

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
    <Box sx={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc' }}>
      {/* Top Navigation */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
                }}
              >
                <SmartToyIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#ffffff', letterSpacing: '-0.02em' }}>
                  AI Request Triage Assistant
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Powered by LangGraph & Google Gemini
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              {currentUser ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip
                    avatar={<Avatar src={currentUser.avatar_url}>{currentUser.name[0]}</Avatar>}
                    label={currentUser.name}
                    variant="outlined"
                    sx={{ color: '#f8fafc', borderColor: '#475569' }}
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
                    sx={{ borderColor: '#475569', color: '#cbd5e1' }}
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
                      borderColor: '#475569',
                      color: '#f8fafc',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
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
          background: 'radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.15), transparent 60%)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <Chip
            icon={<AutoAwesomeIcon sx={{ color: '#a855f7 !important' }} />}
            label="AI-POWERED CLIENT INQUIRY ORCHESTRATION 2.0"
            sx={{
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              color: '#c084fc',
              borderColor: 'rgba(168, 85, 247, 0.3)',
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
              mb: 3,
            }}
          >
            Turn Unstructured Client Inquiries into{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #c084fc 100%)',
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
              color: '#94a3b8',
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

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 8 }}>
            <Button
              variant="contained"
              size="large"
              onClick={currentUser ? onLaunchWorkspace : onOpenAuthModal}
              endIcon={<ArrowForwardIcon />}
              sx={{
                py: 1.8,
                px: 4,
                fontSize: '1.05rem',
                fontWeight: 700,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
              }}
            >
              {currentUser ? 'Enter Live Workspace' : 'Get Started Free (Admin Login)'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                const el = document.getElementById('interactive-demo');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={{
                py: 1.8,
                px: 3.5,
                fontSize: '1.05rem',
                fontWeight: 600,
                borderRadius: 2.5,
                borderColor: '#475569',
                color: '#f8fafc',
                '&:hover': {
                  borderColor: '#94a3b8',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                },
              }}
            >
              Explore Live Interactive Demo
            </Button>
          </Stack>

          {/* METRICS STRIP */}
          <Paper
            elevation={0}
            sx={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 4,
              p: 3,
              mb: 8,
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={6} md={3}>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#60a5fa' }}>
                  99.4%
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Routing Accuracy
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#34d399' }}>
                  &lt; 1.5s
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Average Triage Speed
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#c084fc' }}>
                  4 Teams
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Eng, Sales, Fin, CS
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#f59e0b' }}>
                  100%
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                🔴 Technical Outage
              </Button>
              <Button
                variant={activeDemoTab === 'billing' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setActiveDemoTab('billing')}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                🟠 Billing Dispute
              </Button>
              <Button
                variant={activeDemoTab === 'sales' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setActiveDemoTab('sales')}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                🔵 250-Seat Enterprise
              </Button>
            </Box>

            <Paper
              elevation={0}
              sx={{
                textAlign: 'left',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Window Header */}
              <Box sx={{ px: 3, py: 1.8, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981' }} />
                <Typography variant="caption" sx={{ ml: 2, color: '#94a3b8', fontFamily: 'monospace' }}>
                  AI Triage Pipeline • {currentDemo.title}
                </Typography>
              </Box>

              <Grid container>
                {/* Left: Incoming Request */}
                <Grid item xs={12} md={6} sx={{ p: 3, borderRight: { md: '1px solid #334155' } }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Incoming Client Message
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#f8fafc', mt: 0.5, mb: 1 }}>
                    {currentDemo.sender}
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: 2,
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      lineHeight: 1.6,
                      color: '#cbd5e1',
                      minHeight: 140,
                    }}
                  >
                    "{currentDemo.text}"
                  </Box>
                </Grid>

                {/* Right: AI Output */}
                <Grid item xs={12} md={6} sx={{ p: 3, backgroundColor: 'rgba(30, 41, 59, 0.4)' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                      sx={{ color: '#e2e8f0', borderColor: '#475569' }}
                    />
                    <Chip
                      size="small"
                      label={`Route: ${currentDemo.owner}`}
                      sx={{ backgroundColor: currentDemo.ownerColor, color: '#fff', fontWeight: 600 }}
                    />
                  </Stack>

                  <Typography variant="body2" sx={{ color: '#e2e8f0', mb: 1.5, fontSize: '0.85rem' }}>
                    <strong>Summary:</strong> {currentDemo.summary}
                  </Typography>

                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      borderRadius: 2,
                      border: '1px solid #334155',
                      fontSize: '0.8rem',
                      color: '#93c5fd',
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
          <Typography variant="overline" sx={{ color: '#60a5fa', fontWeight: 700, letterSpacing: '0.1em' }}>
            ENTERPRISE CAPABILITIES
          </Typography>
          <Typography variant="h3" fontWeight="800" sx={{ letterSpacing: '-0.02em', mt: 1 }}>
            Engineered for Modern Operations
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: '#60a5fa', mb: 2 }}><SpeedIcon fontSize="large" /></Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                  Instant Summarization
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                  Extracts core business implications into a concise 1-2 sentence briefing, removing customer noise and emotional panic.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: '#f59e0b', mb: 2 }}><SecurityIcon fontSize="large" /></Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                  Urgency Justification
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                  Computes concrete risk levels (Urgent, High, Med, Low) with defensible business justification reasons.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: '#10b981', mb: 2 }}><HubIcon fontSize="large" /></Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                  Deterministic Routing
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                  Maps directly to responsible internal owners (Engineering, Finance, Sales Team, Client Success) with zero guessing.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: '#c084fc', mb: 2 }}><EmailIcon fontSize="large" /></Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                  Email Dispatch
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                  Auto-drafts empathetic first replies ready to review, customize, and transmit directly via Gmail SMTP or Safe Simulation.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* FOOTER CALL TO ACTION */}
      <Box sx={{ borderTop: '1px solid #334155', py: 8, backgroundColor: '#0b1120', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight="800" sx={{ color: '#f8fafc', mb: 2 }}>
            Ready to streamline your client operations?
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4 }}>
            Sign in with the pre-configured admin account to test automated triage, Gmail dispatch, dynamic scenario generation, and webhook feeds.
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 4, color: '#64748b' }}>
            © 2026 AI Request Triage Assistant • Built for Node Solutions / Stage Two Challenge
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

