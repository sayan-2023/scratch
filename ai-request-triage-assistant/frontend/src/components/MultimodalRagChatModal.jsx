import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Chip,
  Stack,
  Tooltip,
  CircularProgress,
  Collapse,
  Paper,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import UndoIcon from '@mui/icons-material/Undo';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';

import { useColorMode } from '../ThemeContext';

const STARTER_PROMPTS = [
  {
    icon: '⚡',
    label: 'P1 Urgent SLA & Escalation',
    prompt: 'What is our enterprise SLA for P1 Urgent incidents and who is automatically paged?',
  },
  {
    icon: '📸',
    label: 'Diagnose 504 Gateway Timeout',
    prompt: 'How do I diagnose a 504 Gateway Timeout error screenshot and which team owns it?',
  },
  {
    icon: '💳',
    label: 'Stripe Chargeback Routing',
    prompt: 'How are Stripe chargeback disputes and billing overcharges routed and prioritized?',
  },
  {
    icon: '🔌',
    label: 'Webhook HMAC Verification',
    prompt: 'What are the security requirements and HMAC verification steps for inbound webhooks?',
  },
];

const WEBSITE_GUIDE_PROMPTS = [
  {
    icon: '🌐',
    label: 'How Platform Works',
    prompt: 'How does the AI Request Triage Assistant work and what are its core capabilities?',
  },
  {
    icon: '🧠',
    label: 'LangGraph Cognitive Graph',
    prompt: 'How does the LangGraph cognitive state pipeline process, classify, and route inbound requests under the hood?',
  },
  {
    icon: '⏱️',
    label: 'Enterprise SLA & Routing',
    prompt: 'How does the system calculate SLA turnaround targets across P1-P4 incidents and route to teams?',
  },
  {
    icon: '🔌',
    label: 'Webhook Simulator',
    prompt: 'How do I test the Inbound Webhook Simulator and what formats (CloudWatch, Stripe, PagerDuty) are supported?',
  },
  {
    icon: '🚀',
    label: 'Live Studio & Sandboxes',
    prompt: 'How do I test the Live AI Triage Studio on the home page and how do I access the full Workspace?',
  },
];

export default function MultimodalRagChatModal({ open, onClose, apiKey = '', mode = 'workspace' }) {
  const { isDark } = useColorMode();
  const isWebsiteGuide = mode === 'website_guide';
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaderStage, setLoaderStage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedSourcesIndex, setExpandedSourcesIndex] = useState(null);

  // File upload / multimodal state
  const [attachedImage, setAttachedImage] = useState(null); // { dataUrl, name, size }
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Speech Recognition & Auto-Correction state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [aiAutoCorrectEnabled, setAiAutoCorrectEnabled] = useState(true);
  const [isCorrectingSpeech, setIsCorrectingSpeech] = useState(false);
  const [speechCorrectionNotice, setSpeechCorrectionNotice] = useState(null); // { original, corrected, changesMade }

  const recognitionRef = useRef(null);
  const latestTranscriptRef = useRef('');
  const autoCorrectRef = useRef(aiAutoCorrectEnabled);
  const apiKeyRef = useRef(apiKey);
  const modeRef = useRef(mode);

  useEffect(() => {
    autoCorrectRef.current = aiAutoCorrectEnabled;
  }, [aiAutoCorrectEnabled]);

  useEffect(() => {
    apiKeyRef.current = apiKey;
  }, [apiKey]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Knowledge Base drawer state
  const [showKbDrawer, setShowKbDrawer] = useState(false);
  const [kbDocs, setKbDocs] = useState([]);

  // Load initial welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      if (isWebsiteGuide) {
        setMessages([
          {
            id: 'welcome-guide-0',
            role: 'assistant',
            content: `👋 **Welcome! I'm Nova, your AI Request Triage Platform & Website Guide.**

I'm here to explain how this website works, how our cognitive triage engine operates, and how to test every feature:
- 🏗️ **Cognitive Agent Architecture** (FastAPI, LangGraph 4-node state graph, Gemini 2.5) [KB-AGENT-07]
- ⏱️ **Enterprise SLA Matrix** (< 15m Urgent, 1h High, 4h Med, 24h Low) [KB-SLA-01]
- 🎯 **Department Routing Engine** (Engineering, Finance, Sales, Client Success) [KB-ROUTE-02]
- 🔌 **Inbound Webhook Simulator** (AWS CloudWatch, Stripe, PagerDuty, Datadog) [KB-WEBHOOK-03]
- 🚀 **Interactive Sandboxes** (Try the Live Studio on this page or launch the full Workspace) [KB-PLATFORM-08]

*Ask me anything about how this website works, its architecture, or pick a starter topic below to explore!*`,
            sources: [
              {
                id: 'KB-PLATFORM-08',
                title: 'AI Request Triage Assistant Website & Platform Guide',
                category: 'Platform Guide',
                score: 0.99,
                snippet: 'Comprehensive guide on how this website works, page sections, demo sandboxes, and authentication.',
              },
              {
                id: 'KB-AGENT-07',
                title: 'Cognitive Agent Pipeline & LangGraph Architecture',
                category: 'System Architecture',
                score: 0.98,
                snippet: 'Deterministic StateGraph transitions: START -> Node 1 (Classify) -> Node 2 (Draft) -> END.',
              },
            ],
            suggestedFollowups: [
              'How does this platform work? [KB-PLATFORM-08]',
              'How does the LangGraph cognitive pipeline work? [KB-AGENT-07]',
              'How do I test the Inbound Webhook Simulator? [KB-WEBHOOK-03]',
            ],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages([
          {
            id: 'welcome-0',
            role: 'assistant',
            content: `👋 **Welcome! I'm Nova, your Enterprise Multimodal RAG Assistant.**

I am grounded in our verified operational knowledge base:
- ⏱️ **Enterprise SLA Policies** (< 15m Urgent, 1h High, 4h Med, 24h Low)
- 🎯 **Department Ownership Matrix** (Engineering, Finance, Sales, Client Success)
- 🔌 **Inbound Webhook Protocols** (AWS CloudWatch, Stripe, PagerDuty, Datadog)
- 📸 **Multimodal Vision Diagnostics** (504 timeouts, CPU graphs, dispute slips)

*You can type any inquiry or drag, upload, or paste (Ctrl+V) a screenshot for multimodal visual diagnosis!*`,
            sources: [
              {
                id: 'KB-SLA-01',
                title: 'Enterprise SLA Matrix',
                category: 'SLA & Urgency',
                score: 0.99,
                snippet: 'Mandatory operational turnaround targets across P1-P4 incidents.',
              },
              {
                id: 'KB-ROUTE-02',
                title: 'Department Ownership Policies',
                category: 'Team Routing',
                score: 0.98,
                snippet: 'Deterministic routing to Engineering, Finance, Sales, or Client Success.',
              },
            ],
            suggestedFollowups: [
              'What is our SLA for P1 Urgent downtime?',
              'How do I diagnose a 504 Gateway Timeout screenshot?',
              'Show me the supported inbound Webhook formats',
            ],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    }
  }, [open, isWebsiteGuide]);

  // Fetch Knowledge Base overview
  useEffect(() => {
    if (open && kbDocs.length === 0) {
      fetch('/api/chat/knowledge-base')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setKbDocs(data))
        .catch(() => {});
    }
  }, [open]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Cycle loader stages while waiting
  useEffect(() => {
    let timer;
    if (loading) {
      setLoaderStage(0);
      timer = setInterval(() => {
        setLoaderStage((prev) => (prev + 1) % 3);
      }, 1400);
    }
    return () => clearInterval(timer);
  }, [loading]);

  // Clipboard paste listener for screenshots (Disabled in website guide mode)
  useEffect(() => {
    if (isWebsiteGuide) return;
    const handlePaste = (e) => {
      if (!open) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [open, isWebsiteGuide]);

  // Web Speech API Speech Recognition Initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        latestTranscriptRef.current = '';
        setSpeechCorrectionNotice(null);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += chunk;
          } else {
            interim += chunk;
          }
        }
        const captured = (finalTranscript || interim).trim();
        if (captured) {
          latestTranscriptRef.current = captured;
          setInputQuery(captured);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = async () => {
        setIsListening(false);
        const rawTranscript = latestTranscriptRef.current.trim();
        if (!rawTranscript) return;

        if (autoCorrectRef.current) {
          // Trigger AI Auto-Correction & Grammar/Spelling Rewriting
          setIsCorrectingSpeech(true);
          try {
            const res = await fetch('/api/ai/correct-speech-query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: rawTranscript,
                api_key: apiKeyRef.current || undefined,
                context: modeRef.current,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.corrected_text) {
                setInputQuery(data.corrected_text);
                if (data.changes_made) {
                  setSpeechCorrectionNotice({
                    original: rawTranscript,
                    corrected: data.corrected_text,
                    changesMade: true,
                  });
                }
              }
            }
          } catch (err) {
            console.warn('Speech auto-correct failed:', err);
          } finally {
            setIsCorrectingSpeech(false);
          }
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition init error:', err);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const handleToggleListening = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    } else {
      latestTranscriptRef.current = '';
      setSpeechCorrectionNotice(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          try {
            recognitionRef.current.stop();
            setTimeout(() => recognitionRef.current?.start(), 150);
          } catch (err) {}
        }
      }
    }
  };

  const handleUndoSpeechCorrection = () => {
    if (speechCorrectionNotice?.original) {
      setInputQuery(speechCorrectionNotice.original);
      setSpeechCorrectionNotice(null);
    }
  };

  const processImageFile = (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage({
        dataUrl: event.target.result,
        name: file.name || `screenshot_${Date.now()}.png`,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  const handleSendMessage = async (queryText = inputQuery) => {
    const trimmed = queryText.trim();
    if (isWebsiteGuide) {
      if (!trimmed) return;
    } else {
      if (!trimmed && !attachedImage) return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      imageData: isWebsiteGuide ? undefined : attachedImage?.dataUrl,
      fileName: isWebsiteGuide ? undefined : attachedImage?.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    const imagePayload = isWebsiteGuide ? null : attachedImage?.dataUrl;
    const fileNamePayload = isWebsiteGuide ? null : attachedImage?.name;
    setAttachedImage(null);
    setLoading(true);

    try {
      // Build conversation history format
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat/multimodal-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed || 'Analyze this attached multimodal operational screenshot.',
          image_data: imagePayload || null,
          file_name: fileNamePayload || null,
          conversation_history: historyPayload,
          api_key: apiKey || undefined,
          mode: mode,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      const botMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        sources: data.sources || [],
        imageAnalysis: data.image_analysis,
        suggestedFollowups: data.suggested_followups || [],
        latencyMs: data.latency_ms,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);

      if (ttsEnabled) {
        speakText(data.reply, messages.length + 1);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Operational Connectivity Notice**\n\nI was unable to complete the multimodal retrieval. Please check the backend connection or your Gemini API key in the header settings.`,
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text, index) => {
    if (!window.speechSynthesis) return;

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner TTS speech
    const cleanSpeech = text
      .replace(/[#*_`\[\]]/g, '')
      .replace(/\(http[^)]+\)/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingIndex(null);
    setMessages([]);
  };

  const loaderStageTexts = isWebsiteGuide
    ? [
        '🔍 Scanning Platform Documentation [KB-PLATFORM-08, KB-AGENT-07]...',
        '🧠 Analyzing Cognitive Pipeline Architecture with Gemini 2.5...',
        '⚡ Synthesizing Interactive Platform & Feature Explanation...',
      ]
    : [
        '🔍 Scanning Enterprise Knowledge Base [KB-SLA-01, KB-ROUTE-02]...',
        '🧠 Processing Multimodal Visual & Semantic Tokens with Gemini 2.5...',
        '⚡ Synthesizing Grounded Citations & Operational Guidance...',
      ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isFullscreen ? false : 'md'}
      fullWidth
      fullScreen={isFullscreen}
      PaperProps={{
        onDragOver: isWebsiteGuide ? undefined : handleDragOver,
        onDragLeave: isWebsiteGuide ? undefined : handleDragLeave,
        onDrop: isWebsiteGuide ? undefined : handleDrop,
        sx: {
          height: isFullscreen ? '100vh' : { xs: '90vh', md: '780px' },
          backgroundColor: isDark ? '#0b0f19' : '#ffffff',
          backgroundImage: isDark
            ? 'radial-gradient(ellipse at 80% 0%, rgba(139, 92, 246, 0.18) 0%, transparent 60%), radial-gradient(ellipse at 10% 100%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)'
            : 'radial-gradient(ellipse at 80% 0%, rgba(243, 232, 255, 0.8) 0%, transparent 60%)',
          border: isDark ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid #e2e8f0',
          borderRadius: isFullscreen ? 0 : 3.5,
          boxShadow: isDark
            ? '0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 35px rgba(139, 92, 246, 0.28)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        },
      }}
    >
      {/* Drag & Drop Visual Overlay (Disabled in website guide mode) */}
      {!isWebsiteGuide && isDragOver && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 1400,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '3px dashed #a855f7',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            pointerEvents: 'none',
          }}
        >
          <ImageIcon sx={{ fontSize: 64, color: '#c084fc', animation: 'bounce 1s infinite' }} />
          <Typography variant="h5" fontWeight="800" sx={{ color: '#f8fafc' }}>
            Drop Image or Screenshot to Analyze
          </Typography>
          <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
            Nova will run Multimodal Vision diagnostics against Enterprise SLA & Routing rules
          </Typography>
        </Box>
      )}

      {/* Cybernetic Dialog Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isDark ? 'rgba(15, 23, 42, 0.9)' : '#ffffff',
          backdropFilter: 'blur(12px)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Left: Nova Identity & Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Mini Robot Avatar with Glowing Status */}
          <Box
            sx={{
              position: 'relative',
              width: 42,
              height: 42,
              borderRadius: 2.2,
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.45)',
            }}
          >
            <AutoAwesomeIcon sx={{ color: '#ffffff', fontSize: 22 }} />
            {/* Live pulsing dot */}
            <Box
              sx={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                border: '2px solid #0f172a',
                boxShadow: '0 0 6px #10b981',
              }}
            />
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight="800" sx={{ color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1.2 }}>
                {isWebsiteGuide ? 'Nova • Platform Guide' : 'Nova Assistant'}
              </Typography>
              <Chip
                label={isWebsiteGuide ? 'Website Guide' : 'Gemini 2.5 RAG'}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#f3e8ff',
                  color: isDark ? '#c084fc' : '#7e22ce',
                  border: isDark ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid #d8b4fe',
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span>{isWebsiteGuide ? 'Platform Concierge • Architecture & Features Explainer' : 'Multimodal Vision & Enterprise Triage Grounding'}</span>
            </Typography>
          </Box>
        </Box>

        {/* Right: Controls (KB, Audio, Fullscreen, Clear, Close) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Knowledge Base Inspector Toggle */}
          <Tooltip title={showKbDrawer ? 'Hide Knowledge Base' : 'View Indexed Knowledge Modules (7)'}>
            <IconButton
              size="small"
              onClick={() => setShowKbDrawer(!showKbDrawer)}
              sx={{
                color: showKbDrawer ? '#c084fc' : isDark ? '#94a3b8' : '#64748b',
                backgroundColor: showKbDrawer ? (isDark ? 'rgba(139, 92, 246, 0.2)' : '#f3e8ff') : 'transparent',
              }}
            >
              <MenuBookIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>

          {/* Voice Audio Read-Aloud Toggle */}
          <Tooltip title={ttsEnabled ? 'Voice Auto-Read Aloud: ON' : 'Voice Auto-Read Aloud: OFF'}>
            <IconButton
              size="small"
              onClick={() => {
                const next = !ttsEnabled;
                setTtsEnabled(next);
                if (!next && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                  setSpeakingIndex(null);
                }
              }}
              sx={{
                color: ttsEnabled ? '#10b981' : isDark ? '#94a3b8' : '#64748b',
                backgroundColor: ttsEnabled ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5') : 'transparent',
              }}
            >
              {ttsEnabled ? <VolumeUpIcon sx={{ fontSize: 19 }} /> : <VolumeOffIcon sx={{ fontSize: 19 }} />}
            </IconButton>
          </Tooltip>

          {/* Fullscreen Toggle */}
          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}>
            <IconButton
              size="small"
              onClick={() => setIsFullscreen(!isFullscreen)}
              sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              {isFullscreen ? <FullscreenExitIcon sx={{ fontSize: 20 }} /> : <FullscreenIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>

          {/* Clear Chat */}
          <Tooltip title="Clear Chat History">
            <IconButton
              size="small"
              onClick={handleClearHistory}
              sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>

          {/* Close */}
          <IconButton
            size="small"
            onClick={() => {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              onClose();
            }}
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              '&:hover': { color: isDark ? '#ffffff' : '#0f172a' },
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Collapsible Knowledge Base Inspector Panel */}
      <Collapse in={showKbDrawer} sx={{ flexShrink: 0, width: '100%', position: 'relative', zIndex: 9 }}>
        <Box
          sx={{
            p: 2,
            backgroundColor: isDark ? '#050811' : '#f8fafc',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            boxShadow: isDark ? '0 4px 14px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
            <Typography variant="caption" sx={{ color: '#a855f7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📚 Indexed Enterprise Knowledge Modules ({kbDocs.length || 7})
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.72rem' }}>
              Grounded Retrieval via Hybrid BM25 & Semantic Matcher
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
            {(kbDocs.length ? kbDocs : STARTER_PROMPTS).map((doc, idx) => (
              <Box
                key={idx}
                sx={{
                  minWidth: 210,
                  p: 1.2,
                  borderRadius: 2,
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
                  border: isDark ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid #e2e8f0',
                  flexShrink: 0,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Chip
                    size="small"
                    label={doc.id || `KB-0${idx + 1}`}
                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, backgroundColor: isDark ? '#1e1b4b' : '#f3e8ff', color: '#a855f7' }}
                  />
                  <Typography variant="caption" sx={{ fontSize: '0.62rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                    {doc.category || 'Operational'}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.76rem', color: isDark ? '#e2e8f0' : '#1e293b', mb: 0.4 }}>
                  {doc.title || doc.label}
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.68rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {doc.summary || doc.prompt}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Collapse>

      {/* Main Messages Scroll Area */}
      <DialogContent
        sx={{
          p: { xs: 1.8, md: 2.5 },
          flex: '1 1 0px',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.2,
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Quick Starter Chips */}
        {messages.length <= 1 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 700, mb: 1, display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>
              {isWebsiteGuide ? '⚡ Quick Website & Architecture Questions:' : '⚡ Quick Operational Questions:'}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {(isWebsiteGuide ? WEBSITE_GUIDE_PROMPTS : STARTER_PROMPTS).map((item, idx) => (
                <Chip
                  key={idx}
                  icon={<span>{item.icon}</span>}
                  label={item.label}
                  onClick={() => handleSendMessage(item.prompt)}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    py: 1.8,
                    cursor: 'pointer',
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f1f5f9',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #cbd5e1',
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : '#ede9fe',
                      borderColor: '#a855f7',
                      transform: 'translateY(-1px)',
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Render Chat Messages */}
        {messages.map((msg, index) => (
          <Box
            key={msg.id || index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              animation: 'fadeInUp 0.3s ease-out',
              '@keyframes fadeInUp': {
                '0%': { opacity: 0, transform: 'translateY(8px)' },
                '100%': { opacity: 1, transform: 'translateY(0px)' },
              },
            }}
          >
            {/* Sender identity & timestamp */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5, px: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.72rem', color: msg.role === 'user' ? '#38bdf8' : '#c084fc' }}>
                {msg.role === 'user' ? 'You' : isWebsiteGuide ? 'Nova (Website Guide)' : 'Nova (Multimodal RAG)'}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.68rem' }}>
                {msg.timestamp}
              </Typography>
            </Box>

            {/* Message Bubble Container */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                maxWidth: { xs: '92%', md: '84%' },
                borderRadius: 3,
                borderBottomRightRadius: msg.role === 'user' ? 0.8 : 3,
                borderBottomLeftRadius: msg.role === 'assistant' ? 0.8 : 3,
                backgroundColor:
                  msg.role === 'user'
                    ? isDark
                      ? 'rgba(30, 58, 138, 0.5)'
                      : '#eff6ff'
                    : isDark
                    ? 'rgba(15, 23, 42, 0.85)'
                    : '#ffffff',
                border:
                  msg.role === 'user'
                    ? isDark
                      ? '1px solid rgba(59, 130, 246, 0.4)'
                      : '1px solid #bfdbfe'
                    : isDark
                    ? '1px solid rgba(139, 92, 246, 0.3)'
                    : '1px solid #e2e8f0',
                boxShadow: isDark ? '0 4px 18px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* If user attached an image */}
              {msg.imageData && (
                <Box sx={{ mb: 1.5 }}>
                  <Box
                    component="img"
                    src={msg.imageData}
                    alt="User Attachment"
                    sx={{
                      maxHeight: 220,
                      maxWidth: '100%',
                      borderRadius: 2,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  {msg.fileName && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.4, color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.7rem' }}>
                      📎 {msg.fileName}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Multimodal Analysis Badge */}
              {msg.imageAnalysis && (
                <Box
                  sx={{
                    mb: 1.5,
                    p: 1.2,
                    borderRadius: 2,
                    backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : '#faf5ff',
                    border: isDark ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid #e9d5ff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <AutoAwesomeIcon sx={{ color: '#c084fc', fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: isDark ? '#e9d5ff' : '#6b21a8', fontWeight: 700, fontSize: '0.74rem' }}>
                    {msg.imageAnalysis}
                  </Typography>
                </Box>
              )}

              {/* Message Content with Markdown-style rendering */}
              <Typography
                component="div"
                sx={{
                  color: isDark ? '#f1f5f9' : '#1e293b',
                  fontSize: '0.86rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
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
                {msg.content}
              </Typography>

              {/* Grounded RAG Sources Accordion */}
              {msg.sources && msg.sources.length > 0 && (
                <Box sx={{ mt: 2, pt: 1.5, borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9' }}>
                  <Box
                    onClick={() =>
                      setExpandedSourcesIndex(expandedSourcesIndex === index ? null : index)
                    }
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      py: 0.5,
                      borderRadius: 1.5,
                      '&:hover': { opacity: 0.85 },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <MenuBookIcon sx={{ fontSize: 16, color: '#a855f7' }} />
                      <Typography variant="caption" sx={{ color: '#a855f7', fontWeight: 800, fontSize: '0.74rem' }}>
                        Retrieved Enterprise Grounding ({msg.sources.length} Sources)
                      </Typography>
                    </Box>
                    {expandedSourcesIndex === index ? (
                      <ExpandLessIcon sx={{ fontSize: 18, color: '#a855f7' }} />
                    ) : (
                      <ExpandMoreIcon sx={{ fontSize: 18, color: '#a855f7' }} />
                    )}
                  </Box>

                  <Collapse in={expandedSourcesIndex === index}>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {msg.sources.map((src, sIdx) => (
                        <Box
                          key={sIdx}
                          sx={{
                            p: 1.2,
                            borderRadius: 2,
                            backgroundColor: isDark ? '#050811' : '#f8fafc',
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
                              <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.74rem' }}>
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

              {/* Bot Action Bar (TTS Read-Aloud, Copy, Latency) */}
              {msg.role === 'assistant' && (
                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #f8fafc',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* TTS Read Aloud Button */}
                    <Tooltip title={speakingIndex === index ? 'Stop Reading' : 'Read Aloud'}>
                      <Button
                        size="small"
                        onClick={() => speakText(msg.content, index)}
                        startIcon={
                          speakingIndex === index ? (
                            <Box sx={{ display: 'flex', gap: 0.3, alignItems: 'center' }}>
                              <Box sx={{ width: 2, height: 10, backgroundColor: '#10b981', animation: 'eq1 0.6s infinite alternate' }} />
                              <Box sx={{ width: 2, height: 14, backgroundColor: '#10b981', animation: 'eq2 0.8s infinite alternate' }} />
                              <Box sx={{ width: 2, height: 8, backgroundColor: '#10b981', animation: 'eq3 0.5s infinite alternate' }} />
                            </Box>
                          ) : (
                            <VolumeUpIcon sx={{ fontSize: 15 }} />
                          )
                        }
                        sx={{
                          fontSize: '0.72rem',
                          textTransform: 'none',
                          color: speakingIndex === index ? '#10b981' : isDark ? '#94a3b8' : '#64748b',
                          p: '2px 8px',
                          borderRadius: 1.5,
                          '@keyframes eq1': { '0%': { height: 4 }, '100%': { height: 12 } },
                          '@keyframes eq2': { '0%': { height: 14 }, '100%': { height: 6 } },
                          '@keyframes eq3': { '0%': { height: 6 }, '100%': { height: 13 } },
                        }}
                      >
                        {speakingIndex === index ? 'Speaking...' : 'Read Aloud'}
                      </Button>
                    </Tooltip>

                    {/* Copy Button */}
                    <Tooltip title={copiedIndex === index ? 'Copied!' : 'Copy response'}>
                      <Button
                        size="small"
                        onClick={() => copyToClipboard(msg.content, index)}
                        startIcon={copiedIndex === index ? <CheckIcon sx={{ fontSize: 14, color: '#10b981' }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          fontSize: '0.72rem',
                          textTransform: 'none',
                          color: copiedIndex === index ? '#10b981' : isDark ? '#94a3b8' : '#64748b',
                          p: '2px 8px',
                          borderRadius: 1.5,
                        }}
                      >
                        {copiedIndex === index ? 'Copied' : 'Copy'}
                      </Button>
                    </Tooltip>
                  </Box>

                  {msg.latencyMs && (
                    <Typography variant="caption" sx={{ color: isDark ? '#475569' : '#94a3b8', fontSize: '0.68rem' }}>
                      ⚡ {msg.latencyMs}ms
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>

            {/* Dynamic Follow-up Suggestions */}
            {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && index === messages.length - 1 && (
              <Box sx={{ mt: 1.2, pl: 0.5, maxWidth: '85%' }}>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.7rem', fontWeight: 700, display: 'block', mb: 0.6 }}>
                  Suggested Follow-ups:
                </Typography>
                <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', gap: 0.8 }}>
                  {msg.suggestedFollowups.map((q, qIdx) => (
                    <Chip
                      key={qIdx}
                      size="small"
                      label={q}
                      onClick={() => handleSendMessage(q)}
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                        color: isDark ? '#cbd5e1' : '#334155',
                        '&:hover': {
                          backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#ede9fe',
                          borderColor: '#a855f7',
                        },
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        ))}

        {/* ULTRA-ADVANCED ANIMATED LOADER */}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              animation: 'fadeInUp 0.3s ease-out',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                borderBottomLeftRadius: 1,
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
                border: '1.5px solid',
                borderColor: isDark ? 'rgba(139, 92, 246, 0.5)' : '#c084fc',
                boxShadow: isDark
                  ? '0 10px 30px rgba(139, 92, 246, 0.25), inset 0 0 20px rgba(139, 92, 246, 0.1)'
                  : '0 8px 24px rgba(139, 92, 246, 0.15)',
                minWidth: { xs: 260, sm: 360 },
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Concentric Rotating Neural Orb Animation */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {/* Outer spinning ring (Pink) */}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      border: '2px dashed #ec4899',
                      animation: 'spinClockwise 3s linear infinite',
                      '@keyframes spinClockwise': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                  {/* Middle counter-spinning ring (Purple) */}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 4,
                      borderRadius: '50%',
                      border: '2px solid transparent',
                      borderTopColor: '#a855f7',
                      borderRightColor: '#a855f7',
                      animation: 'spinCounter 2s linear infinite',
                      '@keyframes spinCounter': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(-360deg)' },
                      },
                    }}
                  />
                  {/* Core pulsating neural orb */}
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #38bdf8 20%, #8b5cf6 90%)',
                      boxShadow: '0 0 12px #38bdf8, 0 0 20px #8b5cf6',
                      animation: 'orbPulse 1.2s ease-in-out infinite alternate',
                      '@keyframes orbPulse': {
                        '0%': { transform: 'scale(0.85)', opacity: 0.7 },
                        '100%': { transform: 'scale(1.2)', opacity: 1 },
                      },
                    }}
                  />
                </Box>

                {/* Progress Text with live stage changes */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight="800"
                    sx={{
                      color: isDark ? '#f8fafc' : '#0f172a',
                      fontSize: '0.84rem',
                      lineHeight: 1.3,
                    }}
                  >
                    Nova Cognitive Engine
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#a855f7',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      display: 'block',
                      animation: 'fadeInText 0.4s ease',
                      '@keyframes fadeInText': {
                        '0%': { opacity: 0, transform: 'translateY(2px)' },
                        '100%': { opacity: 1, transform: 'translateY(0px)' },
                      },
                    }}
                  >
                    {loaderStageTexts[loaderStage]}
                  </Typography>
                </Box>
              </Box>

              {/* Futuristic Scanning Progress Bar */}
              <Box
                sx={{
                  width: '100%',
                  height: 3,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '40%',
                    background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)',
                    borderRadius: 2,
                    animation: 'scanBeam 1.5s ease-in-out infinite',
                    '@keyframes scanBeam': {
                      '0%': { left: '-40%' },
                      '100%': { left: '100%' },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </DialogContent>

      {/* Multimodal Attachment Preview Strip (Only in workspace mode) */}
      {!isWebsiteGuide && attachedImage && (
        <Box
          sx={{
            px: 2,
            py: 1,
            backgroundColor: isDark ? '#050811' : '#f1f5f9',
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            position: 'relative',
            zIndex: 10,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src={attachedImage.dataUrl}
              alt="Attached preview"
              sx={{
                width: 38,
                height: 38,
                objectFit: 'cover',
                borderRadius: 1.5,
                border: '1px solid rgba(139, 92, 246, 0.4)',
              }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem', color: isDark ? '#f8fafc' : '#0f172a' }}>
                {attachedImage.name}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.68rem' }}>
                {attachedImage.size} • Multimodal Vision Ready
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setAttachedImage(null)} sx={{ color: '#ef4444' }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}

      {/* Input Control Bar */}
      <Box
        sx={{
          p: { xs: 1.5, md: 2 },
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          backdropFilter: 'blur(12px)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Spoken Query Auto-Correction Notice Banner */}
        {speechCorrectionNotice && speechCorrectionNotice.changesMade && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 0.6,
              mb: 1,
              borderRadius: 2,
              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f3e8ff',
              border: isDark ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid #d8b4fe',
              animation: 'fadeIn 0.25s ease-out',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, overflow: 'hidden' }}>
              <AutoAwesomeIcon sx={{ fontSize: 16, color: '#a855f7', flexShrink: 0 }} />
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? '#e9d5ff' : '#6b21a8',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                ✨ Spoken query auto-corrected for grammar & spelling
              </Typography>
            </Box>
            <Button
              size="small"
              startIcon={<UndoIcon sx={{ fontSize: 13 }} />}
              onClick={handleUndoSpeechCorrection}
              sx={{
                minWidth: 'auto',
                py: 0.2,
                px: 1,
                fontSize: '0.7rem',
                fontWeight: 700,
                color: isDark ? '#93c5fd' : '#2563eb',
                textTransform: 'none',
                flexShrink: 0,
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                },
              }}
            >
              Undo
            </Button>
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: isDark ? '#050811' : '#f8fafc',
            borderRadius: 3,
            p: '4px 8px',
            border: '1px solid',
            borderColor: isListening
              ? '#ef4444'
              : isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : '#cbd5e1',
            transition: 'all 0.2s ease',
            boxShadow: isListening
              ? '0 0 16px rgba(239, 68, 68, 0.35)'
              : 'none',
            '&:focus-within': {
              borderColor: '#a855f7',
              boxShadow: '0 0 16px rgba(168, 85, 247, 0.25)',
            },
          }}
        >
          {/* Hidden File Input (Only in workspace mode) */}
          {!isWebsiteGuide && (
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          )}

          {/* Attachment Button (Only in workspace mode) */}
          {!isWebsiteGuide && (
            <Tooltip title="Attach screenshot or error image (or drag & drop / paste Ctrl+V)">
              <IconButton
                size="small"
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  color: attachedImage ? '#a855f7' : isDark ? '#94a3b8' : '#64748b',
                  '&:hover': { color: '#a855f7' },
                }}
              >
                <AttachFileIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Microphone Voice Capture Button */}
          <Tooltip
            title={
              isListening
                ? 'Listening... Click to finish speaking'
                : 'Microphone (Click to speak your question)'
            }
          >
            <IconButton
              size="small"
              onClick={handleToggleListening}
              sx={{
                color: isListening ? '#ffffff' : isDark ? '#94a3b8' : '#64748b',
                backgroundColor: isListening ? '#ef4444' : 'transparent',
                border: isListening ? '1px solid #dc2626' : '1px solid transparent',
                transition: 'all 0.2s ease',
                position: 'relative',
                '&:hover': {
                  color: isListening ? '#ffffff' : '#a855f7',
                  backgroundColor: isListening
                    ? '#dc2626'
                    : isDark
                    ? 'rgba(139, 92, 246, 0.12)'
                    : '#f3e8ff',
                },
                ...(isListening && {
                  animation: 'pulseRecordRing 1.3s infinite',
                  '@keyframes pulseRecordRing': {
                    '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.6)' },
                    '50%': { transform: 'scale(1.08)', boxShadow: '0 0 0 6px rgba(239, 68, 68, 0)' },
                  },
                }),
              }}
            >
              {isListening ? <GraphicEqIcon sx={{ fontSize: 19 }} /> : <MicIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>

          {/* AI Auto-Correct Toggle Button (Beside Microphone) */}
          <Tooltip
            title={
              aiAutoCorrectEnabled
                ? 'AI Speech Auto-Correct: ON (Fixes grammar & spelling automatically)'
                : 'AI Speech Auto-Correct: OFF (Keeps raw spoken transcript)'
            }
          >
            <IconButton
              size="small"
              onClick={() => {
                const next = !aiAutoCorrectEnabled;
                setAiAutoCorrectEnabled(next);
                if (!next) setSpeechCorrectionNotice(null);
              }}
              sx={{
                color: aiAutoCorrectEnabled
                  ? isDark
                    ? '#c084fc'
                    : '#7c3aed'
                  : isDark
                  ? '#475569'
                  : '#94a3b8',
                backgroundColor: aiAutoCorrectEnabled
                  ? isDark
                    ? 'rgba(139, 92, 246, 0.18)'
                    : '#ede9fe'
                  : 'transparent',
                border: aiAutoCorrectEnabled
                  ? isDark
                    ? '1px solid rgba(139, 92, 246, 0.45)'
                    : '1px solid #c4b5fd'
                  : '1px solid transparent',
                position: 'relative',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: aiAutoCorrectEnabled
                    ? isDark
                      ? 'rgba(139, 92, 246, 0.3)'
                      : '#ddd6fe'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : '#f1f5f9',
                },
              }}
            >
              <AutoFixHighIcon sx={{ fontSize: 18 }} />
              {/* Active green dot indicator */}
              {aiAutoCorrectEnabled && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 4px #10b981',
                  }}
                />
              )}
            </IconButton>
          </Tooltip>

          {/* Text Input */}
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={
              isListening
                ? '🎙️ Listening... speak your query now (click mic when done)...'
                : isCorrectingSpeech
                ? '✨ AI is auto-correcting grammar & spelling...'
                : isWebsiteGuide
                ? 'Ask how this website works, its architecture, or features...'
                : 'Ask Nova about SLAs, routing, webhooks, or drop a screenshot...'
            }
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '0.88rem',
                color: isDark ? '#f8fafc' : '#0f172a',
                py: 0.5,
              },
            }}
          />

          {/* Inline Speech Auto-Correction Spinner */}
          {isCorrectingSpeech && (
            <Tooltip title="AI is checking grammar & spelling...">
              <CircularProgress size={18} sx={{ color: '#a855f7', mr: 0.5, flexShrink: 0 }} />
            </Tooltip>
          )}

          {/* Send Button */}
          <Button
            variant="contained"
            size="small"
            disabled={
              loading ||
              isCorrectingSpeech ||
              (isWebsiteGuide ? !inputQuery.trim() : !inputQuery.trim() && !attachedImage)
            }
            onClick={() => handleSendMessage()}
            sx={{
              minWidth: 42,
              width: 42,
              height: 40,
              p: 0,
              borderRadius: 2.2,
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 18px rgba(236, 72, 153, 0.55)',
              },
              '&:disabled': {
                opacity: 0.45,
                background: isDark ? '#334155' : '#cbd5e1',
              },
            }}
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
          </Button>
        </Box>

        {/* Bottom Helper text */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.8, px: 0.5 }}>
          <Typography variant="caption" sx={{ color: isDark ? '#475569' : '#94a3b8', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <span>🎙️ <strong>Click mic</strong> to speak</span>
            <span>•</span>
            <span style={{ color: aiAutoCorrectEnabled ? (isDark ? '#c084fc' : '#7c3aed') : 'inherit', fontWeight: aiAutoCorrectEnabled ? 700 : 400 }}>
              ✨ AI Auto-Correct: {aiAutoCorrectEnabled ? 'ON' : 'OFF'}
            </span>
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? '#475569' : '#94a3b8', fontSize: '0.68rem' }}>
            {isWebsiteGuide ? 'Platform & Architecture Guide' : 'Grounded by Gemini 2.5 & LangGraph'}
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}

