import React, { useState } from 'react';
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
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ClearIcon from '@mui/icons-material/Clear';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import ForumIcon from '@mui/icons-material/Forum';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import CloseIcon from '@mui/icons-material/Close';

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
  const isSubmitDisabled = loading || !requestText.trim() || requestText.trim().length < 5;

  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [presetTitle, setPresetTitle] = useState('');
  const [presetSender, setPresetSender] = useState('');
  const [presetChannel, setPresetChannel] = useState('Email');
  const [presetCategory, setPresetCategory] = useState('Support');
  const [presetPriority, setPresetPriority] = useState('Medium');

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

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" fontWeight="bold">
            Incoming Client Request
          </Typography>

          {activeSample && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                icon={<ForumIcon fontSize="small" />}
                label={activeSample.channel}
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
              <Chip
                size="small"
                icon={<AlternateEmailIcon fontSize="small" />}
                label={activeSample.sender}
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            </Stack>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Paste an unstructured email, chat message, or contact form submission below:
        </Typography>

        <TextField
          multiline
          rows={6}
          fullWidth
          placeholder="e.g., 'Hello, our login portal is throwing 500 error codes since 9:30 AM and our accounting team is unable to process end-of-month payments. We need this resolved as soon as possible!'"
          value={requestText}
          onChange={(e) => onChangeText(e.target.value)}
          disabled={loading}
          sx={{
            backgroundColor: '#ffffff',
            '& .MuiOutlinedInput-root': {
              fontFamily: 'inherit',
            },
          }}
        />

        {!hasApiKey && (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={onOpenKeyModal}>
                Set Key
              </Button>
            }
            sx={{ mt: 2 }}
          >
            No Gemini API key detected. Please configure a key to run the LangGraph agent.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {requestText.length} characters
          </Typography>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {requestText && requestText.trim().length >= 5 && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleOpenBookmark}
                disabled={loading}
                startIcon={<BookmarkAddIcon />}
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Save as Preset
              </Button>
            )}

            {requestText && (
              <Button
                variant="outlined"
                color="inherit"
                onClick={onClear}
                disabled={loading}
                startIcon={<ClearIcon />}
                size="small"
              >
                Clear
              </Button>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={onTriage}
              disabled={isSubmitDisabled}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoFixHighIcon />}
              sx={{ px: 3, py: 1 }}
            >
              {loading ? 'Triaging with LangGraph...' : 'Triage Request'}
            </Button>
          </Stack>
        </Box>
      </CardContent>

      {/* Save as Preset Modal */}
      <Dialog open={isBookmarkModalOpen} onClose={() => setIsBookmarkModalOpen(false)} maxWidth="sm" fullWidth>
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
          >
            Save Preset
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
