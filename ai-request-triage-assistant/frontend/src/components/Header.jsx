import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Chip,
  Tooltip,
  Badge,
  Avatar,
  Stack,
  Divider,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import KeyIcon from '@mui/icons-material/VpnKey';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import LogoutIcon from '@mui/icons-material/Logout';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';

import ThemeToggle from './ThemeToggle';
import { useColorMode } from '../ThemeContext';

export default function Header({
  onOpenKeyModal,
  hasApiKey,
  backendOnline,
  onOpenEmailModal,
  emailAccountsCount = 0,
  simulationMode = false,
  onOpenInboxModal,
  inboxCount = 0,
  currentUser = null,
  onOpenAuthModal,
  onLogout,
  onNavigateHome,
}) {
  const { isDark } = useColorMode();

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
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
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
            onClick={onNavigateHome}
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Tooltip title={backendOnline ? 'Backend service is reachable' : 'Backend is unreachable'}>
            <Chip
              size="small"
              icon={<CheckCircleIcon fontSize="small" />}
              label={backendOnline ? 'Online' : 'Offline'}
              color={backendOnline ? 'success' : 'error'}
              variant="outlined"
            />
          </Tooltip>

          {/* Home Landing Page Link */}
          {onNavigateHome && (
            <Tooltip title="View Marketing Homepage & Overview">
              <Button
                variant="text"
                color="inherit"
                size="small"
                startIcon={<HomeOutlinedIcon />}
                onClick={onNavigateHome}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                Home
              </Button>
            </Tooltip>
          )}

          {/* Inbound Live Feed & Webhook Queue Button */}
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={
              <Badge badgeContent={inboxCount} color="error" max={99}>
                <MoveToInboxIcon />
              </Badge>
            }
            onClick={onOpenInboxModal}
            sx={{ borderRadius: 2 }}
          >
            Inbound Feed
          </Button>

          {/* Email Settings */}
          <Button
            variant={emailAccountsCount > 0 ? 'outlined' : 'contained'}
            color={emailAccountsCount > 0 ? 'inherit' : 'primary'}
            size="small"
            startIcon={emailAccountsCount > 0 ? <MarkEmailReadIcon /> : <MailOutlineIcon />}
            onClick={onOpenEmailModal}
            sx={{
              borderRadius: 2,
              borderColor: emailAccountsCount > 0 ? 'divider' : undefined,
              color: emailAccountsCount > 0 ? 'text.primary' : undefined,
            }}
          >
            {emailAccountsCount > 0
              ? `${emailAccountsCount} Gmail`
              : 'Gmail'}
          </Button>

          {/* API Key */}
          <Button
            variant={hasApiKey ? 'outlined' : 'contained'}
            color={hasApiKey ? 'inherit' : 'warning'}
            size="small"
            startIcon={<KeyIcon />}
            onClick={onOpenKeyModal}
            sx={{
              borderRadius: 2,
              borderColor: hasApiKey ? 'divider' : undefined,
              color: hasApiKey ? 'text.primary' : undefined,
            }}
          >
            {hasApiKey ? 'API Key' : 'Set Key'}
          </Button>

          {/* Theme Toggle (Inside Workspace) */}
          <ThemeToggle size="small" />

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'divider' }} />

          {/* User Account & Profile */}
          {currentUser ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={`Signed in as ${currentUser.email}`}>
                <Chip
                  avatar={<Avatar src={currentUser.avatar_url}>{currentUser.name[0]}</Avatar>}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <Typography variant="body2" fontWeight="600" color="text.primary" component="span">
                        {currentUser.name}
                      </Typography>
                      {currentUser.role === 'Admin' && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{
                            backgroundColor: '#7c3aed',
                            color: '#ffffff',
                            fontWeight: 700,
                            px: 0.6,
                            py: 0.1,
                            borderRadius: 0.8,
                            fontSize: '0.65rem',
                          }}
                        >
                          Admin
                        </Typography>
                      )}
                    </Box>
                  }
                  variant="outlined"
                  sx={{ borderColor: 'divider' }}
                />
              </Tooltip>

              <Tooltip title="Log out of current session">
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={onLogout}
                  startIcon={<LogoutIcon />}
                  sx={{ borderRadius: 2, minWidth: 'auto', px: 1.5 }}
                >
                  Logout
                </Button>
              </Tooltip>
            </Stack>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<LockOutlinedIcon />}
              onClick={onOpenAuthModal}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                fontWeight: 600,
              }}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
