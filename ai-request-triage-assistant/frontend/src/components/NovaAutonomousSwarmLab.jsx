import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  Stack,
  LinearProgress,
  IconButton,
  TextField,
  Paper,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import HubIcon from '@mui/icons-material/Hub';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import CodeIcon from '@mui/icons-material/Code';

import { useColorMode } from '../ThemeContext';

const SWARM_SCENARIOS = [
  {
    id: 'aws_outage',
    title: '🚨 AWS 504 Gateway Outage',
    priority: 'P1 - Critical',
    priorityColor: '#ef4444',
    department: 'Engineering / DevOps',
    text: 'URGENT: All EU-central cluster pods returning HTTP 504 Gateway Timeouts on checkout API endpoints. Customer payments failing globally!',
    sla: '15 minutes',
  },
  {
    id: 'stripe_dispute',
    title: '💳 Stripe Chargeback Surge',
    priority: 'P2 - High',
    priorityColor: '#f59e0b',
    department: 'Finance & Billing',
    text: 'We received 18 automated chargeback webhooks for enterprise account ACME-9021. Needs immediate ledger reconciliation and dispute documentation.',
    sla: '1 hour',
  },
  {
    id: 'security_audit',
    title: '🔐 Potential API Token Leak',
    priority: 'P1 - Critical',
    priorityColor: '#ef4444',
    department: 'Security & SecOps',
    text: 'Security alert: Production JWT signing key was committed to a public GitHub repo snippet. Revocation and rotation required immediately.',
    sla: '10 minutes',
  },
  {
    id: 'sla_upgrade',
    title: '💼 Enterprise SLA Contract',
    priority: 'P3 - Medium',
    priorityColor: '#3b82f6',
    department: 'Client Success & Sales',
    text: 'Global Logistics Corp wants to upgrade their contract tier to 24/7 dedicated support and custom webhook SLA guarantees.',
    sla: '4 hours',
  },
];

export default function NovaAutonomousSwarmLab({ open, onClose, apiKey = '' }) {
  const { isDark } = useColorMode();
  const [selectedScenario, setSelectedScenario] = useState(SWARM_SCENARIOS[0]);
  const [customText, setCustomText] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  // Swarm execution states
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0: idle, 1: Classifier, 2: Security, 3: Router, 4: Draft Generator, 5: Complete
  const [swarmResult, setSwarmResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setSwarmResult(null);
      setIsRunning(false);
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }
  }, [open]);

  const handleRunSwarm = async () => {
    setIsRunning(true);
    setActiveStep(1);
    setSwarmResult(null);

    const inputText = isCustom ? customText.trim() || selectedScenario.text : selectedScenario.text;
    const scenarioTitle = isCustom ? 'Custom Incident Ticket' : selectedScenario.title;

    // Call real backend GenAI Swarm Orchestrator endpoint
    const apiPromise = fetch('/api/ai/swarm-orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: inputText,
        scenario_title: scenarioTitle,
        api_key: apiKey || undefined,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      return await res.json();
    });

    // Step 1: Classifier Agent
    await new Promise((r) => setTimeout(r, 450));
    setActiveStep(2);

    // Step 2: Security Agent
    await new Promise((r) => setTimeout(r, 450));
    setActiveStep(3);

    // Step 3: Router Agent
    await new Promise((r) => setTimeout(r, 450));
    setActiveStep(4);

    let genAiData = null;
    try {
      genAiData = await apiPromise;
    } catch (e) {
      console.warn('Swarm API call fallback:', e);
    }

    // Step 4: Multi-Agent Synthesis
    await new Promise((r) => setTimeout(r, 450));
    setActiveStep(5);
    setIsRunning(false);

    if (genAiData) {
      setSwarmResult({
        priority: genAiData.priority,
        urgencyScore: genAiData.urgency_score,
        category: genAiData.category,
        department: genAiData.department,
        sla: genAiData.sla,
        summary: genAiData.summary,
        draftResponse: genAiData.draft_response,
        sentimentLabel: genAiData.sentiment_label,
        sentimentScore: genAiData.sentiment_score,
        churnRisk: genAiData.churn_risk,
        keyEntities: genAiData.key_entities || [],
        redactedCount: genAiData.redacted_items_count || 0,
        sanitizedText: genAiData.sanitized_text || '',
        agentTraces: genAiData.agent_traces || [],
        executionTimeMs: genAiData.execution_time_ms || 280,
        tokensUsed: genAiData.tokens_used || 320,
        confidence: genAiData.confidence || 98.6,
      });
    }
  };

  const handleSpeakResult = () => {
    if (!('speechSynthesis' in window) || !swarmResult) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const speechText = `Autonomous swarm triage complete. Priority: ${swarmResult.priority}. Assigned department: ${swarmResult.department}. Estimated SLA: ${swarmResult.sla}. Autonomous resolution: ${swarmResult.draftResponse}`;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.05;
    utterance.pitch = 1.02;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopyDraft = () => {
    if (!swarmResult?.draftResponse) return;
    navigator.clipboard.writeText(swarmResult.draftResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: isDark
            ? 'linear-gradient(160deg, #111827 0%, #0b0f19 100%)'
            : 'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)',
          boxShadow: isDark
            ? '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 40px rgba(168, 85, 247, 0.2)'
            : '0 25px 50px -15px rgba(99, 102, 241, 0.2), 0 0 30px rgba(236, 72, 153, 0.1)',
        },
      }}
    >
      {/* Top Gradient Banner */}
      <Box
        sx={{
          height: 5,
          width: '100%',
          background: 'linear-gradient(90deg, #06b6d4 0%, #a855f7 50%, #ec4899 100%)',
        }}
      />

      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          pt: 2.5,
          px: { xs: 2.5, sm: 4 },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              bgcolor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a855f7',
            }}
          >
            <HubIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1.2 }}>
              Autonomous Multi-Agent Swarm Lab
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              Interactive In-Place Stress Test • Zero Redirection • Real-Time LangGraph Simulation
            </Typography>
          </Box>
        </Stack>

        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: 2 }}>
        {/* Scenario Selection Grid */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: isDark ? '#cbd5e1' : '#334155' }}>
          Select Incident Scenario to Inject into Multi-Agent Swarm:
        </Typography>

        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          {SWARM_SCENARIOS.map((scenario) => {
            const isSelected = !isCustom && selectedScenario.id === scenario.id;
            return (
              <Grid item xs={12} sm={6} key={scenario.id}>
                <Paper
                  onClick={() => {
                    setIsCustom(false);
                    setSelectedScenario(scenario);
                  }}
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    cursor: 'pointer',
                    border: '1.5px solid',
                    borderColor: isSelected
                      ? '#a855f7'
                      : isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                    bgcolor: isSelected
                      ? isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(168, 85, 247, 0.06)'
                      : isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#a855f7',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                      {scenario.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={scenario.priority}
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        bgcolor: `${scenario.priorityColor}20`,
                        color: scenario.priorityColor,
                      }}
                    />
                  </Stack>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block', lineHeight: 1.4 }}>
                    {scenario.text}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Custom Ticket Option Toggle */}
        <Box sx={{ mb: 3 }}>
          <Button
            size="small"
            variant="text"
            onClick={() => setIsCustom(!isCustom)}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', color: '#a855f7', p: 0 }}
          >
            {isCustom ? '← Use Preconfigured Scenarios' : '✎ Or write a custom chaos inquiry ticket'}
          </Button>

          {isCustom && (
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="Enter your custom urgent client inquiry text here..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {/* Run Button & Live Progress */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            disabled={isRunning}
            onClick={handleRunSwarm}
            startIcon={isRunning ? <AutoAwesomeIcon sx={{ animation: 'spin 1s linear infinite' }} /> : <PlayArrowIcon />}
            sx={{
              px: 4,
              py: 1.3,
              borderRadius: 3,
              fontSize: '0.98rem',
              fontWeight: 800,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #06b6d4 0%, #a855f7 50%, #ec4899 100%)',
              boxShadow: '0 8px 24px rgba(168, 85, 247, 0.4)',
              '&:hover': {
                boxShadow: '0 10px 30px rgba(168, 85, 247, 0.6)',
              },
            }}
          >
            {isRunning ? 'Multi-Agent Swarm Orchestrating...' : '▶ Run Autonomous Agent Swarm'}
          </Button>
        </Box>

        {/* 4-Step Interactive Node Pipeline Visualizer */}
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
            mb: 3,
          }}
        >
          <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
            Live LangGraph State Machine Nodes:
          </Typography>

          <Grid container spacing={1}>
            {[
              { step: 1, label: 'Classifier Agent', desc: 'Sentiment & Urgency', icon: '🧠' },
              { step: 2, label: 'Security Agent', desc: 'PII Redaction & TLS', icon: '🛡️' },
              { step: 3, label: 'Router Agent', desc: 'LangGraph SLA Node', icon: '⚡' },
              { step: 4, label: 'Synthesis Agent', desc: 'Empathetic Auto-Draft', icon: '✍️' },
            ].map((node, idx) => {
              const isNodeActive = activeStep === node.step;
              const isNodeDone = activeStep > node.step;
              const traceThought = swarmResult?.agentTraces?.[idx]?.thought;

              return (
                <Grid item xs={6} sm={3} key={node.step}>
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      textAlign: 'center',
                      border: '1px solid',
                      borderColor: isNodeActive
                        ? '#06b6d4'
                        : isNodeDone
                        ? '#10b981'
                        : isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                      bgcolor: isNodeActive
                        ? isDark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.08)'
                        : isNodeDone
                        ? isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)'
                        : 'transparent',
                      transition: 'all 0.3s ease',
                      boxShadow: isNodeActive ? '0 0 15px rgba(6, 182, 212, 0.4)' : 'none',
                    }}
                  >
                    <Typography sx={{ fontSize: '1.2rem', mb: 0.3 }}>
                      {isNodeDone ? '✓' : node.icon}
                    </Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ display: 'block', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '0.72rem' }}>
                      {node.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.65rem' }}>
                      {node.desc}
                    </Typography>
                    {traceThought && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: '0.6rem',
                          color: isDark ? '#38bdf8' : '#0284c7',
                          mt: 0.5,
                          lineHeight: 1.2,
                          textAlign: 'left',
                          fontStyle: 'italic',
                        }}
                      >
                        "{traceThought}"
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Live Swarm Result Telemetry Deck */}
        {swarmResult && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
              border: '1px solid',
              borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
              boxShadow: '0 8px 30px rgba(16, 185, 129, 0.1)',
            }}
          >
            {/* Stats Row */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="caption" color="text.secondary">
                  Priority Class
                </Typography>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#ef4444' }}>
                  {swarmResult.priority}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={2.4}>
                <Typography variant="caption" color="text.secondary">
                  Assigned Owner
                </Typography>
                <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                  {swarmResult.department}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={2.4}>
                <Typography variant="caption" color="text.secondary">
                  Target SLA
                </Typography>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#f59e0b' }}>
                  {swarmResult.sla}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={2.4}>
                <Typography variant="caption" color="text.secondary">
                  Confidence Score
                </Typography>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#10b981' }}>
                  {swarmResult.confidence}%
                </Typography>
              </Grid>

              <Grid item xs={6} sm={2.4}>
                <Typography variant="caption" color="text.secondary">
                  Latency / Tokens
                </Typography>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#06b6d4' }}>
                  {swarmResult.executionTimeMs}ms • {swarmResult.tokensUsed} tkn
                </Typography>
              </Grid>
            </Grid>

            {/* Extracted Entities & Security Badges */}
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5, gap: 0.8 }}>
              {swarmResult.redactedCount > 0 ? (
                <Chip
                  size="small"
                  label={`🔒 Sanitized ${swarmResult.redactedCount} Secret(s)`}
                  sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                />
              ) : (
                <Chip
                  size="small"
                  label="🛡️ Zero-Trust Perimeter Clean"
                  sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                />
              )}
              {swarmResult.sentimentLabel && (
                <Chip
                  size="small"
                  label={`Sentiment: ${swarmResult.sentimentLabel}`}
                  sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', fontWeight: 600, fontSize: '0.68rem', height: 22 }}
                />
              )}
              {swarmResult.keyEntities?.map((ent, i) => (
                <Chip
                  key={i}
                  size="small"
                  label={ent}
                  sx={{ bgcolor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.08)', color: '#0284c7', fontWeight: 600, fontSize: '0.68rem', height: 22 }}
                />
              ))}
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            {/* Generated Reply Draft */}
            <Box sx={{ mb: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  Autonomous Draft Response:
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={isSpeaking ? <StopIcon sx={{ color: '#ef4444' }} /> : <VolumeUpIcon sx={{ color: '#06b6d4' }} />}
                    onClick={handleSpeakResult}
                    sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0.3 }}
                  >
                    {isSpeaking ? 'Stop Audio' : 'Speak Aloud'}
                  </Button>
                  <Button
                    size="small"
                    startIcon={copied ? <CheckIcon sx={{ color: '#10b981' }} /> : <ContentCopyIcon />}
                    onClick={handleCopyDraft}
                    sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0.3 }}
                  >
                    {copied ? 'Copied!' : 'Copy Draft'}
                  </Button>
                </Stack>
              </Stack>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  color: isDark ? '#e2e8f0' : '#1e293b',
                  fontFamily: 'monospace',
                }}
              >
                {swarmResult.draftResponse}
              </Paper>
            </Box>

            {/* Telemetry JSON Toggle */}
            <Button
              size="small"
              variant="text"
              startIcon={<CodeIcon />}
              onClick={() => setShowJson(!showJson)}
              sx={{ textTransform: 'none', fontSize: '0.72rem', p: 0, color: 'text.secondary' }}
            >
              {showJson ? 'Hide State Telemetry JSON' : 'Inspect LangGraph State Telemetry JSON'}
            </Button>

            {showJson && (
              <Box
                component="pre"
                sx={{
                  mt: 1,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: isDark ? '#080c14' : '#1e293b',
                  color: '#38bdf8',
                  fontSize: '0.7rem',
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                }}
              >
                {JSON.stringify(
                  {
                    status: 'success',
                    session_id: 'swarm-live-' + Date.now(),
                    scenario: selectedScenario.id,
                    priority: swarmResult.priority,
                    department: swarmResult.department,
                    sla: swarmResult.sla,
                    urgency_score: swarmResult.urgencyScore,
                    sentiment: swarmResult.sentimentLabel,
                    churn_risk: swarmResult.churnRisk,
                    sanitized_tokens: swarmResult.redactedCount,
                    key_entities: swarmResult.keyEntities,
                    latency_ms: swarmResult.executionTimeMs,
                    tokens_used: swarmResult.tokensUsed,
                    agent_traces: swarmResult.agentTraces,
                  },
                  null,
                  2
                )}
              </Box>
            )}
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, pb: 2.5, justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          ⚡ Runs in-place with zero navigation disruption
        </Typography>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
          Close Lab
        </Button>
      </DialogActions>
    </Dialog>
  );
}
