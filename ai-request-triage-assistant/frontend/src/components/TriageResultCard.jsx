import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
  TextField,
  Button,
  Stack,
  Alert,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import SendIcon from '@mui/icons-material/Send';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

export default function TriageResultCard({
  result,
  onSendEmail,
  accounts = [],
  simulationMode = false,
  onOpenEmailModal,
}) {
  const [copied, setCopied] = useState(false);
  const [draftText, setDraftText] = useState(result.draft_response || '');
  const [recipientEmails, setRecipientEmails] = useState('client@example.com');
  const [subject, setSubject] = useState('');
  const [selectedSender, setSelectedSender] = useState('auto');

  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sentData, setSentData] = useState(null);
  const [sendError, setSendError] = useState(null);

  // Sync draft text & defaults if result changes
  useEffect(() => {
    setDraftText(result.draft_response || '');
    const defaultSubject = `Re: [${result.category || 'General'} - ${result.priority || 'Normal'}] ${
      result.summary ? (result.summary.length > 55 ? result.summary.slice(0, 52) + '...' : result.summary) : 'Inquiry Follow-up'
    }`;
    setSubject(defaultSubject);
    setSentSuccess(false);
    setSentData(null);
    setSendError(null);
    setSelectedSender('auto');
  }, [result]);

  const handleCopy = () => {
    navigator.clipboard.writeText(draftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Determine which account matches this department
  const getMatchingAccount = () => {
    if (!accounts || accounts.length === 0) return null;
    const match = accounts.find(
      (a) => a.department && a.department.toLowerCase() === (result.assigned_owner || '').toLowerCase()
    );
    if (match) return match;
    const defaultAcc = accounts.find((a) => a.is_default);
    return defaultAcc || accounts[0];
  };

  const activeSenderAccount = selectedSender === 'auto' ? getMatchingAccount() : accounts.find((a) => a.email === selectedSender);

  const handleSend = async () => {
    if (!recipientEmails.trim()) {
      setSendError('Please provide at least one recipient email address.');
      return;
    }
    if (!draftText.trim()) {
      setSendError('Email body cannot be empty.');
      return;
    }

    // If attempting real live email, verify App Password exists
    if (!simulationMode && (!activeSenderAccount || !activeSenderAccount.app_password || !activeSenderAccount.app_password.trim())) {
      setSendError(
        `Cannot send live email from '${activeSenderAccount?.email || 'Gmail'}': A 16-character Google App Password is required to authenticate with Gmail SMTP. Please click "Configure Gmail" to add your App Password, or turn on Safe Simulation Mode.`
      );
      return;
    }

    setSending(true);
    setSendError(null);

    const payload = {
      to_emails: recipientEmails.split(/[,;]+/).map((e) => e.trim()).filter(Boolean),
      subject: subject.trim() || 'AI Request Triage Response',
      body: draftText.trim(),
      assigned_owner: result.assigned_owner,
      sender_email: selectedSender !== 'auto' ? selectedSender : (activeSenderAccount ? activeSenderAccount.email : undefined),
      accounts: accounts.length > 0 ? accounts : undefined,
      simulate: Boolean(simulationMode),
    };

    try {
      if (onSendEmail) {
        const responseData = await onSendEmail(payload);
        setSentSuccess(true);
        setSentData(responseData);
      } else {
        // Fallback local mock if no handler provided
        setSentSuccess(true);
        setSentData({
          sent_from: activeSenderAccount?.email || 'triage-operations@gmail.com',
          sent_to: payload.to_emails,
          timestamp: new Date().toLocaleTimeString(),
          is_simulation: true,
        });
      }
    } catch (err) {
      setSendError(err.message || 'Failed to transmit email. Please check your Gmail configuration.');
    } finally {
      setSending(false);
    }
  };

  // Helper for priority styling
  const getPriorityDetails = (priority) => {
    switch (priority) {
      case 'Urgent':
        return {
          color: '#dc2626',
          bgColor: '#fef2f2',
          borderColor: '#fca5a5',
          icon: <ErrorOutlineIcon fontSize="small" />,
        };
      case 'High':
        return {
          color: '#d97706',
          bgColor: '#fffbeb',
          borderColor: '#fcd34d',
          icon: <WarningAmberIcon fontSize="small" />,
        };
      case 'Medium':
        return {
          color: '#0284c7',
          bgColor: '#f0f9ff',
          borderColor: '#bae6fd',
          icon: <InfoOutlinedIcon fontSize="small" />,
        };
      case 'Low':
        return {
          color: '#16a34a',
          bgColor: '#f0fdf4',
          borderColor: '#bbf7d0',
          icon: <CheckCircleOutlineIcon fontSize="small" />,
        };
      default:
        return {
          color: '#475569',
          bgColor: '#f8fafc',
          borderColor: '#cbd5e1',
          icon: <InfoOutlinedIcon fontSize="small" />,
        };
    }
  };

  // Helper for department styling
  const getOwnerDetails = (owner) => {
    switch (owner) {
      case 'Engineering':
        return { icon: <EngineeringIcon fontSize="small" />, color: 'error' };
      case 'Finance':
        return { icon: <AccountBalanceIcon fontSize="small" />, color: 'warning' };
      case 'Sales Team':
        return { icon: <TrendingUpIcon fontSize="small" />, color: 'success' };
      case 'Client Success':
      default:
        return { icon: <SupportAgentIcon fontSize="small" />, color: 'primary' };
    }
  };

  const priorityStyle = getPriorityDetails(result.priority);
  const ownerDetails = getOwnerDetails(result.assigned_owner);

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <Box
        sx={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #f1f5f9',
          px: 3,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            icon={priorityStyle.icon}
            label={`${result.priority} Priority`}
            sx={{
              backgroundColor: priorityStyle.bgColor,
              color: priorityStyle.color,
              borderColor: priorityStyle.borderColor,
              borderWidth: 1,
              borderStyle: 'solid',
              fontWeight: 'bold',
            }}
          />
          <Typography variant="body2" color="text.secondary">
            AI Triage Completed
          </Typography>
        </Box>

        {result.processing_time_ms && (
          <Chip
            size="small"
            icon={<TimerOutlinedIcon fontSize="small" />}
            label={`${(result.processing_time_ms / 1000).toFixed(2)}s pipeline`}
            variant="outlined"
            sx={{ backgroundColor: '#ffffff', fontSize: '0.75rem' }}
          />
        )}
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* Core Triage Metadata Grid */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {/* Category */}
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                height: '100%',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                Assigned Category
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={result.category}
                  color="primary"
                  sx={{ fontWeight: 700, fontSize: '0.9rem', px: 0.5 }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Department Owner Routing */}
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                height: '100%',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                Routed Department Owner
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  icon={ownerDetails.icon}
                  label={result.assigned_owner}
                  color={ownerDetails.color}
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '0.9rem', px: 0.5, borderWidth: 2 }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Priority Justification */}
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                height: '100%',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                Priority Justification
              </Typography>
              <Typography variant="body2" color="text.primary" sx={{ mt: 0.8, fontWeight: 500 }}>
                {result.priority_reason}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Short Summary Section */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
          }}
        >
          <Typography variant="caption" color="primary.dark" fontWeight="700" textTransform="uppercase">
            Request Summary
          </Typography>
          <Typography variant="body1" color="#1e3a8a" sx={{ mt: 0.5, fontWeight: 500 }}>
            {result.summary}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Draft Response & Email Dispatch Section */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Approve & Transmit Client Email
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Review recipient(s), dispatch account, and edit message before transmitting:
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Tooltip title={copied ? 'Copied!' : 'Copy response to clipboard'}>
                <Button
                  size="small"
                  variant="outlined"
                  color={copied ? 'success' : 'inherit'}
                  startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                  onClick={handleCopy}
                >
                  {copied ? 'Copied' : 'Copy Text'}
                </Button>
              </Tooltip>
            </Stack>
          </Box>

          {/* Email Envelope Header Fields */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 2,
            }}
          >
            <Grid container spacing={2}>
              {/* Recipient Input (Supports single or multiple) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="To (Client Email ID / Multiple IDs)"
                  placeholder="e.g. client@example.com, manager@example.com"
                  size="small"
                  fullWidth
                  value={recipientEmails}
                  onChange={(e) => setRecipientEmails(e.target.value)}
                  disabled={sentSuccess}
                  helperText="Enter single email or multiple separated by comma (,)"
                />
              </Grid>

              {/* Sender Account Selector */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" fullWidth disabled={sentSuccess}>
                    <InputLabel>From (Gmail Dispatcher)</InputLabel>
                    <Select
                      value={selectedSender}
                      label="From (Gmail Dispatcher)"
                      onChange={(e) => setSelectedSender(e.target.value)}
                    >
                      <MenuItem value="auto">
                        <em>
                          Auto-Route by Department{' '}
                          {activeSenderAccount ? `(${activeSenderAccount.email})` : '(Default)'}
                        </em>
                      </MenuItem>
                      {accounts.map((acc, i) => (
                        <MenuItem key={i} value={acc.email}>
                          {acc.email} ({acc.department || 'Default'})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {onOpenEmailModal && (
                    <Tooltip title="Configure Gmail Accounts">
                      <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        onClick={onOpenEmailModal}
                        sx={{ minWidth: 40, px: 1 }}
                      >
                        <SettingsOutlinedIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, ml: 1 }}>
                  {accounts.length === 0
                    ? 'No Gmail accounts set yet (running in Safe Test Mode)'
                    : activeSenderAccount
                    ? `Dispatched via: ${activeSenderAccount.email} [${activeSenderAccount.department || 'Default'}]`
                    : 'Dispatched via primary Gmail'}
                </Typography>
              </Grid>

              {/* Subject Line */}
              <Grid item xs={12}>
                <TextField
                  label="Subject Line"
                  size="small"
                  fullWidth
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={sentSuccess}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Draft Body Text Area */}
          <TextField
            multiline
            rows={7}
            fullWidth
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            disabled={sentSuccess}
            placeholder="Review or write the response to be emailed..."
            sx={{
              backgroundColor: '#fafafa',
              '& .MuiOutlinedInput-root': {
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                lineHeight: 1.6,
              },
            }}
          />

          {/* Warning if trying live delivery without App Password */}
          {!simulationMode && (!activeSenderAccount || !activeSenderAccount.app_password) && (
            <Alert
              severity="warning"
              sx={{ mt: 2, borderRadius: 2 }}
              action={
                onOpenEmailModal && (
                  <Button color="inherit" size="small" variant="outlined" onClick={onOpenEmailModal}>
                    Configure App Password
                  </Button>
                )
              }
            >
              <strong>Live Delivery Action Required:</strong> No 16-character Google App Password is set for{' '}
              <strong>{activeSenderAccount?.email || 'your Gmail account'}</strong>. Gmail requires an App Password to authenticate and send real emails. Click <strong>Configure App Password</strong> or toggle <strong>Safe Simulation Mode</strong>.
            </Alert>
          )}

          {/* Success Banner */}
          {sentSuccess && sentData && (
            <Alert
              severity={sentData.is_simulation ? 'warning' : 'success'}
              icon={sentData.is_simulation ? <InfoOutlinedIcon fontSize="medium" /> : <CheckCircleOutlineIcon fontSize="medium" />}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                {sentData.is_simulation ? '⚠️ Simulation Complete (No Real Email Sent)' : '✓ Real Email Successfully Transmitted!'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {sentData.is_simulation ? (
                  <span>
                    Simulated recipient: <strong>{sentData.sent_to ? sentData.sent_to.join(', ') : recipientEmails}</strong>
                    <br />
                    Simulated sender: <strong>{sentData.sent_from}</strong> at {sentData.timestamp}
                    <br />
                    <span style={{ color: '#b45309', fontWeight: 500, display: 'block', marginTop: 4 }}>
                      Note: This was a safe mock test. No email arrived in {sentData.sent_to ? sentData.sent_to.join(', ') : recipientEmails} because Simulation Mode was active or no Google App Password was provided.
                    </span>
                  </span>
                ) : (
                  <span>
                    Live email delivered to: <strong>{sentData.sent_to ? sentData.sent_to.join(', ') : recipientEmails}</strong>
                    <br />
                    Dispatched from: <strong>{sentData.sent_from}</strong> at {sentData.timestamp} via Gmail SMTP.
                  </span>
                )}
              </Typography>
            </Alert>
          )}

          {/* Error Banner */}
          {sendError && (
            <Alert
              severity="error"
              sx={{ mt: 2, borderRadius: 2 }}
              action={
                onOpenEmailModal && (
                  <Button color="inherit" size="small" onClick={onOpenEmailModal}>
                    Check Gmail Settings
                  </Button>
                )
              }
            >
              {sendError}
            </Alert>
          )}

          {/* Footer Bar: Characters, Words, and Transmit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {draftText.length} characters • {draftText.trim().split(/\s+/).filter(Boolean).length} words
            </Typography>

            <Button
              variant="contained"
              color={sentSuccess ? (sentData?.is_simulation ? 'warning' : 'success') : 'primary'}
              endIcon={
                sending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : sentSuccess ? (
                  <CheckIcon />
                ) : (
                  <SendIcon />
                )
              }
              onClick={handleSend}
              disabled={sending || sentSuccess}
              sx={{ px: 3, py: 1, borderRadius: 2, fontWeight: 600 }}
            >
              {sending
                ? 'Transmitting...'
                : sentSuccess
                ? (sentData?.is_simulation ? 'Simulated' : 'Transmitted')
                : simulationMode
                ? 'Simulate Transmission (Safe Mode)'
                : 'Approve & Transmit Live Email'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
