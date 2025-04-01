# Ocularum Technical Architecture

## System Overview

Ocularum is built as an Electron application that integrates Node.js, Python, and streamlink to provide a seamless Twitch viewing experience with unique "autotune" capabilities.

```
┌───────────────────────────────────────────────────────────┐
│                      Electron App                         │
│                                                           │
│  ┌───────────────┐           ┌─────────────────────────┐  │
│  │   Renderer    │           │       Main Process      │  │
│  │   Process     │           │                         │  │
│  │  (React UI)   │◄────────►│  (Node.js Application)  │  │
│  └───────────────┘           └──────────┬──────────────┘  │
│                                         │                  │
└─────────────────────────────────────────┼──────────────────┘
                                          │
                      ┌──────────────────▼───────────────────┐
                      │                                      │
                      │       Python Integration Layer       │
                      │     (Twitch API, Stream Handling)    │
                      │                                      │
                      └──────────────────┬───────────────────┘
                                         │
                      ┌──────────────────▼───────────────────┐
                      │                                      │
                      │             Streamlink               │
                      │      (Stream Playback Service)       │
                      │                                      │
                      └──────────────────────────────────────┘
```

## Component Architecture

### 1. Electron Application

#### Main Process (Node.js)
- **Core Responsibilities**:
  - Application lifecycle management
  - System tray integration
  - Global shortcuts
  - IPC with renderer process
  - Python process management
  - Configuration management
  - Update checking and installation

- **Key Modules**:
  - `main/index.js`: Main process entry point and lifecycle management
  - `main/python-bridge.js`: Interface to Python processes
  - `preload/index.js`: Secure exposing of APIs to renderer process
  - `main/ipc-handler.js`: IPC communication with renderer

#### Renderer Process (React + Redux)
- **Core Responsibilities**:
  - User interface rendering
  - User interaction handling
  - Stream display management
  - Authentication flow

- **Key Components**:
  - `App.jsx`: Main application component with routing
  - `layouts/MainLayout.jsx`: Application layout with navigation
  - `pages/Home.jsx`: Home page with stream discovery
  - `pages/Streams.jsx`: Active streams management
  - `pages/Browse.jsx`: Channel browsing and discovery
  - `pages/Settings.jsx`: Application settings and autotune configuration
  - `pages/Auth.jsx`: Twitch authentication page
  - `components/TwitchAuth.jsx`: Twitch OAuth component
  - `components/StreamCard.jsx`: Stream display component
  - `components/Notifications/UpdateNotification.jsx`: Update notification component

- **State Management (Redux)**:
  - `redux/store.js`: Redux store configuration
  - `redux/slices/authSlice.js`: Authentication state management

### 2. Python Integration Layer

- **Core Responsibilities**:
  - Twitch API communication
  - Stream information fetching
  - Authentication with Twitch
  - Notification management

- **Key Modules**:
  - `twitch_integration/api_wrapper.py`: Twitch API wrapper
  - `streamlink/stream_handler.py`: Stream management
  - `autotune/__init__.py`: Autotune functionality
  - `main.py`: Main Python interface

### 3. Streamlink Integration

- **Core Responsibilities**:
  - Stream URL resolution
  - Quality selection
  - Stream playback

- **Integration Points**:
  - Command-line interface from Python
  - Stream quality configuration
  - Output handling

## Data Flow

### Authentication Flow
1. User initiates Twitch login via TwitchAuth component
2. Electron opens OAuth authentication page in external browser
3. User approves application access
4. Auth token is extracted and stored in local storage
5. Redux store is updated with authentication state
6. Python layer uses token for API requests

### Stream Discovery Flow
1. React components query Python backend for stream data
2. Python layer fetches information from Twitch API
3. Results are passed back to renderer process via IPC
4. UI updates to show available streams in Browse and Home pages

### Autotune Flow
1. Background process in Python regularly checks favorite streamers
2. When a streamer goes live:
   - Notification is triggered through IPC to renderer
   - If autotune is enabled, stream is prepared
   - Stream is launched based on user preferences
3. On application start:
   - Check autotune streamers via Settings page
   - Launch streams for those currently live

### Playback Flow
1. User selects stream to watch in Browse or Home page
2. Request is sent to Python layer via IPC
3. Streamlink resolves the stream URL
4. Active stream is added to Streams page
5. Stream begins playback

## File Structure

```
ocularum/
├── package.json           # Node.js dependencies and scripts
├── CHANGELOG.md           # Project changelog
├── README.md              # Project overview
├── python/                # Python integration layer
│   ├── requirements.txt   # Python dependencies
│   ├── twitch_integration/# Twitch API integration
│   ├── streamlink/        # Streamlink wrappers
│   ├── autotune/          # Autotune functionality
│   └── main.py            # Main Python entry point
├── src/                   # Frontend source files (React)
│   ├── index.js           # Renderer process entry point
│   ├── App.jsx            # Main application component
│   ├── components/        # Reusable React components
│   │   ├── StreamCard.jsx # Stream display component
│   │   ├── TwitchAuth.jsx # Authentication component
│   │   └── Notifications/ # Notification components
│   ├── layouts/           # Layout components
│   │   └── MainLayout.jsx # Main application layout
│   ├── pages/             # Page components
│   │   ├── Home.jsx       # Home page
│   │   ├── Streams.jsx    # Active streams page
│   │   ├── Browse.jsx     # Channel browsing page
│   │   ├── Settings.jsx   # Settings page
│   │   └── Auth.jsx       # Authentication page
│   └── redux/             # Redux state management
│       ├── store.js       # Redux store configuration
│       └── slices/        # Redux slices
│           └── authSlice.js # Authentication state
├── electron/              # Electron-specific code
│   ├── main/              # Main process modules
│   │   ├── index.js       # Main process entry point
│   │   └── python-bridge.js # Python process interface
│   └── preload/           # Preload scripts
│       └── index.js       # Context bridge setup
├── public/                # Public assets
│   ├── index.html         # HTML template
│   └── manifest.json      # Web app manifest
└── docs/                  # Documentation
    ├── user_guide.md      # User documentation
    ├── developer_guide.md # Developer documentation
    ├── technical_architecture.md # Architecture documentation
    └── project_roadmap.md # Project roadmap
```

## Communication Architecture

### IPC Channels
- `python-command`: Invoke Python backend commands
- `register-notification`: Register for event notifications
- `unregister-notification`: Unregister from event notifications
- `app:open-external`: Open external URLs
- `app:install-update`: Install application updates

### Context Bridge (Preload)
- `window.electron.invoke`: Send commands to Python backend
- `window.electron.onNotification`: Register notification listeners
- `window.electron.app.openExternal`: Open external URLs
- `window.electron.app.installUpdate`: Install updates
- `window.electron.onUpdateAvailable`: Listen for update availability
- `window.electron.onUpdateDownloaded`: Listen for completed updates

### Python to Node.js Communication
- JSON-formatted messages over stdin/stdout
- Command/response pattern for request handling
- Event notifications for asynchronous updates

## Security Considerations

- Context isolation with Electron's contextBridge API
- Secure storage of Twitch authentication tokens in localStorage
- Validation of all IPC messages
- Sanitization of user inputs
- Secure communication between Node.js and Python

## UI Architecture

- Material UI component library for consistent design
- Responsive design with mobile and desktop layouts
- Dark theme optimized for streaming content
- React Router for client-side navigation
- Redux for centralized state management

## Performance Optimizations

- Lazy loading of non-critical components
- Efficient stream data polling
- Caching of frequently accessed data
- Optimized React component rendering 