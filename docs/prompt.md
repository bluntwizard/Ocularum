# Ocularum Project Context

## Project Overview

You are helping with the development of Ocularum, an Electron-based desktop application that allows users to watch Twitch streams using streamlink. The key feature is "autotune," which automatically starts streams from favorite streamers when they go live.

## Tech Stack

- **Frontend**: Electron with React 18, Redux Toolkit, and Material UI
- **Backend**: Node.js (Electron main process) and Python 3.7+
- **Third-party Services**: Twitch API, Streamlink
- **State Management**: Redux with Redux Toolkit
- **Routing**: React Router v6
- **Styling**: Material UI v5 with custom theme

## Project Structure

- `src/`: Frontend React code
  - `components/`: Reusable UI components
  - `pages/`: Main application pages
  - `layouts/`: Layout components
  - `redux/`: Redux store and slices
- `electron/`: Electron main process code
  - `main/`: Main process modules
  - `preload/`: Preload scripts for context bridge
- `python/`: Python backend for Twitch API and Streamlink integration
  - `twitch_integration/`: Twitch API wrapper
  - `streamlink/`: Streamlink integration code
  - `autotune/`: Autotune functionality
- `public/`: Static assets
- `docs/`: Project documentation

## Communication Architecture

### Frontend to Python Backend
1. Frontend (React) calls `window.electron.invoke('python-command', command, params)`
2. Preload script passes this to main process via IPC
3. Main process sends command to Python backend
4. Python processes command and returns result
5. Result is passed back to frontend

### Notification System
1. Python backend triggers events
2. Main process receives events and forwards to renderer
3. Renderer registers listeners via `window.electron.onNotification(channel, callback)`
4. UI components react to notifications (e.g., stream status changes)

## Key Components

### Authentication Flow
- `components/TwitchAuth.jsx`: Manages Twitch OAuth flow
- `redux/slices/authSlice.js`: Stores auth state
- Uses localStorage for token persistence

### Stream Management
- `pages/Streams.jsx`: Lists and manages active streams
- `components/StreamCard.jsx`: Displays stream information
- Polls for stream status updates

### Autotune System
- `pages/Settings.jsx`: Configuration for autotune
- Python background process checks for live streamers
- `pages/Home.jsx`: Shows autotuned channels

### Navigation
- `layouts/MainLayout.jsx`: Main application navigation sidebar
- `App.jsx`: Routing and protected routes

## Design Patterns and Conventions

1. **Functional Components**: All React components are functional with hooks
2. **Redux State Management**:
   - Global state in Redux store
   - Local state with React useState
   - Use selectors for state access
3. **Async Operations**:
   - Use async/await for API calls
   - Handle loading, success, and error states
4. **Protected Routes**: Authentication check for secure routes
5. **Material UI Styling**:
   - Use `sx` prop for component styling
   - Follow theme spacing and typography
6. **Error Handling**:
   - Try/catch blocks for API calls
   - User-friendly error messages

## Current Development Status

The project has implemented the core UI components including:
- Authentication with Twitch
- Home dashboard
- Stream management
- Channel browsing
- Settings and configuration
- Autotune functionality

## Common Challenges

1. **IPC Communication**: Ensure proper data serialization between processes
2. **Authentication Flow**: Handling OAuth token refresh and expiration
3. **Stream Management**: Coordinating between Python streamlink and UI
4. **State Synchronization**: Keeping UI state in sync with backend state
5. **Error Handling**: Graceful handling of API failures and network issues

## Documentation Resources

Refer to these files for more detailed information:
- `docs/technical_architecture.md`: System design and architecture
- `docs/project_roadmap.md`: Planned features and development phases
- `docs/developer_guide.md`: Setup and contribution guidelines
- `docs/user_guide.md`: User-facing documentation
- `CHANGELOG.md`: History of changes and updates

## Development Guidelines

1. **Component Development**:
   - Create new components in appropriate directories (pages, components, layouts)
   - Use consistent naming pattern (PascalCase for components)
   - Implement component props validation
   
2. **State Management**:
   - Use Redux for global state (auth, streams, settings)
   - Use local state for UI-specific state (form inputs, toggles)
   
3. **API Communication**:
   - Use the invoke pattern: `window.electron.invoke('python-command', command, params)`
   - Handle loading states and errors consistently
   
4. **Styling**:
   - Follow Material UI theming system
   - Use theme color palette for consistency
   - Ensure responsive design for all components

5. **Documentation**:
   - Update CHANGELOG.md for significant changes
   - Keep technical documentation up to date
   - Document complex functions and components

## How You Can Help

As an AI assistant, you can help with:
1. Code implementation and refactoring
2. Bug fixing and troubleshooting
3. UI/UX improvements
4. Documentation updates
5. Feature implementation
6. Testing strategies

When providing code or solutions, please consider:
- The existing architecture and patterns
- Cross-platform compatibility
- Performance implications
- Security best practices 