#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Twitch API integration for Ocularum using pyTwitchAPI.

This module provides a wrapper around pyTwitchAPI for retrieving
stream information, following channels, and other Twitch-related functionality.
"""

import os
import logging
import asyncio
from typing import Dict, List, Optional, Any, Union

from twitchAPI.twitch import Twitch
from twitchAPI.oauth import UserAuthenticator
from twitchAPI.helper import first
from twitchAPI.type import AuthScope
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


class TwitchIntegration:
    """Wrapper for pyTwitchAPI providing functionality for Ocularum."""

    def __init__(self, client_id: str = None, client_secret: str = None):
        """
        Initialize the Twitch API integration.

        Args:
            client_id: Twitch application client ID
            client_secret: Twitch application client secret
        """
        self.client_id = client_id or os.getenv("TWITCH_CLIENT_ID")
        self.client_secret = client_secret or os.getenv("TWITCH_CLIENT_SECRET")
        self.twitch = None
        self.user_auth_token = None
        self.refresh_token = None
        
        if not self.client_id or not self.client_secret:
            logger.warning("Twitch client ID or client secret not provided or found in environment variables")

    async def initialize(self) -> bool:
        """
        Initialize the Twitch API client.
        
        Returns:
            bool: True if initialization was successful, False otherwise
        """
        try:
            self.twitch = await Twitch(self.client_id, self.client_secret)
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Twitch API: {e}")
            return False

    async def authenticate_user(self, scopes: List[AuthScope] = None) -> bool:
        """
        Authenticate with Twitch using user authorization.
        
        Args:
            scopes: List of authorization scopes to request
            
        Returns:
            bool: True if authentication was successful, False otherwise
        """
        if not self.twitch:
            logger.error("Twitch API client not initialized")
            return False
            
        if scopes is None:
            scopes = [
                AuthScope.USER_READ_EMAIL,
                AuthScope.USER_READ_FOLLOWS
            ]
            
        try:
            auth = UserAuthenticator(self.twitch, scopes, force_verify=False)
            self.user_auth_token, self.refresh_token = await auth.authenticate()
            await self.twitch.set_user_authentication(self.user_auth_token, scopes, self.refresh_token)
            return True
        except Exception as e:
            logger.error(f"Failed to authenticate user: {e}")
            return False

    async def get_user_info(self, username: str = None, user_id: str = None) -> Optional[Dict[str, Any]]:
        """
        Get information about a Twitch user.

        Args:
            username: Twitch username
            user_id: Twitch user ID

        Returns:
            Dict containing user information or None if not found
        """
        if not self.twitch:
            logger.error("Twitch API client not initialized")
            return None
            
        if not username and not user_id:
            logger.error("Either username or user_id must be provided")
            return None
            
        try:
            if username:
                user = await first(self.twitch.get_users(logins=[username]))
            else:
                user = await first(self.twitch.get_users(user_ids=[user_id]))
                
            if user:
                return user.__dict__
            return None
        except Exception as e:
            logger.error(f"Failed to get user info: {e}")
            return None
            
    async def get_live_streams(self, user_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Get information about live streams for the specified user IDs.

        Args:
            user_ids: List of Twitch user IDs to check

        Returns:
            List of dictionaries containing stream information
        """
        if not self.twitch:
            logger.error("Twitch API client not initialized")
            return []
            
        if not user_ids:
            return []
            
        try:
            streams = []
            async for stream in self.twitch.get_streams(user_ids=user_ids):
                streams.append(stream.__dict__)
            return streams
        except Exception as e:
            logger.error(f"Failed to get live streams: {e}")
            return []

    async def get_followed_channels(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get channels followed by the specified user.

        Args:
            user_id: Twitch user ID

        Returns:
            List of dictionaries containing followed channel information
        """
        if not self.twitch:
            logger.error("Twitch API client not initialized")
            return []
            
        if not user_id:
            logger.error("User ID must be provided")
            return []
            
        try:
            follows = []
            async for follow in self.twitch.get_followed_channels(user_id=user_id):
                follows.append(follow.__dict__)
            return follows
        except Exception as e:
            logger.error(f"Failed to get followed channels: {e}")
            return []

    async def get_stream_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """
        Get stream information for a specific username.

        Args:
            username: Twitch username

        Returns:
            Dict containing stream information or None if not live/found
        """
        if not self.twitch:
            logger.error("Twitch API client not initialized")
            return None
            
        try:
            stream = await first(self.twitch.get_streams(user_logins=[username]))
            if stream:
                return stream.__dict__
            return None
        except Exception as e:
            logger.error(f"Failed to get stream by username: {e}")
            return None

    async def close(self):
        """Close the Twitch API client session."""
        if self.twitch:
            await self.twitch.close()


# Example usage
if __name__ == "__main__":
    async def main():
        twitch_integration = TwitchIntegration()
        if await twitch_integration.initialize():
            # Example: Get user info
            user_info = await twitch_integration.get_user_info(username="ninja")
            if user_info:
                print(f"Found user: {user_info['display_name']}")
                
                # Example: Check if user is live
                stream_info = await twitch_integration.get_stream_by_username("ninja")
                if stream_info:
                    print(f"{user_info['display_name']} is live playing {stream_info['game_name']}!")
                else:
                    print(f"{user_info['display_name']} is not live.")
            else:
                print("User not found.")
            
            await twitch_integration.close()
    
    asyncio.run(main()) 