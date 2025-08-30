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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { outwardFlowService, ServiceRequest } from '../services/outwardFlowService';

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'info';
    case 'in_progress':
      return 'primary';
    case 'completed':
      return 'success';
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

const ServiceRequestManagement: React.FC = () => {
  const navigate = useNavigate();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [requestTypeFilter, setRequestTypeFilter] = useState('');

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');

  // Load service requests
  useEffect(() => {
    loadServiceRequests();
  }, [page, rowsPerPage, searchTerm, statusFilter, priorityFilter, requestTypeFilter]);

  const loadServiceRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(requestTypeFilter && { requestType: requestTypeFilter }),
      };

      const response = await outwardFlowService.serviceRequests.getAll(params);
      if (response.success) {
        setServiceRequests(response.data || []);
        setTotalCount(response.pagination?.totalItems || 0);
      } else {
        setError(response.message || 'Failed to load service requests');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load service requests');
      console.error('Error loading service requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
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
    navigate('/spare-parts/outward/service-requests/create');
  };

  const handleViewRequest = (request: ServiceRequest) => {
    navigate(`/spare-parts/outward/service-requests/${request.id}`);
  };

  const handleEditRequest = (request: ServiceRequest) => {
    navigate(`/spare-parts/outward/service-requests/${request.id}/edit`);
  };

  const handleDeleteRequest = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setDeleteDialogOpen(true);
  };

  const handleApproveRequest = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRequest) return;

    try {
      const response = await outwardFlowService.serviceRequests.delete(selectedRequest.id);
      if (response.success) {
        loadServiceRequests();
        setDeleteDialogOpen(false);
        setSelectedRequest(null);
      } else {
        setError(response.message || 'Failed to delete service request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete service request');
    }
  };

  const confirmApproval = async () => {
    if (!selectedRequest) return;

    try {
      const response = await outwardFlowService.serviceRequests.approve(selectedRequest.id, {
        comments: approvalComments,
      });
      if (response.success) {
        loadServiceRequests();
        setApproveDialogOpen(false);
        setSelectedRequest(null);
        setApprovalComments('');
      } else {
        setError(response.message || 'Failed to approve service request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve service request');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setRequestTypeFilter('');
    setPage(0);
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Service Requests
        </Typography>
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadServiceRequests} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateRequest}
          >
            Create Service Request
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
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
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
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={requestTypeFilter}
                  label="Type"
                  onChange={(e) => setRequestTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="REPAIR">Repair</MenuItem>
                  <MenuItem value="INSPECTION">Inspection</MenuItem>
                  <MenuItem value="EMERGENCY">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={clearFilters}
                  size="small"
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Service Requests Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request ID</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Estimated Cost</TableCell>
                <TableCell>Request Date</TableCell>
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
              ) : serviceRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Box py={4}>
                      <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Service Requests Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Create your first service request to get started.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateRequest}
                      >
                        Create Service Request
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                serviceRequests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {request.requestNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {request.vehicleNumber || request.vehicleId}
                      </Typography>
                      {request.riderName && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Rider: {request.riderName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.requestType}
                        size="small"
                        variant="outlined"
                      />
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
                      <Typography variant="body2">
                        {request.requestedByName || request.requestedBy}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {request.estimatedCost ? (
                        <Typography variant="body2" fontWeight="bold">
                          ₹{request.estimatedCost.toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not estimated
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </Typography>
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
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRequest(request)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {request.status === 'PENDING' && (
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApproveRequest(request)}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteRequest(request)}
                          >
                            <DeleteIcon />
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
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the service request "{selectedRequest?.requestNumber}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Service Request</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Approve service request "{selectedRequest?.requestNumber}"?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Approval Comments (Optional)"
            value={approvalComments}
            onChange={(e) => setApprovalComments(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmApproval} color="success" variant="contained">
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceRequestManagement;
