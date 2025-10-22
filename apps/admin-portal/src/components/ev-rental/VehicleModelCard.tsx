/**
 * VehicleModelCard Component
 *
 * Displays a vehicle model with specifications, rental pricing, and depreciation info.
 * Used in:
 * - Vehicle preference selection during rider registration
 * - Rental assignment dialog for admins
 * - Vehicle model browsing in admin panel
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  Grid,
  Avatar,
} from '@mui/material';
import {
  ElectricScooter,
  ElectricBike,
  LocalShipping,
  Battery80,
  Speed,
  Schedule,
  TrendingDown,
  CheckCircle,
} from '@mui/icons-material';
import { VehicleModel, RentalCategory } from '../../types/evRental';
import { formatCurrency } from '../../services/evRentalService';

interface VehicleModelCardProps {
  model: VehicleModel;
  selected?: boolean;
  onSelect?: (model: VehicleModel) => void;
  showRentalInfo?: boolean;
  showActions?: boolean;
  vehicleAge?: number; // For depreciation calculation
  depreciated?: {
    actualCost: number;
    depreciationPercentage: number;
    savings: number;
  };
}

/**
 * Get icon for rental category
 */
const getCategoryIcon = (category: RentalCategory | null) => {
  switch (category) {
    case 'ELECTRIC_SCOOTER':
      return <ElectricScooter />;
    case 'ELECTRIC_BIKE':
      return <ElectricBike />;
    case 'ELECTRIC_CARGO':
      return <LocalShipping />;
    default:
      return <ElectricScooter />;
  }
};

/**
 * Get color for rental category
 */
const getCategoryColor = (category: RentalCategory | null): 'primary' | 'secondary' | 'info' => {
  switch (category) {
    case 'ELECTRIC_SCOOTER':
      return 'primary';
    case 'ELECTRIC_BIKE':
      return 'secondary';
    case 'ELECTRIC_CARGO':
      return 'info';
    default:
      return 'primary';
  }
};

/**
 * Format category name for display
 */
const formatCategoryName = (category: RentalCategory | null): string => {
  if (!category) return 'Not Specified';
  return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export const VehicleModelCard: React.FC<VehicleModelCardProps> = ({
  model,
  selected = false,
  onSelect,
  showRentalInfo = true,
  showActions = true,
  vehicleAge,
  depreciated,
}) => {
  const specs = model.specifications || {};
  const isAvailable = model.isAvailableForRent;

  // Calculate display price (depreciated or base)
  const displayPrice = depreciated?.actualCost || model.baseRentalCost;
  const hasDiscount = depreciated && depreciated.depreciationPercentage > 0;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
        },
      }}
    >
      {/* Status Badge */}
      {selected && (
        <Chip
          icon={<CheckCircle />}
          label="Selected"
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1,
          }}
        />
      )}

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: getCategoryColor(model.rentalCategory) + '.light',
              color: getCategoryColor(model.rentalCategory) + '.main',
              mr: 2,
            }}
          >
            {getCategoryIcon(model.rentalCategory)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" gutterBottom>
              {model.modelName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {model.manufacturer} • {model.year}
            </Typography>
          </Box>
        </Box>

        {/* Category Chip */}
        <Chip
          label={formatCategoryName(model.rentalCategory)}
          color={getCategoryColor(model.rentalCategory)}
          size="small"
          sx={{ mb: 2 }}
        />

        {/* Rental Description */}
        {showRentalInfo && model.rentalDescription && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, minHeight: 40 }}
          >
            {model.rentalDescription}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Specifications */}
        <Grid container spacing={2}>
          {specs.batteryCapacity && (
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Battery80 fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Battery
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {specs.batteryCapacity}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {specs.range && (
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Speed fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Range
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {specs.range}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {specs.chargingTime && (
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Charging
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {specs.chargingTime}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {specs.topSpeed && (
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Speed fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Top Speed
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {specs.topSpeed}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>

        {showRentalInfo && (
          <>
            <Divider sx={{ my: 2 }} />

            {/* Pricing Information */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Monthly Rental
                </Typography>
                <Box sx={{ textAlign: 'right' }}>
                  {hasDiscount && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textDecoration: 'line-through', mr: 1 }}
                      component="span"
                    >
                      {formatCurrency(model.baseRentalCost)}
                    </Typography>
                  )}
                  <Typography
                    variant="h5"
                    component="span"
                    color={hasDiscount ? 'success.main' : 'primary.main'}
                    fontWeight="bold"
                  >
                    {formatCurrency(displayPrice)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    per month
                  </Typography>
                </Box>
              </Box>

              {/* Depreciation Info */}
              {hasDiscount && depreciated && (
                <Box
                  sx={{
                    bgcolor: 'success.50',
                    borderRadius: 1,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    mt: 1,
                  }}
                >
                  <TrendingDown fontSize="small" sx={{ color: 'success.main', mr: 1 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="caption" color="success.main" fontWeight="medium">
                      {depreciated.depreciationPercentage}% Depreciation Discount
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Save {formatCurrency(depreciated.savings)}/month
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Vehicle Age Info */}
              {vehicleAge !== undefined && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Vehicle Age: {vehicleAge} months
                </Typography>
              )}

              {/* Minimum Rental Period */}
              {model.minimumRentalPeriod && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Minimum Period: {model.minimumRentalPeriod} months
                </Typography>
              )}
            </Box>
          </>
        )}

        {/* Availability Status */}
        {!isAvailable && (
          <Chip
            label="Not Available for Rent"
            color="error"
            size="small"
            sx={{ mt: 2 }}
          />
        )}
      </CardContent>

      {/* Actions */}
      {showActions && onSelect && (
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant={selected ? 'contained' : 'outlined'}
            color="primary"
            fullWidth
            onClick={() => onSelect(model)}
            disabled={!isAvailable}
          >
            {selected ? 'Selected' : 'Select Model'}
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

export default VehicleModelCard;
