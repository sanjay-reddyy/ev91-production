import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Paper,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import {
  ElectricScooter,
  InfoOutlined,
} from '@mui/icons-material';
import {
  RiderVehiclePreference,
} from '../../types/evRental';
import {
  updateVehiclePreference,
} from '../../services/evRentalService';

interface VehiclePreferenceSelectorProps {
  riderId: string;
  needsEvRental?: boolean; // Add this prop to track the boolean flag
  currentPreference?: RiderVehiclePreference;
  currentModelId?: string;
  currentOwnVehicleType?: RiderVehiclePreference | null;
  onPreferenceSelected: (preference: RiderVehiclePreference, modelId: string, ownVehicleType?: RiderVehiclePreference | null) => void;
  disabled?: boolean;
}

export const VehiclePreferenceSelector: React.FC<VehiclePreferenceSelectorProps> = ({
  riderId,
  needsEvRental = false, // Default to false if not provided
  currentPreference,
  onPreferenceSelected,
  disabled = false,
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize based on needsEvRental boolean flag (source of truth)
  // If needsEvRental is true, rider needs EV rental
  // If needsEvRental is false, check if they have a specific vehiclePreference set
  const [selectedNeedsRental, setSelectedNeedsRental] = useState<boolean>(needsEvRental);
  const [selectedOwnVehicleType, setSelectedOwnVehicleType] = useState<RiderVehiclePreference | undefined>(
    !needsEvRental && currentPreference && currentPreference !== RiderVehiclePreference.NEED_EV_RENTAL
      ? currentPreference
      : undefined
  );

  const handlePreferenceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const needsRental = event.target.value === 'yes';
    setSelectedNeedsRental(needsRental);

    if (needsRental) {
      setSelectedOwnVehicleType(undefined);
    }
  };

  const handleSave = async () => {
    if (!selectedNeedsRental && !selectedOwnVehicleType) {
      setError('Please select your vehicle type');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: any = {
        needsEvRental: selectedNeedsRental
      };

      // When "Yes" is selected: vehiclePreference should be "NEED_EV_RENTAL" (EV91 Rental Vehicle)
      // When "No" is selected: vehiclePreference should be one of: OWN_VEHICLE, RENTED_VEHICLE, CYCLE, WALK
      if (selectedNeedsRental) {
        payload.vehiclePreference = RiderVehiclePreference.NEED_EV_RENTAL;
      } else if (selectedOwnVehicleType) {
        payload.vehiclePreference = selectedOwnVehicleType;
      }

      await updateVehiclePreference(riderId, payload);

      // Return appropriate preference value to parent component
      const preference = selectedNeedsRental
        ? RiderVehiclePreference.NEED_EV_RENTAL
        : (selectedOwnVehicleType || RiderVehiclePreference.OWN_VEHICLE);

      onPreferenceSelected(preference, '', selectedOwnVehicleType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preference');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ElectricScooter sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h6" gutterBottom>
              EV Rental Preference
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Does this rider need an EV rental vehicle from the company?
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" icon={<InfoOutlined />} sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>EV Rental Benefits:</strong> Save on fuel costs, reduce maintenance, and contribute
            to a cleaner environment.
          </Typography>
        </Alert>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl component="fieldset" fullWidth disabled={disabled || saving}>
          <FormLabel component="legend" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Does the rider need an EV rental vehicle?
            </Typography>
          </FormLabel>
          <RadioGroup
            value={selectedNeedsRental ? 'yes' : 'no'}
            onChange={handlePreferenceChange}
          >
            <FormControlLabel
              value="yes"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    Yes - Rider needs EV rental from company
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Company will provide an electric vehicle for deliveries
                  </Typography>
                </Box>
              }
              sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
            />
            <FormControlLabel
              value="no"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    No - Rider has own vehicle
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rider will use their personal vehicle or other means
                  </Typography>
                </Box>
              }
              sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
            />
          </RadioGroup>
        </FormControl>
      </Paper>

      {!selectedNeedsRental && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.50' }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            What type of vehicle does the rider have?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please specify the rider's current vehicle for delivery purposes
          </Typography>
          <FormControl fullWidth disabled={disabled || saving}>
            <InputLabel>Vehicle Type</InputLabel>
            <Select
              value={selectedOwnVehicleType || ''}
              label="Vehicle Type"
              onChange={(e) => setSelectedOwnVehicleType(e.target.value as RiderVehiclePreference)}
            >
              <MenuItem value={RiderVehiclePreference.OWN_VEHICLE}>Own Vehicle</MenuItem>
              <MenuItem value={RiderVehiclePreference.RENTED_VEHICLE}>Rented Vehicle</MenuItem>
              <MenuItem value={RiderVehiclePreference.CYCLE}>Cycle</MenuItem>
              <MenuItem value={RiderVehiclePreference.WALK}>Walk</MenuItem>
            </Select>
          </FormControl>
        </Paper>
      )}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={
            disabled ||
            saving ||
            (!selectedNeedsRental && !selectedOwnVehicleType)
          }
        >
          {saving ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Saving...
            </>
          ) : (
            'Save Preference'
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default VehiclePreferenceSelector;
