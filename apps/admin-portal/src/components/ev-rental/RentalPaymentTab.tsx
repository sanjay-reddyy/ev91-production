/**
 * RentalPaymentTab Component
 *
 * Displays and manages rental payment schedule for a rider.
 * This component:
 * - Shows all rental payments with status
 * - Displays payment summary (total, paid, pending, overdue)
 * - Allows admin to update payment status
 * - Highlights overdue payments
 * - Shows payment history and details
 */

import React, { useState, useEffect } from 'react';
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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Payment,
  Edit,
  CheckCircle,
  Warning,
  Schedule,
  Receipt,
  Refresh,
} from '@mui/icons-material';
import {
  RentalWithPayments,
  RiderRentalPayment,
  RentalPaymentStatus,
  UpdatePaymentRequest,
} from '../../types/evRental';
import {
  getRentalPayments,
  updateRentalPayment,
  formatCurrency,
  formatDate,
  getPaymentStatusColor,
  isPaymentOverdue,
} from '../../services/evRentalService';

interface RentalPaymentTabProps {
  riderId: string;
  rental: RentalWithPayments;
  onPaymentUpdated: () => void;
}

export const RentalPaymentTab: React.FC<RentalPaymentTabProps> = ({
  riderId,
  rental,
  onPaymentUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<RiderRentalPayment[]>([]);
  const [summary, setSummary] = useState({
    totalDue: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    overdueCount: 0,
  });

  // Payment update dialog
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<RiderRentalPayment | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Update form fields
  const [updateForm, setUpdateForm] = useState({
    status: '' as RentalPaymentStatus,
    amountPaid: 0,
    paidDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    transactionReference: '',
    deductedFromEarnings: false,
    notes: '',
  });

  // Load payments
  useEffect(() => {
    loadPayments();
  }, [riderId, rental.id]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await getRentalPayments(riderId, rental.id);
      setPayments(data.payments);
      setSummary(data.summary);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open update dialog
  const handleOpenUpdateDialog = (payment: RiderRentalPayment) => {
    setSelectedPayment(payment);
    setUpdateForm({
      status: payment.status,
      amountPaid: payment.amountPaid,
      paidDate: payment.paidDate || new Date().toISOString().split('T')[0],
      paymentMethod: payment.paymentMethod || 'EARNINGS_DEDUCTION',
      transactionReference: payment.transactionReference || '',
      deductedFromEarnings: payment.deductedFromEarnings,
      notes: payment.notes || '',
    });
    setUpdateError(null);
    setUpdateDialogOpen(true);
  };

  // Handle payment update
  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;

    try {
      setUpdating(true);
      setUpdateError(null);

      const updateData: UpdatePaymentRequest = {
        status: updateForm.status,
        amountPaid: updateForm.amountPaid,
        paidDate: updateForm.paidDate,
        paymentMethod: updateForm.paymentMethod,
        transactionReference: updateForm.transactionReference || undefined,
        deductedFromEarnings: updateForm.deductedFromEarnings,
        notes: updateForm.notes || undefined,
      };

      await updateRentalPayment(riderId, selectedPayment.id, updateData);

      setUpdateDialogOpen(false);
      await loadPayments();
      onPaymentUpdated();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update payment');
      console.error('Error updating payment:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Get status icon
  const getStatusIcon = (status: RentalPaymentStatus) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle fontSize="small" />;
      case 'OVERDUE':
        return <Warning fontSize="small" />;
      default:
        return <Schedule fontSize="small" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Payment Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Receipt sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Due
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(summary.totalDue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Paid
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {formatCurrency(summary.totalPaid)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Pending
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                {formatCurrency(summary.totalPending)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Overdue
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {formatCurrency(summary.totalOverdue)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {summary.overdueCount} payment(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Rental Info */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">
              Vehicle
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {rental.vehicleModel?.modelName || 'Unknown Model'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {rental.vehicleRegistrationNumber}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">
              Monthly Cost
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatCurrency(rental.monthlyRentalCost)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">
              Start Date
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatDate(rental.startDate)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <Chip
              label={rental.status}
              color={rental.status === 'ACTIVE' ? 'success' : 'default'}
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Overdue Alert */}
      {summary.overdueCount > 0 && (
        <Alert severity="error" icon={<Warning />} sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>{summary.overdueCount} payment(s) overdue!</strong> Total overdue amount:{' '}
            {formatCurrency(summary.totalOverdue)}
          </Typography>
        </Alert>
      )}

      {/* Payment Table */}
      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Payment Schedule</Typography>
          <Button
            startIcon={<Refresh />}
            onClick={loadPayments}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="right">Amount Due</TableCell>
                <TableCell align="right">Amount Paid</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Paid Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => {
                const overdue = isPaymentOverdue(payment);
                return (
                  <TableRow
                    key={payment.id}
                    sx={{
                      bgcolor: overdue ? 'error.50' : 'transparent',
                      '&:hover': { bgcolor: overdue ? 'error.100' : 'action.hover' },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {payment.paymentMonth}
                      </Typography>
                      {payment.deductedFromEarnings && (
                        <Chip
                          label="Auto-deducted"
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(payment.dueDate)}</Typography>
                      {overdue && (
                        <Typography variant="caption" color="error">
                          Overdue
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(payment.amountDue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={payment.amountPaid >= payment.amountDue ? 'success.main' : 'text.primary'}
                      >
                        {formatCurrency(payment.amountPaid)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(payment.status)}
                        label={payment.status}
                        color={getPaymentStatusColor(payment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {payment.paymentMethod || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {payment.paidDate ? formatDate(payment.paidDate) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Update Payment">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenUpdateDialog(payment)}
                          color="primary"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Update Payment Dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Payment sx={{ mr: 1, color: 'primary.main' }} />
            Update Payment - {selectedPayment?.paymentMonth}
          </Box>
        </DialogTitle>

        <DialogContent>
          {updateError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUpdateError(null)}>
              {updateError}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                label="Payment Status"
                fullWidth
                value={updateForm.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as RentalPaymentStatus })}
              >
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="OVERDUE">Overdue</MenuItem>
                <MenuItem value="WAIVED">Waived</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount Paid"
                type="number"
                fullWidth
                value={updateForm.amountPaid}
                onChange={(e) => setUpdateForm({ ...updateForm, amountPaid: Number(e.target.value) })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Paid Date"
                type="date"
                fullWidth
                value={updateForm.paidDate}
                onChange={(e) => setUpdateForm({ ...updateForm, paidDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                label="Payment Method"
                fullWidth
                value={updateForm.paymentMethod}
                onChange={(e) => setUpdateForm({ ...updateForm, paymentMethod: e.target.value })}
              >
                <MenuItem value="EARNINGS_DEDUCTION">Earnings Deduction</MenuItem>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="CHEQUE">Cheque</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Transaction Reference"
                fullWidth
                value={updateForm.transactionReference}
                onChange={(e) => setUpdateForm({ ...updateForm, transactionReference: e.target.value })}
                placeholder="Transaction ID, receipt number, etc."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                label="Deducted from Earnings?"
                fullWidth
                value={updateForm.deductedFromEarnings ? 'true' : 'false'}
                onChange={(e) => setUpdateForm({ ...updateForm, deductedFromEarnings: e.target.value === 'true' })}
              >
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Notes"
                multiline
                rows={3}
                fullWidth
                value={updateForm.notes}
                onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                placeholder="Add any notes about this payment..."
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)} disabled={updating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdatePayment}
            disabled={updating}
            startIcon={updating ? <CircularProgress size={20} /> : <Payment />}
          >
            {updating ? 'Updating...' : 'Update Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RentalPaymentTab;
