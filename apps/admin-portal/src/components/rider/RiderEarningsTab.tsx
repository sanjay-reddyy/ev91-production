import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
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
  Chip,
} from '@mui/material';
import { RiderEarning, RiderEarningsSummary } from '../../services';

interface RiderEarningsTabProps {
  earnings: RiderEarning[];
  earningsSummary: RiderEarningsSummary | null;
  earningsPeriod: 'weekly' | 'monthly' | 'yearly';
  onPeriodChange: (period: 'weekly' | 'monthly' | 'yearly') => void;
}

const RiderEarningsTab: React.FC<RiderEarningsTabProps> = ({
  earnings,
  earningsSummary,
  earningsPeriod,
  onPeriodChange,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'verified':
      case 'delivered':
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
      case 'cancelled':
      case 'failed':
        return 'error';
      case 'processing':
      case 'picked_up':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Earnings Summary */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography variant="h6">Earnings Summary</Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={earningsPeriod}
                  label="Period"
                  onChange={(e) =>
                    onPeriodChange(e.target.value as 'weekly' | 'monthly' | 'yearly')
                  }
                >
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {earningsSummary && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Earnings
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {formatCurrency(earningsSummary.totalEarnings)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Orders
                    </Typography>
                    <Typography variant="h5" color="success.main">
                      {earningsSummary.totalOrders}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Average per Order
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(earningsSummary.averageEarningPerOrder)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Distance
                    </Typography>
                    <Typography variant="h5">{earningsSummary.totalDistance} km</Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Earnings Table */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Earnings History
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Order Value</TableCell>
                    <TableCell align="right">Earnings</TableCell>
                    <TableCell align="right">Distance (km)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {earnings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        No earnings found for this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    earnings.map((earning) => (
                      <TableRow key={earning.id}>
                        <TableCell>{earning.orderId ? earning.orderId.slice(0, 8) + '...' : 'N/A'}</TableCell>
                        <TableCell>{formatDate(earning.orderDate)}</TableCell>
                        <TableCell align="right">{formatCurrency(earning.totalRate)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium" color="success.main">
                            {formatCurrency(earning.finalEarning)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{earning.distance || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={earning.paymentStatus}
                            color={getStatusColor(earning.paymentStatus) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {earning.riderRating ? `${earning.riderRating} ⭐` : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default RiderEarningsTab;
