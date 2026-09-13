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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Divider,
  Stack,
  Chip,
  Switch,
  FormControlLabel,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const DEPARTMENTS = [
  'Default',
  'Sales Team',
  'Client Success',
  'Engineering',
  'Finance',
];

export default function EmailSettingsModal({
  open,
  onClose,
  accounts,
  onSaveAccounts,
  simulationMode,
  onToggleSimulationMode,
}) {
  const [localAccounts, setLocalAccounts] = useState(accounts || []);
  const [showPasswords, setShowPasswords] = useState({});
  const [testingIndex, setTestingIndex] = useState(null);
  const [testResults, setTestResults] = useState({});

  // Sync when dialog opens
  React.useEffect(() => {
    if (open) {
      setLocalAccounts(accounts && accounts.length > 0 ? accounts : [createEmptyAccount(true)]);
      setTestResults({});
    }
  }, [open, accounts]);

  function createEmptyAccount(isFirst = false) {
    return {
      email: '',
      app_password: '',
      department: isFirst ? 'Default' : 'Engineering',
      display_name: '',
      is_default: isFirst,
    };
  }

  const handleAccountChange = (index, field, value) => {
    setLocalAccounts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddAccount = () => {
    setLocalAccounts((prev) => [...prev, createEmptyAccount(false)]);
  };

  const handleRemoveAccount = (index) => {
    setLocalAccounts((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((a) => a.is_default)) {
        updated[0].is_default = true;
      }
      return updated;
    });
  };

  const handleSetDefault = (index) => {
    setLocalAccounts((prev) =>
      prev.map((acc, i) => ({
        ...acc,
        is_default: i === index,
      }))
    );
  };

  const togglePasswordVisibility = (index) => {
    setShowPasswords((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleTestAccount = async (index) => {
    const acc = localAccounts[index];
    if (!acc.email || !acc.app_password) {
      setTestResults((prev) => ({
        ...prev,
        [index]: {
          success: false,
          message: 'Both Gmail address and App Password are required to test connection.',
        },
      }));
      return;
    }

    setTestingIndex(index);
    setTestResults((prev) => ({ ...prev, [index]: null }));

    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: acc.email.trim(),
          app_password: acc.app_password.trim(),
        }),
      });

      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [index]: {
          success: data.success,
          message: data.message,
        },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [index]: {
          success: false,
          message: `Connection test failed: ${err.message}`,
        },
      }));
    } finally {
      setTestingIndex(null);
    }
  };

  const handleSave = () => {
    // Filter out completely blank accounts
    const valid = localAccounts.filter((a) => a.email && a.email.trim());
    onSaveAccounts(valid);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MailIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Gmail Dispatch Accounts
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Configure single or multiple Gmail accounts for automatic response routing
            </Typography>
          </Box>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={Boolean(simulationMode)}
              onChange={(e) => onToggleSimulationMode(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body2" fontWeight="600">
                Safe Simulation Mode
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {simulationMode ? 'Enabled (No actual emails sent)' : 'Live Delivery via Gmail SMTP'}
              </Typography>
            </Box>
          }
        />
      </DialogTitle>

      <DialogContent dividers sx={{ backgroundColor: '#f8fafc' }}>
        {/* Helper Instructions Box */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" color="text.primary" gutterBottom>
            How to configure a Gmail Account:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            1. Enter your <strong>Gmail address</strong> (e.g. <code>support@gmail.com</code>).<br />
            2. For live sending, generate a 16-character <strong>Google App Password</strong>:{' '}
            <Link
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3 }}
            >
              Google App Passwords <OpenInNewIcon fontSize="inherit" />
            </Link>{' '}
            <em>(Requires 2-Step Verification to be ON)</em>.<br />
            3. You can set <strong>multiple Gmail accounts</strong> to auto-route by department (Sales, Engineering, etc.) or use a single account for all outgoing emails.
          </Typography>
        </Paper>

        {/* Account Cards */}
        <Stack spacing={2.5}>
          {localAccounts.map((account, index) => {
            const testResult = testResults[index];
            const isTesting = testingIndex === index;

            return (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2.5,
                  backgroundColor: '#ffffff',
                  border: account.is_default ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  borderRadius: 2,
                  position: 'relative',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" fontWeight="bold">
                      Account #{index + 1}
                    </Typography>
                    {account.is_default ? (
                      <Chip label="Primary / Default" size="small" color="primary" sx={{ fontWeight: 600 }} />
                    ) : (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleSetDefault(index)}
                        sx={{ fontSize: '0.75rem', py: 0 }}
                      >
                        Set as Default
                      </Button>
                    )}
                  </Stack>

                  {localAccounts.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveAccount(index)}
                      title="Remove Account"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label="Gmail Address"
                    placeholder="example@gmail.com"
                    size="small"
                    fullWidth
                    value={account.email}
                    onChange={(e) => handleAccountChange(index, 'email', e.target.value)}
                  />

                  <TextField
                    label="Sender Display Name (Optional)"
                    placeholder="e.g. Apex Dynamics Support"
                    size="small"
                    fullWidth
                    value={account.display_name || ''}
                    onChange={(e) => handleAccountChange(index, 'display_name', e.target.value)}
                  />

                  <TextField
                    label="Google App Password (16 characters)"
                    placeholder="abcd efgh ijkl mnop"
                    size="small"
                    fullWidth
                    type={showPasswords[index] ? 'text' : 'password'}
                    value={account.app_password || ''}
                    onChange={(e) => handleAccountChange(index, 'app_password', e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => togglePasswordVisibility(index)}
                            edge="end"
                          >
                            {showPasswords[index] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText={simulationMode ? 'Optional in Simulation Mode' : 'Required for live SMTP'}
                  />

                  <FormControl size="small" fullWidth>
                    <InputLabel>Routed Department</InputLabel>
                    <Select
                      value={account.department || 'Default'}
                      label="Routed Department"
                      onChange={(e) => handleAccountChange(index, 'department', e.target.value)}
                    >
                      {DEPARTMENTS.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept === 'Default' ? 'Default / All Departments' : dept}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Connection Test Action */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, pt: 1.5, borderTop: '1px dashed #e2e8f0' }}>
                  <Typography variant="caption" color="text.secondary">
                    {account.department === 'Default'
                      ? 'Used for general inquiries or fallback'
                      : `Automatically handles replies routed to: ${account.department}`}
                  </Typography>

                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => handleTestAccount(index)}
                    disabled={isTesting || !account.email}
                    startIcon={isTesting ? <CircularProgress size={14} /> : null}
                    sx={{ textTransform: 'none' }}
                  >
                    {isTesting ? 'Testing...' : 'Test SMTP Connection'}
                  </Button>
                </Box>

                {/* Test Feedback */}
                {testResult && (
                  <Alert
                    severity={testResult.success ? 'success' : 'error'}
                    icon={testResult.success ? <CheckCircleOutlineIcon fontSize="small" /> : <ErrorOutlineIcon fontSize="small" />}
                    sx={{ mt: 1.5, py: 0.5 }}
                  >
                    {testResult.message}
                  </Alert>
                )}
              </Paper>
            );
          })}
        </Stack>

        <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAddAccount}
            sx={{ textTransform: 'none' }}
          >
            Add Another Gmail Account
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Email Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
}

