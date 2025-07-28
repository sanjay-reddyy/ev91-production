// Network Connectivity Test
// Run this in your mobile app to test connectivity to the backend

import apiClient from './client';

export const testNetworkConnectivity = async () => {
  console.log('🔍 Testing network connectivity...');
  
  try {
    // Test basic health endpoint
    console.log('Testing /health/live endpoint...');
    const healthResponse = await apiClient.get('/api/v1/health/live');
    console.log('✅ Health endpoint successful:', healthResponse.data);
    
    // Test CORS endpoint
    console.log('Testing /health/cors endpoint...');
    const corsResponse = await apiClient.get('/api/v1/health/cors');
    console.log('✅ CORS endpoint successful:', corsResponse.data);
    
    return {
      success: true,
      healthStatus: healthResponse.data,
      corsStatus: corsResponse.data,
    };
  } catch (error: any) {
    console.log('❌ Network test failed:');
    
    if (error.response) {
      console.log('Server responded with error:', {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      console.log('No response received:', error.message);
      console.log('Possible issues:');
      console.log('- Backend server not running');
      console.log('- CORS policy blocking request');
      console.log('- Network connectivity problem');
      console.log('- Incorrect URL/port configuration');
    } else {
      console.log('Request setup error:', error.message);
    }
    
    return {
      success: false,
      error: error.message,
      details: error.response?.data || error.request || 'Unknown error',
    };
  }
};

// Test specific endpoints
export const testRegistrationEndpoint = async () => {
  try {
    console.log('🧪 Testing registration endpoint with dummy data...');
    
    // This should fail with validation errors, but confirms endpoint is reachable
    const response = await apiClient.post('/api/v1/register/start-registration', {
      // Invalid data to test endpoint reachability
      test: true,
    });
    
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Registration endpoint reachable (validation error expected)');
      return { success: true, reachable: true, validationError: error.response.data };
    }
    
    console.log('❌ Registration endpoint failed:', error.message);
    return { success: false, error: error.message };
  }
};
