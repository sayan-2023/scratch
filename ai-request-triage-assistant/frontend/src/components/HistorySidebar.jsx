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
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LayersIcon from '@mui/icons-material/Layers';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function HistorySidebar({ history = [], onSelectHistoryItem, activeIndex }) {
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
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header with Title & Stats */}
      <Box sx={{ p: 2.2, borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HistoryIcon fontSize="small" />
            </Box>
            <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#0f172a' }}>
              Session History
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`${history.length} Triaged`}
            sx={{ height: 20, fontSize: '0.7rem', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 700 }}
          />
        </Box>

        {/* Operational KPI Cards */}
        <Grid container spacing={1}>
          <Grid item xs={4}>
            <Box
              sx={{
                p: 1,
                textAlign: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.68rem', fontWeight: 600 }}>
                P1 URGENT
              </Typography>
              <Typography variant="subtitle2" fontWeight="800" sx={{ color: urgentCount > 0 ? '#dc2626' : '#0f172a' }}>
                {urgentCount}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                p: 1,
                textAlign: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.68rem', fontWeight: 600 }}>
                HIGH RISK
              </Typography>
              <Typography variant="subtitle2" fontWeight="800" sx={{ color: highCount > 0 ? '#d97706' : '#0f172a' }}>
                {highCount}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                p: 1,
                textAlign: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.68rem', fontWeight: 600 }}>
                ENG ROUTED
              </Typography>
              <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#2563eb' }}>
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
                  <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              mt: 1.5,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#ffffff',
                borderRadius: 2,
                fontSize: '0.78rem',
              },
            }}
          />
        )}
      </Box>

      {/* History Items or Modern Empty State */}
      {history.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', my: 'auto' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              mx: 'auto',
              borderRadius: 3,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              mb: 2,
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 28, color: '#a855f7' }} />
          </Box>
          <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#1e293b', mb: 0.5 }}>
            No Triage Sessions Yet
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', maxWidth: 220, mx: 'auto', lineHeight: 1.5, mb: 2 }}>
            Select a scenario preset above or paste an email to trigger real-time AI triage.
          </Typography>

          <Stack spacing={1} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
              <SpeedIcon fontSize="small" sx={{ color: '#2563eb', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Pipeline: Gemini 2.5 Flash
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
              <SecurityIcon fontSize="small" sx={{ color: '#10b981', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: '#64748b' }}>
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
                      borderLeft: isSelected ? '4px solid #7c3aed' : '4px solid transparent',
                      backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.04)' : undefined,
                      '&:hover': {
                        backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.08)' : '#f8fafc',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={isSelected ? 800 : 600} noWrap sx={{ maxWidth: '65%', color: '#0f172a' }}>
                            {item.result.category} • {item.result.assigned_owner}
                          </Typography>
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
                {index < filteredHistory.length - 1 && <Divider component="li" />}
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Card>
  );
}
