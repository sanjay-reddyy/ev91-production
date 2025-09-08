import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Map as MapIcon,
  LocalShipping as DeliveryIcon,
  ElectricCar as VehicleIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isAfter } from 'date-fns';
import vehicleService from '../services/vehicleService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

interface CityDashboardData {
  totalCities: number;
  activeCities: number;
  operationalCities: number;
  newCitiesThisMonth: number;
  topCitiesByPopulation: Array<{
    name: string;
    population: number;
    isOperational: boolean;
    state: string;
  }>;
  citiesByState: Array<{
    state: string;
    count: number;
    operational: number;
  }>;
  marketPotentialByCities: Array<{
    name: string;
    potential: number;
    state: string;
  }>;
  recentlyLaunched: Array<{
    name: string;
    launchDate: string;
    state: string;
    isOperational: boolean;
  }>;
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CityDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<CityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await vehicleService.getCities();
      if (response.success && response.data) {
        const cities = response.data;

        // Calculate dashboard metrics
        const totalCities = cities.length;
        const activeCities = cities.filter((city: any) => city.isActive).length;
        const operationalCities = cities.filter((city: any) => city.isOperational).length;

        // New cities this month
        const thisMonth = new Date();
        thisMonth.setDate(1); // Start of current month
        const newCitiesThisMonth = cities.filter((city: any) =>
          city.createdAt && isAfter(parseISO(city.createdAt), thisMonth)
        ).length;

        // Top cities by population
        const topCitiesByPopulation = cities
          .filter((city: any) => city.estimatedPopulation)
          .sort((a: any, b: any) => (b.estimatedPopulation || 0) - (a.estimatedPopulation || 0))
          .slice(0, 8)
          .map((city: any) => ({
            name: city.name,
            population: city.estimatedPopulation,
            isOperational: city.isOperational,
            state: city.state
          }));

        // Cities by state
        const stateMap = new Map<string, { count: number; operational: number }>();
        cities.forEach((city: any) => {
          const current = stateMap.get(city.state) || { count: 0, operational: 0 };
          stateMap.set(city.state, {
            count: current.count + 1,
            operational: current.operational + (city.isOperational ? 1 : 0)
          });
        });

        const citiesByState = Array.from(stateMap.entries())
          .map(([state, data]) => ({
            state,
            count: data.count,
            operational: data.operational
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Market potential by cities
        const marketPotentialByCities = cities
          .filter((city: any) => city.marketPotential)
          .sort((a: any, b: any) => (b.marketPotential || 0) - (a.marketPotential || 0))
          .slice(0, 6)
          .map((city: any) => ({
            name: city.name,
            potential: city.marketPotential,
            state: city.state
          }));

        // Recently launched cities
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const recentlyLaunched = cities
          .filter((city: any) => city.launchDate && isAfter(parseISO(city.launchDate), sixMonthsAgo))
          .sort((a: any, b: any) => new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime())
          .slice(0, 5)
          .map((city: any) => ({
            name: city.name,
            launchDate: city.launchDate,
            state: city.state,
            isOperational: city.isOperational
          }));

        setDashboardData({
          totalCities,
          activeCities,
          operationalCities,
          newCitiesThisMonth,
          topCitiesByPopulation,
          citiesByState,
          marketPotentialByCities,
          recentlyLaunched
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  };

  if (loading || !dashboardData) {
    return (
      <Box p={3}>
        <Typography variant="h4" gutterBottom>City Management Dashboard</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            City Management Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Overview of all cities and operational areas
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ViewIcon />}
            onClick={() => navigate('/cities')}
          >
            View All Cities
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/cities/add')}
          >
            Add New City
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    Total Cities
                  </Typography>
                  <Typography variant="h3">
                    {dashboardData.totalCities}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <PublicIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    Active Cities
                  </Typography>
                  <Typography variant="h3" color="success.main">
                    {dashboardData.activeCities}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {((dashboardData.activeCities / dashboardData.totalCities) * 100).toFixed(1)}% of total
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <BusinessIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    Operational
                  </Typography>
                  <Typography variant="h3" color="info.main">
                    {dashboardData.operationalCities}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {((dashboardData.operationalCities / dashboardData.totalCities) * 100).toFixed(1)}% of total
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <DeliveryIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    New This Month
                  </Typography>
                  <Typography variant="h3" color="warning.main">
                    {dashboardData.newCitiesThisMonth}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Recently added
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <TrendingUpIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts and Analytics */}
      <Grid container spacing={3} mb={4}>
        {/* Cities by State Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cities by State
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={dashboardData.citiesByState}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="state"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Total Cities" />
                  <Bar dataKey="operational" fill="#82ca9d" name="Operational" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Distribution Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                City Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Operational', value: dashboardData.operationalCities },
                      { name: 'Active (Non-operational)', value: dashboardData.activeCities - dashboardData.operationalCities },
                      { name: 'Inactive', value: dashboardData.totalCities - dashboardData.activeCities }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Operational', value: dashboardData.operationalCities },
                      { name: 'Active (Non-operational)', value: dashboardData.activeCities - dashboardData.operationalCities },
                      { name: 'Inactive', value: dashboardData.totalCities - dashboardData.activeCities }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top Cities by Population */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Top Cities by Population
              </Typography>
              <List>
                {dashboardData.topCitiesByPopulation.map((city, index) => (
                  <ListItem key={city.name} divider>
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                        {index + 1}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={city.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" component="div">
                            {city.state} • {formatNumber(city.population)}
                          </Typography>
                          {city.isOperational && (
                            <Chip label="Operational" size="small" color="success" sx={{ mt: 0.5 }} />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Market Potential */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Top Markets by Potential
              </Typography>
              <List>
                {dashboardData.marketPotentialByCities.map((city, index) => (
                  <ListItem key={city.name} divider>
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'warning.main' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={city.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="success.main" fontWeight="bold">
                            {formatCurrency(city.potential)}
                          </Typography>
                          <Typography variant="caption">
                            {city.state}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recently Launched */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recently Launched
              </Typography>
              <List>
                {dashboardData.recentlyLaunched.length > 0 ? (
                  dashboardData.recentlyLaunched.map((city) => (
                    <ListItem key={city.name} divider>
                      <ListItemIcon>
                        <LocationIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={city.name}
                        secondary={
                          <Box>
                            <Typography variant="caption" component="div">
                              {city.state} • {format(parseISO(city.launchDate), 'MMM dd, yyyy')}
                            </Typography>
                            {city.isOperational && (
                              <Chip label="Operational" size="small" color="success" sx={{ mt: 0.5 }} />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No recent launches"
                      secondary="No cities launched in the last 6 months"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate('/cities/add')}
            >
              Add New City
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ViewIcon />}
              onClick={() => navigate('/cities')}
            >
              View All Cities
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<MapIcon />}
              onClick={() => navigate('/cities?view=geographic')}
            >
              Geographic View
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AssessmentIcon />}
              onClick={() => navigate('/cities?view=analytics')}
            >
              Market Analysis
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default CityDashboard;
