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
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

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
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        backgroundColor: isDark ? 'rgba(8, 12, 20, 0.92)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: isDark
          ? '0 10px 30px -10px rgba(0, 0, 0, 0.6)'
          : '0 10px 30px -10px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s ease',
        top: 0,
        zIndex: 1100,
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1.5px',
          background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.45), rgba(168, 85, 247, 0.55), rgba(236, 72, 153, 0.45), transparent)',
          backgroundSize: '200% 100%',
          animation: 'headerShimmer 6s linear infinite',
        },
        '@keyframes headerShimmer': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 0.8, px: { xs: 1, sm: 2 } }}>
        {/* Brand Logo with Shifting Gradient & Hover Tilt */}
        <Box
          onClick={onNavigateHome}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'transform 0.25s ease',
            '&:hover': {
              transform: 'scale(1.02)',
            },
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%)',
              backgroundSize: '200% 200%',
              animation: 'logoGradient 6s ease infinite alternate',
              color: '#fff',
              p: 0.9,
              borderRadius: 2.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isDark
                ? '0 4px 18px rgba(124, 58, 237, 0.45)'
                : '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                transform: 'rotate(-6deg) scale(1.08)',
                boxShadow: '0 6px 24px rgba(236, 72, 153, 0.55)',
              },
              '@keyframes logoGradient': {
                '0%': { backgroundPosition: '0% 50%' },
                '100%': { backgroundPosition: '100% 50%' },
              },
            }}
          >
            <SmartToyIcon fontSize="small" />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography variant="subtitle1" fontWeight="800" sx={{ color: isDark ? '#ffffff' : '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                AI Request Triage Assistant
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.72rem', display: { xs: 'none', sm: 'block' } }}>
              Turn unstructured inquiries into prioritized routing & response drafts
            </Typography>
          </Box>
        </Box>

        {/* Action Controls & Indicators */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Online Indicator with Radar Beacon */}
          <Tooltip title={backendOnline ? 'Backend service connected & ready' : 'Backend is unreachable'}>
            <Box
              sx={{
                px: 1.2,
                py: 0.4,
                borderRadius: 50,
                border: '1px solid',
                borderColor: backendOnline
                  ? isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.4)'
                  : 'rgba(239, 68, 68, 0.4)',
                backgroundColor: backendOnline
                  ? isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)'
                  : 'rgba(239, 68, 68, 0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                color: backendOnline ? '#10b981' : '#ef4444',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: backendOnline ? '#10b981' : '#ef4444',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: -3,
                    left: -3,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: backendOnline ? '#10b981' : '#ef4444',
                    opacity: 0.6,
                    animation: 'radarDot 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                  },
                  '@keyframes radarDot': {
                    '0%': { transform: 'scale(0.8)', opacity: 0.8 },
                    '70%, 100%': { transform: 'scale(2.4)', opacity: 0 },
                  },
                }}
              />
              <span>{backendOnline ? 'Online' : 'Offline'}</span>
            </Box>
          </Tooltip>

          {/* Home Landing Page Link */}
          {onNavigateHome && (
            <Tooltip title="View Marketing Homepage & Overview">
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  <HomeOutlinedIcon
                    sx={{
                      fontSize: 18,
                      color: isDark ? '#a5b4fc' : '#6366f1',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                }
                onClick={onNavigateHome}
                sx={{
                  borderRadius: 2.2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.01em',
                  px: 1.4,
                  py: 0.5,
                  position: 'relative',
                  overflow: 'hidden',
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.28)',
                  color: isDark ? '#e0e7ff' : '#3730a3',
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)',
                  boxShadow: isDark
                    ? '0 2px 8px rgba(0, 0, 0, 0.25)'
                    : '0 1px 4px rgba(99, 102, 241, 0.08)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent)',
                    transition: 'left 0.5s ease',
                  },
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    borderColor: isDark ? '#818cf8' : '#6366f1',
                    color: isDark ? '#ffffff' : '#4338ca',
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.1)',
                    boxShadow: isDark
                      ? '0 4px 16px rgba(99, 102, 241, 0.35)'
                      : '0 4px 14px rgba(99, 102, 241, 0.2)',
                  },
                  '&:hover::before': {
                    left: '100%',
                  },
                  '&:hover .MuiButton-startIcon svg': {
                    transform: 'scale(1.18) translateY(-1px)',
                    filter: isDark ? 'drop-shadow(0 0 6px rgba(165, 180, 252, 0.7))' : 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.4))',
                  },
                }}
              >
                Home
              </Button>
            </Tooltip>
          )}

          {/* Inbound Live Feed & Webhook Queue Button with Pulsing Badge */}
          <Button
            variant="outlined"
            size="small"
            startIcon={
              <Badge
                badgeContent={inboxCount}
                color="error"
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.7)',
                    animation: inboxCount > 0 ? 'pulseBadge 2s infinite' : 'none',
                    '@keyframes pulseBadge': {
                      '0%, 100%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.15)' },
                    },
                  },
                }}
              >
                <MoveToInboxIcon sx={{ fontSize: 18 }} />
              </Badge>
            }
            onClick={onOpenInboxModal}
            sx={{
              borderRadius: 2.2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              borderColor: isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(37, 99, 235, 0.3)',
              color: isDark ? '#93c5fd' : '#2563eb',
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.06)' : 'rgba(37, 99, 235, 0.04)',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                borderColor: '#3b82f6',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
              },
            }}
          >
            Inbound Feed
          </Button>

          {/* Email Settings */}
          <Button
            variant="outlined"
            size="small"
            startIcon={emailAccountsCount > 0 ? <MarkEmailReadIcon sx={{ fontSize: 18 }} /> : <MailOutlineIcon sx={{ fontSize: 18 }} />}
            onClick={onOpenEmailModal}
            sx={{
              borderRadius: 2.2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              borderColor: isDark ? '#334155' : '#cbd5e1',
              color: isDark ? '#e2e8f0' : '#334155',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                borderColor: '#10b981',
                color: '#10b981',
              },
            }}
          >
            {emailAccountsCount > 0 ? `${emailAccountsCount} Gmail` : 'Gmail'}
          </Button>

          {/* API Key */}
          <Button
            variant={hasApiKey ? 'outlined' : 'contained'}
            color={hasApiKey ? 'inherit' : 'warning'}
            size="small"
            startIcon={<KeyIcon sx={{ fontSize: 17 }} />}
            onClick={onOpenKeyModal}
            sx={{
              borderRadius: 2.2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              borderColor: isDark ? '#334155' : '#cbd5e1',
              color: hasApiKey ? (isDark ? '#e2e8f0' : '#334155') : '#fff',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                borderColor: '#f59e0b',
                color: hasApiKey ? '#f59e0b' : '#fff',
              },
            }}
          >
            {hasApiKey ? 'API Key' : 'Set Key'}
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle size="small" />

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0' }} />

          {/* User Account & Profile */}
          {currentUser ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={`Signed in as ${currentUser.email}`}>
                <Chip
                  avatar={<Avatar src={currentUser.avatar_url}>{currentUser.name[0]}</Avatar>}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <Typography variant="body2" fontWeight="700" color="inherit" component="span">
                        {currentUser.name}
                      </Typography>
                      {currentUser.role === 'Admin' && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{
                            backgroundColor: '#7c3aed',
                            color: '#ffffff',
                            fontWeight: 800,
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
                  sx={{
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderRadius: 2.2,
                  }}
                />
              </Tooltip>

              <Tooltip title="Log out of current session">
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={onLogout}
                  startIcon={<LogoutIcon sx={{ fontSize: 17 }} />}
                  sx={{
                    borderRadius: 2.2,
                    minWidth: 'auto',
                    px: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                    },
                  }}
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
                borderRadius: 2.2,
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                fontWeight: 700,
                textTransform: 'none',
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
