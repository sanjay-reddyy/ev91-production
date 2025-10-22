import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';

interface Order {
  id: string;
  orderDate: string;
  deliveryStatus: string;
  orderValue?: number;
  customerRating?: number | null;
  distance?: number | null;
  [key: string]: any;
}

interface RiderOrderHistoryTabProps {
  orderHistory: Order[];
}

const RiderOrderHistoryTab: React.FC<RiderOrderHistoryTabProps> = ({ orderHistory }) => {
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
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Orders
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell align="right">Order Value</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Customer Rating</TableCell>
                <TableCell align="right">Distance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orderHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orderHistory.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id.slice(0, 8)}...</TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell align="right">
                      {order.orderValue ? formatCurrency(order.orderValue) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.deliveryStatus}
                        color={getStatusColor(order.deliveryStatus) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {order.customerRating ? `${order.customerRating} ⭐` : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {order.distance ? `${order.distance} km` : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default RiderOrderHistoryTab;
