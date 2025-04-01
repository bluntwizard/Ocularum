import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Box,
  CircularProgress,
  Typography,
  Alert
} from '@mui/material';
import { Tv as TvIcon } from '@mui/icons-material';
import { setUser, setAuthenticated } from '../redux/slices/authSlice';

const TwitchAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Request twitch auth
      const result = await window.electron.invoke('python-command', 'get_auth_url');
      
      if (result.success && result.auth_url) {
        // Open Twitch authentication URL in system browser
        window.electron.openExternal(result.auth_url);
        
        // Register callback for auth completion
        window.electron.onNotification('auth-complete', handleAuthComplete);
      } else {
        setError('Failed to get authentication URL');
        setLoading(false);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Authentication error: ' + error.message);
      setLoading(false);
    }
  };

  const handleAuthComplete = async (success, data) => {
    try {
      if (success) {
        // Get user info from token
        const userResult = await window.electron.invoke('python-command', 'get_user_info');
        
        if (userResult.success && userResult.user) {
          // Store username in local storage
          localStorage.setItem('twitch_username', userResult.user.login);
          localStorage.setItem('twitch_display_name', userResult.user.display_name);
          
          // Update Redux store
          dispatch(setUser({
            id: userResult.user.id,
            username: userResult.user.login,
            displayName: userResult.user.display_name,
            profileImage: userResult.user.profile_image_url
          }));
          dispatch(setAuthenticated(true));
          
          // Navigate to home page
          navigate('/');
        } else {
          setError('Failed to get user information');
        }
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Error processing authentication:', error);
      setError('Error processing authentication: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={handleLogin}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <TvIcon />}
        sx={{
          bgcolor: '#9147ff',
          '&:hover': {
            bgcolor: '#772ce8'
          },
          px: 4,
          py: 1.5,
          borderRadius: 2,
          fontSize: '1rem',
          textTransform: 'none'
        }}
      >
        {loading ? 'Connecting...' : 'Connect with Twitch'}
      </Button>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        We will only request permission to view your public information and followed channels.
      </Typography>
    </Box>
  );
};

export default TwitchAuth;