import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
  Stack,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,

  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,

  Breadcrumbs,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  LocalShipping as ShippingIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,

  Save as SaveIcon,
  Print as PrintIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

// Import components
import OrderTracker from '../components/orders/OrderTracker';

// Import types and services
import {
  Order,
  OrderStatus,
  OrderItem,
  OrderStatusUpdate,
  getStatusColor,
  getPaymentStatusColor,
  ORDER_STATUSES,
} from '../types/order';
import * as orderService from '../services/orderService';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [order, setOrder] = useState<Order | null>(null);
  const [statusHistory, setStatusHistory] = useState<OrderStatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Status update dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  // Assign rider dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [riders, setRiders] = useState<any[]>([]); // Will be populated from API
  const [vehicles, setVehicles] = useState<any[]>([]); // Will be populated from API

  // Load order details
  const loadOrder = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

      const response = await orderService.getOrderById(id);

      if (response.success && response.data) {
        setOrder(response.data as Order);

        // Load status history
        const historyResponse = await orderService.getOrderStatusHistory(id);
        if (historyResponse.success && historyResponse.data) {
          // The current order may have the status updates
          const orderData = response.data as Order;
          const updates = orderData.order_status_updates || [];
          setStatusHistory(updates);
        }
      } else {
        setError(response.error || 'Failed to load order details');
      }
    } catch (err: any) {
      console.error('Error loading order:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Status update handlers
  const handleOpenStatusDialog = () => {
    if (order) {
      setNewStatus(order.status as OrderStatus);
      setStatusNote('');
      setStatusDialogOpen(true);
    }
  };

  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setNewStatus('');
    setStatusNote('');
  };

  const handleStatusUpdate = async () => {
    if (!id || !newStatus || newStatus === order?.status) {
      handleCloseStatusDialog();
      return;
    }

    try {
      setStatusLoading(true);
      setError('');

      const response = await orderService.updateOrderStatus(
        id,
        newStatus as OrderStatus,
        statusNote
      );

      if (response.success) {
        setSuccess(`Order status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
        loadOrder();
      } else {
        setError(response.error || 'Failed to update order status');
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setStatusLoading(false);
      handleCloseStatusDialog();
    }
  };

  // Cancel order handlers
  const handleOpenCancelDialog = () => {
    setCancellationReason('');
    setCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setCancellationReason('');
  };

  const handleCancelOrder = async () => {
    if (!id || !cancellationReason.trim()) {
      handleCloseCancelDialog();
      return;
    }

    try {
      setStatusLoading(true);
      setError('');

      const response = await orderService.cancelOrder(id, cancellationReason);

      if (response.success) {
        setSuccess('Order cancelled successfully');
        loadOrder();
      } else {
        setError(response.error || 'Failed to cancel order');
      }
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setStatusLoading(false);
      handleCloseCancelDialog();
    }
  };

  // Assign rider handlers
  const handleOpenAssignDialog = () => {
    setSelectedRider(order?.rider_id || '');
    setSelectedVehicle(order?.vehicle_id || '');
    setAssignDialogOpen(true);

    // TODO: Load riders and vehicles from API
    // For now using placeholder data
    setRiders([
      { id: 'rider1', name: 'John Doe' },
      { id: 'rider2', name: 'Jane Smith' }
    ]);
    setVehicles([
      { id: 'vehicle1', name: 'EV Scooter #1' },
      { id: 'vehicle2', name: 'EV Scooter #2' }
    ]);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
  };

  const handleAssignRider = async () => {
    if (!id || !selectedRider) {
      handleCloseAssignDialog();
      return;
    }

    try {
      setStatusLoading(true);
      setError('');

      const response = await orderService.assignRider(
        id,
        selectedRider,
        selectedVehicle || undefined
      );

      if (response.success) {
        setSuccess('Rider assigned successfully');
        loadOrder();
      } else {
        setError(response.error || 'Failed to assign rider');
      }
    } catch (err: any) {
      console.error('Error assigning rider:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setStatusLoading(false);
      handleCloseAssignDialog();
    }
  };

  // Format helpers
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (err) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '₹0.00';
    return `₹${amount.toFixed(2)}`;
  };

  // Determine if actions should be disabled
  const isActionDisabled = (order?.status === OrderStatus.DELIVERED ||
    order?.status === OrderStatus.CANCELLED ||
    order?.status === OrderStatus.FAILED);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (!order && error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<BackIcon />}
          onClick={() => navigate('/orders')}
        >
          Back to Orders
        </Button>
      </Box>
    );
  }

  // Order not found
  if (!order) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Order not found or has been deleted
        </Alert>
        <Button
          variant="contained"
          startIcon={<BackIcon />}
          onClick={() => navigate('/orders')}
        >
          Back to Orders
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
          Dashboard
        </Link>
        <Link to="/orders" style={{ textDecoration: 'none', color: 'inherit' }}>
          Orders
        </Link>
        <Typography color="text.primary">{order.order_number}</Typography>
      </Breadcrumbs>

      {/* Alerts */}
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

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Order #{order.order_number}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/orders')}
          >
            Back to Orders
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/orders/${id}/edit`)}
            disabled={isActionDisabled}
          >
            Edit Order
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Stack>
      </Box>

      {/* Order Status Tracker */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Order Status
        </Typography>
        <OrderTracker order={order} statusHistory={statusHistory} />
      </Paper>

      <Grid container spacing={3}>
        {/* Order Information Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                  <Chip
                    label={order.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(order.status as OrderStatus)}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Payment Status</Typography>
                  <Chip
                    label={order.payment_status.replace('_', ' ').toUpperCase()}
                    color={getPaymentStatusColor(order.payment_status)}
                    variant="outlined"
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Payment Method</Typography>
                  <Typography>{order.payment_method.toUpperCase()}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Created</Typography>
                  <Typography>{formatDate(order.created_at)}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Last Updated</Typography>
                  <Typography>{formatDate(order.updated_at)}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Notes</Typography>
                  <Typography>{order.notes || 'No notes'}</Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1}>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  startIcon={<ShippingIcon />}
                  onClick={handleOpenStatusDialog}
                  disabled={isActionDisabled}
                >
                  Update Status
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  startIcon={<PersonIcon />}
                  onClick={handleOpenAssignDialog}
                  disabled={isActionDisabled || order.status === OrderStatus.PENDING}
                >
                  {order.rider_id ? 'Reassign Rider' : 'Assign Rider'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<CancelIcon />}
                  onClick={handleOpenCancelDialog}
                  disabled={isActionDisabled}
                >
                  Cancel Order
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer and Addresses */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Client/Store Info */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Client & Store
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Client</Typography>
                      <Typography>{order.client_name || 'Unknown Client'}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Store</Typography>
                      <Typography>{order.store_name || 'Unknown Store'}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Pickup Address</Typography>
                      <Typography>{order.pickup_address || 'Not specified'}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Customer Info */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Customer Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Customer Name</Typography>
                      <Typography>{order.customer_name || 'Not specified'}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Phone</Typography>
                      <Typography>{order.customer_phone || 'Not specified'}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                      <Typography>{order.customer_email || 'Not specified'}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Delivery Address</Typography>
                      <Typography>{order.delivery_address || 'Not specified'}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Delivery Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Delivery Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Rider</Typography>
                      <Typography>{order.rider_name || 'Not assigned'}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Vehicle</Typography>
                      <Typography>{order.vehicle_type || 'Not assigned'}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Distance
                      </Typography>
                      <Typography>
                        {order.distance
                          ? `${order.distance.toFixed(2)} km`
                          : 'Not calculated'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Battery Level
                      </Typography>
                      <Typography>
                        {order.battery_level !== undefined
                          ? `${order.battery_level}%`
                          : 'Not available'}
                      </Typography>
                    </Box>

                    {order.battery_consumed !== undefined && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Battery Consumed
                        </Typography>
                        <Typography>{`${order.battery_consumed}%`}</Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Timing Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Timing Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Scheduled For
                      </Typography>
                      <Typography>
                        {order.scheduled_for
                          ? formatDate(order.scheduled_for)
                          : 'Not scheduled'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Pickup Time
                      </Typography>
                      <Typography>
                        {order.picked_at
                          ? formatDate(order.picked_at)
                          : 'Not picked up yet'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Estimated Pickup
                      </Typography>
                      <Typography>
                        {order.estimated_pickup_time
                          ? formatDate(order.estimated_pickup_time)
                          : 'Not estimated'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Delivery Time
                      </Typography>
                      <Typography>
                        {order.delivered_at
                          ? formatDate(order.delivered_at)
                          : 'Not delivered yet'}
                      </Typography>
                    </Box>

                    {order.status === OrderStatus.CANCELLED && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Cancellation Reason
                        </Typography>
                        <Typography color="error">
                          {order.status_reason || 'No reason provided'}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Order Items */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item: OrderItem) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body1">{item.itemName}</Typography>
                            {item.notes && (
                              <Typography variant="caption" color="textSecondary">
                                {item.notes}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.totalPrice)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography color="textSecondary">No items found</Typography>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Summary Rows */}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="subtitle2">Subtotal</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(order.order_value)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="subtitle2">Delivery Fee</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(order.delivery_fee)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="subtitle2">Tax</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {/* Tax is not directly in the schema, could calculate or use 0 as placeholder */}
                        {formatCurrency(0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="subtitle2">Discount</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {/* Discount is not directly in the schema, could calculate or use 0 as placeholder */}
                        {formatCurrency(0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="h6">Total</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6">{formatCurrency(order.total_amount)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Status History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Status History
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<TimelineIcon />}
                  onClick={() => {}}
                >
                  View Timeline
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Updated By</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statusHistory && statusHistory.length > 0 ? (
                      statusHistory.map((history) => (
                        <TableRow key={history.id}>
                          <TableCell>
                            <Chip
                              label={history.to_status.replace('_', ' ').toUpperCase()}
                              color={getStatusColor(history.to_status as OrderStatus)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {history.updated_by_name || 'System'}
                          </TableCell>
                          <TableCell>
                            {formatDate(history.created_at)}
                          </TableCell>
                          <TableCell>
                            {history.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography color="textSecondary">No status history found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleCloseStatusDialog}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, pb: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                label="Status"
              >
                {ORDER_STATUSES.map((status) => (
                  <MenuItem
                    key={status}
                    value={status}
                    disabled={
                      // Disable delivered/cancelled/failed if order is already in one of those states
                      (order?.status === OrderStatus.DELIVERED ||
                       order?.status === OrderStatus.CANCELLED ||
                       order?.status === OrderStatus.FAILED) &&
                      order?.status !== status
                    }
                  >
                    {status.replace('_', ' ').toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Notes (Optional)"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog} disabled={statusLoading}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={statusLoading || !newStatus || newStatus === order?.status}
            startIcon={statusLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {statusLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog}>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, pb: 1 }}>
            <Typography sx={{ mb: 2 }}>
              Are you sure you want to cancel this order? This action cannot be undone.
            </Typography>
            <TextField
              fullWidth
              label="Cancellation Reason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              multiline
              rows={3}
              required
              error={!cancellationReason.trim()}
              helperText={!cancellationReason.trim() ? 'Reason is required' : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} disabled={statusLoading}>No, Keep Order</Button>
          <Button
            onClick={handleCancelOrder}
            variant="contained"
            color="error"
            disabled={statusLoading || !cancellationReason.trim()}
            startIcon={statusLoading ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {statusLoading ? 'Cancelling...' : 'Yes, Cancel Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Rider Dialog */}
      <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog}>
        <DialogTitle>{order.rider_id ? 'Reassign Rider' : 'Assign Rider'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, pb: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="rider-label">Rider</InputLabel>
              <Select
                labelId="rider-label"
                value={selectedRider}
                onChange={(e) => setSelectedRider(e.target.value)}
                label="Rider"
              >
                <MenuItem value="">Select a rider</MenuItem>
                {riders.map((rider) => (
                  <MenuItem key={rider.id} value={rider.id}>
                    {rider.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="vehicle-label">Vehicle</InputLabel>
              <Select
                labelId="vehicle-label"
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                label="Vehicle"
              >
                <MenuItem value="">Select a vehicle</MenuItem>
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog} disabled={statusLoading}>Cancel</Button>
          <Button
            onClick={handleAssignRider}
            variant="contained"
            disabled={statusLoading || !selectedRider}
            startIcon={statusLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {statusLoading ? 'Assigning...' : (order.rider_id ? 'Reassign' : 'Assign')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetail;
