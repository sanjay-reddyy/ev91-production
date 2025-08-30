import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import {
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  LocalShipping as LocalShippingIcon,
  AttachMoney as AttachMoneyIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Note as NoteIcon,
  Done as DoneIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { outwardFlowService, InstalledPart, SparePartRequest } from '../services/outwardFlowService';

// Status color mapping for installations
const getInstallationStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'info';
    case 'scheduled':
      return 'warning';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

// Priority color mapping
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
};

const InstallationManagement: React.FC = () => {
  const navigate = useNavigate();
  const [installedParts, setInstalledParts] = useState<InstalledPart[]>([]);
  const [partRequests, setPartRequests] = useState<SparePartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');

  // Dialog states
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SparePartRequest | null>(null);
  const [selectedInstallation, setSelectedInstallation] = useState<InstalledPart | null>(null);
  const [installationData, setInstallationData] = useState({
    unitCost: '',
    serviceCost: '',
    laborCost: '',
    warrantyMonths: '12',
    notes: '',
    mileageAtInstallation: '',
    technicianId: '',
    technicianName: '',
    installationDate: new Date().toISOString().split('T')[0],
  });

  // View mode toggle
  const [viewMode, setViewMode] = useState<'pending' | 'completed'>('pending');

  // Load data
  useEffect(() => {
    if (viewMode === 'pending') {
      loadPendingInstallations();
    } else {
      loadCompletedInstallations();
    }
  }, [viewMode, page, rowsPerPage, searchTerm, statusFilter, dateFilter, vehicleFilter]);

  const loadPendingInstallations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        status: 'ISSUED', // Parts that are issued but not yet installed
        ...(searchTerm && { search: searchTerm }),
        ...(vehicleFilter && { vehicleId: vehicleFilter }),
      };

      const response = await outwardFlowService.partRequests.getAll(params);
      if (response.success) {
        setPartRequests(response.data || []);
        setTotalCount(response.pagination?.totalItems || 0);
      } else {
        setError(response.message || 'Failed to load pending installations');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load pending installations');
      console.error('Error loading pending installations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedInstallations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(dateFilter && { startDate: dateFilter }),
        ...(vehicleFilter && { vehicleId: vehicleFilter }),
      };

      const response = await outwardFlowService.installations.getAll(params);
      if (response.success) {
        setInstalledParts(response.data || []);
        setTotalCount(response.pagination?.totalItems || 0);
      } else {
        setError(response.message || 'Failed to load completed installations');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load completed installations');
      console.error('Error loading completed installations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleInstall = (request: SparePartRequest) => {
    setSelectedRequest(request);
    setInstallDialogOpen(true);
    setInstallationData({
      unitCost: request.actualCost?.toString() || request.estimatedCost.toString(),
      serviceCost: '',
      laborCost: '',
      warrantyMonths: '12',
      notes: '',
      mileageAtInstallation: '',
      technicianId: '',
      technicianName: '',
      installationDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleEditInstallation = (installation: InstalledPart) => {
    setSelectedInstallation(installation);
    setEditDialogOpen(true);
    setInstallationData({
      unitCost: installation.unitCost.toString(),
      serviceCost: installation.serviceCost?.toString() || '',
      laborCost: installation.laborCost?.toString() || '',
      notes: installation.notes || '',
      mileageAtInstallation: installation.mileageAtInstallation?.toString() || '',
      installationDate: installation.installedAt.split('T')[0],
    });
  };

  const handleViewInstallation = (installation: InstalledPart) => {
    setSelectedInstallation(installation);
    setViewDialogOpen(true);
  };

  const confirmInstall = async () => {
    if (!selectedRequest) return;

    try {
      const response = await outwardFlowService.partRequests.install(selectedRequest.id, {
        unitCost: parseFloat(installationData.unitCost),
        serviceCost: parseFloat(installationData.serviceCost) || undefined,
        laborCost: parseFloat(installationData.laborCost) || undefined,
        warrantyMonths: parseInt(installationData.warrantyMonths) || undefined,
        notes: installationData.notes,
        mileageAtInstallation: parseInt(installationData.mileageAtInstallation) || undefined,
        technicianId: installationData.technicianId || undefined,
        technicianName: installationData.technicianName || undefined,
        installationDate: installationData.installationDate,
      });

      if (response.success) {
        setSuccess('Part marked as installed successfully');
        loadPendingInstallations();
        setInstallDialogOpen(false);
      } else {
        setError(response.message || 'Failed to mark as installed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to mark as installed');
    }
  };

  const confirmEdit = async () => {
    if (!selectedInstallation) return;

    try {
      const response = await outwardFlowService.installations.update(selectedInstallation.id, {
        notes: installationData.notes || undefined,
        warrantyStartDate: installationData.warrantyStartDate || undefined,
        warrantyEndDate: installationData.warrantyEndDate || undefined,
        nextServiceMileage: parseInt(installationData.nextServiceMileage) || undefined,
      });

      if (response.success) {
        setSuccess('Installation details updated successfully');
        loadCompletedInstallations();
        setEditDialogOpen(false);
      } else {
        setError(response.message || 'Failed to update installation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update installation');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFilter('');
    setVehicleFilter('');
    setPage(0);
  };

  const getTotalCost = (installation: InstalledPart) => {
    return installation.unitCost + (installation.serviceCost || 0) + (installation.laborCost || 0);
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Installation Management
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          {/* View Mode Toggle */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>View</InputLabel>
            <Select
              value={viewMode}
              label="View"
              onChange={(e) => setViewMode(e.target.value as any)}
            >
              <MenuItem value="pending">Pending Installations</MenuItem>
              <MenuItem value="completed">Completed Installations</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton
              onClick={viewMode === 'pending' ? loadPendingInstallations : loadCompletedInstallations}
              color="primary"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="date"
                label="From Date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Vehicle Filter"
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={clearFilters}
                size="small"
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Typography variant="h6">
              {viewMode === 'pending' ? 'Pending Installations' : 'Completed Installations'} ({totalCount})
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Part Details</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Service Request</TableCell>
                  <TableCell>Quantity</TableCell>
                  {viewMode === 'completed' ? (
                    <>
                      <TableCell>Installation Date</TableCell>
                      <TableCell>Technician</TableCell>
                      <TableCell>Total Cost</TableCell>
                      <TableCell>Warranty</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>Priority</TableCell>
                      <TableCell>Estimated Cost</TableCell>
                      <TableCell>Issued Date</TableCell>
                    </>
                  )}
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : viewMode === 'pending' ? (
                  partRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Box py={4}>
                          <CheckCircleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No Pending Installations
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            All issued parts have been installed.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    partRequests.map((request) => (
                      <TableRow key={request.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {request.sparePart?.displayName || request.sparePart?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {request.sparePart?.partNumber}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {request.serviceRequest?.vehicleNumber || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {request.serviceRequest?.requestNumber || request.serviceRequestId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {request.quantity}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.priority}
                            size="small"
                            color={getPriorityColor(request.priority) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            ₹{(request.actualCost || request.estimatedCost).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {request.updatedAt ? new Date(request.updatedAt).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Mark as Installed">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleInstall(request)}
                            >
                              <BuildIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )
                ) : installedParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box py={4}>
                        <BuildIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No Installations Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          No completed installations match your criteria.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  installedParts.map((installation) => (
                    <TableRow key={installation.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {installation.sparePart?.displayName || installation.sparePart?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {installation.sparePart?.partNumber}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {installation.serviceRequest?.vehicleDetails?.vehicleNumber || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {installation.serviceRequest?.requestNumber || installation.serviceRequestId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {installation.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(installation.installedAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                            {(installation.technicianName || 'U')[0].toUpperCase()}
                          </Avatar>
                          <Typography variant="body2">
                            {installation.technicianName || 'Unknown'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          ₹{getTotalCost(installation).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Part: ₹{installation.unitCost.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {installation.warrantyMonths ? (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <SecurityIcon fontSize="small" color="primary" />
                            <Typography variant="body2">
                              {installation.warrantyMonths}m
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No warranty
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewInstallation(installation)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditInstallation(installation)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </CardContent>
      </Card>

      {/* Install Dialog */}
      <Dialog open={installDialogOpen} onClose={() => setInstallDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Mark Part as Installed</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Typography gutterBottom>
                Record installation details for "{selectedRequest.sparePart?.displayName}"
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Unit Cost (₹)"
                    value={installationData.unitCost}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, unitCost: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Service Cost (₹)"
                    value={installationData.serviceCost}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, serviceCost: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Labor Cost (₹)"
                    value={installationData.laborCost}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, laborCost: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Warranty (Months)"
                    value={installationData.warrantyMonths}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, warrantyMonths: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Installation Date"
                    value={installationData.installationDate}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, installationDate: e.target.value }))}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Mileage at Installation"
                    value={installationData.mileageAtInstallation}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, mileageAtInstallation: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Technician ID"
                    value={installationData.technicianId}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, technicianId: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Technician Name"
                    value={installationData.technicianName}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, technicianName: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Installation Notes"
                    value={installationData.notes}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstallDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmInstall}
            color="primary"
            variant="contained"
            disabled={!installationData.unitCost}
          >
            Mark as Installed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Installation Details</DialogTitle>
        <DialogContent>
          {selectedInstallation && (
            <Box>
              <Typography gutterBottom>
                Edit installation details for "{selectedInstallation.sparePart?.displayName}"
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Unit Cost (₹)"
                    value={installationData.unitCost}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, unitCost: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Service Cost (₹)"
                    value={installationData.serviceCost}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, serviceCost: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Labor Cost (₹)"
                    value={installationData.laborCost}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, laborCost: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Warranty (Months)"
                    value={installationData.warrantyMonths}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, warrantyMonths: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Mileage at Installation"
                    value={installationData.mileageAtInstallation}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, mileageAtInstallation: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Technician Name"
                    value={installationData.technicianName}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, technicianName: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Installation Notes"
                    value={installationData.notes}
                    onChange={(e) => setInstallationData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmEdit}
            color="primary"
            variant="contained"
            disabled={!installationData.unitCost}
          >
            Update Installation
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Installation Details</DialogTitle>
        <DialogContent>
          {selectedInstallation && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Part Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <BuildIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Part Name"
                        secondary={selectedInstallation.sparePart?.displayName || selectedInstallation.sparePart?.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Part Number"
                        secondary={selectedInstallation.sparePart?.partNumber}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocalShippingIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Quantity"
                        secondary={selectedInstallation.quantity}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Installation Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Installation Date"
                        secondary={new Date(selectedInstallation.installedAt).toLocaleDateString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Technician"
                        secondary={selectedInstallation.technicianName || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <SpeedIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Mileage"
                        secondary={selectedInstallation.mileageAtInstallation || 'Not recorded'}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Cost Breakdown
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="primary">
                          ₹{selectedInstallation.unitCost.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Unit Cost
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="primary">
                          ₹{(selectedInstallation.serviceCost || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Service Cost
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="primary">
                          ₹{(selectedInstallation.laborCost || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Labor Cost
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="success.main">
                          ₹{getTotalCost(selectedInstallation).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Cost
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              {selectedInstallation.notes && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Installation Notes
                    </Typography>
                    <Typography variant="body2">
                      {selectedInstallation.notes}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              {selectedInstallation.warrantyMonths && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <SecurityIcon color="primary" />
                      <Box>
                        <Typography variant="h6">
                          {selectedInstallation.warrantyMonths} Months Warranty
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Valid until: {new Date(
                            new Date(selectedInstallation.installedAt).getTime() +
                            selectedInstallation.warrantyMonths * 30 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstallationManagement;
