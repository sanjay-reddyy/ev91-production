import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Paper,
  Chip,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  Skeleton,
  Divider,
  Badge,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Inventory2 as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as OrderIcon,
  Speed as SpeedIcon,
  Assessment as AnalyticsIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  LocalShipping as ShippingIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { dashboardService, analyticsService } from '../services/sparePartsService'

// Chart Component (using simple progress bars for now - can be replaced with proper charts)
const SimpleBarChart: React.FC<{ 
  data: Array<{ label: string; value: number; color?: string }>
  title: string
}> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(item => item.value))
  
  return (
    <Card>
      <CardHeader 
        title={title}
        titleTypographyProps={{ variant: 'h6', fontSize: '1rem' }}
        avatar={<PieChartIcon color="primary" />}
      />
      <CardContent>
        {data.map((item, index) => (
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
              value={(item.value / maxValue) * 100}
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
        ))}
      </CardContent>
    </Card>
  )
}

const SparePartsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d')

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery(
    ['dashboard-stats'],
    () => dashboardService.getStats(),
    {
      refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  // Fetch analytics data
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
  } = useQuery(
    ['analytics-usage', timeRange],
    () => analyticsService.getUsageAnalysis({ 
      startDate: new Date(Date.now() - (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const stats = dashboardData?.data || {}
  const analytics = analyticsData?.data || {}

  // Loading state
  if (dashboardLoading) {
    return (
      <Box p={3}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          Spare Parts Dashboard
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
  if (dashboardError) {
    return (
      <Box p={3}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          Spare Parts Dashboard
        </Typography>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={() => refetchDashboard()}>
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

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Spare Parts Dashboard
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => refetchDashboard()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Key Metrics Row */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {(stats.totalParts || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Parts
                  </Typography>
                  {stats.usageTrend && (
                    <Box display="flex" alignItems="center" mt={1}>
                      {stats.usageTrend > 0 ? (
                        <TrendingUpIcon fontSize="small" color="success" />
                      ) : (
                        <TrendingDownIcon fontSize="small" color="error" />
                      )}
                      <Typography 
                        variant="caption" 
                        color={stats.usageTrend > 0 ? 'success.main' : 'error.main'}
                        ml={0.5}
                      >
                        {formatPercent(stats.usageTrend)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light' }}>
                  <InventoryIcon />
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
                    {formatCurrency(stats.totalValue || 0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Inventory Value
                  </Typography>
                  {stats.costTrend && (
                    <Box display="flex" alignItems="center" mt={1}>
                      {stats.costTrend > 0 ? (
                        <TrendingUpIcon fontSize="small" color="success" />
                      ) : (
                        <TrendingDownIcon fontSize="small" color="error" />
                      )}
                      <Typography 
                        variant="caption" 
                        color={stats.costTrend > 0 ? 'success.main' : 'error.main'}
                        ml={0.5}
                      >
                        {formatPercent(stats.costTrend)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Avatar sx={{ bgcolor: 'success.light' }}>
                  <MoneyIcon />
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
                    {stats.lowStockAlerts || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Low Stock Alerts
                  </Typography>
                  <Typography variant="caption" color="warning.main">
                    Needs immediate attention
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light' }}>
                  <WarningIcon />
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
                    {stats.pendingOrders || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Orders
                  </Typography>
                  {stats.ordersTrend && (
                    <Box display="flex" alignItems="center" mt={1}>
                      {stats.ordersTrend > 0 ? (
                        <TrendingUpIcon fontSize="small" color="success" />
                      ) : (
                        <TrendingDownIcon fontSize="small" color="error" />
                      )}
                      <Typography 
                        variant="caption" 
                        color={stats.ordersTrend > 0 ? 'success.main' : 'error.main'}
                        ml={0.5}
                      >
                        {formatPercent(stats.ordersTrend)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Avatar sx={{ bgcolor: 'info.light' }}>
                  <OrderIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Metrics Row */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Performance Metrics" 
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
                      {((stats.stockAvailability || 0) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Stock Availability
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {((stats.orderFulfillmentRate || 0) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Order Fulfillment
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight="bold" color="info.main">
                      {(stats.inventoryTurnover || 0).toFixed(1)}x
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Inventory Turnover
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight="bold" color="warning.main">
                      {((stats.supplierPerformance || 0) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Supplier Performance
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
              title="Quick Stats" 
              avatar={<AnalyticsIcon color="primary" />}
            />
            <CardContent>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="textSecondary">Monthly Usage</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {(stats.monthlyUsage || 0).toLocaleString()} parts
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="textSecondary">Active Suppliers</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {stats.supplierCount || 0}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="textSecondary">Cost Efficiency</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {((stats.costEfficiency || 0) * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Average Lead Time</Typography>
                <Typography variant="body2" fontWeight="medium">
                  7 days
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts and Analytics Row */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <SimpleBarChart
            title="Top Categories by Value"
            data={(stats.topCategories || []).map((cat: any) => ({
              label: cat.category,
              value: cat.value,
              color: ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#607d8b'][
                (stats.topCategories || []).indexOf(cat) % 6
              ],
            }))}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <SimpleBarChart
            title="Top Categories by Count"
            data={(stats.topCategories || []).map((cat: any) => ({
              label: cat.category,
              value: cat.count,
              color: ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#607d8b'][
                (stats.topCategories || []).indexOf(cat) % 6
              ],
            }))}
          />
        </Grid>
      </Grid>

      {/* Bottom Row: Recent Activity and Low Stock Alerts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Recent Stock Movements" 
              avatar={<TimelineIcon color="primary" />}
            />
            <CardContent sx={{ p: 0 }}>
              <List>
                {(stats.recentMovements || []).map((movement: any, index: number) => (
                  <React.Fragment key={movement.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: movement.movementType === 'IN' ? 'success.light' : 
                                   movement.movementType === 'OUT' ? 'error.light' : 'info.light'
                        }}>
                          {movement.movementType === 'IN' ? (
                            <TrendingUpIcon />
                          ) : movement.movementType === 'OUT' ? (
                            <TrendingDownIcon />
                          ) : (
                            <ShippingIcon />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2">
                              {movement.quantity} units
                            </Typography>
                            <Chip 
                              label={movement.movementType} 
                              size="small" 
                              color={
                                movement.movementType === 'IN' ? 'success' : 
                                movement.movementType === 'OUT' ? 'error' : 'info'
                              }
                            />
                          </Box>
                        }
                        secondary={movement.reason}
                      />
                      <ListItemSecondaryAction>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(movement.createdAt).toLocaleDateString()}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < (stats.recentMovements || []).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  Low Stock Alerts
                  <Badge badgeContent={stats.lowStockItems?.length || 0} color="error">
                    <WarningIcon />
                  </Badge>
                </Box>
              }
              avatar={<WarningIcon color="warning" />}
            />
            <CardContent sx={{ p: 0 }}>
              <List>
                {(stats.lowStockItems || []).slice(0, 5).map((item: any, index: number) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'error.light' }}>
                          <ErrorIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.sparePart?.name || 'Unknown Part'}
                        secondary={
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              Current: {item.currentQuantity} | Min: {item.minThreshold}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="textSecondary">
                              Store: {item.store}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip 
                          label="Critical" 
                          size="small" 
                          color="error" 
                          variant="outlined"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < Math.min((stats.lowStockItems || []).length - 1, 4) && <Divider />}
                  </React.Fragment>
                ))}
                {(stats.lowStockItems || []).length === 0 && (
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.light' }}>
                        <CheckCircleIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="All good!"
                      secondary="No low stock alerts at the moment"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default SparePartsDashboard
