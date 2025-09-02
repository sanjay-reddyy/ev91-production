import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
  Assignment as RequestIcon,
  Build as ServiceIcon,
  Inventory as PartsIcon,
  Timeline as WorkflowIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import UnifiedServiceRequestForm from './UnifiedServiceRequestForm';
import {
  ServiceRequest,
  ServiceRequestStatus,
  ServiceRequestPriority,
  ServiceStats,
} from '../types/unifiedService';

const UnifiedServiceDashboard: React.FC = () => {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState<ServiceStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    totalCost: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form and dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadServiceRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [serviceRequests, statusFilter, typeFilter, priorityFilter, searchTerm]);

  const loadServiceRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/unified-service/requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setServiceRequests(data.requests || []);
        calculateStats(data.requests || []);
      } else {
        setError('Failed to load service requests');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (requests: ServiceRequest[]) => {
    const stats = {
      total: requests.length,
      pending: requests.filter(r => ['DRAFT', 'SUBMITTED'].includes(r.status)).length,
      inProgress: requests.filter(r => ['APPROVED', 'IN_PROGRESS'].includes(r.status)).length,
      completed: requests.filter(r => r.status === 'COMPLETED').length,
      totalCost: requests.reduce((sum, r) => sum + (r.totalActualCost || r.totalEstimatedCost || 0), 0),
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...serviceRequests];

    if (statusFilter) {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter(r => r.serviceType === typeFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter(r => r.priority === priorityFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        (r.ticketNumber || '').toLowerCase().includes(term) ||
        r.title.toLowerCase().includes(term) ||
        (r.vehicle?.registrationNumber || '').toLowerCase().includes(term)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleApproval = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/v1/unified-service/requests/${requestId}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        setSuccess(`Service request ${action}d successfully`);
        loadServiceRequests();
      } else {
        setError(`Failed to ${action} service request`);
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  const getStatusColor = (status: ServiceRequestStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'SUBMITTED': return 'info';
      case 'APPROVED': return 'primary';
      case 'REJECTED': return 'error';
      case 'IN_PROGRESS': return 'warning';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: ServiceRequestPriority): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (priority) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleFormSubmit = () => {
    loadServiceRequests();
    setFormOpen(false);
    setSelectedRequest(null);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Unified Service Management
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadServiceRequests}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedRequest(null);
              setFormOpen(true);
            }}
          >
            New Service Request
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <RequestIcon color="primary" />
                <Box>
                  <Typography variant="h6">{stats.total}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Requests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ServiceIcon color="warning" />
                <Box>
                  <Typography variant="h6">{stats.pending}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <WorkflowIcon color="info" />
                <Box>
                  <Typography variant="h6">{stats.inProgress}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    In Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircleIcon color="success" />
                <Box>
                  <Typography variant="h6">{stats.completed}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PartsIcon color="primary" />
                <Box>
                  <Typography variant="h6">{formatCurrency(stats.totalCost)}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Cost
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ticket, title, or vehicle..."
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="SUBMITTED">Submitted</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PREVENTIVE">Preventive</MenuItem>
                  <MenuItem value="REPAIR">Repair</MenuItem>
                  <MenuItem value="INSPECTION">Inspection</MenuItem>
                  <MenuItem value="EMERGENCY">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setStatusFilter('');
                  setTypeFilter('');
                  setPriorityFilter('');
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                sx={{ ml: 1 }}
              >
                Export
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Service Requests Table */}
      <Card>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ticket #</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Cost</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {request.ticketNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {request.vehicle?.registrationNumber || request.vehicleId}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{request.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.serviceType}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.priority}
                      size="small"
                      color={getPriorityColor(request.priority)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.status}
                      size="small"
                      color={getStatusColor(request.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {request.totalEstimatedCost
                      ? formatCurrency(request.totalEstimatedCost)
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {request.createdAt ? format(new Date(request.createdAt), 'MM/dd/yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedRequest(request);
                            setViewDialogOpen(true);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedRequest(request);
                            setFormOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {request.status === 'SUBMITTED' && request.id && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApproval(request.id!, 'approve')}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleApproval(request.id!, 'reject')}
                            >
                              <RejectIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRequests.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No service requests found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Service Request Form Dialog */}
      <UnifiedServiceRequestForm
        open={formOpen}
        initialData={selectedRequest}
        onClose={() => {
          setFormOpen(false);
          setSelectedRequest(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* View Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Service Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Ticket Number</Typography>
                  <Typography variant="body1">{selectedRequest.ticketNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  <Chip
                    label={selectedRequest.status}
                    color={getStatusColor(selectedRequest.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Description</Typography>
                  <Typography variant="body1">{selectedRequest.description}</Typography>
                </Grid>
                {selectedRequest.parts && selectedRequest.parts.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Parts Required</Typography>
                    <Typography variant="body1">{selectedRequest.parts.length} parts</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UnifiedServiceDashboard;
