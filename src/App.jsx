import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Snackbar, Alert } from '@mui/material';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import HomePage from './pages/Home';
import StreamsPage from './pages/Streams';
import BrowsePage from './pages/Browse';
import SettingsPage from './pages/Settings';
import AuthPage from './pages/Auth';

// Components
import UpdateNotification from './components/Notifications/UpdateNotification';

// Selectors
import { selectIsAuthenticated } from './store/slices/authSlice';

const App = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [notification, setNotification] = useState(null);

  // Set up update event listeners
  useEffect(() => {
    const unsubscribeAvailable = window.electron.onUpdateAvailable(() => {
      setUpdateAvailable(true);
      setNotification({
        severity: 'info',
        message: 'An update is available and will be downloaded in the background.'
      });
    });

    const unsubscribeDownloaded = window.electron.onUpdateDownloaded(() => {
      setUpdateDownloaded(true);
      setNotification({
        severity: 'success',
        message: 'Update downloaded! Restart to apply.'
      });
    });

    return () => {
      unsubscribeAvailable();
      unsubscribeDownloaded();
    };
  }, []);

  // Handle notification close
  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/auth" replace />;
    }
    return children;
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Update notification */}
      {updateDownloaded && (
        <UpdateNotification 
          onInstall={() => window.electron.app.installUpdate()}
        />
      )}

      {/* Routes */}
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<HomePage />} />
          <Route path="streams" element={<StreamsPage />} />
          <Route path="browse" element={<BrowsePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>

      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notification && (
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity} 
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default App; 