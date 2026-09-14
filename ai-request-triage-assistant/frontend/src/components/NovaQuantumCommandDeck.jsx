import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import MemoryIcon from '@mui/icons-material/Memory';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';

import NovaAutonomousSwarmLab from './NovaAutonomousSwarmLab';
import { useColorMode } from '../ThemeContext';

const MISSION_CAPSULES = [
  {
    id: 'vision',
    icon: '📸',
    title: 'Multimodal Vision OCR',
    subtitle: 'Upload inquiry screenshots, 504 gateway timeout dumps, or billing receipts for instant optical extraction.',
    badge: 'Gemini 2.5 Flash Vision',
    color: '#06b6d4',
    bgGlow: 'rgba(6, 182, 212, 0.15)',
  },
  {
    id: 'langgraph',
    icon: '⚡',
    title: 'LangGraph Cognitive Routing',
    subtitle: 'Inspect node-by-node SLA decision trees, confidence scores, and automated multi-department handoffs.',
    badge: 'Sub-second Triage',
    color: '#a855f7',
    bgGlow: 'rgba(168, 85, 247, 0.15)',
  },
  {
    id: 'voice',
    icon: '🎙️',
    title: 'Neural Audio & Speech TTS',
    subtitle: 'Listen to operational briefings aloud and submit voice prompts using browser Web Speech recognition.',
    badge: 'Neural Voice Engine',
    color: '#ec4899',
    bgGlow: 'rgba(236, 72, 153, 0.15)',
  },
  {
    id: 'rag',
    icon: '🧠',
    title: 'Vector Knowledge RAG',
    subtitle: 'Deep semantic retrieval across organizational policies, emergency SOPs, and service level agreements.',
    badge: 'Vector Embeddings',
    color: '#10b981',
    bgGlow: 'rgba(16, 185, 129, 0.15)',
  },
];

export default function NovaQuantumCommandDeck({
  onEngageNova,
  onLaunchWorkspace,
  apiKey = '',
}) {
  const { isDark } = useColorMode();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [swarmLabOpen, setSwarmLabOpen] = useState(false);
  const [equalizerHeights, setEqualizerHeights] = useState([18, 34, 12, 45, 28, 50, 22, 38, 14, 42]);

  // Audio Equalizer dynamic bar animation
  useEffect(() => {
    const interval = setInterval(() => {
      setEqualizerHeights((prev) =>
        prev.map(() =>
          isSpeaking
            ? Math.floor(Math.random() * 42) + 12
            : Math.floor(Math.random() * 18) + 8
        )
      );
    }, 120);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Voice Intro Synthesizer
  const handleSpeakNovaIntro = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const introText =
      'Greetings! I am Nova, your multimodal AI triage intelligence. Powered by Google Gemini 2.5 Flash and LangGraph, I can analyze complex inquiry documents, decode customer screenshots, and route emergency incidents with zero latency. Engage me now for live autonomous triage!';

    const utterance = new SpeechSynthesisUtterance(introText);
    utterance.rate = 1.02;
    utterance.pitch = 1.05;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <Box sx={{ position: 'relative', my: 6, px: { xs: 1, sm: 2 } }}>
      {/* Outer Glow Halo */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          right: '15%',
          bottom: '10%',
          borderRadius: '40px',
          background: isDark
            ? 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.25), rgba(59, 130, 246, 0.18), transparent 70%)'
            : 'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.15), rgba(99, 102, 241, 0.12), transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main Glass Deck Container */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          zIndex: 1,
          borderRadius: 6,
          p: { xs: 3, sm: 5, md: 6 },
          overflow: 'hidden',
          background: isDark
            ? 'linear-gradient(145deg, rgba(17, 24, 39, 0.85) 0%, rgba(10, 15, 29, 0.95) 100%)'
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(248, 250, 252, 0.96) 100%)',
          backdropFilter: 'blur(24px)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(168, 85, 247, 0.35)' : 'rgba(168, 85, 247, 0.2)',
          boxShadow: isDark
            ? '0 30px 80px -20px rgba(0, 0, 0, 0.8), 0 0 50px rgba(168, 85, 247, 0.15)'
            : '0 30px 70px -20px rgba(99, 102, 241, 0.18), 0 0 40px rgba(236, 72, 153, 0.1)',
        }}
      >
        {/* Top Floating Telemetry Status Ribbon */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            pb: 4,
            mb: 4,
            borderBottom: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: '#10b981',
                boxShadow: '0 0 12px #10b981',
                animation: 'pulseGreen 2s infinite',
                '@keyframes pulseGreen': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.5, transform: 'scale(1.25)' },
                },
              }}
            />
            <Typography
              variant="caption"
              fontWeight={800}
              sx={{
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isDark ? '#38bdf8' : '#0284c7',
                fontSize: '0.75rem',
              }}
            >
              Nova Quantum Nexus • Autonomous Live Deck
            </Typography>
            <Chip
              size="small"
              icon={<AutoAwesomeIcon style={{ fontSize: 13, color: '#f59e0b' }} />}
              label="Gemini 2.5 Flash Multimodal"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                color: isDark ? '#fbbf24' : '#b45309',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            />
          </Stack>

          {/* Telemetry Pills */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.6,
                fontSize: '0.72rem',
                fontWeight: 600,
                color: isDark ? '#94a3b8' : '#64748b',
              }}
            >
              <MemoryIcon sx={{ fontSize: 14, color: '#a855f7' }} />
              <span>Inference: &lt;420ms</span>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.6,
                fontSize: '0.72rem',
                fontWeight: 600,
                color: isDark ? '#94a3b8' : '#64748b',
              }}
            >
              <ShieldOutlinedIcon sx={{ fontSize: 14, color: '#3b82f6' }} />
              <span>Zero-Shot Privacy</span>
            </Box>
          </Stack>
        </Box>

        {/* Central Quantum Reactor Hologram & Hero Title */}
        <Grid container spacing={4} alignItems="center" sx={{ mb: 5 }}>
          {/* Left: Interactive 3D Quantum Orb */}
          <Grid item xs={12} md={5} sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                position: 'relative',
                width: { xs: 200, sm: 230 },
                height: { xs: 200, sm: 230 },
                mx: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Outer Counter-Rotating Ring 1 */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px dashed',
                  borderColor: isDark ? 'rgba(168, 85, 247, 0.5)' : 'rgba(168, 85, 247, 0.4)',
                  animation: 'spinClockwise 16s linear infinite',
                  '@keyframes spinClockwise': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />

              {/* Orbiting Ring 2 */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 16,
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: isDark ? 'rgba(6, 182, 212, 0.4)' : 'rgba(6, 182, 212, 0.3)',
                  borderTopColor: 'transparent',
                  animation: 'spinCounter 10s linear infinite',
                  '@keyframes spinCounter': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(-360deg)' },
                  },
                }}
              />

              {/* Energy Glow Pulsing Sphere */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 32,
                  borderRadius: '50%',
                  background: isSpeaking
                    ? 'radial-gradient(circle, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)'
                    : 'radial-gradient(circle, #8b5cf6 0%, #3b82f6 50%, #06b6d4 100%)',
                  opacity: isSpeaking ? 0.95 : 0.75,
                  boxShadow: isSpeaking
                    ? '0 0 50px rgba(236, 72, 153, 0.8), inset 0 0 25px rgba(255, 255, 255, 0.6)'
                    : '0 0 35px rgba(139, 92, 246, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.4)',
                  transition: 'all 0.5s ease',
                  animation: 'breathingPulse 3s ease-in-out infinite',
                  '@keyframes breathingPulse': {
                    '0%, 100%': { transform: 'scale(0.96)' },
                    '50%': { transform: 'scale(1.04)' },
                  },
                }}
              />

              {/* Center Robot Icon with floating bounce */}
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  animation: 'floatRobot 2.5s ease-in-out infinite',
                  '@keyframes floatRobot': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' },
                  },
                }}
              >
                <Typography sx={{ fontSize: { xs: '3.8rem', sm: '4.5rem' }, lineHeight: 1 }}>
                  🤖
                </Typography>
              </Box>

              {/* Orbiting Satellite Particle */}
              <Box
                sx={{
                  position: 'absolute',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor: '#38bdf8',
                  boxShadow: '0 0 10px #38bdf8',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  animation: 'orbitSatellite 6s linear infinite',
                  transformOrigin: '50% 115px',
                  '@keyframes orbitSatellite': {
                    '0%': { transform: 'translateX(-50%) rotate(0deg)' },
                    '100%': { transform: 'translateX(-50%) rotate(360deg)' },
                  },
                }}
              />
            </Box>

            {/* Audio Wave Visualizer Bars under Orb */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                height: 48,
                mt: 2,
              }}
            >
              {equalizerHeights.map((h, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 4,
                    height: `${h}px`,
                    borderRadius: 2,
                    background: isSpeaking
                      ? 'linear-gradient(180deg, #ec4899 0%, #a855f7 100%)'
                      : 'linear-gradient(180deg, #38bdf8 0%, #3b82f6 100%)',
                    transition: 'height 0.12s ease',
                  }}
                />
              ))}
            </Box>

            {/* Neural Voice Test Button */}
            <Button
              variant="outlined"
              size="small"
              onClick={handleSpeakNovaIntro}
              startIcon={isSpeaking ? <StopIcon sx={{ color: '#ef4444' }} /> : <VolumeUpIcon sx={{ color: '#38bdf8' }} />}
              sx={{
                mt: 1,
                borderRadius: 4,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                borderColor: isSpeaking ? '#ef4444' : isDark ? 'rgba(56, 189, 248, 0.4)' : '#38bdf8',
                color: isSpeaking ? '#ef4444' : isDark ? '#38bdf8' : '#0284c7',
                bgcolor: isSpeaking
                  ? 'rgba(239, 68, 68, 0.1)'
                  : isDark ? 'rgba(56, 189, 248, 0.06)' : 'rgba(56, 189, 248, 0.08)',
                '&:hover': {
                  borderColor: isSpeaking ? '#dc2626' : '#0284c7',
                  bgcolor: isSpeaking ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                },
              }}
            >
              {isSpeaking ? 'Stop Audio Voice' : '▶ Play Live Neural Voice Introduction'}
            </Button>
          </Grid>

          {/* Right: Master Headline & Interactive Triggers */}
          <Grid item xs={12} md={7}>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                mb: 1.5,
                background: isDark
                  ? 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 40%, #cbd5e1 100%)'
                  : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.75rem', sm: '2.2rem' },
              }}
            >
              Supercharge Operations with Nova's Autonomous Neural Core
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: isDark ? '#94a3b8' : '#475569',
                lineHeight: 1.65,
                mb: 3,
                fontSize: { xs: '0.95rem', sm: '1.02rem' },
              }}
            >
              Nova is not a basic chatbot. It is a multimodal operational co-pilot capable of optical OCR parsing on infrastructure logs, voice-driven triage diagnostics, and real-time SLA matrix routing.
            </Typography>

            {/* 4 Mission Quick-Strike Capsules */}
            <Grid container spacing={1.5} sx={{ mb: 3 }}>
              {MISSION_CAPSULES.map((capsule) => (
                <Grid item xs={12} sm={6} key={capsule.id}>
                  <Box
                    sx={{
                      p: 1.8,
                      borderRadius: 3,
                      cursor: 'default',
                      userSelect: 'none',
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        borderColor: capsule.color,
                        boxShadow: `0 4px 16px ${capsule.bgGlow}`,
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.6 }}>
                      <Typography sx={{ fontSize: '1.25rem', lineHeight: 1 }}>{capsule.icon}</Typography>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                        {capsule.title}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block', lineHeight: 1.45, mb: 1 }}>
                      {capsule.subtitle}
                    </Typography>
                    <Chip
                      size="small"
                      label={capsule.badge}
                      sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        color: capsule.color,
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Master Action Button */}
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() => setSwarmLabOpen(true)}
                startIcon={<ScienceOutlinedIcon sx={{ fontSize: 24 }} />}
                sx={{
                  py: 1.8,
                  px: 4,
                  borderRadius: 3.5,
                  fontSize: { xs: '0.98rem', sm: '1.08rem' },
                  fontWeight: 800,
                  textTransform: 'none',
                  letterSpacing: '0.02em',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
                  boxShadow: '0 10px 32px rgba(139, 92, 246, 0.45)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px) scale(1.005)',
                    boxShadow: '0 14px 44px rgba(236, 72, 153, 0.6)',
                    background: 'linear-gradient(135deg, #0891b2 0%, #7c3aed 50%, #db2777 100%)',
                  },
                }}
              >
                🔬 Autonomous Swarm Lab (Live GenAI Simulation)
              </Button>
            </Box>

            {/* In-Place Autonomous Swarm Lab Modal (No Redirect) */}
            <NovaAutonomousSwarmLab
              open={swarmLabOpen}
              onClose={() => setSwarmLabOpen(false)}
              apiKey={apiKey}
            />

            {/* Floating Robot Companion Hint */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.2,
                mt: 2.5,
                p: '6px 14px',
                borderRadius: 20,
                bgcolor: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.06)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.15)',
              }}
            >
              <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>🤖</Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? '#c084fc' : '#7c3aed',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                }}
              >
                <strong>Pro-tip:</strong> Nova is also hovering dynamically at the bottom-right corner of your screen for ambient instant triage anytime.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
