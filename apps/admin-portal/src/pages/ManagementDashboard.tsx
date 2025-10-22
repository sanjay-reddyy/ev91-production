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
  Divider,
} from '@mui/material'
import {
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Store as StoreIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as ShippingIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { dashboardApi } from '../services/dashboardService'
import { ManagementDashboardMetrics } from '../types/department'
import { formatCurrency, formatNumber, formatPercentage, getGreeting } from '../utils/dashboardHelpers'

export default function ManagementDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<ManagementDashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()

    // Refresh every 2 minutes
    const interval = setInterval(loadDashboardData, 120000)

    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setError(null)
      const data = await dashboardApi.getManagementDashboard()
      setMetrics(data)
    } catch (err: any) {
      console.error('Error loading management dashboard:', err)
      setError(err.message || 'Failed to load management dashboard')
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

  const DepartmentCard = ({
    title,
    icon,
    color,
    metrics: deptMetrics,
  }: {
    title: string
    icon: React.ReactNode
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
    metrics: Array<{ label: string; value: string | number }>
  }) => (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
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
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {deptMetrics.map((metric, index) => (
          <Box key={index} display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              {metric.label}
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {metric.value}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  )

  const QuickStatCard = ({
    label,
    value,
    icon,
    color = 'primary',
    trend,
  }: {
    label: string
    value: string | number
    icon: React.ReactNode
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
    trend?: number
  }) => (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Box sx={{ color: `${color}.main` }}>{icon}</Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
      <Typography variant="h4" fontWeight="bold">
        {value}
      </Typography>
      {trend !== undefined && (
        <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
          <TrendingUpIcon
            sx={{
              fontSize: 16,
              color: trend > 0 ? 'success.main' : 'error.main',
              transform: trend < 0 ? 'rotate(180deg)' : 'none',
            }}
          />
          <Typography
            variant="caption"
            color={trend > 0 ? 'success.main' : 'error.main'}
          >
            {formatPercentage(Math.abs(trend))}
          </Typography>
        </Box>
      )}
    </Paper>
  )

  return (
    <Box p={3}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          {getGreeting()}, {user?.firstName || 'Management'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Executive Dashboard - Consolidated view across all departments
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
        </Typography>
      </Box>

      {/* Key Performance Indicators */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <QuickStatCard
            label="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            icon={<MoneyIcon />}
            color="success"
            trend={metrics.revenueGrowth}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickStatCard
            label="Active Riders"
            value={formatNumber(metrics.activeRiders)}
            icon={<PeopleIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickStatCard
            label="Active Vehicles"
            value={formatNumber(metrics.activeVehicles)}
            icon={<CarIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickStatCard
            label="Total Stores"
            value={formatNumber(metrics.totalStores)}
            icon={<StoreIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Critical Alerts */}
      {metrics.criticalAlerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="bold">
            System Alerts ({metrics.criticalAlerts.length})
          </Typography>
          {metrics.criticalAlerts.slice(0, 3).map((alert, index) => (
            <Typography key={index} variant="body2">
              • [{alert.department}] {alert.message}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Department Performance Overview */}
      <Typography variant="h5" gutterBottom mb={2}>
        Department Performance
      </Typography>

      <Grid container spacing={3} mb={3}>
        {/* Operations Department */}
        <Grid item xs={12} md={6}>
          <DepartmentCard
            title="Operations"
            icon={<ShippingIcon />}
            color="primary"
            metrics={[
              { label: 'Active Riders', value: formatNumber(metrics.activeRiders) },
              { label: 'Total Deliveries', value: formatNumber(metrics.totalDeliveries) },
              { label: 'Avg Delivery Time', value: `${metrics.avgDeliveryTime.toFixed(1)} min` },
              { label: 'On-Time Rate', value: formatPercentage(metrics.onTimeRate) },
            ]}
          />
        </Grid>

        {/* Sales Department */}
        <Grid item xs={12} md={6}>
          <DepartmentCard
            title="Sales"
            icon={<StoreIcon />}
            color="success"
            metrics={[
              { label: 'Total Clients', value: formatNumber(metrics.totalClients) },
              { label: 'Total Stores', value: formatNumber(metrics.totalStores) },
              { label: 'New Clients (Month)', value: formatNumber(metrics.newClientsThisMonth) },
              { label: 'Revenue', value: formatCurrency(metrics.totalRevenue) },
            ]}
          />
        </Grid>

        {/* Finance Department */}
        <Grid item xs={12} md={6}>
          <DepartmentCard
            title="Finance"
            icon={<MoneyIcon />}
            color="warning"
            metrics={[
              { label: 'Total Revenue', value: formatCurrency(metrics.totalRevenue) },
              { label: 'Revenue Growth', value: formatPercentage(metrics.revenueGrowth) },
              { label: 'Net Profit', value: formatCurrency(metrics.netProfit) },
              { label: 'Profit Margin', value: formatPercentage(metrics.profitMargin) },
            ]}
          />
        </Grid>

        {/* Fleet/Vehicle Department */}
        <Grid item xs={12} md={6}>
          <DepartmentCard
            title="Fleet Management"
            icon={<CarIcon />}
            color="info"
            metrics={[
              { label: 'Total Vehicles', value: formatNumber(metrics.totalVehicles) },
              { label: 'Active Vehicles', value: formatNumber(metrics.activeVehicles) },
              { label: 'Total Riders', value: formatNumber(metrics.totalRiders) },
              { label: 'Total Hubs', value: formatNumber(metrics.totalHubs) },
            ]}
          />
        </Grid>
      </Grid>

      {/* System Status */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Overall System Metrics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="h5" color="primary.main" fontWeight="bold">
                {formatNumber(metrics.totalRiders)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Riders
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="h5" color="success.main" fontWeight="bold">
                {formatPercentage(metrics.customerSatisfaction)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customer Satisfaction
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="h5" color="info.main" fontWeight="bold">
                {formatNumber(metrics.totalHubs)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Hubs
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}
