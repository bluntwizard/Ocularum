import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Stop as StopIcon } from '@mui/icons-material';

const StreamsPage = () => {
  const [loading, setLoading] = useState(true);
  const [streams, setStreams] = useState([]);
  const [error, setError] = useState(null);

  // Fetch active streams
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await window.electron.invoke('python-command', 'get_active_streams');
        
        if (result.success) {
          // Convert object to array of streams
          const streamArray = Object.entries(result.streams).map(([id, details]) => ({
            id,
            ...details
          }));
          
          setStreams(streamArray);
        } else {
          setError('Failed to load active streams');
        }
      } catch (error) {
        console.error('Error fetching streams:', error);
        setError('Error loading streams: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
    
    // Set up polling to refresh the data
    const interval = setInterval(fetchStreams, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Stop a stream
  const handleStopStream = async (streamId) => {
    try {
      const result = await window.electron.invoke('python-command', 'stop_stream', {
        stream_id: streamId
      });
      
      if (result.success) {
        // Update the streams list
        setStreams(streams.filter(stream => stream.id !== streamId));
      } else {
        setError('Failed to stop stream');
      }
    } catch (error) {
      console.error('Error stopping stream:', error);
      setError('Error stopping stream: ' + error.message);
    }
  };

  // Format runtime as hours:minutes:seconds
  const formatRuntime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Active Streams
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : streams.length > 0 ? (
        <Grid container spacing={3}>
          {streams.map((stream) => (
            <Grid item xs={12} sm={6} md={4} key={stream.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {stream.channel}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quality: {stream.quality}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Runtime: {formatRuntime(stream.runtime)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="error" 
                    startIcon={<StopIcon />}
                    onClick={() => handleStopStream(stream.id)}
                  >
                    Stop Stream
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No active streams. Start a stream from the Browse or Home page.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StreamsPage; 