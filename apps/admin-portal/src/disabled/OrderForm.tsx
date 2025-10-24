import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  FormHelperText,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Breadcrumbs,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Save as SaveIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Import types and services
import {
  Order,
  PaymentMethod,
  CreateOrderData,
  UpdateOrderData,
  OrderItemFormData,
} from '../types/order';
import { ApiResponse } from '../types/auth';
import * as orderService from '../services/orderService';

// Initial values for a new order item
const initialOrderItem: OrderItemFormData = {
  id: '',
  name: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0,
  notes: '',
  isNew: true,
};

// Validation schema
const validationSchema = yup.object({
  clientId: yup.string().required('Client is required'),
  storeId: yup.string().required('Store is required'),
  orderType: yup.string().required('Order type is required'),
  customerName: yup.string().required('Customer name is required'),
  customerPhone: yup.string().required('Customer phone is required'),
  customerEmail: yup.string().email('Enter a valid email').required('Customer email is required'),
  deliveryAddress: yup.string().required('Delivery address is required'),
  pickupAddress: yup.string().required('Pickup address is required'),
  paymentMethod: yup.string().required('Payment method is required'),
  deliveryFee: yup.number().min(0, 'Delivery fee cannot be negative'),
  items: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Item name is required'),
      quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
      unitPrice: yup.number().min(0, 'Price cannot be negative').required('Unit price is required'),
    })
  ).min(1, 'At least one item is required'),
});

const OrderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id && id !== 'new';

  // States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [filteredStores, setFilteredStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Load clients and stores
  const loadClientAndStoreData = useCallback(async () => {
    try {
      // For demo purposes, using placeholder data
      // In a real app, these would be API calls
      setClients([
        { id: 'client1', name: 'Client 1' },
        { id: 'client2', name: 'Client 2' }
      ]);

      setStores([
        { id: 'store1', name: 'Store 1', clientId: 'client1', address: '123 Main St, City' },
        { id: 'store2', name: 'Store 2', clientId: 'client1', address: '456 Oak Ave, City' },
        { id: 'store3', name: 'Store 3', clientId: 'client2', address: '789 Pine St, City' }
      ]);

      setProducts([
        { id: 'product1', name: 'Product 1', price: 100 },
        { id: 'product2', name: 'Product 2', price: 200 },
        { id: 'product3', name: 'Product 3', price: 150 }
      ]);
    } catch (err: any) {
      console.error('Error loading client and store data:', err);
      setError(err.message || 'An unexpected error occurred loading clients and stores');
    }
  }, []);

  // Load order data for editing
  const loadOrderData = useCallback(async () => {
    if (!isEditMode) return;

    try {
      const response = await orderService.getOrderById(id as string);

      if (response.success && response.data) {
        const order = response.data as Order;

        // Filter stores based on client
        const clientStores = stores.filter(store => store.clientId === order.client_id);
        setFilteredStores(clientStores);

        // Initialize form with order data
        formik.setValues({
          clientId: order.client_id || '',
          clientName: order.client_name || '',
          clientCode: order.client_code || '',
          storeId: order.store_id || '',
          storeName: order.store_name || '',
          storeCode: order.store_code || '',
          storeAddress: order.store_address || '',
          cityId: order.city_id || '',
          cityName: order.city_name || '',
          orderType: order.order_type || 'delivery',
          orderSource: order.order_source || 'admin',
          priority: order.priority || 'normal',
          customerName: order.customer_name || '',
          customerPhone: order.customer_phone || '',
          customerEmail: order.customer_email || '',
          deliveryAddress: order.delivery_address || '',
          deliveryLatitude: order.delivery_latitude as number | undefined,
          deliveryLongitude: order.delivery_longitude as number | undefined,
          pickupAddress: order.pickup_address || '',
          pickupLatitude: order.pickup_latitude as number | undefined,
          pickupLongitude: order.pickup_longitude as number | undefined,
          paymentMethod: (order.payment_method || PaymentMethod.CASH) as PaymentMethod,
          deliveryFee: order.delivery_fee || 50,
          estimatedPickupTime: order.estimated_pickup_time ? new Date(order.estimated_pickup_time) : null,
          estimatedDeliveryTime: order.estimated_delivery_time ? new Date(order.estimated_delivery_time) : null,
          scheduledFor: order.scheduled_for ? new Date(order.scheduled_for) : null,
          notes: order.notes || '',
          specialInstructions: order.special_instructions || '',
          items: order.items ? order.items.map(item => ({
            id: item.id,
            name: item.itemName || '',
            description: item.itemDescription || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0,
            notes: item.notes || '',
            isNew: false,
          })) : [{ ...initialOrderItem }],
        });
      } else {
        setError(response.error || 'Failed to load order details');
      }
    } catch (err: any) {
      console.error('Error loading order:', err);
      setError(err.message || 'An unexpected error occurred');
    }
  }, [id, isEditMode, stores]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await loadClientAndStoreData();
        await loadOrderData();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadClientAndStoreData, loadOrderData]);

  // Formik setup
  const formik = useFormik({
    initialValues: {
      clientId: '',
      clientName: '',
      clientCode: '',
      storeId: '',
      storeName: '',
      storeCode: '',
      storeAddress: '',
      cityId: '',
      cityName: '',
      orderType: 'delivery',
      orderSource: 'admin',
      priority: 'normal',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      deliveryAddress: '',
      deliveryLatitude: undefined as number | undefined,
      deliveryLongitude: undefined as number | undefined,
      pickupAddress: '',
      pickupLatitude: undefined as number | undefined,
      pickupLongitude: undefined as number | undefined,
      paymentMethod: PaymentMethod.CASH,
      deliveryFee: 50, // Default delivery fee
      estimatedPickupTime: null as Date | null,
      estimatedDeliveryTime: null as Date | null,
      scheduledFor: null as Date | null,
      notes: '',
      specialInstructions: '',
      items: [{ ...initialOrderItem }] as OrderItemFormData[],
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setSubmitting(true);
      setError('');
      setSuccess('');

      try {
        // Calculate order value from items
        const orderValue = values.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

        // Calculate total amount (order value + delivery fee)
        const totalAmount = orderValue + values.deliveryFee;

        // Prepare order data
        const orderData = {
          // Client and store information
          clientId: values.clientId,
          clientName: values.clientName,
          storeId: values.storeId,
          storeName: values.storeName,
          cityId: values.cityId,

          // Order metadata
          orderType: values.orderType,
          orderSource: values.orderSource || 'admin',
          priority: values.priority || 'normal',

          // Customer information
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          customerEmail: values.customerEmail,

          // Location information
          deliveryAddress: values.deliveryAddress,
          deliveryLatitude: values.deliveryLatitude,
          deliveryLongitude: values.deliveryLongitude,
          pickupAddress: values.pickupAddress || '',
          pickupLatitude: values.pickupLatitude,
          pickupLongitude: values.pickupLongitude,

          // Payment and fees
          paymentMethod: values.paymentMethod,
          orderValue,
          deliveryFee: values.deliveryFee,
          totalAmount,

          // Scheduling
          estimatedPickupTime: values.estimatedPickupTime?.toISOString(),
          estimatedDeliveryTime: values.estimatedDeliveryTime?.toISOString(),
          scheduledFor: values.scheduledFor?.toISOString(),

          // Notes
          notes: values.notes,
          specialInstructions: values.specialInstructions,

          // Items
        items: values.items.map((item) => ({
            id: item.isNew ? undefined : item.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes
        })),      
        };

      let response: ApiResponse<Order | Order[]>;
        if (isEditMode) {
          const updateData = {
            id: id as string,
            ...orderData
          } as unknown as UpdateOrderData;
          response = await orderService.updateOrder(id as string, updateData);
        } else {
          response = await orderService.createOrder(orderData as unknown as CreateOrderData);
        }

        if (response.success) {
          setSuccess(isEditMode ? 'Order updated successfully' : 'Order created successfully');

          // Navigate back to order detail or list after short delay
          setTimeout(() => {
            if (isEditMode) {
              navigate(`/orders/${id}`);
            } else if (response.data) {
              // Handle single order response or get the first from an array
              const orderData = Array.isArray(response.data) ? response.data[0] : response.data;
              if (orderData && orderData.id) {
                navigate(`/orders/${orderData.id}`);
              } else {
                navigate('/orders');
              }
            } else {
              navigate('/orders');
            }
          }, 1500);
        } else {
          setError(response.error || 'Failed to save order');
        }
      } catch (err: any) {
        console.error('Error saving order:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Handle client change - update available stores
  const handleClientChange = (clientId: string) => {
    formik.setFieldValue('clientId', clientId);
    formik.setFieldValue('storeId', '');

    const clientStores = stores.filter(store => store.clientId === clientId);
    setFilteredStores(clientStores);
  };

  // Handle store change - update pickup address
  const handleStoreChange = (storeId: string) => {
    formik.setFieldValue('storeId', storeId);

    const selectedStore = stores.find(store => store.id === storeId);
    if (selectedStore) {
      formik.setFieldValue('pickupAddress', selectedStore.address);
    }
  };

  // Handle adding a new item to the order
  const handleAddItem = () => {
    const updatedItems = [...formik.values.items, { ...initialOrderItem }];
    formik.setFieldValue('items', updatedItems);
  };

  // Handle removing an item from the order
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...formik.values.items];
    updatedItems.splice(index, 1);
    formik.setFieldValue('items', updatedItems);
  };

  // Handle product selection in an order item
  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updatedItems = [...formik.values.items];
      updatedItems[index] = {
        ...updatedItems[index],
        name: product.name,
        description: product.description || '',
        unitPrice: product.price,
        totalPrice: product.price * updatedItems[index].quantity,
      };
      formik.setFieldValue('items', updatedItems);
    }
  };

  // Handle quantity change in an order item
  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedItems = [...formik.values.items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
      totalPrice: updatedItems[index].unitPrice * quantity,
    };
    formik.setFieldValue('items', updatedItems);
  };

  // Handle unit price change in an order item
  const handleUnitPriceChange = (index: number, unitPrice: number) => {
    const updatedItems = [...formik.values.items];
    updatedItems[index] = {
      ...updatedItems[index],
      unitPrice,
      totalPrice: unitPrice * updatedItems[index].quantity,
    };
    formik.setFieldValue('items', updatedItems);
  };

  // Calculate order totals
  const calculateOrderTotals = () => {
    const subtotal = formik.values.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const deliveryFee = 50; // Fixed fee
    const taxRate = 0.05; // 5% tax
    const taxAmount = subtotal * taxRate;
    const total = subtotal + deliveryFee + taxAmount;

    return {
      subtotal: subtotal.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      tax: taxAmount.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const totals = calculateOrderTotals();

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
          Dashboard
        </Link>
        <Link to="/orders" style={{ textDecoration: 'none', color: 'inherit' }}>
          Orders
        </Link>
        <Typography color="text.primary">
          {isEditMode ? `Edit Order ${id}` : 'Create New Order'}
        </Typography>
      </Breadcrumbs>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {isEditMode ? 'Edit Order' : 'Create New Order'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/orders')}
        >
          Back to Orders
        </Button>
      </Box>

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Client and Store Selection */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Client & Store
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl
                      fullWidth
                      error={formik.touched.clientId && Boolean(formik.errors.clientId)}
                    >
                      <InputLabel id="client-label">Client</InputLabel>
                      <Select
                        labelId="client-label"
                        id="clientId"
                        name="clientId"
                        value={formik.values.clientId}
                        onChange={(e) => handleClientChange(e.target.value)}
                        label="Client"
                        disabled={submitting}
                      >
                        <MenuItem value="">
                          <em>Select a client</em>
                        </MenuItem>
                        {clients.map((client) => (
                          <MenuItem key={client.id} value={client.id}>
                            {client.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.clientId && formik.errors.clientId && (
                        <FormHelperText>{formik.errors.clientId}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl
                      fullWidth
                      error={formik.touched.storeId && Boolean(formik.errors.storeId)}
                      disabled={!formik.values.clientId || submitting}
                    >
                      <InputLabel id="store-label">Store</InputLabel>
                      <Select
                        labelId="store-label"
                        id="storeId"
                        name="storeId"
                        value={formik.values.storeId}
                        onChange={(e) => handleStoreChange(e.target.value)}
                        label="Store"
                      >
                        <MenuItem value="">
                          <em>Select a store</em>
                        </MenuItem>
                        {filteredStores.map((store) => (
                          <MenuItem key={store.id} value={store.id}>
                            {store.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.storeId && formik.errors.storeId && (
                        <FormHelperText>{formik.errors.storeId}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="pickupAddress"
                      name="pickupAddress"
                      label="Pickup Address"
                      value={formik.values.pickupAddress}
                      onChange={formik.handleChange}
                      disabled={true} // Auto-filled from store selection
                      InputProps={{
                        startAdornment: <LocationIcon color="action" />,
                      }}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Customer Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Customer Information
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="customerName"
                      name="customerName"
                      label="Customer Name"
                      value={formik.values.customerName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.customerName && Boolean(formik.errors.customerName)}
                      helperText={formik.touched.customerName && formik.errors.customerName}
                      disabled={submitting}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="customerPhone"
                      name="customerPhone"
                      label="Phone Number"
                      value={formik.values.customerPhone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.customerPhone && Boolean(formik.errors.customerPhone)}
                      helperText={formik.touched.customerPhone && formik.errors.customerPhone}
                      disabled={submitting}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="customerEmail"
                      name="customerEmail"
                      label="Email Address"
                      value={formik.values.customerEmail}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.customerEmail && Boolean(formik.errors.customerEmail)}
                      helperText={formik.touched.customerEmail && formik.errors.customerEmail}
                      disabled={submitting}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="deliveryAddress"
                      name="deliveryAddress"
                      label="Delivery Address"
                      value={formik.values.deliveryAddress}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.deliveryAddress && Boolean(formik.errors.deliveryAddress)}
                      helperText={formik.touched.deliveryAddress && formik.errors.deliveryAddress}
                      disabled={submitting}
                      multiline
                      rows={3}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Order Details */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Details
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl
                      fullWidth
                      error={formik.touched.paymentMethod && Boolean(formik.errors.paymentMethod)}
                    >
                      <InputLabel id="payment-method-label">Payment Method</InputLabel>
                      <Select
                        labelId="payment-method-label"
                        id="paymentMethod"
                        name="paymentMethod"
                        value={formik.values.paymentMethod}
                        onChange={formik.handleChange}
                        label="Payment Method"
                        disabled={submitting}
                      >
                        <MenuItem value={PaymentMethod.CASH}>Cash</MenuItem>
                        <MenuItem value={PaymentMethod.CREDIT_CARD}>Credit Card</MenuItem>
                        <MenuItem value={PaymentMethod.UPI}>UPI</MenuItem>
                        <MenuItem value={PaymentMethod.WALLET}>Digital Wallet</MenuItem>
                      </Select>
                      {formik.touched.paymentMethod && formik.errors.paymentMethod && (
                        <FormHelperText>{formik.errors.paymentMethod}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="notes"
                      name="notes"
                      label="Order Notes"
                      value={formik.values.notes}
                      onChange={formik.handleChange}
                      disabled={submitting}
                      multiline
                      rows={2}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="Estimated Pickup Time"
                        value={formik.values.estimatedPickupTime}
                        onChange={(value) => formik.setFieldValue('estimatedPickupTime', value)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: 'outlined',
                            disabled: submitting,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="Estimated Delivery Time"
                        value={formik.values.estimatedDeliveryTime}
                        onChange={(value) => formik.setFieldValue('estimatedDeliveryTime', value)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: 'outlined',
                            disabled: submitting,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="Scheduled For"
                        value={formik.values.scheduledFor}
                        onChange={(value) => formik.setFieldValue('scheduledFor', value)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: 'outlined',
                            disabled: submitting,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Order Items */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Order Items
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                    disabled={submitting}
                  >
                    Add Item
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {formik.values.items.length === 0 && (
                  <Typography color="text.secondary" align="center" sx={{ my: 2 }}>
                    No items added yet. Click "Add Item" to start adding items to this order.
                  </Typography>
                )}

                {formik.values.items.length > 0 && (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="center">Quantity</TableCell>
                          <TableCell align="right">Unit Price (₹)</TableCell>
                          <TableCell align="right">Total Price (₹)</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formik.values.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell width="40%">
                              <FormControl
                                fullWidth
                                error={
                                  formik.touched.items?.[index]?.name &&
                                  Boolean(
                                    formik.errors.items?.[index] &&
                                    typeof formik.errors.items[index] === 'object' &&
                                    (formik.errors.items[index] as any)?.name
                                  )
                                }
                              >
                                <Autocomplete
                                  id={`items.${index}.name`}
                                  options={products}
                                  getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                                  isOptionEqualToValue={(option, value) => option.id === value.id}
                                  value={
                                    item.name
                                      ? products.find(p => p.name === item.name) || null
                                      : null
                                  }
                                  onChange={(_, value) => {
                                    if (value) {
                                      handleProductSelect(index, value.id);
                                    }
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Product"
                                      name={`items.${index}.name`}
                                      value={item.name}
                                      onChange={(e) => {
                                        const updatedItems = [...formik.values.items];
                                        updatedItems[index].name = e.target.value;
                                        formik.setFieldValue('items', updatedItems);
                                      }}
                                      disabled={submitting}
                                      required
                                      error={
                                        formik.touched.items?.[index]?.name &&
                                        Boolean(
                                          formik.errors.items?.[index] &&
                                          typeof formik.errors.items[index] === 'object' &&
                                          (formik.errors.items[index] as any)?.name
                                        )
                                      }
                                      helperText={
                                        formik.touched.items?.[index]?.name &&
                                        typeof formik.errors.items?.[index] === 'object' &&
                                        (formik.errors.items[index] as any)?.name
                                      }
                                    />
                                  )}
                                  disabled={submitting}
                                />
                              </FormControl>
                              <TextField
                                fullWidth
                                margin="dense"
                                id={`items.${index}.notes`}
                                name={`items.${index}.notes`}
                                label="Item Notes"
                                value={item.notes || ''}
                                onChange={(e) => {
                                  const updatedItems = [...formik.values.items];
                                  updatedItems[index].notes = e.target.value;
                                  formik.setFieldValue('items', updatedItems);
                                }}
                                disabled={submitting}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center" width="15%">
                              <TextField
                                id={`items.${index}.quantity`}
                                name={`items.${index}.quantity`}
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const quantity = parseInt(e.target.value);
                                  handleQuantityChange(index, quantity);
                                }}
                                inputProps={{ min: 1 }}
                                disabled={submitting}
                                error={
                                  formik.touched.items?.[index]?.quantity &&
                                  Boolean(
                                    formik.errors.items?.[index] &&
                                    typeof formik.errors.items[index] === 'object' &&
                                    (formik.errors.items[index] as any)?.quantity
                                  )
                                }
                                helperText={
                                  formik.touched.items?.[index]?.quantity &&
                                  typeof formik.errors.items?.[index] === 'object' &&
                                  (formik.errors.items[index] as any)?.quantity
                                }
                              />
                            </TableCell>
                            <TableCell align="right" width="15%">
                              <TextField
                                id={`items.${index}.unitPrice`}
                                name={`items.${index}.unitPrice`}
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => {
                                  const unitPrice = parseFloat(e.target.value);
                                  handleUnitPriceChange(index, unitPrice);
                                }}
                                inputProps={{ min: 0, step: 0.01 }}
                                disabled={submitting}
                                error={
                                  formik.touched.items?.[index]?.unitPrice &&
                                  Boolean(
                                    formik.errors.items?.[index] &&
                                    typeof formik.errors.items[index] === 'object' &&
                                    (formik.errors.items[index] as any)?.unitPrice
                                  )
                                }
                                helperText={
                                  formik.touched.items?.[index]?.unitPrice &&
                                  typeof formik.errors.items?.[index] === 'object' &&
                                  (formik.errors.items[index] as any)?.unitPrice
                                }
                              />
                            </TableCell>
                            <TableCell align="right" width="15%">
                              ₹{item.totalPrice.toFixed(2)}
                            </TableCell>
                            <TableCell align="center" width="10%">
                              <IconButton
                                color="error"
                                onClick={() => handleRemoveItem(index)}
                                disabled={formik.values.items.length <= 1 || submitting}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Order Totals */}
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="subtitle2">Subtotal</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography>₹{totals.subtotal}</Typography>
                          </TableCell>
                          <TableCell />
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="subtitle2">Delivery Fee</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography>₹{totals.deliveryFee}</Typography>
                          </TableCell>
                          <TableCell />
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="subtitle2">Tax (5%)</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography>₹{totals.tax}</Typography>
                          </TableCell>
                          <TableCell />
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="h6">Total</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="h6">₹{totals.total}</Typography>
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {typeof formik.errors.items === 'string' && (
                  <Typography color="error" sx={{ mt: 2 }}>
                    {formik.errors.items}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Submit buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/orders')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={submitting ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : (isEditMode ? 'Update Order' : 'Create Order')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default OrderForm;
