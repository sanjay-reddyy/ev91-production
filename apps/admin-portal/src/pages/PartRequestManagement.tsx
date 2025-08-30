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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Build as BuildIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { outwardFlowService, SparePartRequest } from '../services/outwardFlowService';

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'info';
    case 'issued':
      return 'primary';
    case 'installed':
      return 'success';
    case 'rejected':
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

// Status steps for the stepper
const getStatusSteps = () => [
  'Pending',
  'Approved',
  'Issued',
  'Installed'
];

const getActiveStep = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 0;
    case 'approved':
      return 1;
    case 'issued':
      return 2;
    case 'installed':
      return 3;
    case 'rejected':
    case 'cancelled':
      return -1; // No active step for rejected/cancelled
    default:
      return 0;
  }
};

const PartRequestManagement: React.FC = () => {
  const navigate = useNavigate();
  const [partRequests, setPartRequests] = useState<SparePartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SparePartRequest | null>(null);
  const [actionComments, setActionComments] = useState('');
  const [installationData, setInstallationData] = useState({
    unitCost: '',
    serviceCost: '',
    laborCost: '',
    warrantyMonths: '',
    notes: '',
    mileageAtInstallation: '',
  });

  // Load part requests
  useEffect(() => {
    loadPartRequests();
  }, [page, rowsPerPage, searchTerm, statusFilter, priorityFilter]);

  const loadPartRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
      };

      const response = await outwardFlowService.partRequests.getAll(params);
      if (response.success) {
        setPartRequests(response.data || []);
        setTotalCount(response.pagination?.totalItems || 0);
      } else {
        setError(response.message || 'Failed to load part requests');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load part requests');
      console.error('Error loading part requests:', err);
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

  const handleCreateRequest = () => {
    navigate('/spare-parts/outward/part-requests/create');
  };

  const handleViewRequest = (request: SparePartRequest) => {
    navigate(`/spare-parts/outward/part-requests/${request.id}`);
  };

  const handleApprove = (request: SparePartRequest) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
    setActionComments('');
  };

  const handleReject = (request: SparePartRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
    setActionComments('');
  };

  const handleIssue = (request: SparePartRequest) => {
    setSelectedRequest(request);
    setIssueDialogOpen(true);
    setActionComments('');
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
    });
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;

    try {
      const response = await outwardFlowService.partRequests.approve(selectedRequest.id, {
        comments: actionComments,
      });
      if (response.success) {
        loadPartRequests();
        setApproveDialogOpen(false);
      } else {
        setError(response.message || 'Failed to approve request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest || !actionComments.trim()) return;

    try {
      const response = await outwardFlowService.partRequests.reject(selectedRequest.id, {
        comments: actionComments,
        reason: 'Rejected by manager',
      });
      if (response.success) {
        loadPartRequests();
        setRejectDialogOpen(false);
      } else {
        setError(response.message || 'Failed to reject request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
    }
  };

  const confirmIssue = async () => {
    if (!selectedRequest) return;

    try {
      const response = await outwardFlowService.partRequests.issue(selectedRequest.id, {
        storeId: 'default-store', // This should come from user selection
        storeName: 'Main Store',
        notes: actionComments,
      });
      if (response.success) {
        loadPartRequests();
        setIssueDialogOpen(false);
      } else {
        setError(response.message || 'Failed to issue part');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to issue part');
    }
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
      });
      if (response.success) {
        loadPartRequests();
        setInstallDialogOpen(false);
      } else {
        setError(response.message || 'Failed to mark as installed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to mark as installed');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setPage(0);
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Part Requests
        </Typography>
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadPartRequests} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateRequest}
          >
            Create Part Request
          </Button>
        </Box>
      </Box>

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
            <Grid item xs={12} sm={6} md={4}>
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
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="ISSUED">Issued</MenuItem>
                  <MenuItem value="INSTALLED">Installed</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </Select>
              </FormControl>
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

      {/* Part Requests Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Part Details</TableCell>
                <TableCell>Service Request</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Cost</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : partRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Box py={4}>
                      <BuildIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Part Requests Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Create your first part request to get started.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateRequest}
                      >
                        Create Part Request
                      </Button>
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
                      <Chip
                        label={request.status}
                        size="small"
                        color={getStatusColor(request.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: 200 }}>
                        {getActiveStep(request.status) >= 0 ? (
                          <Stepper activeStep={getActiveStep(request.status)} alternativeLabel>
                            {getStatusSteps().map((label) => (
                              <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                              </Step>
                            ))}
                          </Stepper>
                        ) : (
                          <Typography variant="caption" color="error">
                            {request.status}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {request.requestedByName || request.requestedBy}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{(request.actualCost || request.estimatedCost).toLocaleString()}
                      </Typography>
                      {request.actualCost && request.actualCost !== request.estimatedCost && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Est: ₹{request.estimatedCost.toLocaleString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1}>
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => handleViewRequest(request)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        {request.status === 'PENDING' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApprove(request)}
                              >
                                <CheckIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleReject(request)}
                              >
                                <CloseIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {request.status === 'APPROVED' && (
                          <Tooltip title="Issue Part">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleIssue(request)}
                            >
                              <LocalShippingIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {request.status === 'ISSUED' && (
                          <Tooltip title="Mark as Installed">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleInstall(request)}
                            >
                              <BuildIcon />
                            </IconButton>
                          </Tooltip>
                        )}
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
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Part Request</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Approve part request for "{selectedRequest?.sparePart?.displayName}"?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Approval Comments (Optional)"
            value={actionComments}
            onChange={(e) => setActionComments(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmApprove} color="success" variant="contained">
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Part Request</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Reject part request for "{selectedRequest?.sparePart?.displayName}"?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason (Required)"
            value={actionComments}
            onChange={(e) => setActionComments(e.target.value)}
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmReject}
            color="error"
            variant="contained"
            disabled={!actionComments.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Issue Dialog */}
      <Dialog open={issueDialogOpen} onClose={() => setIssueDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Issue Part</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Issue part "{selectedRequest?.sparePart?.displayName}" from inventory?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Issue Notes (Optional)"
            value={actionComments}
            onChange={(e) => setActionComments(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssueDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmIssue} color="primary" variant="contained">
            Issue Part
          </Button>
        </DialogActions>
      </Dialog>

      {/* Install Dialog */}
      <Dialog open={installDialogOpen} onClose={() => setInstallDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Mark Part as Installed</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Record installation details for "{selectedRequest?.sparePart?.displayName}"
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Mileage at Installation"
                value={installationData.mileageAtInstallation}
                onChange={(e) => setInstallationData(prev => ({ ...prev, mileageAtInstallation: e.target.value }))}
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
    </Box>
  );
};

export default PartRequestManagement;
