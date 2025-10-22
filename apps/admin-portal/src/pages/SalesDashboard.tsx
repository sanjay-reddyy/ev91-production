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
} from '@mui/material'
import {
  Store as StoreIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { dashboardApi } from '../services/dashboardService'
import { SalesDashboardMetrics } from '../types/department'
import { formatCurrency, formatNumber, formatPercentage, getGreeting } from '../utils/dashboardHelpers'

export default function SalesDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<SalesDashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()

    // Refresh data every 2 minutes
    const interval = setInterval(loadDashboardData, 120000)

    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setError(null)
      const data = await dashboardApi.getSalesDashboard()
      setMetrics(data)
    } catch (err: any) {
      console.error('Error loading sales dashboard:', err)
      setError(err.message || 'Failed to load sales dashboard')
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
          {getGreeting()}, {user?.firstName || 'Sales Team'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Sales Department Dashboard - Real-time sales performance and client metrics
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
        </Typography>
      </Box>

      {/* Overview KPIs */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Clients"
            value={formatNumber(metrics.totalClients)}
            icon={<BusinessIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Stores"
            value={formatNumber(metrics.totalStores)}
            icon={<StoreIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Stores Per Client"
            value={(metrics.totalStores / metrics.totalClients || 0).toFixed(2)}
            icon={<AssessmentIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="New Clients (Month)"
            value={formatNumber(metrics.newClientsThisMonth)}
            icon={<TrendingUpIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Revenue Metrics */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Revenue Performance
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Avg Revenue Per Client
              </Typography>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                {formatCurrency(metrics.avgRevenuePerClient)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Avg Revenue Per Store
              </Typography>
              <Typography variant="h5" color="primary.main" fontWeight="bold">
                {formatCurrency(metrics.avgRevenuePerStore)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Target Achievement
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {formatPercentage(metrics.achievementPercentage)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                of target revenue
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Client Growth */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Client Growth Metrics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {formatNumber(metrics.newClientsThisMonth)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New This Month
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {formatPercentage(metrics.conversionRate)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Conversion Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {formatPercentage(metrics.clientChurnRate)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Churn Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {formatNumber(metrics.leadsInPipeline)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Leads in Pipeline
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* City Distribution */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          City-wise Distribution
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>City</strong></TableCell>
                <TableCell align="center"><strong>Stores</strong></TableCell>
                <TableCell align="center"><strong>Revenue</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.storesByCity.map((city, index) => (
                <TableRow key={index}>
                  <TableCell>{city.city}</TableCell>
                  <TableCell align="center">{formatNumber(city.count)}</TableCell>
                  <TableCell align="center">{formatCurrency(city.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Top Clients */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Top Clients by Performance
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Client Name</strong></TableCell>
                <TableCell align="center"><strong>Revenue</strong></TableCell>
                <TableCell align="center"><strong>Stores</strong></TableCell>
                <TableCell align="center"><strong>Growth</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.topClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell align="center">{formatCurrency(client.revenue)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={client.stores}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${formatPercentage(client.growth)}`}
                      color={client.growth > 0 ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}
