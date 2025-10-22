import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';

interface Payment {
  id: string;
  date: string;
  amount: number;
  type: 'earning' | 'payout' | 'adjustment' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  orderId?: string;
}

interface RiderPaymentHistoryTabProps {
  payments: Payment[];
  loading?: boolean;
}

const RiderPaymentHistoryTab: React.FC<RiderPaymentHistoryTabProps> = ({
  payments,
  loading = false,
}) => {
  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'earning':
        return 'success';
      case 'payout':
        return 'primary';
      case 'adjustment':
        return 'warning';
      case 'refund':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Loading payment history...</Typography>
      </Box>
    );
  }

  if (payments.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No payment history available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Payment transactions will appear here once available.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Payment History
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Payment ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} hover>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {payment.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(payment.date)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                    color={getPaymentTypeColor(payment.type) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {payment.description || '-'}
                  </Typography>
                  {payment.orderId && (
                    <Typography variant="caption" color="text.secondary">
                      Order: {payment.orderId}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color={
                      payment.type === 'earning' || payment.type === 'refund'
                        ? 'success.main'
                        : 'text.primary'
                    }
                  >
                    {payment.type === 'earning' || payment.type === 'refund' ? '+' : '-'}
                    {formatAmount(payment.amount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    color={getStatusColor(payment.status) as any}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RiderPaymentHistoryTab;
