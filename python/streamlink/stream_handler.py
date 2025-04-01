#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Stream handler module for Ocularum.

This module provides functionality to interact with streamlink
for playing Twitch streams.
"""

import os
import logging
import json
import subprocess
import tempfile
import signal
import asyncio
import platform
from typing import Dict, List, Optional, Any, Tuple

# Configure logging
logger = logging.getLogger(__name__)


class StreamHandler:
    """Handler for stream playback using streamlink."""

    def __init__(self, streamlink_path: str = None):
        """
        Initialize the stream handler.

        Args:
            streamlink_path: Path to streamlink executable (optional)
        """
        self.streamlink_path = streamlink_path or self._find_streamlink()
        self.active_streams = {}  # Dictionary to track active stream processes

    def _find_streamlink(self) -> str:
        """
        Find the streamlink executable.

        Returns:
            Path to streamlink executable
        """
        # First check if streamlink is in PATH
        try:
            if platform.system() == "Windows":
                result = subprocess.run(["where", "streamlink"], capture_output=True, text=True)
                if result.returncode == 0:
                    return result.stdout.strip().split("\n")[0]
            else:
                result = subprocess.run(["which", "streamlink"], capture_output=True, text=True)
                if result.returncode == 0:
                    return result.stdout.strip()
        except Exception as e:
            logger.warning(f"Failed to find streamlink in PATH: {e}")

        # Check common installation paths
        common_paths = []
        
        if platform.system() == "Windows":
            common_paths.extend([
                os.path.join(os.environ.get("APPDATA", ""), "streamlink", "bin", "streamlink.exe"),
                os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "streamlink", "bin", "streamlink.exe"),
                "C:\\Program Files\\Streamlink\\bin\\streamlink.exe",
                "C:\\Program Files (x86)\\Streamlink\\bin\\streamlink.exe"
            ])
        elif platform.system() == "Darwin":  # macOS
            common_paths.extend([
                "/usr/local/bin/streamlink",
                "/opt/homebrew/bin/streamlink"
            ])
        else:  # Linux/Unix
            common_paths.extend([
                "/usr/bin/streamlink",
                "/usr/local/bin/streamlink",
                "/opt/streamlink/bin/streamlink"
            ])

        for path in common_paths:
            if os.path.isfile(path):
                return path

        logger.warning("Streamlink executable not found. Using 'streamlink' and relying on PATH")
        return "streamlink"  # Fall back to relying on PATH

    def get_available_qualities(self, channel: str) -> List[str]:
        """
        Get available stream qualities for a Twitch channel.

        Args:
            channel: Twitch channel name

        Returns:
            List of available quality options
        """
        url = f"https://twitch.tv/{channel}"
        
        try:
            cmd = [
                self.streamlink_path,
                "--json",
                url,
                "--twitch-disable-ads"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0 and result.stdout:
                try:
                    data = json.loads(result.stdout)
                    return list(data.get("streams", {}).keys())
                except json.JSONDecodeError:
                    logger.error("Failed to parse streamlink JSON output")
            
            logger.error(f"Streamlink error: {result.stderr}")
            return []
            
        except Exception as e:
            logger.error(f"Error getting stream qualities: {e}")
            return []

    async def start_stream(self, channel: str, quality: str = "best", output_params: Dict[str, Any] = None) -> Tuple[bool, str]:
        """
        Start a Twitch stream using streamlink.

        Args:
            channel: Twitch channel name
            quality: Stream quality (e.g., "best", "720p", "480p")
            output_params: Additional output parameters

        Returns:
            Tuple of (success, stream_id or error message)
        """
        if not channel:
            return False, "Channel name is required"

        url = f"https://twitch.tv/{channel}"
        stream_id = f"{channel}_{quality}_{os.urandom(4).hex()}"
        
        # Default output parameters for different platforms
        if output_params is None:
            output_params = {}
        
        # Create a command for launching streamlink
        cmd = [
            self.streamlink_path,
            url,
            quality,
            "--twitch-disable-ads"
        ]
        
        # Add platform-specific output parameters
        # In a real implementation, this would handle different output methods
        # like passing to a player, creating a pipe, etc.
        if "player" in output_params:
            cmd.extend(["--player", output_params["player"]])
            
            # Add any player args
            if "player_args" in output_params:
                cmd.extend(["--player-args", output_params["player_args"]])
        
        try:
            # Launch the streamlink process
            logger.info(f"Starting stream: {' '.join(cmd)}")
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Store the process
            self.active_streams[stream_id] = {
                "process": process,
                "channel": channel,
                "quality": quality,
                "start_time": asyncio.get_event_loop().time()
            }
            
            # Start a task to monitor the process
            asyncio.create_task(self._monitor_stream(stream_id))
            
            return True, stream_id
            
        except Exception as e:
            logger.error(f"Failed to start stream: {e}")
            return False, str(e)

    async def _monitor_stream(self, stream_id: str):
        """
        Monitor a running stream process.

        Args:
            stream_id: ID of the stream to monitor
        """
        if stream_id not in self.active_streams:
            return
            
        process = self.active_streams[stream_id]["process"]
        
        # Wait for the process to complete
        stdout, stderr = await process.communicate()
        
        # Log output for debugging
        if stdout:
            logger.debug(f"Stream {stream_id} stdout: {stdout.decode()}")
        if stderr:
            logger.warning(f"Stream {stream_id} stderr: {stderr.decode()}")
            
        # Clean up
        if stream_id in self.active_streams:
            logger.info(f"Stream {stream_id} ended with return code {process.returncode}")
            del self.active_streams[stream_id]

    async def stop_stream(self, stream_id: str) -> bool:
        """
        Stop a running stream.

        Args:
            stream_id: ID of the stream to stop

        Returns:
            True if stream was stopped, False otherwise
        """
        if stream_id not in self.active_streams:
            logger.warning(f"Stream {stream_id} not found")
            return False
            
        process = self.active_streams[stream_id]["process"]
        
        try:
            # Try to terminate the process gracefully
            process.terminate()
            
            # Wait for the process to terminate (with timeout)
            try:
                await asyncio.wait_for(process.wait(), timeout=5.0)
            except asyncio.TimeoutError:
                # If it doesn't terminate in time, kill it
                logger.warning(f"Stream {stream_id} did not terminate gracefully, killing it")
                process.kill()
                
            # Clean up
            if stream_id in self.active_streams:
                del self.active_streams[stream_id]
                
            return True
            
        except Exception as e:
            logger.error(f"Error stopping stream {stream_id}: {e}")
            return False

    def get_active_streams(self) -> Dict[str, Dict[str, Any]]:
        """
        Get information about all active streams.

        Returns:
            Dictionary of active streams with their details
        """
        # Return a copy of the active streams dictionary without the process objects
        result = {}
        for stream_id, details in self.active_streams.items():
            result[stream_id] = {
                "channel": details["channel"],
                "quality": details["quality"],
                "start_time": details["start_time"],
                "runtime": asyncio.get_event_loop().time() - details["start_time"]
            }
        return result

    async def close(self):
        """Stop all active streams and clean up resources."""
        stream_ids = list(self.active_streams.keys())
        for stream_id in stream_ids:
            await self.stop_stream(stream_id)


# Example usage
if __name__ == "__main__":
    async def main():
        # Set up logging
        logging.basicConfig(level=logging.INFO)
        
        # Create stream handler
        handler = StreamHandler()
        
        # Example channel to watch
        channel = "ninja"  # Replace with a channel that is live
        
        # Get available qualities
        qualities = handler.get_available_qualities(channel)
        print(f"Available qualities for {channel}: {qualities}")
        
        if qualities:
            # Start the stream with VLC player (if installed)
            success, stream_id = await handler.start_stream(
                channel, 
                quality=qualities[0] if qualities else "best",
                output_params={
                    "player": "vlc",
                    "player_args": "--fullscreen"
                }
            )
            
            if success:
                print(f"Stream started with ID: {stream_id}")
                
                # Wait a bit
                await asyncio.sleep(30)
                
                # Stop the stream
                await handler.stop_stream(stream_id)
                print("Stream stopped")
            else:
                print(f"Failed to start stream: {stream_id}")
        
        # Clean up
        await handler.close()
    
    asyncio.run(main()) 