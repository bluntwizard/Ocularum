import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Container, Paper, Typography } from '@mui/material';

// Components
import TwitchAuth from '../components/Auth/TwitchAuth';

// Selectors
import { selectIsAuthenticated } from '../store/slices/authSlice';

const AuthPage = () => {
  // Check if user is already authenticated
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // If already authenticated, redirect to home page
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #0e0e10, #1f1f23)'
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            borderRadius: 2,
            background: 'rgba(31, 31, 35, 0.9)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              mb: 3
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Welcome to Ocularum
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" paragraph>
              The ultimate Twitch viewer with automatic tuning capabilities.
            </Typography>
          </Box>
          
          <TwitchAuth />
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthPage; 