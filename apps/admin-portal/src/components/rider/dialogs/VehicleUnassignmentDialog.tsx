import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
} from '@mui/material';

interface VehicleUnassignmentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  vehicleInfo?: {
    registrationNumber: string;
    make?: string;
    model?: string;
  };
}

const VehicleUnassignmentDialog: React.FC<VehicleUnassignmentDialogProps> = ({
  open,
  onClose,
  onConfirm,
  vehicleInfo,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setError(null);
      onClose();
    }
  };

  const handleConfirm = async () => {
    // Validate reason
    if (!reason.trim()) {
      setError('Please provide a reason for unassigning the vehicle');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Please provide a more detailed reason (at least 10 characters)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm(reason.trim());
      // Close dialog on success
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to unassign vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Unassign Vehicle
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          You are about to unassign the following vehicle from this rider:
        </DialogContentText>

        {vehicleInfo && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <strong>Registration Number:</strong>
              <span>{vehicleInfo.registrationNumber}</span>
            </Box>
            {vehicleInfo.make && vehicleInfo.model && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Vehicle:</strong>
                <span>{vehicleInfo.make} {vehicleInfo.model}</span>
              </Box>
            )}
          </Box>
        )}

        <DialogContentText sx={{ mb: 2 }}>
          Please provide a reason for unassigning this vehicle. This will be recorded in the vehicle history.
        </DialogContentText>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          required
          fullWidth
          multiline
          rows={4}
          label="Reason for Unassignment"
          placeholder="e.g., Vehicle needed for maintenance, Rider requested change, Vehicle damage reported, etc."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError(null); // Clear error when user types
          }}
          disabled={loading}
          helperText={`${reason.length} characters (minimum 10 required)`}
          error={!!error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={loading || !reason.trim()}
        >
          {loading ? 'Unassigning...' : 'Confirm Unassignment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleUnassignmentDialog;
