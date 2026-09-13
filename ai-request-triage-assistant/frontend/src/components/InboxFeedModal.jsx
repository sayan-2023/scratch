import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  Menu,
  MenuItem,
  CircularProgress,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import BoltIcon from '@mui/icons-material/Bolt';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CodeIcon from '@mui/icons-material/Code';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function InboxFeedModal({
  open,
  onClose,
  inboxMessages = [],
  onSimulateEvent,
  onDeleteMessage,
  onClearInbox,
  onLoadIntoTriage,
  loading = false,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const handleOpenMenu = (e) => setMenuAnchor(e.currentTarget);
  const handleCloseMenu = () => setMenuAnchor(null);

  const handleTriggerSimulate = async (scenarioType) => {
    handleCloseMenu();
    setSimulating(true);
    try {
      await onSimulateEvent(scenarioType);
    } finally {
      setSimulating(false);
    }
  };

  const curlExample = `curl -X POST http://localhost:8000/api/inbox/webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": "Zendesk P1",
    "sender": "ops-lead@partner.com",
    "subject": "Critical API Outage",
    "body": "All payment calls returning HTTP 504. Over 2,000 customers blocked!"
  }'`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoveToInboxIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Live Inbound Ingestion Feed & Webhooks
          </Typography>
          <Chip
            size="small"
            label={`${inboxMessages.length} item${inboxMessages.length === 1 ? '' : 's'}`}
            color="primary"
            variant="outlined"
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'background.default' : '#f8fafc',
          py: 2.5,
        }}
      >
        {/* Top Control Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Simulate or receive live inquiries from webhooks, Zendesk, Stripe, or web forms:
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={simulating ? <CircularProgress size={16} color="inherit" /> : <BoltIcon />}
              onClick={handleOpenMenu}
              disabled={simulating || loading}
            >
              Simulate Inbound Event
            </Button>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
              <MenuItem onClick={() => handleTriggerSimulate('stripe_chargeback')}>
                💳 Stripe Dispute / Chargeback Webhook
              </MenuItem>
              <MenuItem onClick={() => handleTriggerSimulate('zendesk_outage')}>
                🚨 Zendesk P1 Outage Incident
              </MenuItem>
              <MenuItem onClick={() => handleTriggerSimulate('contact_form')}>
                📝 Website Enterprise Contact Form
              </MenuItem>
              <MenuItem onClick={() => handleTriggerSimulate('security_inquiry')}>
                🔒 Security & Compliance Questionnaire
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => handleTriggerSimulate('random')}>
                🎲 Surprise Random Inbound Event
              </MenuItem>
            </Menu>

            {inboxMessages.length > 0 && (
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={onClearInbox}
                startIcon={<DeleteOutlineIcon />}
                disabled={loading}
              >
                Clear Queue
              </Button>
            )}
          </Stack>
        </Box>

        {/* Integration Instructions */}
        <Accordion
          sx={{
            mb: 2.5,
            borderRadius: '8px !important',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            boxShadow: 'none',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CodeIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" fontWeight="600">
                How to stream live webhook events from Stripe, Zendesk, or Formspree
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Typography variant="caption" color="text.secondary" paragraph>
              Post JSON payloads to <code>http://localhost:8000/api/inbox/webhook</code>. Optional: pass <code>"auto_triage": true</code> to immediately categorize and route on ingestion.
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 1.5,
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark' ? '#090d16' : '#1e293b',
                color: '#f1f5f9',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                fontSize: '0.78rem',
                overflowX: 'auto',
                m: 0,
              }}
            >
              {curlExample}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Messages List */}
        {inboxMessages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <MoveToInboxIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="600">
              Inbound queue is empty
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click "Simulate Inbound Event" above or post a webhook to populate live messages.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<BoltIcon />}
              onClick={() => handleTriggerSimulate('random')}
            >
              Generate Test Event
            </Button>
          </Box>
        ) : (
          <Stack spacing={2}>
            {inboxMessages.map((msg) => (
              <Card
                key={msg.id}
                sx={{
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '0 2px 8px rgba(0,0,0,0.4)'
                      : '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  '&:hover': {
                    boxShadow: (theme) =>
                      theme.palette.mode === 'dark'
                        ? '0 6px 20px rgba(0,0,0,0.6)'
                        : '0 4px 12px rgba(0,0,0,0.08)',
                  },
                }}
              >
                <CardContent sx={{ pb: '16px !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip
                        size="small"
                        label={msg.source}
                        color="primary"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                      <Chip
                        size="small"
                        label={msg.status === 'triaged' ? 'Triaged' : 'Pending Review'}
                        icon={msg.status === 'triaged' ? <CheckCircleIcon /> : <AccessTimeIcon />}
                        color={msg.status === 'triaged' ? 'success' : 'warning'}
                        variant="outlined"
                        sx={{ fontSize: '0.72rem' }}
                      />
                    </Stack>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {msg.timestamp}
                      </Typography>
                      <IconButton size="small" color="default" onClick={() => onDeleteMessage(msg.id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>

                  {msg.subject && (
                    <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ mb: 0.5 }}>
                      {msg.subject}
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    From: <strong>{msg.sender}</strong> ({msg.channel})
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                      p: 1.5,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      mb: 1.5,
                    }}
                  >
                    {msg.body}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      startIcon={<AutoFixHighIcon />}
                      onClick={() => onLoadIntoTriage(msg)}
                      sx={{ fontSize: '0.78rem' }}
                    >
                      Load into Triage Workspace
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

