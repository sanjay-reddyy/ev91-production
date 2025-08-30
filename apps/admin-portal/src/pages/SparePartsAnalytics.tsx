import React, { useState, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Alert,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Avatar,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { analyticsService, dashboardService } from '../services/sparePartsService'

interface UsageData {
  name: string
  usage: number
  trend: number
}

interface CategoryData {
  category: string
  count: number
  value: number
  color: string
}

interface TrendData {
  month: string
  usage: number
  cost: number
  orders: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

const SparePartsAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('6months')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Fetch analytics data
  const {
    data: usageAnalytics,
    isLoading: usageLoading,
    error: usageError,
  } = useQuery(
    ['sparePartsUsage', timeRange, selectedCategory],
    () =>
      analyticsService.getUsageAnalysis({
        startDate: getDateFromTimeRange(timeRange).start,
        endDate: getDateFromTimeRange(timeRange).end,
        categoryId: selectedCategory || undefined,
      }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery(
    ['sparePartsDashboard', timeRange],
    () => dashboardService.getStats(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Helper function to get date range from time period
  const getDateFromTimeRange = (range: string) => {
    const end = new Date()
    const start = new Date()
    
    switch (range) {
      case '1month':
        start.setMonth(start.getMonth() - 1)
        break
      case '3months':
        start.setMonth(start.getMonth() - 3)
        break
      case '6months':
        start.setMonth(start.getMonth() - 6)
        break
      case '1year':
        start.setFullYear(start.getFullYear() - 1)
        break
      default:
        start.setMonth(start.getMonth() - 6)
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  // Process data for charts
  const trendData: TrendData[] = useMemo(() => {
    if (!usageAnalytics?.monthlyTrends) return []
    return usageAnalytics.monthlyTrends.map((item: any) => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      usage: item.totalUsage,
      cost: item.totalCost,
      orders: item.orderCount,
    }))
  }, [usageAnalytics])

  const categoryData: CategoryData[] = useMemo(() => {
    if (!usageAnalytics?.categoryBreakdown) return []
    return usageAnalytics.categoryBreakdown.map((item: any, index: number) => ({
      category: item.category,
      count: item.count,
      value: item.totalValue,
      color: COLORS[index % COLORS.length],
    }))
  }, [usageAnalytics])

  const topUsedParts: UsageData[] = useMemo(() => {
    if (!usageAnalytics?.topUsedParts) return []
    return usageAnalytics.topUsedParts.map((item: any) => ({
      name: item.name,
      usage: item.usage,
      trend: item.trend || 0,
    }))
  }, [usageAnalytics])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const isLoading = usageLoading || dashboardLoading
  const error = usageError || dashboardError

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load analytics data. Please try again.
        </Alert>
      </Box>
    )
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Spare Parts Analytics
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              input={<OutlinedInput label="Time Range" />}
              size="small"
            >
              <MenuItem value="1month">Last Month</MenuItem>
              <MenuItem value="3months">Last 3 Months</MenuItem>
              <MenuItem value="6months">Last 6 Months</MenuItem>
              <MenuItem value="1year">Last Year</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              input={<OutlinedInput label="Category" />}
              size="small"
            >
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="ENGINE">Engine</MenuItem>
              <MenuItem value="BRAKE">Brake System</MenuItem>
              <MenuItem value="ELECTRICAL">Electrical</MenuItem>
              <MenuItem value="BODY">Body Parts</MenuItem>
              <MenuItem value="SUSPENSION">Suspension</MenuItem>
              <MenuItem value="TRANSMISSION">Transmission</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Usage
                  </Typography>
                  <Typography variant="h4">
                    {isLoading ? (
                      <Skeleton width={80} />
                    ) : (
                      dashboardData?.totalUsage?.toLocaleString() || '0'
                    )}
                  </Typography>
                  {!isLoading && dashboardData?.usageTrend && (
                    <Box display="flex" alignItems="center" mt={1}>
                      {dashboardData.usageTrend > 0 ? (
                        <TrendingUpIcon color="success" fontSize="small" />
                      ) : (
                        <TrendingDownIcon color="error" fontSize="small" />
                      )}
                      <Typography
                        variant="caption"
                        color={dashboardData.usageTrend > 0 ? 'success.main' : 'error.main'}
                        ml={0.5}
                      >
                        {formatPercentage(dashboardData.usageTrend)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AnalyticsIcon />
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
                  <Typography color="textSecondary" gutterBottom>
                    Total Cost
                  </Typography>
                  <Typography variant="h4">
                    {isLoading ? (
                      <Skeleton width={80} />
                    ) : (
                      formatCurrency(dashboardData?.totalCost || 0)
                    )}
                  </Typography>
                  {!isLoading && dashboardData?.costTrend && (
                    <Box display="flex" alignItems="center" mt={1}>
                      {dashboardData.costTrend > 0 ? (
                        <TrendingUpIcon color="error" fontSize="small" />
                      ) : (
                        <TrendingDownIcon color="success" fontSize="small" />
                      )}
                      <Typography
                        variant="caption"
                        color={dashboardData.costTrend > 0 ? 'error.main' : 'success.main'}
                        ml={0.5}
                      >
                        {formatPercentage(dashboardData.costTrend)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
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
                  <Typography color="textSecondary" gutterBottom>
                    Purchase Orders
                  </Typography>
                  <Typography variant="h4">
                    {isLoading ? (
                      <Skeleton width={60} />
                    ) : (
                      dashboardData?.purchaseOrders || '0'
                    )}
                  </Typography>
                  {!isLoading && dashboardData?.ordersTrend && (
                    <Box display="flex" alignItems="center" mt={1}>
                      {dashboardData.ordersTrend > 0 ? (
                        <TrendingUpIcon color="warning" fontSize="small" />
                      ) : (
                        <TrendingDownIcon color="success" fontSize="small" />
                      )}
                      <Typography
                        variant="caption"
                        color={dashboardData.ordersTrend > 0 ? 'warning.main' : 'success.main'}
                        ml={0.5}
                      >
                        {formatPercentage(dashboardData.ordersTrend)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <ShoppingCartIcon />
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
                  <Typography color="textSecondary" gutterBottom>
                    Inventory Turnover
                  </Typography>
                  <Typography variant="h4">
                    {isLoading ? (
                      <Skeleton width={60} />
                    ) : (
                      `${(dashboardData?.inventoryTurnover || 0).toFixed(1)}x`
                    )}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Times per year
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <SpeedIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={3} mb={3}>
        {/* Usage Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Usage & Cost Trends
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value: any, name: string) => [
                        name === 'cost' ? formatCurrency(value) : value,
                        name.charAt(0).toUpperCase() + name.slice(1),
                      ]}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="usage"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Usage Count"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cost"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Total Cost"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Usage by Category
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, count }) => `${category}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Most Used Parts & Quick Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Most Used Parts
              </Typography>
              {isLoading ? (
                Array.from(new Array(5)).map((_, index) => (
                  <Box key={index} display="flex" alignItems="center" mb={2}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box ml={2} flex={1}>
                      <Skeleton width="60%" />
                      <Skeleton width="40%" />
                    </Box>
                  </Box>
                ))
              ) : (
                <List>
                  {topUsedParts.map((part, index) => (
                    <ListItem key={index} divider={index < topUsedParts.length - 1}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                          {index + 1}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={part.name}
                        secondary={`Used ${part.usage} times`}
                      />
                      <Box display="flex" alignItems="center">
                        {part.trend !== 0 && (
                          <>
                            {part.trend > 0 ? (
                              <TrendingUpIcon color="success" fontSize="small" />
                            ) : (
                              <TrendingDownIcon color="error" fontSize="small" />
                            )}
                            <Typography
                              variant="caption"
                              color={part.trend > 0 ? 'success.main' : 'error.main'}
                              ml={0.5}
                            >
                              {formatPercentage(part.trend)}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Indicators
              </Typography>
              {isLoading ? (
                Array.from(new Array(4)).map((_, index) => (
                  <Box key={index} mb={3}>
                    <Skeleton width="100%" />
                    <Skeleton variant="rectangular" height={6} sx={{ mt: 1 }} />
                  </Box>
                ))
              ) : (
                <Box>
                  <Box mb={3}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Stock Availability</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {((dashboardData?.stockAvailability || 0) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(dashboardData?.stockAvailability || 0) * 100}
                      color={
                        (dashboardData?.stockAvailability || 0) > 0.8
                          ? 'success'
                          : (dashboardData?.stockAvailability || 0) > 0.5
                          ? 'warning'
                          : 'error'
                      }
                    />
                  </Box>
                  <Box mb={3}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Order Fulfillment Rate</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {((dashboardData?.orderFulfillmentRate || 0) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(dashboardData?.orderFulfillmentRate || 0) * 100}
                      color="success"
                    />
                  </Box>
                  <Box mb={3}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Cost Efficiency</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {((dashboardData?.costEfficiency || 0) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(dashboardData?.costEfficiency || 0) * 100}
                      color="info"
                    />
                  </Box>
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Supplier Performance</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {((dashboardData?.supplierPerformance || 0) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(dashboardData?.supplierPerformance || 0) * 100}
                      color="warning"
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default SparePartsAnalytics
