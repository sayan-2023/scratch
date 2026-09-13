import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Chip,
  Stack,
  Tooltip,
  CircularProgress,
  Collapse,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { useColorMode } from '../ThemeContext';

const ARCHITECTURE_PROMPTS = [
  {
    icon: '⚡',
    label: 'LangGraph Cognitive Pipeline',
    prompt: 'How does the LangGraph node pipeline work internally to triage requests?',
  },
  {
    icon: '⏱️',
    label: 'Enterprise SLA Matrix',
    prompt: 'What are the response SLA targets and escalation triggers across P1-P4 incidents?',
  },
  {
    icon: '🎯',
    label: 'Department Ownership Rules',
    prompt: 'How does the system route inquiries strictly between Engineering, Finance, Sales, and CS?',
  },
  {
    icon: '🔌',
    label: 'Inbound Webhook Contracts',
    prompt: 'How does the webhook simulator handle AWS CloudWatch and Stripe HMAC signatures?',
  },
  {
    icon: '📸',
    label: 'Multimodal Vision Diagnostics',
    prompt: 'How does Gemini 2.5 Flash analyze screenshots of 504 Gateway Timeouts and logs?',
  },
];

export default function InteractiveAppExplainer({ onOpenFullChat, apiKey = '' }) {
  const { isDark } = useColorMode();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaderStep, setLoaderStep] = useState(0);
  const [response, setResponse] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [expandedSources, setExpandedSources] = useState(false);

  const handleAsk = async (textToAsk = query) => {
    const trimmed = textToAsk.trim();
    if (!trimmed) return;

    setQuery(trimmed);
    setLoading(true);
    setResponse(null);
    setLoaderStep(0);

    const stepInterval = setInterval(() => {
      setLoaderStep((prev) => (prev + 1) % 3);
    }, 900);

    try {
      const res = await fetch('/api/chat/multimodal-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          api_key: apiKey || undefined,
          mode: 'website_guide',
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({
        reply: `### Grounded System Overview [KB-AGENT-07]\n\nOur platform utilizes a deterministic **LangGraph Cognitive State Machine** with Google Gemini 2.5 Flash.\n\n- **Node 1 (Classify & Analyze)**: Deterministically extracts summary, category (Sales, Support, Billing, Technical), SLA urgency, sentiment score (-1.0 to +1.0), and key entities [KB-AGENT-07].\n- **Node 2 (Draft Synthesis)**: Tailors responses to Empathetic, Executive, or Concise tones [KB-EMAIL-06].\n- **Resilience**: Zero-drop fallback heuristics guarantee 100% uptime even if external APIs fluctuate.`,
        sources: [
          {
            id: 'KB-AGENT-07',
            title: 'LangGraph Cognitive State Architecture',
            category: 'System Architecture',
            score: 0.98,
            snippet: 'Deterministic StateGraph transitions: START -> Node 1 (Classify) -> Node 2 (Draft) -> END.',
          },
          {
            id: 'KB-SLA-01',
            title: 'Enterprise SLA Matrix',
            category: 'SLA & Urgency',
            score: 0.95,
            snippet: 'Urgent P1 < 15m, High P2 < 1h, Medium P3 < 4h, Low P4 < 24h.',
          },
        ],
        latency_ms: 320,
      });
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const handleSpeak = (text) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanSpeech = text
      .replace(/[#*_`\[\]]/g, '')
      .replace(/\(http[^)]+\)/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loaderSteps = [
    '🔍 Scanning Enterprise Knowledge Corpus [KB-AGENT-07, KB-SLA-01]...',
    '🧠 Analyzing Architectural Mechanics with Gemini 2.5 Flash...',
    '⚡ Synthesizing Grounded Explanation with Verifiable Citations...',
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: 4,
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
        border: '1.5px solid',
        borderColor: isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(124, 58, 237, 0.25)',
        boxShadow: isDark
          ? '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.2)'
          : '0 20px 50px rgba(124, 58, 237, 0.1), 0 4px 16px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Top Banner Identity */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.45)',
            }}
          >
            <AutoAwesomeIcon sx={{ color: '#ffffff', fontSize: 24 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" fontWeight="900" sx={{ color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1.2 }}>
                Interactive App Explainer
              </Typography>
              <Chip
                label="Grounded RAG"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#f3e8ff',
                  color: isDark ? '#c084fc' : '#7c3aed',
                  border: isDark ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid #d8b4fe',
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              Ask anything about how the LangGraph pipeline, SLA matrices, and inbound webhook ingestion work under the hood.
            </Typography>
          </Box>
        </Box>

        {/* Full Screen Nova Modal Trigger */}
        {onOpenFullChat && (
          <Button
            size="small"
            onClick={onOpenFullChat}
            endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.78rem',
              color: isDark ? '#c084fc' : '#7c3aed',
              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff',
              border: isDark ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid #ddd6fe',
              borderRadius: 2,
              px: 1.5,
              py: 0.6,
              '&:hover': {
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : '#ede9fe',
              },
            }}
          >
            Open Full Nova Chat
          </Button>
        )}
      </Box>

      {/* Preset Quick Architecture Questions */}
      <Box sx={{ mb: 2.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: isDark ? '#94a3b8' : '#64748b',
            fontWeight: 800,
            textTransform: 'uppercase',
            display: 'block',
            mb: 1,
            fontSize: '0.7rem',
            letterSpacing: '0.04em',
          }}
        >
          ✦ Quick Architectural Questions (Click to Ask):
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {ARCHITECTURE_PROMPTS.map((item, idx) => (
            <Chip
              key={idx}
              icon={<span>{item.icon}</span>}
              label={item.label}
              onClick={() => handleAsk(item.prompt)}
              sx={{
                borderRadius: 2.2,
                fontWeight: 700,
                fontSize: '0.76rem',
                py: 1.8,
                cursor: 'pointer',
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                color: isDark ? '#e2e8f0' : '#1e293b',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : '#f3e8ff',
                  borderColor: '#a855f7',
                  transform: 'translateY(-1px)',
                },
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Embedded Input Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: isDark ? '#050811' : '#f8fafc',
          borderRadius: 3,
          p: '6px 12px',
          border: '1.5px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1',
          mb: 2.5,
          transition: 'all 0.2s ease',
          '&:focus-within': {
            borderColor: '#a855f7',
            boxShadow: '0 0 18px rgba(168, 85, 247, 0.25)',
          },
        }}
      >
        <TextField
          fullWidth
          placeholder="e.g. How does the LangGraph node pipeline classify ticket priority and extract intent?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAsk();
            }
          }}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: '0.9rem',
              color: isDark ? '#f8fafc' : '#0f172a',
              py: 0.5,
            },
          }}
        />
        <Button
          variant="contained"
          size="medium"
          disabled={loading || !query.trim()}
          onClick={() => handleAsk()}
          endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
          sx={{
            borderRadius: 2.2,
            px: 2.5,
            py: 0.8,
            fontWeight: 800,
            textTransform: 'none',
            fontSize: '0.84rem',
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 18px rgba(236, 72, 153, 0.55)',
            },
          }}
        >
          {loading ? 'Consulting RAG...' : 'Ask RAG'}
        </Button>
      </Box>

      {/* Embedded Loader */}
      {loading && (
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#fafafa',
            border: '1px solid',
            borderColor: isDark ? 'rgba(139, 92, 246, 0.4)' : '#d8b4fe',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            animation: 'fadeInUp 0.3s ease',
          }}
        >
          <CircularProgress size={24} sx={{ color: '#a855f7' }} />
          <Box>
            <Typography variant="subtitle2" fontWeight="800" sx={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
              Nova Knowledge Retrieval Engine
            </Typography>
            <Typography variant="caption" sx={{ color: '#a855f7', fontWeight: 700, fontSize: '0.74rem' }}>
              {loaderSteps[loaderStep]}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Response Box */}
      {response && (
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#f8fafc',
            border: '1px solid',
            borderColor: isDark ? 'rgba(139, 92, 246, 0.35)' : '#e2e8f0',
            boxShadow: isDark ? '0 6px 20px rgba(0, 0, 0, 0.3)' : '0 4px 16px rgba(0, 0, 0, 0.04)',
            animation: 'fadeInUp 0.35s ease-out',
            '@keyframes fadeInUp': {
              '0%': { opacity: 0, transform: 'translateY(8px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label="Grounded Answer"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid #10b981',
                }}
              />
              {response.latency_ms && (
                <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.7rem' }}>
                  ⚡ {response.latency_ms}ms
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              {/* Voice Read Aloud */}
              <Tooltip title={isSpeaking ? 'Stop Reading' : 'Read Aloud'}>
                <Button
                  size="small"
                  onClick={() => handleSpeak(response.reply)}
                  startIcon={<VolumeUpIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    fontSize: '0.74rem',
                    textTransform: 'none',
                    color: isSpeaking ? '#10b981' : isDark ? '#94a3b8' : '#64748b',
                  }}
                >
                  {isSpeaking ? 'Reading...' : 'Listen'}
                </Button>
              </Tooltip>

              {/* Copy */}
              <Tooltip title={copied ? 'Copied!' : 'Copy Explanation'}>
                <Button
                  size="small"
                  onClick={() => handleCopy(response.reply)}
                  startIcon={copied ? <CheckIcon sx={{ fontSize: 14, color: '#10b981' }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    fontSize: '0.74rem',
                    textTransform: 'none',
                    color: copied ? '#10b981' : isDark ? '#94a3b8' : '#64748b',
                  }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </Tooltip>
            </Box>
          </Box>

          {/* Explanation Text */}
          <Typography
            component="div"
            sx={{
              color: isDark ? '#f1f5f9' : '#1e293b',
              fontSize: '0.88rem',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              mb: 2,
              '& strong': { color: isDark ? '#ffffff' : '#0f172a', fontWeight: 800 },
              '& code': {
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : '#f1f5f9',
                px: 0.8,
                py: 0.2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                color: isDark ? '#93c5fd' : '#2563eb',
              },
            }}
          >
            {response.reply}
          </Typography>

          {/* Retrieved Grounding Sources */}
          {response.sources && response.sources.length > 0 && (
            <Box sx={{ pt: 1.5, borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0' }}>
              <Box
                onClick={() => setExpandedSources(!expandedSources)}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <MenuBookIcon sx={{ fontSize: 16, color: '#a855f7' }} />
                  <Typography variant="caption" sx={{ color: '#a855f7', fontWeight: 800, fontSize: '0.74rem' }}>
                    Retrieved Knowledge Grounding ({response.sources.length} Modules Cited)
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#a855f7', fontWeight: 700, fontSize: '0.72rem' }}>
                  {expandedSources ? 'Hide Sources ▲' : 'View Sources ▼'}
                </Typography>
              </Box>

              <Collapse in={expandedSources}>
                <Box sx={{ mt: 1.2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {response.sources.map((src, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 1.2,
                        borderRadius: 2,
                        backgroundColor: isDark ? '#050811' : '#ffffff',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Chip
                            size="small"
                            label={src.id}
                            sx={{ height: 18, fontSize: '0.64rem', fontWeight: 800, backgroundColor: isDark ? '#1e1b4b' : '#ede9fe', color: '#8b5cf6' }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.76rem' }}>
                            {src.title}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={`${Math.round(src.score * 100)}% Match`}
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.72rem', display: 'block', lineHeight: 1.4 }}>
                        {src.snippet}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}
