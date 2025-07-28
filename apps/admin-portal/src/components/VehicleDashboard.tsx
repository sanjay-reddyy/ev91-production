import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  DirectionsBike as VehicleIcon,
  Build as ServiceIcon,
  Warning as DamageIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const VehicleDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Mock data - in real app, this would come from API
  const vehicleStats = {
    totalVehicles: 150,
    activeVehicles: 135,
    underMaintenance: 12,
    pendingDamageReports: 8,
    servicesDue: 15,
    avgUtilization: 85,
  };

  const quickActions = [
    {
      title: 'Add New Vehicle',
      description: 'Register a new vehicle in the fleet',
      action: () => navigate('/vehicles/add'),
      color: 'primary' as const,
    },
    {
      title: 'Report Damage',
      description: 'Report damage for a vehicle',
      action: () => navigate('/damage/report'),
      color: 'error' as const,
    },
    {
      title: 'Schedule Service',
      description: 'Schedule maintenance for vehicles',
      action: () => navigate('/services/schedule'),
      color: 'warning' as const,
    },
    {
      title: 'View All Vehicles',
      description: 'Browse complete vehicle inventory',
      action: () => navigate('/vehicles'),
      color: 'info' as const,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
        Vehicle Management Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Monitor and manage your 2-wheeler EV fleet
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VehicleIcon color="primary" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {vehicleStats.totalVehicles}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Vehicles
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="success.main">
                {vehicleStats.activeVehicles} Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ServiceIcon color="warning" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {vehicleStats.underMaintenance}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Under Maintenance
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="error.main">
                {vehicleStats.servicesDue} Services Due
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DamageIcon color="error" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {vehicleStats.pendingDamageReports}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Damage Reports
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Require attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {vehicleStats.avgUtilization}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Utilization
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="success.main">
                Excellent performance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 2,
                      transform: 'translateY(-2px)',
                    }
                  }}
                  onClick={action.action}
                >
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" color={`${action.color}.main`} gutterBottom>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Recent Activity
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              Recent vehicle activities will appear here once the system is fully integrated.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VehicleDashboard;
