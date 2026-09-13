import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';

export default function SamplePicker({ samples, onSelectSample, selectedId }) {
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
    <Card sx={{ mb: 3, border: '1px dashed #cbd5e1', backgroundColor: '#f8fafc' }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <FlashOnIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight="700" color="text.primary">
            Quick Test Scenarios (1-Click Presets)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Select a mock request to test classification, priority scoring, routing, and draft replies:
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {samples.map((sample) => {
            const isSelected = selectedId === sample.id;
            return (
              <Chip
                key={sample.id}
                clickable
                onClick={() => onSelectSample(sample)}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <span>{sample.title}</span>
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        px: 0.8,
                        py: 0.2,
                        borderRadius: 1,
                        backgroundColor:
                          sample.expected_priority === 'Urgent'
                            ? '#fee2e2'
                            : sample.expected_priority === 'High'
                            ? '#fef3c7'
                            : sample.expected_priority === 'Medium'
                            ? '#e0f2fe'
                            : '#dcfce7',
                        color:
                          sample.expected_priority === 'Urgent'
                            ? '#b91c1c'
                            : sample.expected_priority === 'High'
                            ? '#b45309'
                            : sample.expected_priority === 'Medium'
                            ? '#0369a1'
                            : '#15803d',
                      }}
                    >
                      {sample.expected_priority}
                    </Typography>
                  </Box>
                }
                color={isSelected ? 'primary' : 'default'}
                variant={isSelected ? 'filled' : 'outlined'}
                sx={{
                  py: 2.2,
                  px: 0.5,
                  fontSize: '0.85rem',
                  borderColor: isSelected ? 'primary.main' : '#cbd5e1',
                  backgroundColor: isSelected ? undefined : '#ffffff',
                }}
              />
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

