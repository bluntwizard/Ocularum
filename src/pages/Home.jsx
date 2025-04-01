import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Button,
  Skeleton,
  Divider,
  Chip
} from '@mui/material';
import { AutoAwesome as AutotuneIcon } from '@mui/icons-material';

// Selectors
import { selectUser } from '../store/slices/authSlice';

const HomePage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(true);
  const [liveChannels, setLiveChannels] = useState([]);
  const [autotunedChannels, setAutotunedChannels] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get autotuned streamers
        const autotunedResult = await window.electron.invoke('python-command', 'get_autotuned_streamers');
        if (autotunedResult.success) {
          setAutotunedChannels(Object.keys(autotunedResult.streamers).map(username => ({
            username,
            ...autotunedResult.streamers[username]
          })));
        }
        
        // Get live status
        const liveResult = await window.electron.invoke('python-command', 'check_live_status');
        if (liveResult.success) {
          setLiveChannels(liveResult.live_streamers);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Start a stream
  const handleStartStream = async (channel) => {
    try {
      const result = await window.electron.invoke('python-command', 'start_stream', {
        channel,
        quality: 'best'
      });
      
      if (result.success) {
        navigate('/streams');
      }
    } catch (error) {
      console.error('Error starting stream:', error);
    }
  };

  return (
    <Box>
      {/* Welcome message */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome{user ? `, ${user.display_name}` : ''}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your personalized Twitch streaming dashboard.
        </Typography>
      </Box>
      
      {/* Live channels section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Live Now
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/browse')}
          >
            Browse More
          </Button>
        </Box>
        
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
                <Card>
                  <Skeleton variant="rectangular" height={140} />
                  <CardContent>
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : liveChannels.length > 0 ? (
          <Grid container spacing={3}>
            {liveChannels.map((channel) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={channel}>
                <Card>
                  <CardActionArea onClick={() => handleStartStream(channel)}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={`https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel.toLowerCase()}-320x180.jpg`}
                      alt={channel}
                    />
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" noWrap>{channel}</Typography>
                        <Chip 
                          label="LIVE" 
                          size="small" 
                          color="error" 
                          sx={{ height: 24 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Click to watch
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              None of your followed channels are live right now.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/browse')}
              sx={{ mt: 2 }}
            >
              Browse Channels
            </Button>
          </Box>
        )}
      </Box>
      
      <Divider sx={{ my: 4 }} />
      
      {/* Autotuned channels section */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
            <AutotuneIcon sx={{ mr: 1 }} color="primary" />
            Autotuned Channels
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/settings')}
          >
            Manage
          </Button>
        </Box>
        
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2].map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : autotunedChannels.length > 0 ? (
          <Grid container spacing={3}>
            {autotunedChannels.map((channel) => (
              <Grid item xs={12} sm={6} md={4} key={channel.username}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">{channel.username}</Typography>
                      {liveChannels.includes(channel.username) && (
                        <Chip 
                          label="LIVE" 
                          size="small" 
                          color="error" 
                          sx={{ height: 24 }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Quality: {channel.quality || 'best'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              You haven't set up any autotuned channels yet.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/settings')}
              sx={{ mt: 2 }}
            >
              Set Up Autotune
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default HomePage; 