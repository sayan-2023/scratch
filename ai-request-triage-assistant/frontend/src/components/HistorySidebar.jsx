import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Box,
  Divider,
  TextField,
  InputAdornment,
  Grid,
  Stack,
  Tooltip,
  useTheme,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LayersIcon from '@mui/icons-material/Layers';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function HistorySidebar({ history = [], onSelectHistoryItem, activeIndex }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  const urgentCount = history.filter((h) => h.result?.priority === 'Urgent').length;
  const highCount = history.filter((h) => h.result?.priority === 'High').length;
  const engineeringCount = history.filter((h) => h.result?.assigned_owner === 'Engineering').length;

  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const summary = (item.result?.summary || item.text || '').toLowerCase();
    const cat = (item.result?.category || '').toLowerCase();
    const owner = (item.result?.assigned_owner || '').toLowerCase();
    return summary.includes(q) || cat.includes(q) || owner.includes(q);
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'error';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'info';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3.5,
        position: 'relative',
        overflow: 'hidden',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
        backdropFilter: 'blur(20px)',
        boxShadow: isDark
          ? '0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(139, 92, 246, 0.08)'
          : '0 8px 24px -6px rgba(15, 23, 42, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmerAccentSide 4s linear infinite',
        },
        '@keyframes shimmerAccentSide': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
      }}
    >
      {/* Header with Title & Stats */}
      <Box sx={{ p: 2.4, borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0', backgroundColor: isDark ? 'rgba(8, 12, 20, 0.5)' : '#fafafa' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.35)',
              }}
            >
              <HistoryIcon fontSize="small" />
            </Box>
            <Typography variant="subtitle1" fontWeight="800" sx={{ color: isDark ? '#ffffff' : '#0f172a', letterSpacing: '-0.01em' }}>
              Session History
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`${history.length} Triaged`}
            sx={{
              height: 22,
              fontSize: '0.72rem',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
              color: isDark ? '#94a3b8' : '#64748b',
              fontWeight: 700,
              borderRadius: 1.5,
            }}
          />
        </Box>

        {/* Operational KPI Cards with Colored Glass & Hover Lift */}
        <Grid container spacing={1.2}>
          <Grid item xs={4}>
            <Box
              sx={{
                p: 1.2,
                textAlign: 'center',
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
                border: isDark ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid #fecaca',
                borderRadius: 2.2,
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                },
              }}
            >
              <Typography variant="caption" sx={{ color: isDark ? '#fca5a5' : '#dc2626', display: 'block', fontSize: '0.66rem', fontWeight: 700 }}>
                P1 URGENT
              </Typography>
              <Typography variant="subtitle2" fontWeight="900" sx={{ color: isDark ? '#f87171' : '#dc2626', fontSize: '1.05rem', lineHeight: 1.2, mt: 0.2 }}>
                {urgentCount}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                p: 1.2,
                textAlign: 'center',
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#fffbeb',
                border: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid #fde68a',
                borderRadius: 2.2,
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
                },
              }}
            >
              <Typography variant="caption" sx={{ color: isDark ? '#fde68a' : '#d97706', display: 'block', fontSize: '0.66rem', fontWeight: 700 }}>
                HIGH RISK
              </Typography>
              <Typography variant="subtitle2" fontWeight="900" sx={{ color: isDark ? '#fbbf24' : '#d97706', fontSize: '1.05rem', lineHeight: 1.2, mt: 0.2 }}>
                {highCount}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                p: 1.2,
                textAlign: 'center',
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff',
                border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #bfdbfe',
                borderRadius: 2.2,
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                },
              }}
            >
              <Typography variant="caption" sx={{ color: isDark ? '#93c5fd' : '#2563eb', display: 'block', fontSize: '0.66rem', fontWeight: 700 }}>
                ENG ROUTED
              </Typography>
              <Typography variant="subtitle2" fontWeight="900" sx={{ color: isDark ? '#60a5fa' : '#2563eb', fontSize: '1.05rem', lineHeight: 1.2, mt: 0.2 }}>
                {engineeringCount}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Filter Input if history exists */}
        {history.length > 2 && (
          <TextField
            size="small"
            fullWidth
            placeholder="Filter past sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              mt: 1.8,
              '& .MuiOutlinedInput-root': {
                backgroundColor: isDark ? 'rgba(8, 12, 20, 0.65)' : '#ffffff',
                borderRadius: 2,
                fontSize: '0.78rem',
                color: 'text.primary',
                '& fieldset': { borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1' },
              },
            }}
          />
        )}
      </Box>

      {/* History Items or Floating Animated Empty State */}
      {history.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', my: 'auto' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              mx: 'auto',
              borderRadius: '50%',
              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(124, 58, 237, 0.08)',
              border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(124, 58, 237, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              mb: 2.5,
              boxShadow: '0 0 24px rgba(139, 92, 246, 0.25)',
              animation: 'floatIcon 3.5s ease-in-out infinite',
              '@keyframes floatIcon': {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-6px)' },
              },
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 32, color: '#c084fc' }} />
          </Box>
          <Typography variant="subtitle2" fontWeight="800" sx={{ color: isDark ? '#ffffff' : '#0f172a', mb: 0.5 }}>
            No Triage Sessions Yet
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block', maxWidth: 230, mx: 'auto', lineHeight: 1.6, mb: 2.5 }}>
            Select a scenario preset above or paste an email to trigger real-time AI triage.
          </Typography>

          <Stack spacing={1} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
              <SpeedIcon fontSize="small" sx={{ color: '#3b82f6', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                Pipeline: Gemini 2.0 State Graph
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
              <SecurityIcon fontSize="small" sx={{ color: '#10b981', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                PII Anonymization: Active
              </Typography>
            </Box>
          </Stack>
        </Box>
      ) : (
        <List disablePadding sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 620 }}>
          {filteredHistory.map((item, index) => {
            const isSelected = activeIndex === index;
            return (
              <React.Fragment key={index}>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => onSelectHistoryItem(index)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderLeft: isSelected ? '3px solid #8b5cf6' : '3px solid transparent',
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(139, 92, 246, 0.16)' : 'rgba(124, 58, 237, 0.06)')
                        : undefined,
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(139, 92, 246, 0.24)' : 'rgba(124, 58, 237, 0.1)')
                          : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc'),
                        transform: 'translateX(3px)',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, maxWidth: '68%' }}>
                            {isSelected && (
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  backgroundColor: '#8b5cf6',
                                  boxShadow: '0 0 6px #8b5cf6',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <Typography variant="body2" fontWeight={isSelected ? 800 : 600} noWrap sx={{ color: 'text.primary' }}>
                              {item.result.category} • {item.result.assigned_owner}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={item.result.priority}
                            color={getPriorityColor(item.result.priority)}
                            sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4,
                            fontSize: '0.75rem',
                          }}
                        >
                          {item.result.summary || item.text}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {index < filteredHistory.length - 1 && <Divider component="li" sx={{ borderColor: 'divider' }} />}
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Card>
  );
}
