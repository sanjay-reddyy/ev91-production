import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Snackbar, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, IconButton, Tooltip, FormControl, InputLabel, Select
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { suppliersService, Supplier } from '../services/sparePartsService';


const defaultForm: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | '_count'> & {
  displayName: string;
  code: string;
  supplierType: string;
} = {
  name: '',
  displayName: '',
  code: '',
  supplierType: 'OEM',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  taxId: '',
  paymentTerms: '',
  rating: 0,
  isActive: true,
};

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  // const [loading, setLoading] = useState(false); // Removed unused loading variable
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const loadSuppliers = useCallback(async () => {
  // setLoading(true); // removed unused loading state
    try {
      const params = { page: page + 1, limit: rowsPerPage, search: search || undefined };
      const res = await suppliersService.getAll(params);
      let supplierList = [];
      if (Array.isArray(res.data)) {
        supplierList = res.data;
      } else if (res.data && Array.isArray(res.data.suppliers)) {
        supplierList = res.data.suppliers;
      }
      setSuppliers(supplierList);
      setTotalCount(res.pagination?.totalItems || supplierList.length || 0);
    } catch (e) {
      setSuppliers([]);
      setSnackbar({ open: true, message: 'Failed to load suppliers', severity: 'error' });
    } finally {
      // setLoading(false); // removed unused loading state
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setForm({
        name: supplier.name || '',
        displayName: supplier.displayName || '',
        code: supplier.code || '',
        supplierType: supplier.supplierType || 'OEM',
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        country: supplier.country || '',
        taxId: supplier.taxId || '',
        paymentTerms: supplier.paymentTerms || '',
        rating: typeof supplier.rating === 'number' ? supplier.rating : 0,
        isActive: typeof supplier.isActive === 'boolean' ? supplier.isActive : true,
      });
    } else {
      setEditingSupplier(null);
      setForm(defaultForm);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSupplier(null);
    setForm(defaultForm);
  };

  const handleSave = async () => {
    // Frontend validation for required fields
    const errors: { [key: string]: string } = {};
    if (!form.name) errors.name = 'Name is required';
    if (!form.displayName) errors.displayName = 'Display Name is required';
    if (!form.code) errors.code = 'Code is required';
    if (!form.supplierType) errors.supplierType = 'Supplier Type is required';
    if (!form.contactPerson) errors.contactPerson = 'Contact Person is required';
    if (!form.email) errors.email = 'Email is required';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSnackbar({ open: true, message: 'Please fill all required fields.', severity: 'error' });
      return;
    }
    try {
      if (editingSupplier) {
        await suppliersService.update(editingSupplier.id, form);
        setSnackbar({ open: true, message: 'Supplier updated', severity: 'success' });
      } else {
        await suppliersService.create(form);
        setSnackbar({ open: true, message: 'Supplier created', severity: 'success' });
      }
      handleCloseDialog();
      loadSuppliers();
    } catch (e: any) {
      // Show backend error if available
      const backendMsg = e?.response?.data?.message || 'Failed to save supplier';
      setSnackbar({ open: true, message: backendMsg, severity: 'error' });
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!window.confirm(`Delete supplier ${supplier.name}?`)) return;
    try {
      await suppliersService.delete(supplier.id);
      setSnackbar({ open: true, message: 'Supplier deleted', severity: 'success' });
      loadSuppliers();
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to delete supplier', severity: 'error' });
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Suppliers Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Add Supplier</Button>
      </Box>
      <Card>
        <CardContent>
          <Box mb={2} display="flex" gap={2}>
            <TextField
              placeholder="Search suppliers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="small"
              InputProps={{ startAdornment: <SearchIcon fontSize="small" /> }}
              onKeyDown={e => { if (e.key === 'Enter') loadSuppliers(); }}
            />
            <Button variant="outlined" onClick={loadSuppliers}>Search</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center">No suppliers found</TableCell></TableRow>
                ) : suppliers.map(supplier => (
                  <TableRow key={supplier.id}>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.contactPerson}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.city}</TableCell>
                    <TableCell>{supplier.country}</TableCell>
                    <TableCell>{supplier.isActive ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit"><IconButton onClick={() => handleOpenDialog(supplier)}><EditIcon /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton onClick={() => handleDelete(supplier)}><DeleteIcon /></IconButton></Tooltip>
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

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField fullWidth label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required sx={{ mb: 2 }} error={!!formErrors.name} helperText={formErrors.name} />
            <TextField fullWidth label="Display Name" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} required sx={{ mb: 2 }} error={!!formErrors.displayName} helperText={formErrors.displayName} />
            <TextField fullWidth label="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required sx={{ mb: 2 }} error={!!formErrors.code} helperText={formErrors.code} />
            <FormControl fullWidth required sx={{ mb: 2 }} error={!!formErrors.supplierType}>
              <InputLabel>Supplier Type</InputLabel>
              <Select value={form.supplierType} label="Supplier Type" onChange={e => setForm({ ...form, supplierType: e.target.value })}>
                <MenuItem value="OEM">OEM</MenuItem>
                <MenuItem value="Aftermarket">Aftermarket</MenuItem>
                <MenuItem value="Authorized">Authorized</MenuItem>
                <MenuItem value="Local">Local</MenuItem>
              </Select>
              {formErrors.supplierType && <Typography color="error" variant="caption">{formErrors.supplierType}</Typography>}
            </FormControl>
            <TextField fullWidth label="Contact Person" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} required sx={{ mb: 2 }} error={!!formErrors.contactPerson} helperText={formErrors.contactPerson} />
            <TextField fullWidth label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required sx={{ mb: 2 }} error={!!formErrors.email} helperText={formErrors.email} />
            <TextField fullWidth label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Tax ID" value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Payment Terms" value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Rating" type="number" value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} sx={{ mb: 2 }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select value={form.isActive ? 'active' : 'inactive'} label="Status" onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">{editingSupplier ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Suppliers;
