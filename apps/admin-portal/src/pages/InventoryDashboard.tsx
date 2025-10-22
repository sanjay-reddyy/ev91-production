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
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { dashboardApi } from '../services/dashboardService'
import { InventoryDashboardMetrics } from '../types/department'
import { formatCurrency, formatNumber, formatPercentage, getGreeting } from '../utils/dashboardHelpers'

export default function InventoryDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<InventoryDashboardMetrics | null>(null)
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
      const data = await dashboardApi.getInventoryDashboard()
      setMetrics(data)
    } catch (err: any) {
      console.error('Error loading inventory dashboard:', err)
      setError(err.message || 'Failed to load inventory dashboard')
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
          {getGreeting()}, {user?.firstName || 'Inventory Team'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Inventory Dashboard - Stock levels, parts tracking, and procurement
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
        </Typography>
      </Box>

      {/* Inventory Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total SKUs"
            value={formatNumber(metrics.totalSKUs)}
            icon={<InventoryIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Stock Items"
            value={formatNumber(metrics.inStockItems)}
            icon={<CategoryIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Inventory Value"
            value={formatCurrency(metrics.totalValue)}
            icon={<MoneyIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Turnover Rate"
            value={`${metrics.avgTurnoverRate.toFixed(1)}x`}
            icon={<TrendingUpIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Critical Alerts */}
      {(metrics.outOfStockItems > 0 || metrics.lowStockItems > 0) && (
        <Grid container spacing={3} mb={3}>
          {metrics.outOfStockItems > 0 && (
            <Grid item xs={12} md={6}>
              <Alert severity="error" icon={<WarningIcon />}>
                <Typography variant="body2" fontWeight="bold">
                  Out of Stock Alert
                </Typography>
                <Typography variant="body2">
                  {formatNumber(metrics.outOfStockItems)} items are completely out of stock
                </Typography>
              </Alert>
            </Grid>
          )}
          {metrics.lowStockItems > 0 && (
            <Grid item xs={12} md={6}>
              <Alert severity="warning" icon={<WarningIcon />}>
                <Typography variant="body2" fontWeight="bold">
                  Low Stock Warning
                </Typography>
                <Typography variant="body2">
                  {formatNumber(metrics.lowStockItems)} items are running low on stock
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* Stock Health Indicator */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Overall Stock Health
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Stock Health Score</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatPercentage((metrics.inStockItems / metrics.totalSKUs) * 100)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(metrics.inStockItems / metrics.totalSKUs) * 100}
                sx={{ height: 12, borderRadius: 1 }}
                color={
                  (metrics.inStockItems / metrics.totalSKUs) > 0.7 ? 'success' :
                  (metrics.inStockItems / metrics.totalSKUs) > 0.4 ? 'warning' : 'error'
                }
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main">
                    {formatNumber(metrics.inStockItems)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    In Stock
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h6" color="warning.main">
                    {formatNumber(metrics.lowStockItems)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Low Stock
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h6" color="error.main">
                    {formatNumber(metrics.outOfStockItems)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Out of Stock
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 3,
                bgcolor: (metrics.inStockItems / metrics.totalSKUs) > 0.7 ? 'success.light' : 'warning.light',
                borderRadius: 2,
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Inventory Status
              </Typography>
              <Typography variant="h4" fontWeight="bold" mt={1}>
                {(metrics.inStockItems / metrics.totalSKUs) > 0.7 ? 'Healthy' :
                 (metrics.inStockItems / metrics.totalSKUs) > 0.4 ? 'Needs Attention' : 'Critical'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Procurement Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Procurement Activity
            </Typography>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body2" color="text.secondary">
                Pending Purchase Orders
              </Typography>
              <Chip label={formatNumber(metrics.pendingPurchaseOrders)} color="warning" />
            </Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body2" color="text.secondary">
                PO Value
              </Typography>
              <Chip label={formatCurrency(metrics.poValue)} color="primary" />
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Expected Deliveries
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatNumber(metrics.expectedDeliveries)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Usage & Consumption
            </Typography>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body2" color="text.secondary">
                Monthly Consumption
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatNumber(metrics.monthlyConsumption)}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body2" color="text.secondary">
                Fast Moving Items
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatNumber(metrics.fastMovingItemsCount)}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Slow Moving Items
              </Typography>
              <Chip label={formatNumber(metrics.slowMovingItemsCount)} color="info" />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Requested Parts */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Critical Items - Immediate Attention Needed
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Item Name</strong></TableCell>
                <TableCell align="center"><strong>Current Stock</strong></TableCell>
                <TableCell align="center"><strong>Minimum Stock</strong></TableCell>
                <TableCell align="center"><strong>Affected Hubs</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.criticalItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell align="center">{formatNumber(item.currentStock)}</TableCell>
                  <TableCell align="center">{formatNumber(item.minimumStock)}</TableCell>
                  <TableCell align="center">
                    <Chip label={formatNumber(item.affectedHubs)} color="warning" size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={
                        item.currentStock === 0 ? 'Out of Stock' :
                        item.currentStock < item.minimumStock ? 'Below Minimum' : 'Low Stock'
                      }
                      color={
                        item.currentStock === 0 ? 'error' :
                        item.currentStock < item.minimumStock ? 'warning' : 'info'
                      }
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
