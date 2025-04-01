import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  InputAdornment,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';

const BrowsePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [liveChannels, setLiveChannels] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Fetch followed channels
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First get user info to get ID
        const userResult = await window.electron.invoke('python-command', 'get_user_info', {
          username: localStorage.getItem('twitch_username')
        });
        
        if (!userResult.success || !userResult.user) {
          setError('Failed to load user information');
          return;
        }
        
        // Get followed channels
        const followsResult = await window.electron.invoke('python-command', 'get_followed_channels', {
          user_id: userResult.user.id
        });
        
        if (followsResult.success) {
          setChannels(followsResult.channels || []);
          
          // Get live status for these channels
          const userIds = followsResult.channels.map(channel => channel.broadcaster_id);
          const liveResult = await window.electron.invoke('python-command', 'get_live_streams', {
            user_ids: userIds
          });
          
          if (liveResult.success) {
            setLiveChannels(liveResult.streams.map(stream => stream.user_login));
          }
        } else {
          setError('Failed to load followed channels');
        }
      } catch (error) {
        console.error('Error fetching channels:', error);
        setError('Error loading channels: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Start a stream
  const handleStartStream = async (channel) => {
    try {
      const result = await window.electron.invoke('python-command', 'start_stream', {
        channel,
        quality: 'best'
      });
      
      if (result.success) {
        navigate('/streams');
      } else {
        setError('Failed to start stream');
      }
    } catch (error) {
      console.error('Error starting stream:', error);
      setError('Error starting stream: ' + error.message);
    }
  };

  // Add a channel to autotune
  const handleAddAutotune = async (channel) => {
    try {
      const result = await window.electron.invoke('python-command', 'add_autotuned_streamer', {
        username: channel,
        settings: {
          quality: 'best',
          notifications: true,
          auto_start: true
        }
      });
      
      if (result.success) {
        // Show success message
        alert(`Added ${channel} to autotuned channels`);
      } else {
        setError('Failed to add channel to autotune');
      }
    } catch (error) {
      console.error('Error adding autotune:', error);
      setError('Error adding autotune: ' + error.message);
    }
  };

  // Filter channels based on search query and tab
  const filteredChannels = channels
    .filter(channel => {
      const broadcaster_name = channel.broadcaster_name || channel.broadcaster_login || '';
      return broadcaster_name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .filter(channel => {
      if (tabValue === 0) return true; // All channels
      if (tabValue === 1) return liveChannels.includes(channel.broadcaster_login); // Live channels
      return true;
    });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Browse Channels
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Search and filter */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search channels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Channels" />
          <Tab label="Live Now" />
        </Tabs>
      </Box>
      
      {/* Channel list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredChannels.length > 0 ? (
        <Grid container spacing={3}>
          {filteredChannels.map((channel) => {
            const isLive = liveChannels.includes(channel.broadcaster_login);
            const channelName = channel.broadcaster_name || channel.broadcaster_login;
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={channel.broadcaster_id}>
                <Card>
                  <CardActionArea onClick={() => handleStartStream(channel.broadcaster_login)}>
                    {isLive ? (
                      <CardMedia
                        component="img"
                        height="140"
                        image={`https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel.broadcaster_login.toLowerCase()}-320x180.jpg`}
                        alt={channelName}
                      />
                    ) : (
                      <Box 
                        sx={{ 
                          height: 140, 
                          backgroundColor: 'rgba(0, 0, 0, 0.2)', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Offline
                        </Typography>
                      </Box>
                    )}
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" noWrap>{channelName}</Typography>
                        {isLive && (
                          <Chip 
                            label="LIVE" 
                            size="small" 
                            color="error" 
                            sx={{ height: 24 }}
                          />
                        )}
                      </Box>
                      {isLive ? (
                        <Typography variant="body2" color="text.secondary">
                          Click to watch
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Currently offline
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddAutotune(channel.broadcaster_login);
                      }}
                      title="Add to autotune"
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {searchQuery 
              ? 'No channels match your search.' 
              : 'No followed channels found. Follow channels on Twitch to see them here.'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BrowsePage; 