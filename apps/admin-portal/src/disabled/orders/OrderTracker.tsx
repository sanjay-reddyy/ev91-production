import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Paper,
  styled
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
  LocalShipping as ShippingIcon,
  Store as StoreIcon,
  DeliveryDining as DeliveryIcon,
  PendingActions as PendingIcon,
  TaskAlt as CompletedIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// Import types
import {
  Order,
  OrderStatus,
  OrderStatusHistory
} from '../../types/order';

// Styled components for custom step styling
const StepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean; error?: boolean; cancelled?: boolean };
}>(({ theme, ownerState }) => ({
  display: 'flex',
  height: 22,
  alignItems: 'center',
  color: ownerState.active
    ? theme.palette.primary.main
    : ownerState.completed
      ? theme.palette.success.main
      : ownerState.error
        ? theme.palette.error.main
        : ownerState.cancelled
          ? theme.palette.error.light
          : theme.palette.text.disabled,
  '& .StepIcon-completedIcon': {
    color: theme.palette.success.main,
    zIndex: 1,
    fontSize: 24,
  },
  '& .StepIcon-circle': {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'currentColor',
  },
}));

interface OrderStepIconProps {
  active?: boolean;
  completed?: boolean;
  error?: boolean;
  cancelled?: boolean;
  icon: React.ReactNode;
}

// Custom step icon component
function OrderStepIcon(props: OrderStepIconProps) {
  const { active, completed, error, cancelled, icon } = props;

  const ownerState = {
    active,
    completed,
    error,
    cancelled
  };

  const icons: { [index: string]: React.ReactElement } = {
    1: <PendingIcon />,
    2: <StoreIcon />,
    3: <ShippingIcon />,
    4: <DeliveryIcon />,
    5: <CompletedIcon />,
  };

  if (error) {
    return (
      <StepIconRoot ownerState={ownerState}>
        <ErrorIcon color="error" />
      </StepIconRoot>
    );
  }

  if (cancelled) {
    return (
      <StepIconRoot ownerState={ownerState}>
        <CancelIcon color="error" />
      </StepIconRoot>
    );
  }

  return (
    <StepIconRoot ownerState={ownerState}>
      {completed ? (
        <CheckIcon className="StepIcon-completedIcon" />
      ) : (
        icons[String(icon)]
      )}
    </StepIconRoot>
  );
}

// Map order status to step index
const getStepIndex = (status: OrderStatus): number => {
  switch (status) {
    case OrderStatus.PENDING:
      return 0;
    case OrderStatus.CONFIRMED:
      return 1;
    case OrderStatus.PICKED_UP:
      return 2;
    case OrderStatus.IN_TRANSIT:
      return 3;
    case OrderStatus.DELIVERED:
      return 4;
    case OrderStatus.CANCELLED:
    case OrderStatus.FAILED:
      return -1; // Special case for cancelled/failed orders
    default:
      return 0;
  }
};

interface OrderTrackerProps {
  order: Order;
  statusHistory: OrderStatusHistory[];
}

const OrderTracker: React.FC<OrderTrackerProps> = ({ order, statusHistory }) => {
  // Define steps in the order process
  const steps = ['Pending', 'Confirmed', 'Picked Up', 'In Transit', 'Delivered'];

  // Get the current step based on order status
  const currentStep = getStepIndex(order.status as OrderStatus);

  // Special case for cancelled or failed orders
  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isFailed = order.status === OrderStatus.FAILED;

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Find timestamp for each status from history
  const getStatusTimestamp = (status: OrderStatus): string => {
    const historyItem = statusHistory.find(h => h.status === status);
    return historyItem ? formatDate(historyItem.createdAt) : '';
  };

  return (
    <Box sx={{ width: '100%' }}>
      {(isCancelled || isFailed) ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: isCancelled ? '#FFEBEE' : '#FFF8E1',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            mb: 2
          }}
        >
          {isCancelled ? (
            <>
              <CancelIcon color="error" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h6" color="error">Order Cancelled</Typography>
                <Typography variant="body2">
                  {order.cancellationReason || 'No reason provided'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(order.updatedAt)}
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <ErrorIcon color="warning" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h6" color="warning.dark">Order Failed</Typography>
                <Typography variant="body2">
                  {order.cancellationReason || 'No reason provided'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(order.updatedAt)}
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      ) : null}

      <Stepper activeStep={currentStep} alternativeLabel>
        {steps.map((label, index) => {
          const stepProps: { completed?: boolean } = {};
          const labelProps: { optional?: React.ReactNode } = {};

          // Mark appropriate steps as completed
          stepProps.completed = index < currentStep;

          // Add timestamp as optional label
          let timestamp = '';
          switch (index) {
            case 0:
              timestamp = getStatusTimestamp(OrderStatus.PENDING);
              break;
            case 1:
              timestamp = getStatusTimestamp(OrderStatus.CONFIRMED);
              break;
            case 2:
              timestamp = getStatusTimestamp(OrderStatus.PICKED_UP);
              break;
            case 3:
              timestamp = getStatusTimestamp(OrderStatus.IN_TRANSIT);
              break;
            case 4:
              timestamp = getStatusTimestamp(OrderStatus.DELIVERED);
              break;
          }

          if (timestamp) {
            labelProps.optional = (
              <Typography variant="caption" color="text.secondary">
                {timestamp}
              </Typography>
            );
          }

          return (
            <Step key={label} {...stepProps}>
              <StepLabel
                StepIconComponent={OrderStepIcon}
                StepIconProps={{
                  error: isFailed && index === currentStep,
                  // @ts-ignore - custom prop for our OrderStepIcon
                  cancelled: isCancelled && index === currentStep
                }}
                {...labelProps}
              >
                {label}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        {currentStep === steps.length ? (
          <Typography variant="subtitle1" color="success.main">
            Order successfully delivered on {formatDate(order.actualDeliveryTime)}
          </Typography>
        ) : isCancelled ? (
          <Typography variant="subtitle1" color="error">
            Order was cancelled and will not proceed further
          </Typography>
        ) : isFailed ? (
          <Typography variant="subtitle1" color="warning.dark">
            Order delivery failed
          </Typography>
        ) : (
          <Typography variant="subtitle1" color="text.secondary">
            {`Order is currently ${steps[currentStep].toLowerCase()}`}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default OrderTracker;
