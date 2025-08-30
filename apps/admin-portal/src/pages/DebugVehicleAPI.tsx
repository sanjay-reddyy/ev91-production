import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Alert, CircularProgress, TextField } from '@mui/material';
import { vehicleService } from '../services/vehicleService';
import axios from 'axios';

const DebugVehicleAPI: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('admin@ev91.com');
  const [password, setPassword] = useState('SuperAdmin123!');

  useEffect(() => {
    // Check current auth token
    const token = localStorage.getItem('authToken');
    setAuthToken(token);
  }, []);

  const testLogin = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      console.log('🔍 Testing login...');

      const response = await axios.post('http://localhost:8000/api/auth/login', {
        email: email,
        password: password
      });

      console.log('✅ Login response:', response.data);

      if (response.data.success && response.data.data.token) {
        const token = response.data.data.token;
        localStorage.setItem('authToken', token);
        setAuthToken(token);
        setApiResponse(response.data);
      }

    } catch (error: any) {
      console.error('❌ Login error:', error);
      setError(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const testVehicleAPI = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      console.log('🔍 Testing vehicle API...');

      // Test the vehicles endpoint
      const vehiclesResponse = await vehicleService.getVehicles(
        {},
        { page: 1, limit: 10 }
      );

      console.log('✅ Vehicles response:', vehiclesResponse);
      setApiResponse(vehiclesResponse);

    } catch (error: any) {
      console.error('❌ Vehicle API error:', error);
      setError(error.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testStatsAPI = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      console.log('🔍 Testing stats API...');

      // Test the stats endpoint
      const statsResponse = await vehicleService.getVehicleStats();

      console.log('✅ Stats response:', statsResponse);
      setApiResponse(statsResponse);

    } catch (error: any) {
      console.error('❌ Stats API error:', error);
      setError(error.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testOEMsAPI = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      console.log('🔍 Testing OEMs API...');

      // Test the OEMs endpoint
      const oemsResponse = await vehicleService.getOEMs();

      console.log('✅ OEMs response:', oemsResponse);
      setApiResponse(oemsResponse);

    } catch (error: any) {
      console.error('❌ OEMs API error:', error);
      setError(error.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testDirectAnalytics = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      console.log('🔍 Testing direct analytics API...');

      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:8000/api/vehicles/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Direct analytics response:', response.data);
      setApiResponse(response.data);

    } catch (error: any) {
      console.error('❌ Direct analytics error:', error);
      setError(error.response?.data?.message || error.message || 'Analytics failed');
    } finally {
      setLoading(false);
    }
  };

  const testAnalyticsWithoutAuth = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      console.log('🔍 Testing analytics without auth...');

      const response = await axios.get('http://localhost:8000/api/vehicles/analytics');

      console.log('✅ Analytics without auth response:', response.data);
      setApiResponse(response.data);

    } catch (error: any) {
      console.error('❌ Analytics without auth error:', error);
      setError(error.response?.data?.message || error.message || 'Analytics failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Vehicle API Debug Page
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Authentication Status
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Auth Token: {authToken ? `${authToken.substring(0, 20)}...` : 'No token found'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Token Status: {authToken ? '✅ Token exists' : '❌ No token'}
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Login Test
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <TextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="small"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="small"
            />
            <Button
              variant="outlined"
              onClick={testLogin}
              disabled={loading}
            >
              Test Login
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test API Endpoints
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              onClick={testVehicleAPI}
              disabled={loading}
            >
              Test Vehicles API
            </Button>

            <Button
              variant="contained"
              onClick={testStatsAPI}
              disabled={loading}
            >
              Test Stats API
            </Button>

            <Button
              variant="contained"
              onClick={testOEMsAPI}
              disabled={loading}
            >
              Test OEMs API
            </Button>

            <Button
              variant="contained"
              color="secondary"
              onClick={testDirectAnalytics}
              disabled={loading}
            >
              Test Direct Analytics
            </Button>

            <Button
              variant="contained"
              color="warning"
              onClick={testAnalyticsWithoutAuth}
              disabled={loading}
            >
              Test Analytics (No Auth)
            </Button>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography>Testing API...</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">Error</Typography>
          <Typography>{error}</Typography>
        </Alert>
      )}

      {apiResponse && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              API Response
            </Typography>
            <Box
              component="pre"
              sx={{
                backgroundColor: 'grey.100',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.8rem'
              }}
            >
              {JSON.stringify(apiResponse, null, 2)}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DebugVehicleAPI;
