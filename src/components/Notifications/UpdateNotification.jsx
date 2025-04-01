import React from 'react';
import { Alert, Button, Paper, Typography, Box } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

/**
 * Component for showing update notifications
 * @param {Object} props - Component props
 * @param {Function} props.onInstall - Function to call when install button is clicked
 */
const UpdateNotification = ({ onInstall }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1500,
        width: 320,
        padding: 2,
        borderRadius: 2,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Update Available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          A new version of Ocularum is ready to install. Restart the application to apply the update.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={onInstall}
          color="primary"
        >
          Install & Restart
        </Button>
      </Box>
    </Paper>
  );
};

export default UpdateNotification; 