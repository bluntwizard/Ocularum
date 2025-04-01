import { createSlice } from '@reduxjs/toolkit';

// Initial state for authentication
const initialState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null
};

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set loading state
    setAuthLoading: (state, action) => {
      state.isLoading = action.payload;
      // Clear any previous errors when starting a new auth attempt
      if (action.payload === true) {
        state.error = null;
      }
    },
    
    // Set authentication status
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
      // Clear user if not authenticated
      if (!action.payload) {
        state.user = null;
      }
    },
    
    // Set user profile information
    setUserProfile: (state, action) => {
      state.user = action.payload;
    },
    
    // Set auth error
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    
    // Logout - reset to initial state
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    }
  }
});

// Export actions
export const {
  setAuthLoading,
  setAuthenticated,
  setUserProfile,
  setAuthError,
  logout
} = authSlice.actions;

// Export selectors
export const selectIsAuthenticated = state => state.auth.isAuthenticated;
export const selectAuthLoading = state => state.auth.isLoading;
export const selectUser = state => state.auth.user;
export const selectAuthError = state => state.auth.error;

// Export reducer
export default authSlice.reducer; 