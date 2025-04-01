#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Main script for Ocularum Python backend.

This script provides a simple API for the Electron app to interact with
the Twitch API, streamlink, and autotune functionality.
"""

import os
import json
import logging
import asyncio
import argparse
import sys
import signal
from typing import Dict, List, Optional, Any
import threading

from twitch_integration.api_wrapper import TwitchIntegration
from streamlink.stream_handler import StreamHandler
from autotune.manager import AutotuneManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.expanduser("~"), ".ocularum", "ocularum.log"))
    ]
)
logger = logging.getLogger(__name__)


class OcularumBackend:
    """Main backend class for Ocularum."""

    def __init__(self):
        """Initialize the Ocularum backend."""
        self.twitch = None
        self.stream_handler = None
        self.autotune_manager = None
        self.running = False
        self._loop = None
        self._input_thread = None
        self._notification_queue = asyncio.Queue()

    async def initialize(self, client_id: str = None, client_secret: str = None) -> bool:
        """
        Initialize the backend components.

        Args:
            client_id: Twitch client ID
            client_secret: Twitch client secret

        Returns:
            True if initialization was successful, False otherwise
        """
        try:
            # Initialize Twitch API
            self.twitch = TwitchIntegration(client_id, client_secret)
            if not await self.twitch.initialize():
                logger.error("Failed to initialize Twitch API")
                return False

            # Initialize stream handler
            self.stream_handler = StreamHandler()

            # Initialize autotune manager
            self.autotune_manager = AutotuneManager(
                self.twitch,
                self.stream_handler,
                notification_callback=self._handle_notification
            )

            return True
        except Exception as e:
            logger.error(f"Initialization error: {e}")
            return False

    async def authenticate_user(self, scopes: List[str] = None) -> Dict[str, Any]:
        """
        Authenticate with Twitch.

        Args:
            scopes: List of scopes to request

        Returns:
            Dict with 'success' and authentication details
        """
        if not self.twitch:
            return {"success": False, "error": "Twitch API not initialized"}

        try:
            result = await self.twitch.authenticate_user(scopes)
            return {
                "success": result,
                "token": self.twitch.user_auth_token if result else None,
                "refresh_token": self.twitch.refresh_token if result else None
            }
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return {"success": False, "error": str(e)}

    async def get_user_info(self, username: str = None, user_id: str = None) -> Dict[str, Any]:
        """
        Get information about a Twitch user.

        Args:
            username: Twitch username
            user_id: Twitch user ID

        Returns:
            Dict with user information or error
        """
        if not self.twitch:
            return {"success": False, "error": "Twitch API not initialized"}

        try:
            user_info = await self.twitch.get_user_info(username, user_id)
            return {"success": bool(user_info), "user": user_info}
        except Exception as e:
            logger.error(f"Error getting user info: {e}")
            return {"success": False, "error": str(e)}

    async def get_followed_channels(self, user_id: str) -> Dict[str, Any]:
        """
        Get channels followed by the specified user.

        Args:
            user_id: Twitch user ID

        Returns:
            Dict with followed channels or error
        """
        if not self.twitch:
            return {"success": False, "error": "Twitch API not initialized"}

        try:
            channels = await self.twitch.get_followed_channels(user_id)
            return {"success": True, "channels": channels}
        except Exception as e:
            logger.error(f"Error getting followed channels: {e}")
            return {"success": False, "error": str(e)}

    async def get_live_streams(self, user_ids: List[str]) -> Dict[str, Any]:
        """
        Get information about live streams for the specified user IDs.

        Args:
            user_ids: List of Twitch user IDs to check

        Returns:
            Dict with live streams information or error
        """
        if not self.twitch:
            return {"success": False, "error": "Twitch API not initialized"}

        try:
            streams = await self.twitch.get_live_streams(user_ids)
            return {"success": True, "streams": streams}
        except Exception as e:
            logger.error(f"Error getting live streams: {e}")
            return {"success": False, "error": str(e)}

    async def start_stream(self, channel: str, quality: str = "best", player: str = None) -> Dict[str, Any]:
        """
        Start a Twitch stream.

        Args:
            channel: Twitch channel name
            quality: Stream quality
            player: External player to use (optional)

        Returns:
            Dict with result information
        """
        if not self.stream_handler:
            return {"success": False, "error": "Stream handler not initialized"}

        try:
            output_params = {}
            if player:
                output_params["player"] = player

            success, stream_id = await self.stream_handler.start_stream(channel, quality, output_params)
            return {
                "success": success,
                "stream_id": stream_id if success else None,
                "error": None if success else stream_id
            }
        except Exception as e:
            logger.error(f"Error starting stream: {e}")
            return {"success": False, "error": str(e)}

    async def stop_stream(self, stream_id: str) -> Dict[str, Any]:
        """
        Stop a running stream.

        Args:
            stream_id: ID of the stream to stop

        Returns:
            Dict with result information
        """
        if not self.stream_handler:
            return {"success": False, "error": "Stream handler not initialized"}

        try:
            result = await self.stream_handler.stop_stream(stream_id)
            return {"success": result}
        except Exception as e:
            logger.error(f"Error stopping stream: {e}")
            return {"success": False, "error": str(e)}

    async def get_stream_qualities(self, channel: str) -> Dict[str, Any]:
        """
        Get available stream qualities for a Twitch channel.

        Args:
            channel: Twitch channel name

        Returns:
            Dict with available qualities
        """
        if not self.stream_handler:
            return {"success": False, "error": "Stream handler not initialized"}

        try:
            qualities = self.stream_handler.get_available_qualities(channel)
            return {"success": True, "qualities": qualities}
        except Exception as e:
            logger.error(f"Error getting stream qualities: {e}")
            return {"success": False, "error": str(e)}

    async def get_active_streams(self) -> Dict[str, Any]:
        """
        Get information about active streams.

        Returns:
            Dict with active streams information
        """
        if not self.stream_handler:
            return {"success": False, "error": "Stream handler not initialized"}

        try:
            streams = self.stream_handler.get_active_streams()
            return {"success": True, "streams": streams}
        except Exception as e:
            logger.error(f"Error getting active streams: {e}")
            return {"success": False, "error": str(e)}

    # Autotune methods

    async def start_autotune(self) -> Dict[str, Any]:
        """
        Start the autotune manager.

        Returns:
            Dict with result information
        """
        if not self.autotune_manager:
            return {"success": False, "error": "Autotune manager not initialized"}

        try:
            self.autotune_manager.start()
            return {"success": True}
        except Exception as e:
            logger.error(f"Error starting autotune: {e}")
            return {"success": False, "error": str(e)}

    async def stop_autotune(self) -> Dict[str, Any]:
        """
        Stop the autotune manager.

        Returns:
            Dict with result information
        """
        if not self.autotune_manager:
            return {"success": False, "error": "Autotune manager not initialized"}

        try:
            self.autotune_manager.stop()
            return {"success": True}
        except Exception as e:
            logger.error(f"Error stopping autotune: {e}")
            return {"success": False, "error": str(e)}

    async def add_autotuned_streamer(self, username: str, settings: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Add a streamer to the autotune list.

        Args:
            username: Twitch username
            settings: Streamer-specific settings

        Returns:
            Dict with result information
        """
        if not self.autotune_manager:
            return {"success": False, "error": "Autotune manager not initialized"}

        try:
            result = self.autotune_manager.add_autotuned_streamer(username, settings)
            return {"success": result}
        except Exception as e:
            logger.error(f"Error adding autotuned streamer: {e}")
            return {"success": False, "error": str(e)}

    async def remove_autotuned_streamer(self, username: str) -> Dict[str, Any]:
        """
        Remove a streamer from the autotune list.

        Args:
            username: Twitch username

        Returns:
            Dict with result information
        """
        if not self.autotune_manager:
            return {"success": False, "error": "Autotune manager not initialized"}

        try:
            result = self.autotune_manager.remove_autotuned_streamer(username)
            return {"success": result}
        except Exception as e:
            logger.error(f"Error removing autotuned streamer: {e}")
            return {"success": False, "error": str(e)}

    async def get_autotuned_streamers(self) -> Dict[str, Any]:
        """
        Get list of autotuned streamers.

        Returns:
            Dict with autotuned streamers information
        """
        if not self.autotune_manager:
            return {"success": False, "error": "Autotune manager not initialized"}

        try:
            streamers = self.autotune_manager.get_autotuned_streamers()
            return {"success": True, "streamers": streamers}
        except Exception as e:
            logger.error(f"Error getting autotuned streamers: {e}")
            return {"success": False, "error": str(e)}

    async def check_live_status(self) -> Dict[str, Any]:
        """
        Check live status of autotuned streamers.

        Returns:
            Dict with live streamers
        """
        if not self.autotune_manager:
            return {"success": False, "error": "Autotune manager not initialized"}

        try:
            live_streamers = await self.autotune_manager.check_live_status()
            return {"success": True, "live_streamers": list(live_streamers)}
        except Exception as e:
            logger.error(f"Error checking live status: {e}")
            return {"success": False, "error": str(e)}

    # Notification handling

    def _handle_notification(self, event_type: str, data: Dict[str, Any]):
        """
        Handle notifications from components.

        Args:
            event_type: Type of event
            data: Event data
        """
        # Put notification in queue for processing
        asyncio.run_coroutine_threadsafe(
            self._notification_queue.put({"type": event_type, "data": data}),
            self._loop
        )

    async def _process_notifications(self):
        """Process notifications from the queue."""
        while self.running:
            try:
                notification = await self._notification_queue.get()
                # In a real implementation, this would send notifications to the Electron app
                logger.info(f"Notification: {notification}")
                # Example of sending to stdout for IPC
                print(json.dumps({"notification": notification}))
                self._notification_queue.task_done()
            except Exception as e:
                logger.error(f"Error processing notification: {e}")

    # CLI interaction

    def _process_input(self):
        """Process input from stdin for IPC with Electron."""
        while self.running:
            try:
                line = sys.stdin.readline().strip()
                if not line:
                    continue

                # Try to parse as JSON
                try:
                    command = json.loads(line)
                    # Schedule command processing in the event loop
                    asyncio.run_coroutine_threadsafe(
                        self._process_command(command),
                        self._loop
                    )
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON command: {line}")
            except Exception as e:
                logger.error(f"Error processing input: {e}")

    async def _process_command(self, command: Dict[str, Any]):
        """
        Process a command received from stdin.

        Args:
            command: Command to process
        """
        cmd_type = command.get("type")
        cmd_id = command.get("id", "unknown")
        params = command.get("params", {})

        if not cmd_type:
            self._send_response(cmd_id, False, error="Missing command type")
            return

        try:
            # Dispatch to appropriate method
            if cmd_type == "initialize":
                result = await self.initialize(
                    params.get("client_id"),
                    params.get("client_secret")
                )
                self._send_response(cmd_id, result)

            elif cmd_type == "authenticate":
                result = await self.authenticate_user(params.get("scopes"))
                self._send_response(cmd_id, result.get("success"), result)

            elif cmd_type == "get_user_info":
                result = await self.get_user_info(
                    params.get("username"),
                    params.get("user_id")
                )
                self._send_response(cmd_id, result.get("success"), result)

            elif cmd_type == "get_followed_channels":
                result = await self.get_followed_channels(params.get("user_id"))
                self._send_response(cmd_id, result.get("success"), result)

            elif cmd_type == "get_live_streams":
                result = await self.get_live_streams(params.get("user_ids", []))
                self._send_response(cmd_id, result.get("success"), result)

            elif cmd_type == "start_stream":
                result = await self.start_stream(
                    params.get("channel"),
                    params.get("quality", "best"),
                    params.get("player")
                )
                self._send_response(cmd_id, result.get("success"), result)

            elif cmd_type == "stop_stream":
                result = await self.stop_stream(params.get("stream_id"))
                self._send_response(cmd_id, result.get("success"), result)

            elif cmd_type == "get_stream_qualities":
                result = await self.get_stream_qualities(params.get("channel"))
                self._send_response(cmd_id, result.get("success"), result)

            elif cmd_type == "get_active_streams":
                result = await self.get_active_streams()
                self._send_response(cmd_id, result.get("success"), result)

            # Autotune commands
            elif cmd_type == "start_autotune":
                result = await self.start_autotune()
                self._send_response(cmd_id, result.get("success"), result)

            elif cmd_type == "stop_autotune":
                result = await self.stop_autotune()
                self._send_response(cmd_id, result.get("success"), result)

            elif cmd_type == "add_autotuned_streamer":
                result = await self.add_autotuned_streamer(
                    params.get("username"),
                    params.get("settings")
                )
                self._send_response(cmd_id, result.get("success"), result)

            elif cmd_type == "remove_autotuned_streamer":
                result = await self.remove_autotuned_streamer(params.get("username"))
                self._send_response(cmd_id, result.get("success"), result)

            elif cmd_type == "get_autotuned_streamers":
                result = await self.get_autotuned_streamers()
                self._send_response(cmd_id, result.get("success"), result)

            elif cmd_type == "check_live_status":
                result = await self.check_live_status()
                self._send_response(cmd_id, result.get("success"), result)

            else:
                self._send_response(cmd_id, False, error=f"Unknown command type: {cmd_type}")

        except Exception as e:
            logger.error(f"Error processing command {cmd_type}: {e}")
            self._send_response(cmd_id, False, error=str(e))

    def _send_response(self, cmd_id: str, success: bool, data: Dict[str, Any] = None):
        """
        Send a response to stdout for IPC with Electron.

        Args:
            cmd_id: Command ID
            success: Whether the command was successful
            data: Response data
        """
        response = {
            "id": cmd_id,
            "success": success
        }

        if data:
            response.update(data)
            
        # Send as JSON to stdout
        print(json.dumps(response))
        sys.stdout.flush()

    async def run(self):
        """Run the Ocularum backend."""
        self.running = True
        self._loop = asyncio.get_running_loop()

        # Start input processing thread
        self._input_thread = threading.Thread(target=self._process_input)
        self._input_thread.daemon = True
        self._input_thread.start()

        # Start notification processing
        notification_task = asyncio.create_task(self._process_notifications())

        # Register signal handlers
        for sig in (signal.SIGINT, signal.SIGTERM):
            self._loop.add_signal_handler(sig, lambda: asyncio.create_task(self.shutdown()))

        # Keep running until shutdown
        while self.running:
            await asyncio.sleep(1)

        # Clean up
        notification_task.cancel()
        try:
            await notification_task
        except asyncio.CancelledError:
            pass

    async def shutdown(self):
        """Shut down the Ocularum backend."""
        logger.info("Shutting down...")
        self.running = False

        # Stop autotune
        if self.autotune_manager:
            self.autotune_manager.stop()

        # Stop all streams
        if self.stream_handler:
            await self.stream_handler.close()

        # Close Twitch API
        if self.twitch:
            await self.twitch.close()

        logger.info("Shutdown complete.")


# Main entry point
def main():
    parser = argparse.ArgumentParser(description="Ocularum Python Backend")
    parser.add_argument("--client-id", help="Twitch client ID")
    parser.add_argument("--client-secret", help="Twitch client secret")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    args = parser.parse_args()

    # Set up logging level
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    # Create backend
    backend = OcularumBackend()

    # Run the event loop
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(backend.initialize(args.client_id, args.client_secret))
        loop.run_until_complete(backend.run())
    except KeyboardInterrupt:
        pass
    finally:
        loop.run_until_complete(backend.shutdown())
        loop.close()


if __name__ == "__main__":
    main() 