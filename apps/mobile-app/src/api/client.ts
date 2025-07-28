// src/api/client.ts
import axios from 'axios';
import { Platform } from 'react-native';

// Determine API base URL based on environment and platform
const getBaseURL = () => {
  // Check for environment variable first
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Platform-specific URLs
  if (Platform.OS === 'android') {
    // For Android emulator, use 10.0.2.2 which maps to host machine's localhost
    return 'http://192.168.1.37:4004';
  } else if (Platform.OS === 'ios') {
    // For iOS simulator, localhost should work
    return 'http://localhost:4004';
  }
  
  // For physical devices or expo development, use your machine's IP
  // Update this IP to match your machine's local network IP
  return 'http://192.168.1.35:4004';
};

const baseURL = getBaseURL();

// Create axios instance with default config
const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here from secure storage
    // const token = await SecureStore.getItemAsync('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(`API Request failed for URL: ${baseURL}`);
    
    // Handle common errors like 401, 403, network issues
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
      });
      
      // Handle specific status codes
      if (error.response.status === 401) {
        // Handle unauthorized - could redirect to login or refresh token
        console.warn('Unauthorized request - check authentication');
      }
    } else if (error.request) {
      // Request made but no response received - likely network or CORS issue
      console.error('Network Error Details:', {
        message: 'No response received from server',
        possibleCauses: [
          'CORS policy blocking request',
          'Server not running',
          'Network connectivity issue',
          'Incorrect URL/port',
        ],
        requestURL: `${baseURL}${error.config?.url || ''}`,
        method: error.config?.method?.toUpperCase(),
      });
    } else {
      // Request setup error
      console.error('Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
