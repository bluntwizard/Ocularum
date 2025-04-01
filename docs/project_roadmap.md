# Ocularum Project Roadmap

## Project Overview

Ocularum is an Electron-based desktop application that allows users to watch Twitch streams through streamlink. The key differentiator is the "autotune" feature that automatically starts streams from favorite streamers when they go live.

## Core Features

1. **Twitch Integration**
   - Authentication with Twitch
   - Fetch live streams
   - Receive notifications when followed streamers go live

2. **Stream Viewing**
   - Watch multiple streams simultaneously
   - Customize layout and stream quality
   - Control audio for each stream independently

3. **Autotune System**
   - Mark streamers as "autotune"
   - Auto-start streams when streamers go live
   - Boot-time check for live status of favorite streamers

4. **User Preferences**
   - Persistent settings across sessions
   - Customizable notifications
   - Stream quality defaults

## Technical Architecture

### Frontend (Electron)
- Electron framework for cross-platform desktop app
- React for UI components
- Redux for state management
- Electron IPC for communication with backend processes

### Backend
- Node.js for Electron main process
- Python 3.7+ for Twitch API integration (packaged with the app)
- Streamlink for stream playback (packaged with the app)

### Data Storage
- Local configuration files for user preferences
- Secure storage for auth tokens

## Development Phases

### Phase 1: Foundation
- Set up Electron project structure
- Implement basic UI layout
- Create Python integration layer
- Integrate streamlink for basic playback

### Phase 2: Core Functionality
- Implement Twitch authentication
- Develop stream discovery and browsing
- Create basic stream viewing capability
- Set up persistent settings

### Phase 3: Advanced Features
- Implement the autotune system
- Add multi-stream viewing
- Create notification system
- Develop streamers management UI

### Phase 4: Polish & Optimization
- Optimize performance
- Improve error handling
- Enhance UI/UX
- Add keyboard shortcuts

### Phase 5: Distribution
- Package the application for different platforms
- Create installers
- Set up auto-updates

## Technical Considerations

### Cross-Platform Compatibility
- Windows, macOS, and Linux support
- Consideration for different desktop environments
- Handling of platform-specific quirks

### Python Integration
- Packaging Python environment with the app
- Efficient IPC between Node.js and Python
- Handling Python dependencies

### Immutable Filesystems
- Support for read-only environments
- User settings in appropriate locations
- Runtime caching strategies

### Performance
- Efficient stream handling
- Memory management with multiple streams
- Startup optimization

## Potential Challenges

1. **Integration Complexity**
   - Combining Electron, Node.js, Python, and streamlink
   - Managing dependencies across environments

2. **Twitch API Limitations**
   - Rate limits
   - Authentication token management
   - API changes and deprecations

3. **Resource Consumption**
   - Multiple video streams are resource-intensive
   - Battery life considerations on laptops

4. **Packaging**
   - Bundling Python environment
   - Cross-platform installers
   - App size management

## Success Metrics

1. **Usability**
   - Time to setup for new users
   - Number of user interactions required for common tasks

2. **Performance**
   - Startup time
   - Memory usage
   - CPU usage with multiple streams

3. **Reliability**
   - Crash frequency
   - Stream playback issues
   - Authentication failures

## Timeline (Tentative)

- **Phase 1**: 3-4 weeks
- **Phase 2**: 4-6 weeks
- **Phase 3**: 6-8 weeks
- **Phase 4**: 3-4 weeks
- **Phase 5**: 2-3 weeks

Total estimated timeline: 18-25 weeks 