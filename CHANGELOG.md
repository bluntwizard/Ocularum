# Changelog

All notable changes to the Ocularum project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- React frontend implementation with Material UI components
- Redux state management for authentication and application state
- Responsive layout with mobile and desktop support
- Electron preload script for secure IPC communication
- React Router for application navigation
- Authentication page with Twitch login integration
- Main application layout with navigation drawer
- Home page displaying live and autotuned channels
- Streams page for managing active stream playback
- Browse page for discovering and watching Twitch channels
- Settings page for managing application preferences and autotune
- Stream card component for consistent stream display
- Update notifications system for application updates
- TwitchAuth component for OAuth authentication workflow

### Changed
- Migrated application structure to modern React components
- Enhanced user interface with Twitch-inspired dark theme
- Structured the codebase for better maintainability and component reuse

### Fixed
- Properly structured IPC communication between renderer and main process
- Implemented secure context bridge in preload script
- Ensured proper authentication flow with Twitch API

## [0.1.0] - 2023-04-01

### Added
- Initial project structure
- Python backend for Twitch API integration
- Streamlink integration for stream playback
- Autotune feature for automatic stream management
- Electron application wrapper
- Basic documentation 