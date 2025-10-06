import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Alert,
  Skeleton,
  Card,
  CardContent,
  Grid,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TablePagination,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,

  CalendarMonth as CalendarIcon,
  LocalShipping as ShippingIcon,
  Store as StoreIcon,

} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

// Import types and services
import {
  Order,
  OrderStatus,
  PaymentStatus,
  OrderFilters,
  getStatusColor,
  getPaymentStatusColor,
  ORDER_STATUSES,
  PAYMENT_STATUSES
} from '../types/order';
import * as orderService from '../services/orderService';
import * as clientStoreService from '../services/clientStoreService';

// OrderList Component
const OrderList: React.FC = () => {
  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [orderStats, setOrderStats] = useState<{
    totalOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  }>({
    totalOrders: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });

  // Filters state
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [totalOrders, setTotalOrders] = useState(0);

  // Dropdown data
  const [clients, setClients] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch orders when filters change
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await orderService.getOrders(filters);

      if (response.success) {
        setOrders(Array.isArray(response.data) ? response.data : []);
        setTotalOrders(response.pagination?.totalItems || 0);

        // Update stats
        if (response.data) {
          const orders = Array.isArray(response.data) ? response.data : [];
          setOrderStats({
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === OrderStatus.PENDING).length,
            inProgressOrders: orders.filter(o => [
              OrderStatus.APPROVED,
              OrderStatus.ASSIGNED,
              OrderStatus.PICKED_UP,
              OrderStatus.IN_TRANSIT
            ].includes(o.status as OrderStatus)).length,
            deliveredOrders: orders.filter(o => [
              OrderStatus.DELIVERED,
              OrderStatus.COMPLETED
            ].includes(o.status as OrderStatus)).length,
            cancelledOrders: orders.filter(o => [
              OrderStatus.CANCELLED,
              OrderStatus.RETURNED,
              OrderStatus.FAILED
            ].includes(o.status as OrderStatus)).length,
          });
        }
      } else {
        setError(response.error || 'Failed to load orders');
        setOrders([]);
      }
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.message || 'An unexpected error occurred');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load dropdown data
  const loadDropdownData = useCallback(async () => {
    try {
      setLoadingDropdowns(true);

      // Load clients
      const clientsResponse = await clientStoreService.getClients({ limit: 100 });
      if (clientsResponse.success) {
        setClients(clientsResponse.data || []);
      }

      // Load stores - we'll filter these based on selected client
      const storesResponse = await clientStoreService.getStores({ limit: 100 });
      if (storesResponse.success) {
        setStores(storesResponse.data || []);
      }

      // TODO: Replace with actual rider service call when implemented
      // For now, using empty array as placeholder
      setRiders([]);

    } catch (err: any) {
      console.error('Error loading dropdown data:', err);
    } finally {
      setLoadingDropdowns(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDropdownData();
  }, [loadDropdownData]);

  // Load orders when filters change
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    setShowFilters(false);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (err) {
      return 'Invalid date';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Order Management
      </Typography>

      {/* Error/Success alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ShippingIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {orderStats.totalOrders}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Orders
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalendarIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {orderStats.pendingOrders}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ShippingIcon color="secondary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {orderStats.inProgressOrders}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    In Progress
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ShippingIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {orderStats.deliveredOrders}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Delivered
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ShippingIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {orderStats.cancelledOrders}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Cancelled
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search orders by number, customer..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Order Status</InputLabel>
              <Select
                value={filters.status || ''}
                label="Order Status"
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined, page: 1 }))}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {ORDER_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={filters.payment_status || ''}
                label="Payment Status"
                onChange={(e) => setFilters(prev => ({ ...prev, payment_status: e.target.value || undefined, page: 1 }))}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {PAYMENT_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={showFilters ? <ClearIcon /> : <FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              fullWidth
            >
              {showFilters ? 'Hide Filters' : 'More Filters'}
            </Button>
          </Grid>
          <Grid item xs={6} md={2}>
            <Button
              variant="contained"
              component={Link}
              to="/orders/create"
              startIcon={<AddIcon />}
              fullWidth
            >
              New Order
            </Button>
          </Grid>
          <Grid item xs={6} md={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadOrders} disabled={loading} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>

          {/* Additional Filters (conditionally rendered) */}
          {showFilters && (
            <Grid container item spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  size="small"
                  options={clients}
                  getOptionLabel={(option) => option.name}
                  value={clients.find(c => c.id === filters.client_id) || null}
                  onChange={(_, newValue) => setFilters(prev => ({
                    ...prev,
                    client_id: newValue?.id || undefined,
                    store_id: undefined, // Reset store when client changes
                    page: 1
                  }))}
                  renderInput={(params) => <TextField {...params} label="Client" />}
                  loading={loadingDropdowns}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  size="small"
                  options={stores.filter(s => !filters.client_id || s.clientId === filters.client_id)}
                  getOptionLabel={(option) => option.storeName}
                  value={stores.find(s => s.id === filters.store_id) || null}
                  onChange={(_, newValue) => setFilters(prev => ({
                    ...prev,
                    store_id: newValue?.id || undefined,
                    page: 1
                  }))}
                  disabled={!filters.client_id}
                  renderInput={(params) => <TextField
                    {...params}
                    label="Store"
                    helperText={!filters.client_id ? "Select a client first" : ""}
                  />}
                  loading={loadingDropdowns}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  size="small"
                  options={riders}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                  value={riders.find(r => r.id === filters.rider_id) || null}
                  onChange={(_, newValue) => setFilters(prev => ({
                    ...prev,
                    rider_id: newValue?.id || undefined,
                    page: 1
                  }))}
                  renderInput={(params) => <TextField {...params} label="Rider" />}
                  loading={loadingDropdowns}
                />
              </Grid>
              <Grid item xs={6} md={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Start Date"
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value || undefined, page: 1 }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} md={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="End Date"
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value || undefined, page: 1 }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={12} textAlign="right">
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleResetFilters}
                  startIcon={<ClearIcon />}
                  sx={{ ml: 1 }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Orders Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Client/Store</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                // Loading skeletons
                Array.from({ length: filters.limit || 10 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 8 }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : orders.length > 0 ? (
                // Order rows
                orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {order.order_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <StoreIcon fontSize="small" color="primary" />
                          <Typography variant="body2">{order.client_name || 'Unknown Client'}</Typography>
                        </Stack>
                        {order.store_name && (
                          <Typography variant="caption" color="textSecondary">
                            {order.store_name}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(order.status as OrderStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Chip
                          label={order.payment_status.replace('_', ' ').toUpperCase()}
                          color={getPaymentStatusColor(order.payment_status as PaymentStatus)}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="textSecondary">
                          {order.payment_method.toUpperCase()}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {order.customer_name ? (
                        <Stack spacing={0.5}>
                          <Typography variant="body2">{order.customer_name}</Typography>
                          {order.customer_phone && (
                            <Typography variant="caption" color="textSecondary">
                              {order.customer_phone}
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Not specified
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ₹{order.total_amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          component={Link}
                          to={`/orders/${order.id}`}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Order">
                        <IconButton
                          size="small"
                          color="secondary"
                          component={Link}
                          to={`/orders/${order.id}/edit`}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                // No orders found
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="textSecondary">
                      No orders found
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      {Object.keys(filters).filter(k => k !== 'page' && k !== 'limit' && k !== 'sortBy' && k !== 'sortOrder' && filters[k as keyof OrderFilters]).length > 0
                        ? 'Try adjusting your filters or create a new order'
                        : 'Create a new order to get started'}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      component={Link}
                      to="/orders/create"
                      sx={{ mt: 2 }}
                    >
                      Create New Order
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalOrders > 0 && (
          <TablePagination
            component="div"
            count={totalOrders}
            page={(filters.page || 1) - 1}
            onPageChange={(_, newPage) => setFilters(prev => ({ ...prev, page: newPage + 1 }))}
            rowsPerPage={filters.limit || 10}
            onRowsPerPageChange={(e) => setFilters(prev => ({
              ...prev,
              limit: parseInt(e.target.value, 10),
              page: 1
            }))}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        )}
      </Paper>
    </Box>
  );
};

export default OrderList;
