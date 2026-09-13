import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Box,
  Button,
  CircularProgress,
  Stack,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  useTheme,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ClearIcon from '@mui/icons-material/Clear';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import ForumIcon from '@mui/icons-material/Forum';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

export default function RequestInput({
  requestText,
  onChangeText,
  onTriage,
  loading,
  onClear,
  activeSample,
  hasApiKey,
  onOpenKeyModal,
  onSaveAsPreset,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isSubmitDisabled = loading || !requestText.trim() || requestText.trim().length < 5;

  // Preset modal state
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [presetTitle, setPresetTitle] = useState('');
  const [presetSender, setPresetSender] = useState('');
  const [presetChannel, setPresetChannel] = useState('Email');
  const [presetCategory, setPresetCategory] = useState('Support');
  const [presetPriority, setPresetPriority] = useState('Medium');

  // AI Polish & Anonymize state
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState(null);
  const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
  const [enhanceError, setEnhanceError] = useState('');

  // Simulated live execution steps during triage
  const [pipelineStep, setPipelineStep] = useState(1);

  useEffect(() => {
    let t1, t2, t3;
    if (loading) {
      setPipelineStep(1);
      t1 = setTimeout(() => setPipelineStep(2), 350);
      t2 = setTimeout(() => setPipelineStep(3), 750);
      t3 = setTimeout(() => setPipelineStep(4), 1150);
    } else {
      setPipelineStep(1);
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [loading]);

  // Fast client-side heuristics
  const wordCount = requestText.trim() ? requestText.trim().split(/\s+/).length : 0;
  const estReadTimeSec = Math.max(1, Math.round(wordCount / 3.5));

  const lowerText = requestText.toLowerCase();
  const hasOutageKeywords = lowerText.includes('500') || lowerText.includes('504') || lowerText.includes('outage') || lowerText.includes('crash') || lowerText.includes('down');
  const hasBillingKeywords = lowerText.includes('invoice') || lowerText.includes('billing') || lowerText.includes('charged') || lowerText.includes('rate') || lowerText.includes('refund');
  const hasSalesKeywords = lowerText.includes('seats') || lowerText.includes('pricing') || lowerText.includes('contract') || lowerText.includes('quote') || lowerText.includes('expansion');

  const handleOpenBookmark = () => {
    setPresetTitle(activeSample?.title ? `${activeSample.title} (Copy)` : 'Custom Inquiry Scenario');
    setPresetSender(activeSample?.sender || 'Client Name (Company)');
    setPresetChannel(activeSample?.channel || 'Email');
    setPresetCategory(activeSample?.expected_category || 'Support');
    setPresetPriority(activeSample?.expected_priority || 'Medium');
    setIsBookmarkModalOpen(true);
  };

  const handleConfirmSavePreset = async () => {
    if (!presetTitle.trim() || !presetSender.trim()) return;
    if (onSaveAsPreset) {
      await onSaveAsPreset({
        title: presetTitle.trim(),
        sender: presetSender.trim(),
        channel: presetChannel.trim(),
        expected_category: presetCategory,
        expected_priority: presetPriority,
        text: requestText.trim(),
      });
    }
    setIsBookmarkModalOpen(false);
  };

  const handleRunEnhanceAndAnonymize = async () => {
    if (!requestText.trim() || requestText.trim().length < 5) return;
    setEnhancing(true);
    setEnhanceError('');
    try {
      const res = await fetch('/api/ai/enhance-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: requestText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setEnhancedResult(data);
        setIsEnhanceModalOpen(true);
      } else {
        const err = await res.json();
        setEnhanceError(err.detail || 'Failed to enhance text.');
      }
    } catch {
      setEnhanceError('Network error while enhancing text.');
    } finally {
      setEnhancing(false);
    }
  };

  const handleApplyEnhancedText = () => {
    if (enhancedResult?.enhanced_text) {
      onChangeText(enhancedResult.enhanced_text);
    }
    setIsEnhanceModalOpen(false);
  };

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 3.5,
        position: 'relative',
        overflow: 'hidden',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
        backdropFilter: 'blur(20px)',
        boxShadow: isDark
          ? '0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(139, 92, 246, 0.08)'
          : '0 8px 24px -6px rgba(15, 23, 42, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #3b82f6 0%, #7c3aed 50%, #ec4899 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmerAccentInput 4s linear infinite',
        },
        '@keyframes shimmerAccentInput': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
        '&:hover': {
          boxShadow: isDark
            ? '0 14px 36px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(139, 92, 246, 0.15)'
            : '0 12px 30px -6px rgba(15, 23, 42, 0.1)',
        },
      }}
    >
      {/* Top Header Strip */}
      <Box
        sx={{
          px: 3,
          py: 2,
          backgroundColor: isDark ? 'rgba(8, 12, 20, 0.5)' : '#fafafa',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
            }}
          >
            <PsychologyIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="800" sx={{ color: isDark ? '#ffffff' : '#0f172a', lineHeight: 1.2 }}>
              Incoming Client Request
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              Raw unstructured email, support ticket, or webhook payload
            </Typography>
          </Box>
        </Box>

        {activeSample && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              icon={<ForumIcon sx={{ fontSize: 15 }} />}
              label={activeSample.channel}
              sx={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                color: isDark ? '#cbd5e1' : '#475569',
                fontWeight: 600,
                fontSize: '0.75rem',
                borderRadius: 1.8,
              }}
            />
            <Chip
              size="small"
              icon={<AlternateEmailIcon sx={{ fontSize: 15 }} />}
              label={activeSample.sender}
              sx={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                borderColor: isDark ? '#334155' : '#cbd5e1',
                color: isDark ? '#f8fafc' : '#0f172a',
                fontWeight: 600,
                fontSize: '0.75rem',
                borderRadius: 1.8,
              }}
              variant="outlined"
            />
          </Stack>
        )}
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* Text Input Area with Modern Glowing Border */}
        <TextField
          multiline
          rows={6}
          fullWidth
          placeholder="Paste client inquiry, emergency Slack message, billing dispute, or Zendesk ticket payload..."
          value={requestText}
          onChange={(e) => onChangeText(e.target.value)}
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              backgroundColor: isDark ? 'rgba(8, 12, 20, 0.65)' : '#ffffff',
              fontSize: '0.92rem',
              lineHeight: 1.6,
              color: 'text.primary',
              transition: 'all 0.25s ease',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.09)' : '1px solid #cbd5e1',
              '& fieldset': { border: 'none' },
              '&:hover': {
                borderColor: isDark ? 'rgba(139, 92, 246, 0.4)' : '#94a3b8',
                backgroundColor: isDark ? 'rgba(8, 12, 20, 0.85)' : '#ffffff',
              },
              '&.Mui-focused': {
                borderColor: '#8b5cf6',
                boxShadow: isDark
                  ? '0 0 0 3px rgba(139, 92, 246, 0.3), 0 4px 16px rgba(139, 92, 246, 0.15)'
                  : '0 0 0 3px rgba(124, 58, 237, 0.15), 0 4px 12px rgba(124, 58, 237, 0.08)',
              },
            },
          }}
        />

        {/* Real-time Telemetry & Intelligence Indicators */}
        <Box
          sx={{
            mt: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            py: 0.8,
            px: 1,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
              <strong>{requestText.length}</strong> chars • <strong>{wordCount}</strong> words • ~{estReadTimeSec}s read
            </Typography>

            {hasOutageKeywords && (
              <Chip
                size="small"
                label="🚨 Outage Detected"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                  border: isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #fca5a5',
                  color: isDark ? '#fca5a5' : '#dc2626',
                  fontWeight: 700,
                  animation: 'badgePop 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)',
                  '@keyframes badgePop': {
                    '0%': { opacity: 0, transform: 'scale(0.8)' },
                    '100%': { opacity: 1, transform: 'scale(1)' },
                  },
                }}
              />
            )}
            {hasBillingKeywords && (
              <Chip
                size="small"
                label="💳 Financial Query"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
                  border: isDark ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #fde68a',
                  color: isDark ? '#fde68a' : '#d97706',
                  fontWeight: 700,
                  animation: 'badgePop 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)',
                  '@keyframes badgePop': {
                    '0%': { opacity: 0, transform: 'scale(0.8)' },
                    '100%': { opacity: 1, transform: 'scale(1)' },
                  },
                }}
              />
            )}
            {hasSalesKeywords && (
              <Chip
                size="small"
                label="📈 Expansion Signal"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                  border: isDark ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid #bfdbfe',
                  color: isDark ? '#93c5fd' : '#2563eb',
                  fontWeight: 700,
                  animation: 'badgePop 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)',
                  '@keyframes badgePop': {
                    '0%': { opacity: 0, transform: 'scale(0.8)' },
                    '100%': { opacity: 1, transform: 'scale(1)' },
                  },
                }}
              />
            )}
          </Stack>

          {/* Quick AI Action Tools */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Scrub passwords, card numbers, and PII, then polish into an executive briefing">
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleRunEnhanceAndAnonymize}
                  disabled={enhancing || !requestText.trim() || requestText.trim().length < 5}
                  startIcon={enhancing ? <CircularProgress size={14} /> : <SecurityIcon fontSize="small" />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderColor: '#a855f7',
                    color: '#7c3aed',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(168, 85, 247, 0.08)',
                      borderColor: '#9333ea',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {enhancing ? 'Scrubbing & Polishing...' : '✦ AI Polish & Scrub PII'}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Box>

        {enhanceError && (
          <Alert severity="error" sx={{ mt: 1.5, py: 0.5 }}>
            {enhanceError}
          </Alert>
        )}

        {!hasApiKey && (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={onOpenKeyModal}>
                Set Key
              </Button>
            }
            sx={{ mt: 2, borderRadius: 2 }}
          >
            No Gemini API key detected. Please configure a key to run the LangGraph agent.
          </Alert>
        )}

        {/* Live LangGraph Pipeline Execution Visualizer */}
        {loading && (
          <Paper
            elevation={0}
            sx={{
              mt: 2.5,
              p: 2.5,
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: isDark ? 'rgba(11, 15, 25, 0.85)' : '#f8fafc',
              border: isDark ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid #cbd5e1',
              boxShadow: isDark
                ? '0 8px 24px -6px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.15)'
                : '0 6px 18px -4px rgba(124, 58, 237, 0.1)',
              animation: 'pipeGlow 3s ease-in-out infinite alternate',
              '@keyframes pipeGlow': {
                '0%': { borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : '#cbd5e1' },
                '100%': { borderColor: isDark ? 'rgba(236, 72, 153, 0.5)' : '#818cf8' },
              },
            }}
          >
            {/* Top Animated Status Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 10px #10b981',
                    animation: 'radarPulse 1.4s infinite ease-in-out',
                    '@keyframes radarPulse': {
                      '0%': { transform: 'scale(0.9)', opacity: 0.8 },
                      '50%': { transform: 'scale(1.5)', opacity: 1 },
                      '100%': { transform: 'scale(0.9)', opacity: 0.8 },
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: '#a855f7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  LangGraph State Graph Running
                </Typography>
                <Chip
                  size="small"
                  label={`Node ${pipelineStep} / 4`}
                  sx={{
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#ede9fe',
                    color: isDark ? '#c084fc' : '#6d28d9',
                  }}
                />
              </Box>

              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontStyle: 'italic', fontWeight: 500 }}>
                {pipelineStep === 1 && '✦ Parsing request tokens & extracting semantic entities...'}
                {pipelineStep === 2 && '✦ Calculating churn risk & evaluating SLA priority matrix...'}
                {pipelineStep === 3 && '✦ Classifying taxonomy & binding to department owner...'}
                {pipelineStep >= 4 && '✦ Synthesizing empathetic, executive & concise drafts...'}
              </Typography>
            </Box>

            {/* Connecting Track Beam */}
            <Box
              sx={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' },
                gap: 1.5,
              }}
            >
              {[
                { step: 1, label: '1. Inbound Parsing', sub: 'Entities & Intent' },
                { step: 2, label: '2. SLA Urgency', sub: 'Matrix Evaluation' },
                { step: 3, label: '3. Dept Routing', sub: 'Skill Taxonomy' },
                { step: 4, label: '4. Tone Synthesis', sub: 'Multi-Perspective' },
              ].map((item) => {
                const isCompleted = pipelineStep > item.step;
                const isCurrent = pipelineStep === item.step;
                return (
                  <Box
                    key={item.step}
                    sx={{
                      p: 1.4,
                      borderRadius: 2.2,
                      backgroundColor: isCurrent
                        ? (isDark ? 'rgba(139, 92, 246, 0.18)' : '#f3e8ff')
                        : isCompleted
                        ? (isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5')
                        : (isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff'),
                      border: '1px solid',
                      borderColor: isCurrent
                        ? (isDark ? '#a855f7' : '#7c3aed')
                        : isCompleted
                        ? (isDark ? '#10b981' : '#34d399')
                        : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'),
                      boxShadow: isCurrent
                        ? '0 0 16px rgba(139, 92, 246, 0.3)'
                        : isCompleted
                        ? '0 0 10px rgba(16, 185, 129, 0.15)'
                        : 'none',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {isCurrent && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '2px',
                          background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)',
                          backgroundSize: '200% 100%',
                          animation: 'activeStepBeam 1.5s linear infinite',
                          '@keyframes activeStepBeam': {
                            '0%': { backgroundPosition: '0% 0%' },
                            '100%': { backgroundPosition: '200% 0%' },
                          },
                        }}
                      />
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                      {isCompleted ? (
                        <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      ) : isCurrent ? (
                        <CircularProgress size={14} sx={{ color: '#8b5cf6' }} />
                      ) : (
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', border: isDark ? '2px solid #475569' : '2px solid #cbd5e1' }} />
                      )}
                      <Typography
                        variant="caption"
                        fontWeight={isCurrent || isCompleted ? 800 : 600}
                        sx={{
                          color: isCurrent
                            ? (isDark ? '#e9d5ff' : '#6d28d9')
                            : isCompleted
                            ? (isDark ? '#6ee7b7' : '#059669')
                            : 'text.secondary',
                          fontSize: '0.74rem',
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDark ? '#94a3b8' : '#64748b',
                        fontSize: '0.66rem',
                        display: 'block',
                        pl: 2.8,
                      }}
                    >
                      {item.sub}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}

        <Divider sx={{ my: 2.5, borderColor: 'divider' }} />

        {/* Action Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {requestText && requestText.trim().length >= 5 && (
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleOpenBookmark}
                disabled={loading}
                startIcon={<BookmarkAddIcon fontSize="small" />}
                size="small"
                sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary', borderColor: 'divider' }}
              >
                Save as Preset
              </Button>
            )}

            {requestText && (
              <Button
                variant="text"
                color="inherit"
                onClick={onClear}
                disabled={loading}
                startIcon={<ClearIcon fontSize="small" />}
                size="small"
                sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary' }}
              >
                Clear
              </Button>
            )}
          </Stack>

          <Button
            variant="contained"
            onClick={onTriage}
            disabled={isSubmitDisabled}
            startIcon={loading ? <CircularProgress size={18} sx={{ color: '#ffffff' }} /> : <AutoFixHighIcon sx={{ color: '#fbcfe8' }} />}
            sx={{
              px: 3.8,
              py: 1.25,
              borderRadius: 2.5,
              fontWeight: 800,
              textTransform: 'none',
              fontSize: '0.98rem',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%)',
              backgroundSize: '200% 200%',
              animation: 'triageGrad 5s ease infinite alternate',
              boxShadow: isDark
                ? '0 4px 20px rgba(124, 58, 237, 0.45)'
                : '0 4px 16px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 28px rgba(236, 72, 153, 0.55)',
              },
              '&.Mui-disabled': {
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                color: isDark ? '#64748b' : '#94a3b8',
                boxShadow: 'none',
              },
              '@keyframes triageGrad': {
                '0%': { backgroundPosition: '0% 50%' },
                '100%': { backgroundPosition: '100% 50%' },
              },
            }}
          >
            {loading ? 'Triaging with LangGraph...' : 'Triage Request ⚡'}
          </Button>
        </Box>
      </CardContent>

      {/* AI Polish & Anonymize Preview Modal */}
      <Dialog
        open={isEnhanceModalOpen}
        onClose={() => setIsEnhanceModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <ShieldOutlinedIcon sx={{ color: '#7c3aed' }} />
            <Typography variant="h6" fontWeight="800">
              AI Sanitized & Structured Briefing
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setIsEnhanceModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {enhancedResult && (
            <Stack spacing={2.5}>
              {enhancedResult.redacted_items_count > 0 ? (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  <strong>{enhancedResult.redacted_items_count} Sensitive Items Anonymized:</strong> Credit card, account numbers, secret keys, or phone sequences were masked for compliance.
                </Alert>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  ✓ Zero sensitive credentials detected. Text restructured for clarity and executive readability.
                </Alert>
              )}

              {enhancedResult.bullet_points && enhancedResult.bullet_points.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                    Key Operational Incident Points:
                  </Typography>
                  <Stack spacing={0.8}>
                    {enhancedResult.bullet_points.map((pt, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#7c3aed', mt: 0.8 }} />
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {pt}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                  Polished & Structured Replacement:
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    backgroundColor: isDark ? '#0b0f19' : '#f8fafc',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    fontSize: '0.88rem',
                    color: 'text.primary',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {enhancedResult.enhanced_text}
                </Paper>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsEnhanceModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Discard
          </Button>
          <Button
            variant="contained"
            onClick={handleApplyEnhancedText}
            startIcon={<AutoAwesomeIcon />}
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
            }}
          >
            Apply Polished Text to Workspace
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save as Preset Modal */}
      <Dialog open={isBookmarkModalOpen} onClose={() => setIsBookmarkModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BookmarkAddIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Save as Scenario Preset
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setIsBookmarkModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Preset Title"
              size="small"
              fullWidth
              value={presetTitle}
              onChange={(e) => setPresetTitle(e.target.value)}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Sender & Role"
                size="small"
                fullWidth
                value={presetSender}
                onChange={(e) => setPresetSender(e.target.value)}
              />
              <TextField
                label="Channel"
                size="small"
                fullWidth
                value={presetChannel}
                onChange={(e) => setPresetChannel(e.target.value)}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={presetCategory}
                  label="Category"
                  onChange={(e) => setPresetCategory(e.target.value)}
                >
                  <MenuItem value="Technical">Technical</MenuItem>
                  <MenuItem value="Billing">Billing</MenuItem>
                  <MenuItem value="Sales">Sales</MenuItem>
                  <MenuItem value="Support">Support</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={presetPriority}
                  label="Priority"
                  onChange={(e) => setPresetPriority(e.target.value)}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsBookmarkModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmSavePreset}
            disabled={!presetTitle.trim() || !presetSender.trim()}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Save Preset
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
