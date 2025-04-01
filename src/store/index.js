import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
// Import other reducers as needed

// Configure the Redux store
const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers as needed
  },
  // Enable Redux DevTools in development mode
  devTools: process.env.NODE_ENV !== 'production',
});

export default store; 