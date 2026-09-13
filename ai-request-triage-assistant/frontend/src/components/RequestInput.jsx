import React from 'react';
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
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ClearIcon from '@mui/icons-material/Clear';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import ForumIcon from '@mui/icons-material/Forum';

export default function RequestInput({
  requestText,
  onChangeText,
  onTriage,
  loading,
  onClear,
  activeSample,
  hasApiKey,
  onOpenKeyModal,
}) {
  const isSubmitDisabled = loading || !requestText.trim() || requestText.trim().length < 5;

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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {requestText.length} characters
          </Typography>

          <Stack direction="row" spacing={1.5}>
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
    </Card>
  );
}

