import { useEffect, useState } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
} from '@mui/material'
import {
  Hub as HubIcon,
  // People as PeopleIcon, // Commented out - unused import
  // DirectionsCar as CarIcon, // Commented out - unused import
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { dashboardApi } from '../services/dashboardService'
import { SupplyDashboardMetrics } from '../types/department'
import { formatNumber, formatPercentage, getGreeting } from '../utils/dashboardHelpers'

export default function SupplyDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<SupplyDashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()

    // Refresh data every 3 minutes
    const interval = setInterval(loadDashboardData, 180000)

    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setError(null)
      const data = await dashboardApi.getSupplyDashboard()
      setMetrics(data)
    } catch (err: any) {
      console.error('Error loading supply dashboard:', err)
      setError(err.message || 'Failed to load supply dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error || !metrics) {
    return (
      <Box p={3}>
        <Alert severity="error">{error || 'No data available'}</Alert>
      </Box>
    )
  }

  const StatCard = ({
    title,
    value,
    icon,
    color = 'primary',
    subtitle,
  }: {
    title: string
    value: string | number
    icon: React.ReactNode
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
    subtitle?: string
  }) => (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              backgroundColor: `${color}.main`,
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            {icon}
          </Box>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <Box p={3}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          {getGreeting()}, {user?.firstName || 'Supply Team'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Supply Chain Dashboard - Hub capacity, resource allocation, and coverage
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
        </Typography>
      </Box>

      {/* Hub Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Hubs"
            value={formatNumber(metrics.totalHubs)}
            icon={<HubIcon />}
            color="primary"
            subtitle={`Active: ${metrics.activeHubs}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Hub Utilization"
            value={formatPercentage(metrics.hubUtilization)}
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Cities Covered"
            value={formatNumber(metrics.citiesCovered)}
            icon={<StoreIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Stores Served"
            value={formatNumber(metrics.storesServed)}
            icon={<StoreIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Capacity Overview */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resource Capacity Management
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box mb={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Rider Capacity
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  {formatNumber(metrics.currentRiders)} / {formatNumber(metrics.totalRiderCapacity)}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatPercentage((metrics.currentRiders / metrics.totalRiderCapacity) * 100)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(metrics.currentRiders / metrics.totalRiderCapacity) * 100}
                sx={{ height: 10, borderRadius: 1 }}
                color={
                  (metrics.currentRiders / metrics.totalRiderCapacity) > 0.9 ? 'error' :
                  (metrics.currentRiders / metrics.totalRiderCapacity) > 0.7 ? 'warning' : 'success'
                }
              />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Available Rider Capacity
              </Typography>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {formatNumber(metrics.totalRiderCapacity - metrics.currentRiders)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                riders can be added
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box mb={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Vehicle Capacity
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  {formatNumber(metrics.currentVehicles)} / {formatNumber(metrics.totalVehicleCapacity)}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatPercentage((metrics.currentVehicles / metrics.totalVehicleCapacity) * 100)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(metrics.currentVehicles / metrics.totalVehicleCapacity) * 100}
                sx={{ height: 10, borderRadius: 1 }}
                color={
                  (metrics.currentVehicles / metrics.totalVehicleCapacity) > 0.9 ? 'error' :
                  (metrics.currentVehicles / metrics.totalVehicleCapacity) > 0.7 ? 'warning' : 'success'
                }
              />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Available Vehicle Capacity
              </Typography>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {formatNumber(metrics.totalVehicleCapacity - metrics.currentVehicles)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                vehicles can be added
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Performance Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Coverage Efficiency
            </Typography>
            <Typography variant="h3" color="primary.main" fontWeight="bold">
              {formatPercentage(metrics.coverageEfficiency)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Demand-Supply Ratio
            </Typography>
            <Typography variant="h3" color="info.main" fontWeight="bold">
              {metrics.demandSupplyRatio.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Avg Response Time
            </Typography>
            <Typography variant="h3" color="success.main" fontWeight="bold">
              {metrics.avgResponseTime.toFixed(1)} min
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Alerts */}
      {(metrics.overloadedHubs > 0 || metrics.underutilizedHubs > 0) && (
        <Grid container spacing={3} mb={3}>
          {metrics.overloadedHubs > 0 && (
            <Grid item xs={12} md={6}>
              <Alert severity="error" icon={<WarningIcon />}>
                <Typography variant="body2" fontWeight="bold">
                  Overloaded Hubs
                </Typography>
                <Typography variant="body2">
                  {formatNumber(metrics.overloadedHubs)} hubs are operating over capacity
                </Typography>
              </Alert>
            </Grid>
          )}
          {metrics.underutilizedHubs > 0 && (
            <Grid item xs={12} md={6}>
              <Alert severity="warning" icon={<WarningIcon />}>
                <Typography variant="body2" fontWeight="bold">
                  Underutilized Hubs
                </Typography>
                <Typography variant="body2">
                  {formatNumber(metrics.underutilizedHubs)} hubs have low utilization
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* Hub Details Table */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Hub-wise Resource Allocation
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Hub Name</strong></TableCell>
                <TableCell><strong>City</strong></TableCell>
                <TableCell align="center"><strong>Riders</strong></TableCell>
                <TableCell align="center"><strong>Vehicles</strong></TableCell>
                <TableCell align="center"><strong>Stores Served</strong></TableCell>
                <TableCell align="center"><strong>Utilization</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.hubsData.map((hub) => {
                const riderUtilization = (hub.currentRiders / hub.riderCapacity) * 100
                const vehicleUtilization = (hub.currentVehicles / hub.vehicleCapacity) * 100
                const avgUtilization = (riderUtilization + vehicleUtilization) / 2

                return (
                  <TableRow key={hub.id}>
                    <TableCell>{hub.name}</TableCell>
                    <TableCell>{hub.city}</TableCell>
                    <TableCell align="center">
                      {hub.currentRiders} / {hub.riderCapacity}
                    </TableCell>
                    <TableCell align="center">
                      {hub.currentVehicles} / {hub.vehicleCapacity}
                    </TableCell>
                    <TableCell align="center">{hub.storesServed}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={formatPercentage(avgUtilization)}
                        color={
                          avgUtilization > 90 ? 'error' :
                          avgUtilization > 70 ? 'warning' :
                          avgUtilization > 40 ? 'success' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}
