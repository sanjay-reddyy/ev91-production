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
  LinearProgress,
} from '@mui/material'
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  PieChart as PieChartIcon,
  ShowChart as ChartIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { dashboardApi } from '../services/dashboardService'
import { FinanceDashboardMetrics } from '../types/department'
import { formatCurrency, formatNumber, formatPercentage, getGreeting } from '../utils/dashboardHelpers'

export default function FinanceDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<FinanceDashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()

    // Refresh data every 5 minutes
    const interval = setInterval(loadDashboardData, 300000)

    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setError(null)
      const data = await dashboardApi.getFinanceDashboard()
      setMetrics(data)
    } catch (err: any) {
      console.error('Error loading finance dashboard:', err)
      setError(err.message || 'Failed to load finance dashboard')
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
    trend,
  }: {
    title: string
    value: string | number
    icon: React.ReactNode
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
    subtitle?: string
    trend?: number
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
            {trend !== undefined && (
              <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                <TrendingUpIcon
                  sx={{
                    fontSize: 16,
                    color: trend > 0 ? 'success.main' : 'error.main',
                    transform: trend < 0 ? 'rotate(180deg)' : 'none'
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
          {getGreeting()}, {user?.firstName || 'Finance Team'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Finance Department Dashboard - Revenue, costs, and rider payouts
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
        </Typography>
      </Box>

      {/* Revenue Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            icon={<AccountBalanceIcon />}
            color="success"
            trend={metrics.revenueGrowth}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(metrics.monthlyRevenue)}
            icon={<MoneyIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Gross Profit"
            value={formatCurrency(metrics.grossProfit)}
            icon={<ChartIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Net Profit"
            value={formatCurrency(metrics.netProfit)}
            icon={<PieChartIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Rider Payouts */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Rider Payout Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Rider Payouts
              </Typography>
              <Typography variant="h5" color="primary.main" fontWeight="bold">
                {formatCurrency(metrics.riderPayouts)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Pending Payouts
              </Typography>
              <Typography variant="h5" color="warning.main" fontWeight="bold">
                {formatCurrency(metrics.pendingPayouts)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Avg Payout Per Rider
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(metrics.avgPayoutPerRider)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Cost Breakdown */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cost Analysis
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Rider Payouts</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(metrics.riderPayouts)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.monthlyRevenue > 0 ? (metrics.riderPayouts / metrics.monthlyRevenue) * 100 : 0}
                sx={{ height: 8, borderRadius: 1 }}
                color="primary"
              />
            </Box>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Maintenance Costs</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(metrics.maintenanceCosts)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.monthlyRevenue > 0 ? (metrics.maintenanceCosts / metrics.monthlyRevenue) * 100 : 0}
                sx={{ height: 8, borderRadius: 1 }}
                color="warning"
              />
            </Box>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Operational Costs</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(metrics.operationalCosts)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.monthlyRevenue > 0 ? (metrics.operationalCosts / metrics.monthlyRevenue) * 100 : 0}
                sx={{ height: 8, borderRadius: 1 }}
                color="error"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 3,
                bgcolor: 'success.light',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="success.dark">
                Net Profit
              </Typography>
              <Typography variant="h3" color="success.dark" fontWeight="bold">
                {formatCurrency(metrics.netProfit)}
              </Typography>
              <Typography variant="body2" color="success.dark" mt={1}>
                Profit Margin: {formatPercentage(metrics.profitMargin)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Payment Status */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cash Flow Overview
            </Typography>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Cash Inflow</Typography>
                <Chip label={formatCurrency(metrics.cashInflow)} color="success" size="small" />
              </Box>
            </Box>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Cash Outflow</Typography>
                <Chip label={formatCurrency(metrics.cashOutflow)} color="warning" size="small" />
              </Box>
            </Box>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Net Cash Flow</Typography>
                <Chip
                  label={formatCurrency(metrics.netCashFlow)}
                  color={metrics.netCashFlow > 0 ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Financial Alerts
            </Typography>
            {metrics.pendingPayouts > 0 && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                Pending payouts: {formatCurrency(metrics.pendingPayouts)}
              </Alert>
            )}
            {metrics.overduePayments > 0 && (
              <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
                {formatNumber(metrics.overduePayments)} overdue payments require attention
              </Alert>
            )}
            {metrics.profitMargin < 10 && (
              <Alert severity="warning" icon={<WarningIcon />}>
                Low profit margin: {formatPercentage(metrics.profitMargin)}
              </Alert>
            )}
            {metrics.pendingPayouts === 0 && metrics.overduePayments === 0 && metrics.profitMargin >= 10 && (
              <Alert severity="success">
                All financial metrics are healthy
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Payout Summary */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Payout Summary
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {formatCurrency(metrics.riderPayouts)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Rider Payouts
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {formatCurrency(metrics.pendingPayouts)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Payouts
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {formatCurrency(metrics.processedPayoutsThisWeek)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Processed This Week
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}
