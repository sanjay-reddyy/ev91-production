import React from 'react';
import {
  Box,
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
  CircularProgress,
  Alert,
} from '@mui/material';
import { RiderVehicleHistory } from '../../services/vehicleHistoryService';

interface RiderVehicleHistoryTabProps {
  vehicleHistory: RiderVehicleHistory[];
  loading: boolean;
}

const RiderVehicleHistoryTab: React.FC<RiderVehicleHistoryTabProps> = ({
  vehicleHistory,
  loading,
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (vehicleHistory.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        This rider has no vehicle assignment history.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Vehicle Assignment History
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Registration Number</TableCell>
                <TableCell>Make & Model</TableCell>
                <TableCell>Hub</TableCell>
                <TableCell>Assigned Date</TableCell>
                <TableCell>Returned Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Updated By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicleHistory.map((history) => (
                <TableRow key={history.id}>
                  <TableCell>{history.registrationNumber || 'N/A'}</TableCell>
                  <TableCell>
                    {history.vehicleMake && history.vehicleModel
                      ? `${history.vehicleMake} ${history.vehicleModel}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{history.hubCode || history.hubName || 'N/A'}</TableCell>
                  <TableCell>{formatDate(history.assignedAt)}</TableCell>
                  <TableCell>
                    {history.returnedAt ? formatDate(history.returnedAt) : 'Currently Assigned'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={history.status}
                      color={history.status === 'ACTIVE' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{history.notes || '-'}</TableCell>
                  <TableCell>
                    {history.status === 'RETURNED'
                      ? (history.returnedBy || '-')
                      : (history.assignedBy || '-')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default RiderVehicleHistoryTab;
