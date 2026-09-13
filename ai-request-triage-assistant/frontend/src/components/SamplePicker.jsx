import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  useTheme,
} from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddIcon from '@mui/icons-material/Add';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';

export default function SamplePicker({
  samples,
  onSelectSample,
  selectedId,
  onGenerateAiSample,
  onCreateCustomSample,
  onDeleteSample,
  onResetSamples,
  generatingAi = false,
  hasApiKey = false,
  onOpenKeyModal,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // AI Gen form state
  const [aiCategory, setAiCategory] = useState('');
  const [aiIndustry, setAiIndustry] = useState('');

  // Create Custom form state
  const [newTitle, setNewTitle] = useState('');
  const [newSender, setNewSender] = useState('');
  const [newChannel, setNewChannel] = useState('Email');
  const [newCategory, setNewCategory] = useState('Support');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newText, setNewText] = useState('');

  const handleOpenAiModal = () => {
    if (!hasApiKey) {
      if (onOpenKeyModal) onOpenKeyModal();
      return;
    }
    setIsAiModalOpen(true);
  };

  const handleRunAiGenerate = async () => {
    setIsAiModalOpen(false);
    await onGenerateAiSample({
      category: aiCategory || null,
      industry: aiIndustry || null,
    });
  };

  const handleSaveCustom = async () => {
    if (!newTitle.trim() || !newText.trim() || !newSender.trim()) return;
    await onCreateCustomSample({
      title: newTitle.trim(),
      sender: newSender.trim(),
      channel: newChannel.trim() || 'Manual Preset',
      expected_category: newCategory,
      expected_priority: newPriority,
      text: newText.trim(),
    });
    // Reset form
    setNewTitle('');
    setNewSender('');
    setNewChannel('Email');
    setNewText('');
    setIsCreateModalOpen(false);
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
          ? '0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.08)'
          : '0 8px 24px -6px rgba(15, 23, 42, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmerAccent 4s linear infinite',
        },
        '@keyframes shimmerAccent': {
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
      <CardContent sx={{ pb: '18px !important', pt: 2.4, px: 2.8 }}>
        {/* Header and Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
              }}
            >
              <FlashOnIcon fontSize="small" />
            </Box>
            <Typography variant="subtitle1" fontWeight="800" sx={{ color: isDark ? '#ffffff' : '#0f172a', letterSpacing: '-0.01em' }}>
              Scenario Presets & Dynamic Mock Testing
            </Typography>
            <Chip
              size="small"
              label={`${samples.length} scenarios`}
              sx={{
                height: 22,
                fontSize: '0.72rem',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                color: isDark ? '#94a3b8' : '#64748b',
                fontWeight: 700,
                borderRadius: 1.5,
              }}
            />
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* AI Generate Button */}
            <Button
              variant="contained"
              size="small"
              startIcon={generatingAi ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon sx={{ fontSize: 16 }} />}
              onClick={handleOpenAiModal}
              disabled={generatingAi}
              sx={{
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
                backgroundSize: '200% 200%',
                animation: 'aiGenGrad 5s ease infinite alternate',
                fontSize: '0.8rem',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2.2,
                px: 2.2,
                py: 0.6,
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(236, 72, 153, 0.5)',
                },
                '@keyframes aiGenGrad': {
                  '0%': { backgroundPosition: '0% 50%' },
                  '100%': { backgroundPosition: '100% 50%' },
                },
              }}
            >
              {generatingAi ? 'Generating...' : '✨ AI Generate'}
            </Button>

            {/* Add Custom Preset Button */}
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 17 }} />}
              onClick={() => setIsCreateModalOpen(true)}
              sx={{
                fontSize: '0.8rem',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2.2,
                borderColor: isDark ? '#334155' : '#cbd5e1',
                color: isDark ? '#cbd5e1' : '#475569',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
                  borderColor: isDark ? '#64748b' : '#94a3b8',
                },
              }}
            >
              New Preset
            </Button>

            {/* Reset Defaults Button */}
            <Tooltip title="Reset all scenarios back to the 5 baseline defaults">
              <IconButton size="small" onClick={onResetSamples} sx={{ color: isDark ? '#94a3b8' : '#64748b', '&:hover': { color: isDark ? '#fff' : '#0f172a' } }}>
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Chips List */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {samples.map((sample) => {
            const isSelected = selectedId === sample.id;
            return (
              <Chip
                key={sample.id}
                clickable
                onClick={() => onSelectSample(sample)}
                onDelete={
                  sample.is_custom && onDeleteSample
                    ? (e) => {
                        e.stopPropagation();
                        onDeleteSample(sample.id);
                      }
                    : undefined
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    {sample.is_custom && (
                      <AutoAwesomeIcon sx={{ fontSize: '0.85rem', color: '#8b5cf6' }} />
                    )}
                    <span style={{ fontWeight: isSelected ? 700 : 500 }}>{sample.title}</span>
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        px: 0.8,
                        py: 0.2,
                        borderRadius: 1,
                        backgroundColor:
                          sample.expected_priority === 'Urgent'
                            ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2')
                            : sample.expected_priority === 'High'
                            ? (isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7')
                            : sample.expected_priority === 'Medium'
                            ? (isDark ? 'rgba(14, 165, 233, 0.2)' : '#e0f2fe')
                            : (isDark ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7'),
                        color:
                          sample.expected_priority === 'Urgent'
                            ? (isDark ? '#fca5a5' : '#b91c1c')
                            : sample.expected_priority === 'High'
                            ? (isDark ? '#fde68a' : '#b45309')
                            : sample.expected_priority === 'Medium'
                            ? (isDark ? '#7dd3fc' : '#0369a1')
                            : (isDark ? '#86efac' : '#15803d'),
                      }}
                    >
                      {sample.expected_priority}
                    </Typography>
                  </Box>
                }
                variant={isSelected ? 'filled' : 'outlined'}
                sx={{
                  py: 2.2,
                  px: 1,
                  fontSize: '0.84rem',
                  borderRadius: 2.5,
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  borderColor: isSelected
                    ? (isDark ? '#a855f7' : '#7c3aed')
                    : sample.is_custom
                    ? (isDark ? '#8b5cf6' : '#c4b5fd')
                    : (isDark ? 'rgba(255, 255, 255, 0.09)' : '#e2e8f0'),
                  backgroundColor: isSelected
                    ? (isDark ? 'rgba(139, 92, 246, 0.22)' : 'rgba(124, 58, 237, 0.08)')
                    : sample.is_custom
                    ? (isDark ? 'rgba(139, 92, 246, 0.12)' : '#faf5ff')
                    : (isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff'),
                  color: isSelected ? (isDark ? '#f1f5f9' : '#6d28d9') : 'text.primary',
                  boxShadow: isSelected
                    ? (isDark ? '0 0 16px rgba(139, 92, 246, 0.4), 0 0 0 1.5px #a855f7' : '0 4px 14px rgba(124, 58, 237, 0.2), 0 0 0 1.5px #7c3aed')
                    : 'none',
                  '&:hover': {
                    backgroundColor: isSelected
                      ? (isDark ? 'rgba(139, 92, 246, 0.32)' : 'rgba(124, 58, 237, 0.12)')
                      : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#f8fafc'),
                    borderColor: isSelected ? '#a855f7' : (isDark ? 'rgba(255, 255, 255, 0.25)' : '#94a3b8'),
                    transform: 'translateY(-2px)',
                    boxShadow: isDark ? '0 4px 14px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                  },
                }}
              />
            );
          })}
        </Stack>
      </CardContent>

      {/* AI Scenario Generator Dialog */}
      <Dialog open={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              AI Scenario Generator
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setIsAiModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" paragraph>
            Use Gemini to synthesize a new, realistic customer inquiry with authentic details and company context:
          </Typography>

          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Category (Optional)</InputLabel>
              <Select
                value={aiCategory}
                label="Category (Optional)"
                onChange={(e) => setAiCategory(e.target.value)}
              >
                <MenuItem value="">Random / Any Category</MenuItem>
                <MenuItem value="Technical">Technical (Outages, API bugs, SSO)</MenuItem>
                <MenuItem value="Billing">Billing (Invoices, disputes, refunds)</MenuItem>
                <MenuItem value="Sales">Sales (Enterprise plans, demos, expansion)</MenuItem>
                <MenuItem value="Support">Support (Onboarding, permissions, how-to)</MenuItem>
                <MenuItem value="Other">Other / General</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Industry Focus (Optional)</InputLabel>
              <Select
                value={aiIndustry}
                label="Industry Focus (Optional)"
                onChange={(e) => setAiIndustry(e.target.value)}
              >
                <MenuItem value="">Random / Any Industry</MenuItem>
                <MenuItem value="FinTech & Banking">FinTech & Banking</MenuItem>
                <MenuItem value="Healthcare & Telehealth">Healthcare & Telehealth</MenuItem>
                <MenuItem value="E-Commerce & Retail Logistics">E-Commerce & Retail</MenuItem>
                <MenuItem value="Enterprise Cloud & DevOps">Enterprise Cloud & DevOps</MenuItem>
                <MenuItem value="LegalTech & Contract Management">LegalTech</MenuItem>
                <MenuItem value="Cybersecurity & Threat Detection">Cybersecurity</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsAiModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRunAiGenerate}
            startIcon={<AutoAwesomeIcon />}
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              fontWeight: 600,
            }}
          >
            Generate Scenario
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Custom Preset Dialog */}
      <Dialog open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            Create Custom Scenario Preset
          </Typography>
          <IconButton size="small" onClick={() => setIsCreateModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Scenario Title"
              size="small"
              fullWidth
              placeholder="e.g., CSV Export Timeout on Large Dataset"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Sender & Role"
                size="small"
                fullWidth
                placeholder="e.g., Jane Doe (VP Analytics, TechCorp)"
                value={newSender}
                onChange={(e) => setNewSender(e.target.value)}
              />
              <TextField
                label="Origin Channel"
                size="small"
                fullWidth
                placeholder="e.g., Email (support@) or Chat"
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value)}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={newCategory}
                  label="Category"
                  onChange={(e) => setNewCategory(e.target.value)}
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
                  value={newPriority}
                  label="Priority"
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label="Request Message Text"
              multiline
              rows={4}
              fullWidth
              placeholder="Paste or write the unstructured client request message here..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsCreateModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveCustom}
            disabled={!newTitle.trim() || !newText.trim() || !newSender.trim()}
          >
            Save Preset
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
