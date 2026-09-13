import React from 'react';
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
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';

export default function HistorySidebar({ history, onSelectHistoryItem, activeIndex }) {
  if (!history || history.length === 0) {
    return (
      <Card sx={{ height: '100%', border: '1px dashed #cbd5e1' }}>
        <CardContent sx={{ textAlign: 'center', py: 5 }}>
          <HistoryIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
          <Typography variant="subtitle2" color="text.secondary">
            Session History
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Triaged requests will appear here for quick review.
          </Typography>
        </CardContent>
      </Card>
    );
  }

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
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <HistoryIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight="bold">
            Activity Log ({history.length})
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Click any previous request to reload its details:
        </Typography>
      </CardContent>

      <Divider />

      <List disablePadding sx={{ maxHeight: 600, overflowY: 'auto' }}>
        {history.map((item, index) => {
          const isSelected = activeIndex === index;
          return (
            <React.Fragment key={index}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => onSelectHistoryItem(index)}
                  sx={{
                    py: 1.5,
                    borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={isSelected ? 700 : 500} noWrap sx={{ maxWidth: '65%' }}>
                          {item.result.category} • {item.result.assigned_owner}
                        </Typography>
                        <Chip
                          size="small"
                          label={item.result.priority}
                          color={getPriorityColor(item.result.priority)}
                          sx={{ height: 20, fontSize: '0.7rem' }}
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
                          lineHeight: 1.3,
                        }}
                      >
                        {item.result.summary || item.text}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
              {index < history.length - 1 && <Divider component="li" />}
            </React.Fragment>
          );
        })}
      </List>
    </Card>
  );
}

