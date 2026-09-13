import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/VpnKey';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function ApiKeyModal({ open, onClose, apiKey, onSaveKey, hasEnvKey }) {
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    onSaveKey(inputKey.trim());
    onClose();
  };

  const handleClear = () => {
    setInputKey('');
    onSaveKey('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <KeyIcon color="primary" />
        <Typography variant="h6" fontWeight="bold">
          Gemini API Key Configuration
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" paragraph>
          This assistant uses Google Gemini free tier models (e.g. <code>gemini-2.5-flash</code> / <code>gemini-1.5-flash</code>).
          You can provide your key here (saved securely in your browser's local storage) or in the backend <code>.env</code> file.
        </Typography>

        {hasEnvKey && (
          <Alert severity="success" sx={{ mb: 2 }}>
            A Gemini API key is already configured on the backend server! Entering a key below will override it for this browser session.
          </Alert>
        )}

        <TextField
          label="Google Gemini API Key"
          fullWidth
          variant="outlined"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="AIzaSy..."
          type={showKey ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowKey(!showKey)} edge="end">
                  {showKey ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          helperText={
            <span>
              Don't have an API key? Get a free one instantly from{' '}
              <Link
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.2 }}
              >
                Google AI Studio <OpenInNewIcon fontSize="inherit" />
              </Link>
            </span>
          }
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {apiKey && (
          <Button onClick={handleClear} color="error" sx={{ mr: 'auto' }}>
            Remove Saved Key
          </Button>
        )}
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Key
        </Button>
      </DialogActions>
    </Dialog>
  );
}

