import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Snackbar, Alert, Select, InputLabel, FormControl, CircularProgress, Autocomplete, InputAdornment, Avatar
} from '@mui/material';
import MuiIconButton from '@mui/material/IconButton';
import { Add as AddIcon, Refresh as RefreshIcon, Search as SearchIcon, Visibility as VisibilityIcon, Inventory as InventoryIcon, Close as CloseIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { purchaseOrdersService, suppliersService, sparePartsService, PurchaseOrder, Supplier, SparePart } from '../services/sparePartsService';
import { hubService, HubResponse } from '../services/hubService';


const defaultOrderForm = {
  supplierId: '',
  storeId: '',
  storeName: '',
  expectedDeliveryDate: '',
  notes: '',
  items: [] as Array<{ sparePartId: string; sparePart?: SparePart; quantity: number; unitPrice: number; }>,
};

const PurchaseOrders: React.FC = () => {
  // Helper function to get unit price (prefer selling price, fallback to cost price)
  const getUnitPrice = (sparePart?: SparePart): number => {
    return sparePart?.sellingPrice || sparePart?.costPrice || 0;
  };

  // Spare part search and selection state
  const [sparePartSearch, setSparePartSearch] = useState('');
  const [debouncedSparePartSearch, setDebouncedSparePartSearch] = useState('');
  const [sparePartOptions, setSparePartOptions] = useState<SparePart[]>([]);
  const [sparePartsLoading, setSparePartsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSparePartSearch(sparePartSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [sparePartSearch]);

  // ...existing code...

  // Fetch spare parts for autocomplete
  useEffect(() => {
    let active = true;
    if (debouncedSparePartSearch.length < 2) {
      setSparePartOptions([]);
      return;
    }
    setSparePartsLoading(true);
    sparePartsService.getAll({ search: debouncedSparePartSearch, limit: 20 })
      .then(res => {
        let options: SparePart[] = [];
        if (Array.isArray(res.data)) options = res.data;
        else if (res.data?.spareParts) options = res.data.spareParts;
        else if (Array.isArray(res.data?.items)) options = res.data.items;
        if (active) setSparePartOptions(options);
      })
      .catch(() => { if (active) setSparePartOptions([]); })
      .finally(() => { if (active) setSparePartsLoading(false); });
    return () => { active = false; };
  }, [debouncedSparePartSearch]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(defaultOrderForm);
  const [hubs, setHubs] = useState<HubResponse[]>([]);
  const [hubsLoading, setHubsLoading] = useState(false);
  // Load operational hubs for dropdown
  useEffect(() => {
    setHubsLoading(true);
    hubService.getOperationalHubs()
      .then(data => setHubs(Array.isArray(data) ? data : []))
      .catch(() => setHubs([]))
      .finally(() => setHubsLoading(false));
  }, []);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Load suppliers for dropdown
  const loadSuppliers = useCallback(async () => {
    try {
      const res = await suppliersService.getAll({ limit: 100 });
      setSuppliers(Array.isArray(res.data) ? res.data : res.data?.suppliers || []);
    } catch {
      setSuppliers([]);
    }
  }, []);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    try {
      const res = await purchaseOrdersService.getAll({ page: 1, limit: 1 });
      setAnalytics({
        totalOrders: res.pagination?.totalItems || 0,
        totalSpend: res.data?.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0),
      });
    } catch {
      setAnalytics(null);
    }
  }, []);

  // Load purchase orders
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: rowsPerPage, search: search || undefined };
      const res = await purchaseOrdersService.getAll(params);
      setOrders(Array.isArray(res.data) ? res.data : []);
      setTotalCount(res.pagination?.totalItems || 0);
    } catch {
      setOrders([]);
      setTotalCount(0);
      setSnackbar({ open: true, message: 'Failed to load purchase orders', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => { loadSuppliers(); loadAnalytics(); }, [loadSuppliers, loadAnalytics]);
  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Dialog handlers
  const handleOpenDialog = () => {
    setForm(defaultOrderForm);
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setForm(defaultOrderForm);
    setFormErrors({});
  };

  // Add spare part to items (memoized to prevent re-renders and focus loss)
  const handleAddSparePart = useCallback((sparePart: SparePart) => {
    if (!sparePart?.id) return;
    const exists = form.items.find(item => item.sparePartId === sparePart.id);
    if (exists) {
      setForm(f => ({
        ...f,
        items: f.items.map(item =>
          item.sparePartId === sparePart.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      }));
    } else {
      setForm(f => ({
        ...f,
        items: [
          ...f.items,
          { sparePartId: sparePart.id, sparePart, quantity: 1, unitPrice: getUnitPrice(sparePart) },
        ],
      }));
    }
    setSparePartSearch('');
  }, [form.items]);

  // Update item fields
  const handleItemChange = (idx: number, field: 'quantity' | 'unitPrice', value: number) => {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      ),
    }));
  };

  // Remove item
  const handleRemoveItem = (idx: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  // Calculate totals
  const totalQuantity = useMemo(() => form.items.reduce((sum, item) => sum + (item.quantity || 0), 0), [form.items]);
  const totalValue = useMemo(() => form.items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0), [form.items]);

  // Save order with items
  const handleSave = async () => {
    const errors: { [key: string]: string } = {};
    if (!form.supplierId) errors.supplierId = 'Supplier is required';
    if (!form.storeId) errors.storeId = 'Store/Hub is required';
    if (!form.expectedDeliveryDate) errors.expectedDeliveryDate = 'Expected delivery date is required';
    if (!form.items || form.items.length === 0) errors.items = 'At least one item is required';
    else {
      form.items.forEach((item, idx) => {
        if (!item.sparePartId) errors[`item-${idx}`] = 'Spare part required';
        if (!item.quantity || item.quantity < 1) errors[`item-qty-${idx}`] = 'Quantity required';
        if (item.unitPrice == null || item.unitPrice < 0) errors[`item-price-${idx}`] = 'Unit price required';
      });
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const selectedHub = hubs.find(h => h.id === form.storeId);
      await purchaseOrdersService.create({
        supplierId: form.supplierId,
        storeId: form.storeId,
        storeName: selectedHub?.name || '',
        expectedDeliveryDate: form.expectedDeliveryDate,
        notes: form.notes,
        items: form.items.map(({ sparePartId, quantity, unitPrice }) => ({
          sparePartId,
          orderedQuantity: quantity,
          unitCost: unitPrice,
        })),
      });
      setSnackbar({ open: true, message: 'Purchase order created', severity: 'success' });
      handleCloseDialog();
      loadOrders();
      loadAnalytics();
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Failed to create order', severity: 'error' });
    }
  };

  // Table columns: Order #, Supplier, Date, Status, Total, Actions
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Purchase Orders</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>New Order</Button>
      </Box>

      {/* Analytics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Orders</Typography>
              <Typography variant="h4" fontWeight="bold">{analytics?.totalOrders ?? <CircularProgress size={24} />}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Spend</Typography>
              <Typography variant="h4" fontWeight="bold">₹{analytics?.totalSpend?.toLocaleString() ?? <CircularProgress size={24} />}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Refresh */}
      <Box mb={2} display="flex" gap={2} alignItems="center">
        <TextField
          placeholder="Search orders..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          InputProps={{ startAdornment: <SearchIcon fontSize="small" /> }}
          onKeyDown={e => { if (e.key === 'Enter') loadOrders(); }}
        />
        <Button variant="outlined" onClick={loadOrders} startIcon={<RefreshIcon />}>Refresh</Button>
      </Box>

      {/* Orders Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                ) : orders.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">No purchase orders found</TableCell></TableRow>
                ) : orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{order.supplier?.name || '-'}</TableCell>
                    <TableCell>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell align="right">₹{order.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View"><IconButton><VisibilityIcon /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </CardContent>
      </Card>

      {/* Create Order Dialog (enhanced) */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>New Purchase Order</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box component="form" sx={{ mt: 1 }}>
            <FormControl fullWidth required sx={{ mb: 2 }} error={!!formErrors.supplierId}>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={form.supplierId}
                label="Supplier"
                onChange={e => setForm({ ...form, supplierId: e.target.value })}
              >
                {suppliers.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
              {formErrors.supplierId && <Typography color="error" variant="caption">{formErrors.supplierId}</Typography>}
            </FormControl>
            <FormControl fullWidth required sx={{ mb: 2 }} error={!!formErrors.storeId}>
              <InputLabel>Store / Hub</InputLabel>
              <Select
                value={form.storeId}
                label="Store / Hub"
                onChange={e => setForm({ ...form, storeId: e.target.value })}
                disabled={hubsLoading}
              >
                {hubs.map(hub => (
                  <MenuItem key={hub.id} value={hub.id}>{hub.name}</MenuItem>
                ))}
              </Select>
              {formErrors.storeId && <Typography color="error" variant="caption">{formErrors.storeId}</Typography>}
            </FormControl>
            <TextField
              fullWidth
              label="Expected Delivery Date"
              type="date"
              value={form.expectedDeliveryDate}
              onChange={e => setForm({ ...form, expectedDeliveryDate: e.target.value })}
              required
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
              error={!!formErrors.expectedDeliveryDate}
              helperText={formErrors.expectedDeliveryDate}
            />
            <TextField
              fullWidth
              label="Notes"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            {/* Spare Parts Autocomplete */}
            <Autocomplete
              freeSolo
              disablePortal={false}
              options={sparePartOptions}
              getOptionLabel={option => typeof option === 'string' ? option : `${option.name} (${option.partNumber})`}
              renderOption={(props, option) => (
                <li {...props} key={option.id} onClick={() => handleAddSparePart(option)}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                      <InventoryIcon />
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {option.partNumber} • ₹{getUnitPrice(option)}
                      </Typography>
                    </Box>
                  </Box>
                </li>
              )}
              inputValue={sparePartSearch}
              onInputChange={(_, value) => setSparePartSearch(value)}
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder="Search spare parts by name or part number..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
              )}
              loading={sparePartsLoading}
              loadingText="Searching spare parts..."
              noOptionsText={sparePartSearch.length < 2 ? 'Type at least 2 characters to search' : 'No spare parts found'}
              disabled={sparePartsLoading}
            />
            {/* Selected Items Table */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Order Items ({form.items.length})
              </Typography>
              {form.items.length === 0 ? (
                <Alert severity="info">Search and select spare parts to add to the order</Alert>
              ) : (
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Part</TableCell>
                        <TableCell>Part Number</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price (₹)</TableCell>
                        <TableCell align="right">Total (₹)</TableCell>
                        <TableCell align="center">Remove</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {form.items.map((item, idx) => (
                        <TableRow key={item.sparePartId}>
                          <TableCell>{item.sparePart?.name || '-'}</TableCell>
                          <TableCell>{item.sparePart?.partNumber || '-'}</TableCell>
                          <TableCell align="right">
                            <Box display="flex" alignItems="center" gap={1}>
                              <MuiIconButton size="small" onClick={() => handleItemChange(idx, 'quantity', Math.max(1, item.quantity - 1))} disabled={item.quantity <= 1}>
                                <RemoveIcon fontSize="small" />
                              </MuiIconButton>
                              <TextField
                                size="small"
                                type="number"
                                value={item.quantity}
                                onChange={e => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                sx={{ width: 60 }}
                                inputProps={{ min: 1 }}
                                error={!!formErrors[`item-qty-${idx}`]}
                                helperText={formErrors[`item-qty-${idx}`]}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={item.unitPrice}
                              onChange={e => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              sx={{ width: 80 }}
                              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                              error={!!formErrors[`item-price-${idx}`]}
                              helperText={formErrors[`item-price-${idx}`]}
                            />
                          </TableCell>
                          <TableCell align="right">₹{(item.quantity * (item.unitPrice || 0)).toLocaleString()}</TableCell>
                          <TableCell align="center">
                            <MuiIconButton size="small" color="error" onClick={() => handleRemoveItem(idx)}>
                              <CloseIcon fontSize="small" />
                            </MuiIconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}
            </Box>
            {/* Summary */}
            {form.items.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Total Items: <strong>{form.items.length}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Total Quantity: <strong>{totalQuantity}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" color="primary">
                      Total Value: ₹{totalValue.toLocaleString('en-IN')}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
            {formErrors.items && <Typography color="error" variant="caption">{formErrors.items}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseOrders;
