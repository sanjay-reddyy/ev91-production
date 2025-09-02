import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Stack,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  ElectricCar as ChargingIcon,
  Build as ServiceIcon,
  LocalParking as ParkingIcon,
  Security as SecurityIcon,
  Videocam as CCTVIcon,
  LocalCarWash as WashIcon,
  Public as PublicIcon,
  Schedule as ScheduleIcon,
  Person as ManagerIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AttachMoney as MoneyIcon,
  DirectionsCar as VehicleIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { hubService, cityService, type Hub, type City } from '../services/hubService';

const HubDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hub, setHub] = useState<Hub | null>(null);
  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadHubDetails();
    }
  }, [id]);

  const loadHubDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const hubData = await hubService.getHubById(id);
      setHub(hubData);

      // Load city details
      if (hubData.cityId) {
        try {
          const cityData = await cityService.getCityById(hubData.cityId);
          setCity(cityData);
        } catch (cityError) {
          console.warn('Could not load city details:', cityError);
        }
      }
    } catch (err) {
      console.error('Error loading hub details:', err);
      setError('Failed to load hub details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getHubTypeIcon = (hubType: string) => {
    switch (hubType.toLowerCase()) {
      case 'charging':
        return <ChargingIcon />;
      case 'service':
        return <ServiceIcon />;
      default:
        return <BusinessIcon />;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !hub) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Hub not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/hubs')}
        >
          Back to Hubs
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/hubs')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              {hub.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {hub.code} • {city?.name || 'Unknown City'}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/hubs/${hub.id}/edit`)}
          >
            Edit Hub
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Information */}
        <Grid item xs={12} md={8}>
          {/* Basic Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hub Name
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {hub.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hub Code
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {hub.code}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hub Type
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getHubTypeIcon(hub.hubType)}
                    <Typography variant="body1">
                      {hub.hubType}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {hub.hubCategory || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={hub.status}
                    color={getStatusColor(hub.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Operating Hours
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ScheduleIcon fontSize="small" />
                    <Typography variant="body1">
                      {hub.is24x7 ? '24x7' : hub.operatingHours || 'Not specified'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Location Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Address
                  </Typography>
                  <Box display="flex" alignItems="flex-start" gap={1}>
                    <LocationIcon fontSize="small" sx={{ mt: 0.5 }} />
                    <Typography variant="body1">
                      {hub.address}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    PIN Code
                  </Typography>
                  <Typography variant="body1">
                    {hub.pinCode}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Landmark
                  </Typography>
                  <Typography variant="body1">
                    {hub.landmark || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Coordinates
                  </Typography>
                  <Typography variant="body1">
                    {hub.latitude}, {hub.longitude}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    City
                  </Typography>
                  <Typography variant="body1">
                    {city?.displayName || city?.name || 'Unknown'}
                    {city?.state && `, ${city.state}`}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Capacity & Operations */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Capacity & Operations
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center" p={2}>
                    <VehicleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" color="primary">
                      {hub.vehicleCapacity || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vehicle Capacity
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center" p={2}>
                    <ChargingIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" color="success.main">
                      {hub.chargingPoints}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Charging Points
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center" p={2}>
                    <ServiceIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" color="info.main">
                      {hub.serviceCapacity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Service Capacity/Day
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Financial Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Monthly Rent
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatCurrency(hub.monthlyRent)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Setup Cost
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatCurrency(hub.setupCost)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Operational Cost
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatCurrency(hub.operationalCost)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Contact Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              {hub.managerName && (
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar>
                    <ManagerIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">Manager</Typography>
                    <Typography variant="body1">{hub.managerName}</Typography>
                  </Box>
                </Box>
              )}
              {hub.contactNumber && (
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <PhoneIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2">Contact</Typography>
                    <Typography variant="body1">{hub.contactNumber}</Typography>
                  </Box>
                </Box>
              )}
              {hub.emailAddress && (
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <EmailIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2">Email</Typography>
                    <Typography variant="body1">{hub.emailAddress}</Typography>
                  </Box>
                </Box>
              )}
              {hub.alternateContact && (
                <Box display="flex" alignItems="center" gap={2}>
                  <PhoneIcon color="secondary" />
                  <Box>
                    <Typography variant="subtitle2">Alternate Contact</Typography>
                    <Typography variant="body1">{hub.alternateContact}</Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Features & Facilities */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Features & Facilities
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ChargingIcon color={hub.hasChargingStation ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Charging Station"
                    secondary={hub.hasChargingStation ? 'Available' : 'Not Available'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ServiceIcon color={hub.hasServiceCenter ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Service Center"
                    secondary={hub.hasServiceCenter ? 'Available' : 'Not Available'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ParkingIcon color={hub.hasParking ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Parking"
                    secondary={hub.hasParking ? 'Available' : 'Not Available'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color={hub.hasSecurity ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Security"
                    secondary={hub.hasSecurity ? 'Available' : 'Not Available'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CCTVIcon color={hub.hasCCTV ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="CCTV"
                    secondary={hub.hasCCTV ? 'Available' : 'Not Available'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WashIcon color={hub.hasWashFacility ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Wash Facility"
                    secondary={hub.hasWashFacility ? 'Available' : 'Not Available'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PublicIcon color={hub.isPublicAccess ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Public Access"
                    secondary={hub.isPublicAccess ? 'Available' : 'Not Available'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Created</Typography>
                  <Typography variant="body2">
                    {new Date(hub.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Last Updated</Typography>
                  <Typography variant="body2">
                    {new Date(hub.updatedAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Operational</Typography>
                  <Chip
                    label={hub.is24x7 ? '24x7' : 'Limited Hours'}
                    size="small"
                    color={hub.is24x7 ? 'success' : 'default'}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HubDetails;
