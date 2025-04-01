import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Chip,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Stop as StopIcon,
  Visibility as ViewsIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

const StreamCard = ({ 
  stream, 
  onStop, 
  loading = false,
  showControls = true 
}) => {
  const { 
    id, 
    title, 
    user_name, 
    viewer_count, 
    thumbnail_url,
    started_at,
    game_name,
    quality,
    runtime
  } = stream;

  // Format viewer count
  const formatViewers = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count;
  };

  // Format runtime
  const formatRuntime = (seconds) => {
    if (!seconds) return '00:00:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // Calculate stream duration
  const calculateDuration = () => {
    if (!started_at) return null;
    
    const startDate = new Date(started_at);
    const now = new Date();
    const durationMs = now - startDate;
    return Math.floor(durationMs / 1000);
  };

  // Get stream preview image or placeholder
  const getStreamImage = () => {
    if (thumbnail_url) {
      return thumbnail_url.replace('{width}', '320').replace('{height}', '180');
    }
    return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${user_name.toLowerCase()}-320x180.jpg`;
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
      
      <CardMedia
        component="img"
        height={140}
        image={getStreamImage()}
        alt={title || `${user_name}'s stream`}
      />
      
      <CardContent sx={{ flexGrow: 1, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" noWrap sx={{ maxWidth: 'calc(100% - 40px)' }}>
            {user_name}
          </Typography>
          
          {quality && (
            <Chip 
              label={quality} 
              size="small" 
              color="primary" 
              sx={{ height: 20, fontSize: '0.7rem' }} 
            />
          )}
        </Box>
        
        {title && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {title.length > 60 ? `${title.substring(0, 57)}...` : title}
          </Typography>
        )}
        
        {game_name && (
          <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
            Playing: {game_name}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {viewer_count && (
            <Tooltip title="Viewers">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ViewsIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {formatViewers(viewer_count)}
                </Typography>
              </Box>
            </Tooltip>
          )}
          
          <Tooltip title="Stream duration">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TimerIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatRuntime(runtime || calculateDuration())}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </CardContent>
      
      {showControls && (
        <Box sx={{ 
          borderTop: 1, 
          borderColor: 'divider', 
          p: 1, 
          display: 'flex', 
          justifyContent: 'flex-end' 
        }}>
          <Tooltip title="Stop Stream">
            <IconButton 
              color="error" 
              size="small" 
              disabled={loading}
              onClick={() => onStop && onStop(id)}
            >
              <StopIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Card>
  );
};

export default StreamCard; 