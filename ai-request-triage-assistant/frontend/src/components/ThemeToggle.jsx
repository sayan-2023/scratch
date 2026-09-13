import React from 'react';
import { IconButton, Tooltip, Box, Typography } from '@mui/material';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import { useColorMode } from '../ThemeContext';

export default function ThemeToggle({ size = 'medium', showLabel = false, sx = {} }) {
  const { mode, toggleColorMode, isDark } = useColorMode();

  return (
    <Tooltip
      title={isDark ? 'Switch to Light Mode (currently Dark)' : 'Switch to Dark Mode (currently Light)'}
      arrow
    >
      <IconButton
        onClick={toggleColorMode}
        size={size}
        aria-label="Toggle color theme"
        sx={{
          borderRadius: 2.5,
          p: size === 'small' ? 0.8 : 1,
          border: isDark
            ? '1px solid rgba(255, 255, 255, 0.12)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.04)'
            : 'rgba(0, 0, 0, 0.03)',
          backdropFilter: 'blur(8px)',
          color: isDark ? '#fbbf24' : '#f59e0b',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.09)'
              : 'rgba(0, 0, 0, 0.06)',
            borderColor: isDark
              ? 'rgba(251, 191, 36, 0.4)'
              : 'rgba(245, 158, 11, 0.4)',
            boxShadow: isDark
              ? '0 0 16px rgba(251, 191, 36, 0.2)'
              : '0 0 16px rgba(245, 158, 11, 0.2)',
            transform: 'scale(1.05)',
          },
          ...sx,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            transform: isDark ? 'rotate(0deg)' : 'rotate(360deg)',
            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {isDark ? (
            <DarkModeRoundedIcon sx={{ fontSize: size === 'small' ? 19 : 22, color: '#38bdf8' }} />
          ) : (
            <LightModeRoundedIcon sx={{ fontSize: size === 'small' ? 19 : 22, color: '#f59e0b' }} />
          )}
          {showLabel && (
            <Typography
              variant="caption"
              fontWeight="700"
              sx={{
                color: isDark ? '#f8fafc' : '#0f172a',
                fontSize: '0.8rem',
                textTransform: 'capitalize',
                pr: 0.5,
              }}
            >
              {mode}
            </Typography>
          )}
        </Box>
      </IconButton>
    </Tooltip>
  );
}

