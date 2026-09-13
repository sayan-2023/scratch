import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Chip,
  Tooltip,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import KeyIcon from '@mui/icons-material/VpnKey';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';

export default function Header({
  onOpenKeyModal,
  hasApiKey,
  backendOnline,
  onOpenEmailModal,
  emailAccountsCount = 0,
  simulationMode = false,
}) {
  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              backgroundColor: 'primary.main',
              color: '#fff',
              p: 1,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SmartToyIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              AI Request Triage Assistant
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Turn unstructured inquiries into prioritized routing & response drafts
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title={backendOnline ? 'Backend service is reachable' : 'Backend is unreachable'}>
            <Chip
              size="small"
              icon={<CheckCircleIcon fontSize="small" />}
              label={backendOnline ? 'FastAPI Online' : 'Backend Offline'}
              color={backendOnline ? 'success' : 'error'}
              variant="outlined"
            />
          </Tooltip>

          <Button
            variant={emailAccountsCount > 0 ? 'outlined' : 'contained'}
            color={emailAccountsCount > 0 ? 'inherit' : 'primary'}
            size="small"
            startIcon={emailAccountsCount > 0 ? <MarkEmailReadIcon /> : <MailOutlineIcon />}
            onClick={onOpenEmailModal}
            sx={{ borderRadius: 2 }}
          >
            {emailAccountsCount > 0
              ? `${emailAccountsCount} Gmail Account${emailAccountsCount > 1 ? 's' : ''}`
              : 'Configure Gmail'}
          </Button>

          <Button
            variant={hasApiKey ? 'outlined' : 'contained'}
            color={hasApiKey ? 'inherit' : 'warning'}
            size="small"
            startIcon={<KeyIcon />}
            onClick={onOpenKeyModal}
            sx={{ borderRadius: 2 }}
          >
            {hasApiKey ? 'API Key Configured' : 'Configure API Key'}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

