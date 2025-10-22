import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  Box,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import { VehicleAssignment, Hub } from '../../../services';

interface VehicleAssignmentDialogProps {
  open: boolean;
  availableHubs: Hub[];
  availableVehicles: VehicleAssignment[];
  selectedHub: string;
  selectedVehicle: string;
  vehiclesLoading: boolean;
  onClose: () => void;
  onHubChange: (hubId: string) => void;
  onVehicleChange: (vehicleId: string) => void;
  onAssign: () => void;
}

const VehicleAssignmentDialog: React.FC<VehicleAssignmentDialogProps> = ({
  open,
  availableHubs,
  availableVehicles,
  selectedHub,
  selectedVehicle,
  vehiclesLoading,
  onClose,
  onHubChange,
  onVehicleChange,
  onAssign,
}) => {
  // Debug logging
  React.useEffect(() => {
    if (open) {
      console.log('🔵 [VehicleAssignmentDialog] Dialog opened');
      console.log('🔵 [VehicleAssignmentDialog] Available Hubs:', availableHubs.length);
      console.log('🔵 [VehicleAssignmentDialog] Available Vehicles:', availableVehicles.length);
      console.log('🔵 [VehicleAssignmentDialog] Selected Hub:', selectedHub);
      console.log('🔵 [VehicleAssignmentDialog] Selected Vehicle:', selectedVehicle);
      console.log('🔵 [VehicleAssignmentDialog] Vehicles Loading:', vehiclesLoading);
    }
  }, [open, availableHubs, availableVehicles, selectedHub, selectedVehicle, vehiclesLoading]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Vehicle to Rider</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Select Hub</InputLabel>
            <Select
              value={selectedHub}
              label="Select Hub"
              onChange={(e) => onHubChange(e.target.value)}
            >
              {availableHubs.map((hub) => (
                <MenuItem key={hub.id} value={hub.id}>
                  {hub.name} - {hub.cityName || hub.city?.name || 'Unknown City'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!selectedHub || vehiclesLoading}>
            <InputLabel>Select Vehicle</InputLabel>
            <Select
              value={selectedVehicle}
              label="Select Vehicle"
              onChange={(e) => onVehicleChange(e.target.value)}
            >
              {availableVehicles.map((vehicle) => (
                <MenuItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
                  {vehicle.operationalStatus && (
                    <Chip size="small" label={vehicle.operationalStatus} sx={{ ml: 1 }} />
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {vehiclesLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading available vehicles...
              </Typography>
            </Box>
          )}

          {!selectedHub && !vehiclesLoading && (
            <Alert severity="info">
              Please select a hub first to view available vehicles for that location.
            </Alert>
          )}

          {selectedHub && !vehiclesLoading && availableVehicles.length === 0 && (
            <Alert severity="warning">
              No available vehicles found in the selected hub. All vehicles may be currently
              assigned or under maintenance.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            onClose();
            onHubChange('');
            onVehicleChange('');
          }}
        >
          Cancel
        </Button>
        <Button onClick={onAssign} variant="contained" disabled={!selectedVehicle}>
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleAssignmentDialog;
