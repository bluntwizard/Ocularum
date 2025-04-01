#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Autotune manager module for Ocularum.

This module manages the autotune functionality, which automatically
starts streams when followed streamers go live.
"""

import os
import json
import logging
import asyncio
import time
from typing import Dict, List, Optional, Any, Callable, Set

from ..twitch_integration.api_wrapper import TwitchIntegration
from ..streamlink.stream_handler import StreamHandler

# Configure logging
logger = logging.getLogger(__name__)


class AutotuneManager:
    """Manager for the autotune functionality."""

    def __init__(
        self,
        twitch_integration: TwitchIntegration,
        stream_handler: StreamHandler,
        settings_path: str = None,
        notification_callback: Callable[[str, Dict[str, Any]], None] = None
    ):
        """
        Initialize the autotune manager.

        Args:
            twitch_integration: Instance of TwitchIntegration
            stream_handler: Instance of StreamHandler
            settings_path: Path to settings file
            notification_callback: Callback for notifications
        """
        self.twitch = twitch_integration
        self.stream_handler = stream_handler
        self.settings_path = settings_path or os.path.join(
            os.path.expanduser("~"),
            ".ocularum",
            "autotune_settings.json"
        )
        self.notification_callback = notification_callback
        
        # Make sure the settings directory exists
        os.makedirs(os.path.dirname(self.settings_path), exist_ok=True)
        
        self.settings = self._load_settings()
        self.autotuned_streamers = self.settings.get("autotuned_streamers", {})
        
        self.check_interval = self.settings.get("check_interval", 60)  # seconds
        self.max_concurrent_streams = self.settings.get("max_concurrent_streams", 4)
        self.default_quality = self.settings.get("default_quality", "best")
        
        self._running = False
        self._check_task = None
        self._last_check_time = 0
        self._currently_live = set()  # Track currently live autotuned streamers

    def _load_settings(self) -> Dict[str, Any]:
        """
        Load settings from file.

        Returns:
            Dictionary of settings
        """
        if not os.path.exists(self.settings_path):
            # Create default settings
            default_settings = {
                "autotuned_streamers": {},
                "check_interval": 60,
                "max_concurrent_streams": 4,
                "default_quality": "best",
                "auto_start_on_boot": True,
                "notification_settings": {
                    "enabled": True,
                    "sound": True,
                    "popup": True
                }
            }
            self._save_settings(default_settings)
            return default_settings
            
        try:
            with open(self.settings_path, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Failed to load settings: {e}")
            # Return default settings if there's an error
            return {
                "autotuned_streamers": {},
                "check_interval": 60,
                "max_concurrent_streams": 4,
                "default_quality": "best",
                "auto_start_on_boot": True,
                "notification_settings": {
                    "enabled": True,
                    "sound": True,
                    "popup": True
                }
            }

    def _save_settings(self, settings: Dict[str, Any] = None) -> bool:
        """
        Save settings to file.

        Args:
            settings: Settings to save, or use internal settings if None

        Returns:
            True if successful, False otherwise
        """
        if settings is None:
            settings = {
                "autotuned_streamers": self.autotuned_streamers,
                "check_interval": self.check_interval,
                "max_concurrent_streams": self.max_concurrent_streams,
                "default_quality": self.default_quality,
                "auto_start_on_boot": self.settings.get("auto_start_on_boot", True),
                "notification_settings": self.settings.get("notification_settings", {
                    "enabled": True,
                    "sound": True,
                    "popup": True
                })
            }
            
        try:
            with open(self.settings_path, 'w') as f:
                json.dump(settings, f, indent=2)
            return True
        except IOError as e:
            logger.error(f"Failed to save settings: {e}")
            return False

    def add_autotuned_streamer(self, username: str, settings: Dict[str, Any] = None) -> bool:
        """
        Add a streamer to the autotune list.

        Args:
            username: Twitch username
            settings: Streamer-specific settings

        Returns:
            True if successful, False otherwise
        """
        username = username.lower()  # Normalize username
        
        if settings is None:
            settings = {
                "quality": self.default_quality,
                "notifications": True,
                "auto_start": True
            }
            
        self.autotuned_streamers[username] = settings
        return self._save_settings()

    def remove_autotuned_streamer(self, username: str) -> bool:
        """
        Remove a streamer from the autotune list.

        Args:
            username: Twitch username

        Returns:
            True if successful, False otherwise
        """
        username = username.lower()  # Normalize username
        
        if username in self.autotuned_streamers:
            del self.autotuned_streamers[username]
            return self._save_settings()
        return False

    def update_streamer_settings(self, username: str, settings: Dict[str, Any]) -> bool:
        """
        Update settings for an autotuned streamer.

        Args:
            username: Twitch username
            settings: New settings

        Returns:
            True if successful, False otherwise
        """
        username = username.lower()  # Normalize username
        
        if username in self.autotuned_streamers:
            # Update settings while preserving any existing ones not provided
            self.autotuned_streamers[username].update(settings)
            return self._save_settings()
        return False

    def get_autotuned_streamers(self) -> Dict[str, Dict[str, Any]]:
        """
        Get list of autotuned streamers.

        Returns:
            Dictionary of autotuned streamers and their settings
        """
        return self.autotuned_streamers.copy()

    async def check_live_status(self) -> Set[str]:
        """
        Check if any autotuned streamers are live.

        Returns:
            Set of usernames that are currently live
        """
        if not self.autotuned_streamers:
            return set()
            
        if not self.twitch:
            logger.error("Twitch API not initialized")
            return set()
            
        try:
            # Get user IDs for all autotuned streamers
            user_ids = []
            for username in self.autotuned_streamers.keys():
                user_info = await self.twitch.get_user_info(username=username)
                if user_info:
                    user_ids.append(user_info["id"])
            
            # Get live streams for these users
            live_streams = await self.twitch.get_live_streams(user_ids)
            
            # Extract usernames of live streamers
            live_usernames = set()
            for stream in live_streams:
                if "user_login" in stream:
                    live_usernames.add(stream["user_login"].lower())  # Normalize username
            
            return live_usernames
            
        except Exception as e:
            logger.error(f"Error checking live status: {e}")
            return set()

    async def start_autotuned_streams(self, live_streamers: Set[str]) -> List[str]:
        """
        Start streams for live autotuned streamers.

        Args:
            live_streamers: Set of usernames that are currently live

        Returns:
            List of stream IDs that were started
        """
        if not live_streamers:
            return []
            
        # Check which ones are newly live (not in _currently_live)
        newly_live = live_streamers - self._currently_live
        
        # Update currently live set
        self._currently_live = live_streamers
        
        # Get currently active streams
        active_streams = self.stream_handler.get_active_streams()
        active_channels = {details["channel"].lower() for _, details in active_streams.items()}
        
        # Determine which streams to start
        streams_to_start = []
        for username in newly_live:
            # Skip if already streaming
            if username.lower() in active_channels:
                continue
                
            # Check if auto-start is enabled for this streamer
            streamer_settings = self.autotuned_streamers.get(username.lower(), {})
            if streamer_settings.get("auto_start", True):
                streams_to_start.append(username)
                
                # Send notification if enabled
                if streamer_settings.get("notifications", True) and self.notification_callback:
                    self.notification_callback("streamer_live", {
                        "username": username,
                        "auto_start": True
                    })
        
        # Limit the number of concurrent streams
        if len(active_streams) + len(streams_to_start) > self.max_concurrent_streams:
            streams_to_start = streams_to_start[:self.max_concurrent_streams - len(active_streams)]
            
        # Start the streams
        started_stream_ids = []
        for username in streams_to_start:
            quality = self.autotuned_streamers[username].get("quality", self.default_quality)
            success, stream_id = await self.stream_handler.start_stream(
                username, 
                quality=quality
            )
            
            if success:
                started_stream_ids.append(stream_id)
                logger.info(f"Autostarted stream for {username}")
            else:
                logger.error(f"Failed to autostart stream for {username}: {stream_id}")
                
        return started_stream_ids

    async def check_and_start_streams(self) -> List[str]:
        """
        Check for live autotuned streamers and start their streams.

        Returns:
            List of stream IDs that were started
        """
        # Record the check time
        self._last_check_time = time.time()
        
        # Check which streamers are live
        live_streamers = await self.check_live_status()
        
        # Start streams for newly live streamers
        return await self.start_autotuned_streams(live_streamers)

    async def _check_loop(self):
        """Background task that periodically checks for live streamers."""
        while self._running:
            try:
                await self.check_and_start_streams()
            except Exception as e:
                logger.error(f"Error in check loop: {e}")
                
            # Wait for the next check interval
            await asyncio.sleep(self.check_interval)

    def start(self):
        """Start the autotune manager."""
        if self._running:
            return
            
        self._running = True
        self._check_task = asyncio.create_task(self._check_loop())
        logger.info("Autotune manager started")

    def stop(self):
        """Stop the autotune manager."""
        if not self._running:
            return
            
        self._running = False
        if self._check_task:
            self._check_task.cancel()
            self._check_task = None
        logger.info("Autotune manager stopped")

    def is_running(self) -> bool:
        """
        Check if the autotune manager is running.

        Returns:
            True if running, False otherwise
        """
        return self._running

    def get_last_check_time(self) -> float:
        """
        Get the timestamp of the last check.

        Returns:
            Unix timestamp of the last check
        """
        return self._last_check_time

    def get_currently_live(self) -> Set[str]:
        """
        Get the set of currently live autotuned streamers.

        Returns:
            Set of usernames that are currently live
        """
        return self._currently_live.copy()


# Example usage
if __name__ == "__main__":
    async def main():
        # Set up logging
        logging.basicConfig(level=logging.INFO)
        
        # Create dependencies
        twitch = TwitchIntegration()
        await twitch.initialize()
        
        stream_handler = StreamHandler()
        
        # Create autotune manager
        def notification_handler(event_type, data):
            print(f"Notification: {event_type} - {data}")
            
        manager = AutotuneManager(twitch, stream_handler, notification_callback=notification_handler)
        
        # Add some streamers to autotune
        manager.add_autotuned_streamer("ninja")
        manager.add_autotuned_streamer("shroud")
        
        # Start the manager
        manager.start()
        
        # Wait for a while
        print("Waiting for live streamers...")
        await asyncio.sleep(120)
        
        # Stop the manager
        manager.stop()
        
        # Clean up
        await twitch.close()
        await stream_handler.close()
    
    asyncio.run(main()) 