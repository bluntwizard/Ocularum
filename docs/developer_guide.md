# Ocularum Developer Guide

## Getting Started

This guide will help you set up your development environment for Ocularum and understand the codebase structure.

### Prerequisites

Before you begin, make sure you have the following installed:

- Node.js (v14.x or later)
- npm (v6.x or later)
- Python 3.7+
- Git

### Development Environment Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/bluntwizard/Ocularum.git
   cd Ocularum
   ```

2. **Install Node.js dependencies**

   ```bash
   npm install
   ```

3. **Set up Python environment**

   ```bash
   # Create a virtual environment (recommended)
   python -m venv venv
   
   # Activate the virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   
   # Install Python dependencies
   pip install -r python/requirements.txt
   ```

4. **Install Streamlink**

   ```bash
   pip install streamlink
   ```

5. **Create a Twitch Developer Application**

   - Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
   - Create a new application
   - Set the redirect URL to `http://localhost:3000/auth/callback`
   - Note your Client ID and Client Secret

6. **Configure environment variables**

   Create a `.env` file in the project root:

   ```
   TWITCH_CLIENT_ID=your_client_id
   TWITCH_CLIENT_SECRET=your_client_secret
   ```

### Running in Development Mode

```bash
# Start the application in development mode
npm run dev
```

This will:
- Start the Electron application
- Enable hot-reloading for frontend changes
- Connect to the Python backend

## Project Structure Overview

Refer to the [Technical Architecture](./technical_architecture.md) for detailed structure information.

## Development Workflow

### Making Changes to the Frontend

1. **React Components**
   - Frontend code is in the `src/` directory
   - Reusable components are in `src/components/`
   - Page components are in `src/pages/`
   - Layout components are in `src/layouts/`
   - Each component should be a functional component using React hooks

2. **State Management with Redux**
   - Redux store configuration is in `src/redux/store.js`
   - State slices are in `src/redux/slices/`
   - Use the Redux DevTools extension to debug state changes

3. **Styling with Material-UI**
   - Use Material-UI components for consistent styling
   - Theme configuration is in `src/index.js`
   - Use the `sx` prop for component-specific styling
   - Follow Material Design guidelines for spacing and typography

4. **Routing**
   - React Router is used for navigation
   - Routes are defined in `src/App.jsx`
   - Protected routes require authentication

Changes to the frontend will automatically reload in development mode.

### Making Changes to the Main Process

1. Electron main process code is in `electron/main/`
2. The entry point is `electron/main/index.js`
3. Python bridge is in `electron/main/python-bridge.js`
4. After changing main process code, restart the application

### Making Changes to the Preload Script

1. Preload script is in `electron/preload/index.js`
2. It securely exposes APIs to the renderer process using contextBridge
3. After changing the preload script, restart the application

### Making Changes to the Python Backend

1. Python code is in the `python/` directory
2. Main entry point is `python/main.py`
3. Twitch integration is in `python/twitch_integration/`
4. Stream handling is in `python/streamlink/`
5. Autotune functionality is in `python/autotune/`
6. After changing Python code, restart the application

### Coding Standards

- **JavaScript/React**: Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- **Python**: Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- **React Components**: Use functional components with hooks
- **State Management**: Use Redux for global state, React hooks for local state

### Testing

- **Frontend Tests**: Jest + React Testing Library
  ```bash
  npm run test:renderer
  ```

- **Main Process Tests**: Jest
  ```bash
  npm run test:main
  ```

- **Python Tests**: pytest
  ```bash
  cd python
  pytest
  ```

- **End-to-End Tests**: Spectron
  ```bash
  npm run test:e2e
  ```

### Debugging

#### Frontend Debugging

1. Use Chrome DevTools in the Electron window (View > Toggle Developer Tools)
2. React DevTools and Redux DevTools are integrated in development mode
3. Use `console.log()` for quick debugging
4. Set breakpoints in the Chrome DevTools Sources panel

#### Main Process Debugging

1. Launch with debugging enabled:
   ```bash
   npm run dev:debug
   ```
2. Connect using VS Code or Chrome DevTools

#### Python Debugging

1. Insert print statements for quick debugging
2. For advanced debugging, use pdb or an IDE debugger

## Common Development Tasks

### Adding a New Component

1. Create a new file in the appropriate directory:
   - Reusable components in `src/components/`
   - Pages in `src/pages/`
   - Layouts in `src/layouts/`

2. Import necessary hooks and components:
   ```jsx
   import React, { useState, useEffect } from 'react';
   import { useSelector, useDispatch } from 'react-redux';
   import { Box, Typography, Button } from '@mui/material';
   ```

3. Create a functional component:
   ```jsx
   const MyComponent = ({ prop1, prop2 }) => {
     const [state, setState] = useState(initialValue);
     
     useEffect(() => {
       // Side effects here
     }, [dependencies]);
     
     const handleSomething = () => {
       // Event handler
     };
     
     return (
       <Box>
         {/* JSX content */}
       </Box>
     );
   };
   
   export default MyComponent;
   ```

4. Import and use it where needed

### Adding a New Redux Slice

1. Create a new slice file in `src/redux/slices/`:
   ```jsx
   import { createSlice } from '@reduxjs/toolkit';
   
   const initialState = {
     // Initial state properties
   };
   
   export const mySlice = createSlice({
     name: 'mySlice',
     initialState,
     reducers: {
       action1: (state, action) => {
         // Update state here
       },
       action2: (state, action) => {
         // Update state here
       },
     },
   });
   
   export const { action1, action2 } = mySlice.actions;
   
   // Selectors
   export const selectSomething = (state) => state.mySlice.something;
   
   export default mySlice.reducer;
   ```

2. Add the reducer to the store in `src/redux/store.js`:
   ```jsx
   import myReducer from './slices/mySlice';
   
   export const store = configureStore({
     reducer: {
       // Existing reducers
       myReducer,
     },
   });
   ```

### Adding a New Page

1. Create a new file in `src/pages/`:
   ```jsx
   import React from 'react';
   import { Box, Typography } from '@mui/material';
   
   const NewPage = () => {
     return (
       <Box>
         <Typography variant="h4" gutterBottom>
           New Page
         </Typography>
         {/* Page content */}
       </Box>
     );
   };
   
   export default NewPage;
   ```

2. Add the route to `src/App.jsx`:
   ```jsx
   <Route path="/new-page" element={
     <ProtectedRoute>
       <NewPage />
     </ProtectedRoute>
   } />
   ```

3. Add navigation to the page in `src/layouts/MainLayout.jsx`

### Adding a Python Command

1. Add the command handler in `python/main.py`:
   ```python
   async def my_command(self, params: Dict[str, Any]) -> Dict[str, Any]:
       try:
           # Command implementation
           result = {"some_data": "value"}
           return {"success": True, "data": result}
       except Exception as e:
           logger.error(f"Error in my_command: {e}")
           return {"success": False, "error": str(e)}
   ```

2. Add the command to the command mapping in `_process_command`

3. Access it from the renderer process:
   ```jsx
   const result = await window.electron.invoke('python-command', 'my_command', {
     param1: 'value1',
     param2: 'value2',
   });
   
   if (result.success) {
     // Handle success
   } else {
     // Handle error
   }
   ```

## Building for Production

```bash
# Build the application for production
npm run build

# Package the application for distribution
npm run package
```

## Contribution Guidelines

1. **Branch naming convention**: 
   - Features: `feature/feature-name`
   - Bugfixes: `bugfix/issue-description`
   - Documentation: `docs/description`

2. **Commit message format**:
   - Use present tense ("Add feature" not "Added feature")
   - First line is a summary
   - Optionally provide a detailed description after a blank line

3. **Pull request process**:
   - Create a pull request with a clear description
   - Reference any related issues
   - Ensure tests pass
   - Request code review from maintainers

## Troubleshooting

### Common Issues

1. **Python path issues**
   - Ensure your virtual environment is activated
   - Check that Python path is correctly set in the application config

2. **Streamlink errors**
   - Verify Streamlink is properly installed
   - Check for version compatibility issues

3. **Twitch API authentication problems**
   - Confirm your Client ID and Secret are correct
   - Verify redirect URL matches the one in the Twitch Developer Console

4. **Packaging errors**
   - Clear the build directory and try again
   - Ensure all dependencies are installed

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Redux Documentation](https://redux.js.org/introduction/getting-started)
- [Material-UI Documentation](https://mui.com/material-ui/getting-started/overview/)
- [React Router Documentation](https://reactrouter.com/en/main)
- [Twitch API Documentation](https://dev.twitch.tv/docs/api/)
- [Streamlink Documentation](https://streamlink.github.io/) 