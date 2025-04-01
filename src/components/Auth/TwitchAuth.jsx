import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Typography, Box, CircularProgress } from '@mui/material';

// Import auth actions - these would be defined in your auth slice
import { 
  setAuthLoading, 
  setAuthenticated, 
  setAuthError, 
  setUserProfile 
} from '../../store/slices/authSlice';

const TwitchAuth = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, error } = useSelector(state => state.auth);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Scopes required for the application
  const requiredScopes = [
    'user:read:email',
    'user:read:follows',
    'user:read:subscriptions'
  ];

  // Initialize authentication on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we already have auth tokens stored
        const authData = localStorage.getItem('twitch_auth');
        if (authData) {
          const parsedAuth = JSON.parse(authData);
          if (parsedAuth.token && parsedAuth.expiresAt > Date.now()) {
            // Valid token exists, get user profile
            dispatch(setAuthenticated(true));
            await fetchUserProfile();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [dispatch]);

  // Fetch the user's profile information
  const fetchUserProfile = useCallback(async () => {
    try {
      // Call the Electron IPC to get user info
      const response = await window.electron.invoke('python-command', 'get_user_info', {
        username: localStorage.getItem('twitch_username')
      });
      
      if (response.success && response.user) {
        dispatch(setUserProfile(response.user));
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      dispatch(setAuthError('Failed to fetch user profile'));
      dispatch(setAuthenticated(false));
      localStorage.removeItem('twitch_auth');
    }
  }, [dispatch]);

  // Handle login button click
  const handleLogin = async () => {
    dispatch(setAuthLoading(true));
    
    try {
      // Call the Electron IPC to authenticate
      const response = await window.electron.invoke('python-command', 'authenticate', {
        scopes: requiredScopes
      });
      
      if (response.success && response.token) {
        // Store auth data in localStorage
        const authData = {
          token: response.token,
          refreshToken: response.refresh_token,
          expiresAt: Date.now() + (3600 * 1000) // Token expires in 1 hour
        };
        
        localStorage.setItem('twitch_auth', JSON.stringify(authData));
        
        // Set authentication state
        dispatch(setAuthenticated(true));
        
        // Fetch user profile
        await fetchUserProfile();
      } else {
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch(setAuthError(error.message || 'Authentication failed'));
      dispatch(setAuthenticated(false));
    } finally {
      dispatch(setAuthLoading(false));
    }
  };

  // Handle logout button click
  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('twitch_auth');
    localStorage.removeItem('twitch_username');
    
    // Update state
    dispatch(setAuthenticated(false));
    dispatch(setUserProfile(null));
  };

  // Show loading indicator during initialization
  if (isInitializing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 2,
        padding: 3
      }}
    >
      {isAuthenticated ? (
        <>
          <Typography variant="h6" gutterBottom>
            You're connected to Twitch
          </Typography>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleLogout}
            disabled={isLoading}
          >
            Disconnect from Twitch
          </Button>
        </>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            Connect to Twitch to use Ocularum
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleLogin}
            disabled={isLoading}
            sx={{ 
              backgroundColor: '#9146FF', 
              '&:hover': { backgroundColor: '#7232C5' } 
            }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Connect with Twitch'}
          </Button>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default TwitchAuth; 