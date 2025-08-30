import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  Avatar,
  IconButton,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  Skeleton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  DirectionsBike as VehicleIcon,
  Speed as SpeedIcon,
  Assessment as AnalyticsIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  PieChart as PieChartIcon,
  AttachMoney as CostIcon,
  Engineering as MaintenanceIcon,
  Assignment as AssignmentIcon,
  Factory as OEMIcon,
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { vehicleService } from '../services/vehicleService'

// Chart Component
const VehicleChart: React.FC<{ 
  data: Array<{ label: string; value: number; color?: string }>
  title: string
  subtitle?: string
}> = ({ data, title, subtitle }) => {
  const maxValue = Math.max(...data.map(item => item.value))
  
  return (
    <Card>
      <CardHeader 
        title={title}
        subheader={subtitle}
        titleTypographyProps={{ variant: 'h6', fontSize: '1rem' }}
        avatar={<PieChartIcon color="primary" />}
      />
      <CardContent>
        {data.length === 0 ? (
          <Typography variant="body2" color="textSecondary" textAlign="center">
            No data available
          </Typography>
        ) : (
          data.map((item, index) => (
            <Box key={index} mb={2}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="textSecondary">
                  {item.label}
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {item.value.toLocaleString()}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={maxValue > 0 ? (item.value / maxValue) * 100 : 0}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: item.color || 'primary.main',
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  )
}

const VehicleDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('month')
  const [selectedHub, setSelectedHub] = useState('')

  // Fetch vehicle analytics
  const {
    data: vehicleAnalyticsData,
    isLoading: vehicleAnalyticsLoading,
    error: vehicleAnalyticsError,
    refetch: refetchVehicleAnalytics,
  } = useQuery(
    ['vehicle-analytics', timeRange, selectedHub],
    () => vehicleService.getVehicleAnalytics(timeRange, selectedHub || undefined),
    {
      refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  // Fetch service analytics
  const {
    data: serviceAnalyticsData,
    isLoading: serviceAnalyticsLoading,
  } = useQuery(
    ['service-analytics', timeRange],
    () => vehicleService.getServiceAnalytics(timeRange),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Fetch damage analytics
  const {
    data: damageAnalyticsData,
    isLoading: damageAnalyticsLoading,
  } = useQuery(
    ['damage-analytics', timeRange],
    () => vehicleService.getDamageAnalytics(timeRange),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Fetch fleet performance
  const {
    data: fleetPerformanceData,
    isLoading: fleetPerformanceLoading,
  } = useQuery(
    ['fleet-performance', timeRange],
    () => vehicleService.getFleetPerformance(timeRange),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const vehicleAnalytics = vehicleAnalyticsData?.data || {}
  const serviceAnalytics = serviceAnalyticsData?.data || {}
  const damageAnalytics = damageAnalyticsData?.data || {}
  const fleetPerformance = fleetPerformanceData?.data || {}

  // Loading state
  if (vehicleAnalyticsLoading || serviceAnalyticsLoading || damageAnalyticsLoading || fleetPerformanceLoading) {
    return (
      <Box p={3}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          Vehicle Management Dashboard
        </Typography>
        <Grid container spacing={3}>
          {Array.from(new Array(8)).map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="rectangular" height={100} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    )
  }

  // Error state
  if (vehicleAnalyticsError) {
    return (
      <Box p={3}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          Vehicle Management Dashboard
        </Typography>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={() => refetchVehicleAnalytics()}>
            Retry
          </Button>
        }>
          Failed to load dashboard data. Please try again.
        </Alert>
      </Box>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Vehicle Management Dashboard
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="week">Last 7 days</MenuItem>
              <MenuItem value="month">Last 30 days</MenuItem>
              <MenuItem value="quarter">Last 3 months</MenuItem>
              <MenuItem value="year">Last 12 months</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Hub Filter</InputLabel>
            <Select
              value={selectedHub}
              label="Hub Filter"
              onChange={(e) => setSelectedHub(e.target.value)}
            >
              <MenuItem value="">All Hubs</MenuItem>
              {/* Add hub options here */}
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => refetchVehicleAnalytics()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Fleet Overview Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {(vehicleAnalytics.summary?.totalVehicles || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Fleet Size
                  </Typography>
                  <Typography variant="caption" color="primary">
                    All registered vehicles
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light' }}>
                  <VehicleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {vehicleAnalytics.summary?.activeVehicles || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Available Vehicles
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    Ready for assignment
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light' }}>
                  <CheckCircleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {vehicleAnalytics.summary?.assignedVehicles || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Assigned Vehicles
                  </Typography>
                  <Typography variant="caption" color="info.main">
                    Currently in use
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light' }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {vehicleAnalytics.summary?.underMaintenance || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Under Maintenance
                  </Typography>
                  <Typography variant="caption" color="warning.main">
                    Service & repairs
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light' }}>
                  <MaintenanceIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fleet Performance Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Fleet Performance Metrics" 
              avatar={<SpeedIcon color="primary" />}
              action={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {fleetPerformance.fleet?.utilizationRate || 0}%
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Utilization Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {fleetPerformance.fleet?.averageAge || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Avg Age (months)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight="bold" color="info.main">
                      {(fleetPerformance.fleet?.averageMileage || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Avg Mileage (km)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight="bold" color="warning.main">
                      {formatCurrency(fleetPerformance.costs?.costPerVehicle || 0)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Cost per Vehicle
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="Cost Analytics" 
              avatar={<CostIcon color="primary" />}
            />
            <CardContent>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="textSecondary">Total Maintenance</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(fleetPerformance.costs?.totalMaintenanceCosts || 0)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="textSecondary">Cost per KM</Typography>
                <Typography variant="body2" fontWeight="medium">
                  ₹{(fleetPerformance.costs?.costPerKm || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="textSecondary">Service Cost</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(serviceAnalytics.summary?.totalCost || 0)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Damage Cost</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(damageAnalytics.summary?.totalCost || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts and Analytics Row */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <VehicleChart
            title="Vehicle Status Distribution"
            subtitle="Current operational status"
            data={(vehicleAnalytics.statusDistribution || []).map((status: any) => ({
              label: status.status,
              value: status.count,
              color: status.status === 'Available' ? '#4caf50' : 
                     status.status === 'Assigned' ? '#2196f3' : 
                     status.status === 'Under Maintenance' ? '#ff9800' : '#f44336',
            }))}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <VehicleChart
            title="OEM Distribution"
            subtitle="Vehicles by manufacturer"
            data={(vehicleAnalytics.oemAnalytics || []).slice(0, 5).map((oem: any, index: number) => ({
              label: oem.oem,
              value: oem.vehicleCount,
              color: ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'][index % 5],
            }))}
          />
        </Grid>
      </Grid>

      {/* Service and Damage Analytics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <VehicleChart
            title="Service Type Distribution"
            subtitle={`Services in ${timeRange}`}
            data={Object.entries(serviceAnalytics.serviceTypeDistribution || {}).map(([type, count]: [string, any], index) => ({
              label: type,
              value: count,
              color: ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#607d8b'][index % 6],
            }))}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <VehicleChart
            title="Damage Severity Analysis"
            subtitle={`Damages in ${timeRange}`}
            data={Object.entries(damageAnalytics.severityDistribution || {}).map(([severity, count]: [string, any]) => ({
              label: severity,
              value: count,
              color: severity === 'Low' ? '#4caf50' : 
                     severity === 'Medium' ? '#ff9800' : 
                     severity === 'High' ? '#f44336' : '#9c27b0',
            }))}
          />
        </Grid>
      </Grid>

      {/* Bottom Row: Recent Activities and Top Vehicles */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="OEM Performance Overview" 
              avatar={<OEMIcon color="primary" />}
            />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>OEM</TableCell>
                      <TableCell>Model</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell>Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(vehicleAnalytics.oemAnalytics || []).slice(0, 5).map((oem: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{oem.oem}</TableCell>
                        <TableCell>{oem.model}</TableCell>
                        <TableCell align="right">{oem.vehicleCount}</TableCell>
                        <TableCell>
                          <Chip 
                            label={oem.vehicleType} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Fleet Health Indicators" 
              avatar={<AnalyticsIcon color="primary" />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center" p={2}>
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      {fleetPerformance.efficiency?.serviceFrequency || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Services This Period
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center" p={2}>
                    <Typography variant="h6" color="warning.main" fontWeight="bold">
                      {fleetPerformance.efficiency?.damageFrequency || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Damages This Period
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center" p={2}>
                    <Typography variant="h6" color="info.main" fontWeight="bold">
                      {serviceAnalytics.summary?.averageCost ? formatCurrency(serviceAnalytics.summary.averageCost) : '₹0'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Avg Service Cost
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center" p={2}>
                    <Typography variant="h6" color="error.main" fontWeight="bold">
                      {damageAnalytics.summary?.averageCost ? formatCurrency(damageAnalytics.summary.averageCost) : '₹0'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Avg Damage Cost
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default VehicleDashboard
