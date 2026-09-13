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
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 6px 24px -2px rgba(15, 23, 42, 0.08)',
        },
      }}
    >
      <CardContent sx={{ pb: '18px !important', pt: 2.2 }}>
        {/* Header and Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FlashOnIcon fontSize="small" />
            </Box>
            <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#0f172a' }}>
              Scenario Presets & Dynamic Mock Testing
            </Typography>
            <Chip
              size="small"
              label={`${samples.length} scenarios`}
              sx={{ height: 20, fontSize: '0.7rem', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 600 }}
            />
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* AI Generate Button */}
            <Button
              variant="contained"
              size="small"
              startIcon={generatingAi ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={handleOpenAiModal}
              disabled={generatingAi}
              sx={{
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                fontSize: '0.78rem',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                px: 2,
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
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
              startIcon={<AddIcon />}
              onClick={() => setIsCreateModalOpen(true)}
              sx={{
                fontSize: '0.78rem',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                borderColor: '#cbd5e1',
                color: '#334155',
                '&:hover': {
                  backgroundColor: '#f8fafc',
                  borderColor: '#94a3b8',
                },
              }}
            >
              New Preset
            </Button>

            {/* Reset Defaults Button */}
            <Tooltip title="Reset all scenarios back to the 5 baseline defaults">
              <IconButton size="small" onClick={onResetSamples} sx={{ color: '#64748b', '&:hover': { color: '#0f172a' } }}>
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
                            ? '#fee2e2'
                            : sample.expected_priority === 'High'
                            ? '#fef3c7'
                            : sample.expected_priority === 'Medium'
                            ? '#e0f2fe'
                            : '#dcfce7',
                        color:
                          sample.expected_priority === 'Urgent'
                            ? '#b91c1c'
                            : sample.expected_priority === 'High'
                            ? '#b45309'
                            : sample.expected_priority === 'Medium'
                            ? '#0369a1'
                            : '#15803d',
                      }}
                    >
                      {sample.expected_priority}
                    </Typography>
                  </Box>
                }
                variant={isSelected ? 'filled' : 'outlined'}
                sx={{
                  py: 2.2,
                  px: 0.8,
                  fontSize: '0.84rem',
                  borderRadius: 2,
                  transition: 'all 0.15s ease',
                  borderColor: isSelected ? '#7c3aed' : sample.is_custom ? '#c4b5fd' : '#e2e8f0',
                  backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.08)' : sample.is_custom ? '#faf5ff' : '#ffffff',
                  color: isSelected ? '#6d28d9' : '#1e293b',
                  boxShadow: isSelected ? '0 0 0 2px rgba(124, 58, 237, 0.2)' : 'none',
                  '&:hover': {
                    backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.12)' : '#f8fafc',
                    borderColor: isSelected ? '#7c3aed' : '#94a3b8',
                    transform: 'translateY(-1px)',
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
