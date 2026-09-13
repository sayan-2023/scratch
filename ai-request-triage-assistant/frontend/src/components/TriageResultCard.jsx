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
  ButtonGroup,
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
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

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

  // Tone Switcher State
  const [currentTone, setCurrentTone] = useState('empathetic');
  const [toneLoading, setToneLoading] = useState(false);
  const [draftsByTone, setDraftsByTone] = useState({
    empathetic: result.draft_response || '',
    ...(result.alternative_drafts || {}),
  });

  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sentData, setSentData] = useState(null);
  const [sendError, setSendError] = useState(null);

  // Sync draft text & defaults if result changes
  useEffect(() => {
    const initialDraft = result.draft_response || '';
    setDraftText(initialDraft);
    setDraftsByTone({
      empathetic: initialDraft,
      ...(result.alternative_drafts || {}),
    });
    setCurrentTone('empathetic');

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

  // Switch tone persona
  const handleSelectTone = async (toneKey) => {
    if (currentTone === toneKey && draftsByTone[toneKey]) return;
    setCurrentTone(toneKey);

    if (draftsByTone[toneKey]) {
      setDraftText(draftsByTone[toneKey]);
      return;
    }

    // Call tone generation endpoint
    setToneLoading(true);
    try {
      const res = await fetch('/api/ai/tone-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_text: result.summary || 'Client inquiry',
          summary: result.summary,
          assigned_owner: result.assigned_owner,
          priority: result.priority,
          tone: toneKey,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDraftsByTone((prev) => ({ ...prev, [toneKey]: data.draft }));
        setDraftText(data.draft);
      }
    } catch {
      // Keep existing draft on error
    } finally {
      setToneLoading(false);
    }
  };

  // Insert clarifying question into draft
  const handleInsertQuestion = (q) => {
    const questionSnippet = `\n\nCould you please confirm the following details for our diagnostic team:\n• ${q}`;
    setDraftText((prev) => prev.trim() + questionSnippet);
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
      }
    } catch (err) {
      setSendError(err.message || 'Failed to dispatch email.');
    } finally {
      setSending(false);
    }
  };

  // Priority styling
  const getPriorityDetails = (priority) => {
    switch (priority) {
      case 'Urgent':
        return {
          color: '#b91c1c',
          bgColor: '#fee2e2',
          borderColor: '#fca5a5',
          auraColor: 'rgba(239, 68, 68, 0.12)',
          icon: <ErrorOutlineIcon fontSize="small" />,
        };
      case 'High':
        return {
          color: '#b45309',
          bgColor: '#fef3c7',
          borderColor: '#fcd34d',
          auraColor: 'rgba(245, 158, 11, 0.12)',
          icon: <WarningAmberIcon fontSize="small" />,
        };
      case 'Medium':
        return {
          color: '#0369a1',
          bgColor: '#e0f2fe',
          borderColor: '#7dd3fc',
          auraColor: 'rgba(14, 165, 233, 0.12)',
          icon: <InfoOutlinedIcon fontSize="small" />,
        };
      case 'Low':
        return {
          color: '#15803d',
          bgColor: '#dcfce7',
          borderColor: '#86efac',
          auraColor: 'rgba(16, 185, 129, 0.12)',
          icon: <CheckCircleOutlineIcon fontSize="small" />,
        };
      default:
        return {
          color: '#475569',
          bgColor: '#f8fafc',
          borderColor: '#cbd5e1',
          auraColor: 'transparent',
          icon: <InfoOutlinedIcon fontSize="small" />,
        };
    }
  };

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
      sx={{
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        boxShadow: `0 8px 32px -4px ${priorityStyle.auraColor}, 0 4px 16px rgba(0,0,0,0.04)`,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
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
              fontWeight: 800,
              fontSize: '0.85rem',
            }}
          />
          <Typography variant="body2" fontWeight="700" sx={{ color: '#0f172a' }}>
            AI Triage Completed
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {result.churn_risk && (
            <Chip
              size="small"
              label={`Churn Risk: ${result.churn_risk}`}
              sx={{
                height: 22,
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: result.churn_risk === 'Critical' ? '#fee2e2' : result.churn_risk === 'High' ? '#fef3c7' : '#f1f5f9',
                color: result.churn_risk === 'Critical' ? '#b91c1c' : result.churn_risk === 'High' ? '#b45309' : '#475569',
              }}
            />
          )}

          {result.processing_time_ms && (
            <Chip
              size="small"
              icon={<TimerOutlinedIcon fontSize="small" />}
              label={`${(result.processing_time_ms / 1000).toFixed(2)}s`}
              variant="outlined"
              sx={{ backgroundColor: '#ffffff', fontSize: '0.75rem', fontWeight: 600 }}
            />
          )}
        </Stack>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* Core Triage Metadata Grid */}
        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          {/* Category */}
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                height: '100%',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight="700" textTransform="uppercase">
                Assigned Category
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={result.category}
                  color="primary"
                  sx={{ fontWeight: 700, fontSize: '0.9rem', px: 0.5, borderRadius: 2 }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Department Owner Routing */}
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                height: '100%',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight="700" textTransform="uppercase">
                Routed Department Owner
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  icon={ownerDetails.icon}
                  label={result.assigned_owner}
                  color={ownerDetails.color}
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '0.9rem', px: 0.5, borderWidth: 2, borderRadius: 2 }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Priority Justification */}
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                height: '100%',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight="700" textTransform="uppercase">
                Priority Justification
              </Typography>
              <Typography variant="body2" color="text.primary" sx={{ mt: 0.8, fontWeight: 500, lineHeight: 1.5 }}>
                {result.priority_reason}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Short Summary Section */}
        <Box
          sx={{
            mb: 2.5,
            p: 2,
            borderRadius: 2.5,
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
          }}
        >
          <Typography variant="caption" color="primary.dark" fontWeight="800" textTransform="uppercase">
            Executive Summary
          </Typography>
          <Typography variant="body1" color="#1e3a8a" sx={{ mt: 0.5, fontWeight: 500, lineHeight: 1.5 }}>
            {result.summary}
          </Typography>
        </Box>

        {/* Detected Key Entities & Sentiment Bar */}
        {((result.key_entities && result.key_entities.length > 0) || result.sentiment_label) && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2.5,
              backgroundColor: '#faf5ff',
              border: '1px solid #e9d5ff',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ color: '#7c3aed', fontWeight: 800, textTransform: 'uppercase' }}>
                ✦ Key Entities Detected:
              </Typography>
              {result.key_entities && result.key_entities.length > 0 ? (
                result.key_entities.map((entity, i) => (
                  <Chip
                    key={i}
                    size="small"
                    label={entity}
                    sx={{ backgroundColor: '#ffffff', border: '1px solid #d8b4fe', color: '#6b21a8', fontWeight: 600, fontSize: '0.75rem' }}
                  />
                ))
              ) : (
                <Chip size="small" label="Standard Inquiry" sx={{ backgroundColor: '#ffffff', color: '#6b21a8' }} />
              )}
            </Box>

            {result.sentiment_label && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#7c3aed', fontWeight: 700 }}>
                  Customer Emotion:
                </Typography>
                <Chip
                  size="small"
                  label={result.sentiment_label}
                  sx={{ backgroundColor: '#f3e8ff', color: '#6b21a8', fontWeight: 700, fontSize: '0.75rem' }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Suggested Clarifying Diagnostic Questions */}
        {result.suggested_questions && result.suggested_questions.length > 0 && (
          <Box sx={{ mb: 3, p: 2, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 1.2 }}>
              ✦ AI Suggested Diagnostic Questions (Click to append into email draft):
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {result.suggested_questions.map((q, idx) => (
                <Button
                  key={idx}
                  size="small"
                  variant="outlined"
                  onClick={() => handleInsertQuestion(q)}
                  startIcon={<AddCircleOutlineIcon fontSize="small" sx={{ color: '#2563eb' }} />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    borderColor: '#cbd5e1',
                    color: '#1e293b',
                    backgroundColor: '#ffffff',
                    '&:hover': {
                      backgroundColor: '#eff6ff',
                      borderColor: '#2563eb',
                      color: '#1d4ed8',
                    },
                  }}
                >
                  {q}
                </Button>
              ))}
            </Stack>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Draft Response & Email Dispatch Section */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography variant="h6" fontWeight="800" sx={{ color: '#0f172a' }}>
                Approve & Transmit Client Email
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Select audience tone, verify recipient and dispatch credentials:
              </Typography>
            </Box>

            {/* AI Multi-Tone Switcher Controls */}
            <Stack direction="row" spacing={1} alignItems="center">
              <ButtonGroup size="small" sx={{ borderRadius: 2 }}>
                {[
                  { key: 'empathetic', label: '🤝 Empathetic' },
                  { key: 'executive', label: '👔 Executive' },
                  { key: 'concise', label: '⚡ Concise' },
                ].map((item) => {
                  const isActive = currentTone === item.key;
                  return (
                    <Button
                      key={item.key}
                      onClick={() => handleSelectTone(item.key)}
                      disabled={toneLoading}
                      variant={isActive ? 'contained' : 'outlined'}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.78rem',
                        fontWeight: isActive ? 700 : 500,
                        backgroundColor: isActive ? '#7c3aed' : undefined,
                        borderColor: '#cbd5e1',
                        color: isActive ? '#ffffff' : '#475569',
                        '&:hover': {
                          backgroundColor: isActive ? '#6d28d9' : '#f8fafc',
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </ButtonGroup>

              <Tooltip title={copied ? 'Copied!' : 'Copy response to clipboard'}>
                <Button
                  size="small"
                  variant="outlined"
                  color={copied ? 'success' : 'inherit'}
                  startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                  onClick={handleCopy}
                  sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#cbd5e1' }}
                >
                  {copied ? 'Copied' : 'Copy'}
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
              borderRadius: 2.5,
            }}
          >
            <Grid container spacing={2}>
              {/* Recipient Input */}
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
                        sx={{ minWidth: 40, px: 1, borderRadius: 2, borderColor: '#cbd5e1' }}
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

          {/* Draft Body Text Area with tone loading indicator */}
          <Box sx={{ position: 'relative' }}>
            {toneLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  borderRadius: 2.5,
                }}
              >
                <CircularProgress size={24} sx={{ color: '#7c3aed' }} />
                <Typography variant="body2" fontWeight="700" sx={{ color: '#7c3aed' }}>
                  Synthesizing {currentTone} draft...
                </Typography>
              </Box>
            )}

            <TextField
              multiline
              rows={7}
              fullWidth
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              disabled={sentSuccess}
              placeholder="Review or write the response to be emailed..."
              sx={{
                backgroundColor: '#ffffff',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                },
              }}
            />
          </Box>

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
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
              sx={{
                px: 3.5,
                py: 1.2,
                borderRadius: 2.5,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.92rem',
                background: !sentSuccess ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' : undefined,
                boxShadow: !sentSuccess ? '0 4px 14px rgba(124, 58, 237, 0.3)' : undefined,
              }}
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
