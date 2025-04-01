import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Save as SaveIcon,
  Add as AddIcon
} from '@mui/icons-material';

const SettingsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Autotune settings
  const [autotuneEnabled, setAutotuneEnabled] = useState(false);
  const [checkInterval, setCheckInterval] = useState(60);
  const [maxStreams, setMaxStreams] = useState(4);
  const [defaultQuality, setDefaultQuality] = useState('best');
  const [autoStartOnBoot, setAutoStartOnBoot] = useState(true);
  const [autotunedStreamers, setAutotunedStreamers] = useState([]);
  
  // New streamer
  const [newStreamer, setNewStreamer] = useState('');

  // Quality options
  const qualityOptions = [
    { value: 'best', label: 'Best' },
    { value: 'high', label: 'High (720p60)' },
    { value: 'medium', label: 'Medium (480p30)' },
    { value: 'low', label: 'Low (360p30)' },
    { value: 'audio_only', label: 'Audio Only' }
  ];

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get autotune running status
        const statusResult = await window.electron.invoke('python-command', 'is_autotune_running');
        if (statusResult.success) {
          setAutotuneEnabled(statusResult.running);
        }
        
        // Get autotuned streamers
        const autotunedResult = await window.electron.invoke('python-command', 'get_autotuned_streamers');
        if (autotunedResult.success) {
          setAutotunedStreamers(Object.keys(autotunedResult.streamers).map(username => ({
            username,
            ...autotunedResult.streamers[username]
          })));
          
          // Get settings
          const settings = autotunedResult.settings || {};
          setCheckInterval(settings.check_interval || 60);
          setMaxStreams(settings.max_concurrent_streams || 4);
          setDefaultQuality(settings.default_quality || 'best');
          setAutoStartOnBoot(settings.auto_start_on_boot !== false);
        } else {
          setError('Failed to load autotune settings');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setError('Error loading settings: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Toggle autotune
  const handleToggleAutotune = async () => {
    try {
      setSaving(true);
      
      const command = autotuneEnabled ? 'stop_autotune' : 'start_autotune';
      const result = await window.electron.invoke('python-command', command);
      
      if (result.success) {
        setAutotuneEnabled(!autotuneEnabled);
        setSuccess(`Autotune ${autotuneEnabled ? 'stopped' : 'started'} successfully`);
      } else {
        setError(`Failed to ${autotuneEnabled ? 'stop' : 'start'} autotune`);
      }
    } catch (error) {
      console.error('Error toggling autotune:', error);
      setError('Error toggling autotune: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Save settings
      const result = await window.electron.invoke('python-command', 'save_autotune_settings', {
        check_interval: checkInterval,
        max_concurrent_streams: maxStreams,
        default_quality: defaultQuality,
        auto_start_on_boot: autoStartOnBoot
      });
      
      if (result.success) {
        setSuccess('Settings saved successfully');
      } else {
        setError('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Add new streamer
  const handleAddStreamer = async () => {
    if (!newStreamer.trim()) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const result = await window.electron.invoke('python-command', 'add_autotuned_streamer', {
        username: newStreamer,
        settings: {
          quality: defaultQuality,
          notifications: true,
          auto_start: true
        }
      });
      
      if (result.success) {
        // Add to list
        setAutotunedStreamers([
          ...autotunedStreamers,
          {
            username: newStreamer,
            quality: defaultQuality,
            notifications: true,
            auto_start: true
          }
        ]);
        
        setNewStreamer('');
        setSuccess(`Added ${newStreamer} to autotuned streamers`);
      } else {
        setError('Failed to add streamer');
      }
    } catch (error) {
      console.error('Error adding streamer:', error);
      setError('Error adding streamer: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Remove streamer
  const handleRemoveStreamer = async (username) => {
    try {
      setSaving(true);
      setError(null);
      
      const result = await window.electron.invoke('python-command', 'remove_autotuned_streamer', {
        username
      });
      
      if (result.success) {
        // Remove from list
        setAutotunedStreamers(autotunedStreamers.filter(s => s.username !== username));
        setSuccess(`Removed ${username} from autotuned streamers`);
      } else {
        setError('Failed to remove streamer');
      }
    } catch (error) {
      console.error('Error removing streamer:', error);
      setError('Error removing streamer: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Autotune" />
          <Tab label="Appearance" />
          <Tab label="Advanced" />
        </Tabs>
      </Box>
      
      {/* Autotune Settings */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Main settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Autotune Settings
                </Typography>
                
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autotuneEnabled}
                        onChange={handleToggleAutotune}
                        disabled={saving}
                      />
                    }
                    label={autotuneEnabled ? "Autotune Enabled" : "Autotune Disabled"}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoStartOnBoot}
                        onChange={(e) => setAutoStartOnBoot(e.target.checked)}
                        disabled={saving}
                      />
                    }
                    label="Start on application launch"
                  />
                </FormGroup>
                
                <Box sx={{ mt: 3 }}>
                  <TextField
                    label="Check Interval (seconds)"
                    type="number"
                    value={checkInterval}
                    onChange={(e) => setCheckInterval(Number(e.target.value))}
                    fullWidth
                    margin="normal"
                    disabled={saving}
                    InputProps={{ inputProps: { min: 30, max: 300 } }}
                  />
                  
                  <TextField
                    label="Maximum Concurrent Streams"
                    type="number"
                    value={maxStreams}
                    onChange={(e) => setMaxStreams(Number(e.target.value))}
                    fullWidth
                    margin="normal"
                    disabled={saving}
                    InputProps={{ inputProps: { min: 1, max: 10 } }}
                  />
                  
                  <FormControl fullWidth margin="normal" disabled={saving}>
                    <InputLabel>Default Quality</InputLabel>
                    <Select
                      value={defaultQuality}
                      onChange={(e) => setDefaultQuality(e.target.value)}
                      label="Default Quality"
                    >
                      {qualityOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveSettings}
                    disabled={saving}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Save Settings'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Autotuned streamers */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Autotuned Streamers
                </Typography>
                
                <Box sx={{ mb: 3, display: 'flex' }}>
                  <TextField
                    label="Add Streamer"
                    value={newStreamer}
                    onChange={(e) => setNewStreamer(e.target.value)}
                    placeholder="Enter Twitch username"
                    fullWidth
                    disabled={saving}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddStreamer}
                    disabled={!newStreamer.trim() || saving}
                    sx={{ ml: 1 }}
                  >
                    Add
                  </Button>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : autotunedStreamers.length > 0 ? (
                  <List>
                    {autotunedStreamers.map((streamer) => (
                      <ListItem key={streamer.username}>
                        <ListItemText
                          primary={streamer.username}
                          secondary={`Quality: ${streamer.quality || defaultQuality}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            aria-label="delete"
                            onClick={() => handleRemoveStreamer(streamer.username)}
                            disabled={saving}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No autotuned streamers added yet.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Appearance Settings */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Appearance Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Appearance settings will be available in a future update.
            </Typography>
          </CardContent>
        </Card>
      )}
      
      {/* Advanced Settings */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Advanced Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Advanced settings will be available in a future update.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SettingsPage; 