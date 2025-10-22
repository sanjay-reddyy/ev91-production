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
  Chip,
} from '@mui/material'
import {
  People as PeopleIcon,
  LocalShipping as TruckIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ClockIcon,
  TrendingUp as TrendingUpIcon,
  FavoriteBorder as HeartIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { dashboardApi } from '../services/dashboardService'
import { OperationsDashboardMetrics } from '../types/department'
import { formatNumber, formatPercentage, getGreeting } from '../utils/dashboardHelpers'

export default function OperationsDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<OperationsDashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()

    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(loadDashboardData, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setError(null)

      // Fetch from real dashboard API endpoint
      const metricsData = await dashboardApi.getOperationsDashboard()
      setMetrics(metricsData)

    } catch (err: any) {
      console.error('Error loading dashboard data:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )
  }

  if (!metrics) return null

  const userName = user ? user.firstName : 'User'
  const greeting = getGreeting()

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          {greeting}, {userName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Operations Dashboard - Real-time monitoring
        </Typography>
        <Chip
          label={`Last updated: ${new Date(metrics.lastUpdated).toLocaleTimeString()}`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </Box>

      {/* Real-time KPIs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PeopleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Active Riders
                </Typography>
              </Box>
              <Typography variant="h4">{metrics.activeRiders}</Typography>
              <Typography variant="caption" color="success.main">
                LIVE
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TruckIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Ongoing Deliveries
                </Typography>
              </Box>
              <Typography variant="h4">{metrics.ongoingDeliveries}</Typography>
              <Typography variant="caption" color="primary.main">
                LIVE
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircleIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Completed Today
                </Typography>
              </Box>
              <Typography variant="h4">{metrics.completedDeliveriesToday}</Typography>
              <Typography variant="caption" color="text.secondary">
                +{formatPercentage(12.5)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ClockIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Avg Time
                </Typography>
              </Box>
              <Typography variant="h4">{Math.round(metrics.avgDeliveryTime)} min</Typography>
              <Typography variant="caption" color="success.main">
                -3 min
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  On-Time Rate
                </Typography>
              </Box>
              <Typography variant="h4">{formatPercentage(metrics.onTimeDeliveryRate, 0)}</Typography>
              <Typography variant="caption" color="success.main">
                Target: 90%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <HeartIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Satisfaction
                </Typography>
              </Box>
              <Typography variant="h4">{formatPercentage(metrics.customerSatisfaction, 0)}</Typography>
              <Typography variant="caption" color="success.main">
                +2.3%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Riders List */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Live Riders ({metrics.activeRiders})
            </Typography>
            <Box>
              {metrics.liveRiders.map((rider) => (
                <Box
                  key={rider.riderId}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    mb: 1,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2">{rider.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rider.todayDeliveries} deliveries • {formatNumber(rider.todayEarnings)}
                    </Typography>
                  </Box>
                  <Chip
                    label={rider.status}
                    size="small"
                    color={rider.status === 'ACTIVE' ? 'success' : 'default'}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Hourly Performance
            </Typography>
            <Box>
              {metrics.hourlyPerformance && metrics.hourlyPerformance.length > 0 ? (
                metrics.hourlyPerformance.map((hour) => (
                  <Box
                    key={hour.hour}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      mb: 1,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2">{hour.hour}</Typography>
                    <Box display="flex" gap={3}>
                      <Typography variant="body2">
                        {hour.deliveries} deliveries
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(hour.avgTime)} min avg
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No hourly performance data available
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Issues & Alerts */}
      {(metrics.delayedDeliveries > 0 || metrics.riderIssues > 0) && (
        <Box mt={3}>
          <Alert severity="warning">
            {metrics.delayedDeliveries > 0 && (
              <Typography variant="body2">
                • {metrics.delayedDeliveries} delayed deliveries need attention
              </Typography>
            )}
            {metrics.riderIssues > 0 && (
              <Typography variant="body2">
                • {metrics.riderIssues} rider issues reported
              </Typography>
            )}
          </Alert>
        </Box>
      )}
    </Box>
  )
}
