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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Comment as CommentIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import { outwardFlowService, ApprovalHistory, SparePartRequest } from '../services/outwardFlowService';

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
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

const ApprovalManagement: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<SparePartRequest[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SparePartRequest | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<ApprovalHistory[]>([]);
  const [actionComments, setActionComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Load data
  useEffect(() => {
    loadPendingRequests();
    loadApprovalHistory();
  }, [page, rowsPerPage, searchTerm, priorityFilter, dateFilter]);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        status: 'PENDING',
        ...(searchTerm && { search: searchTerm }),
        ...(priorityFilter && { priority: priorityFilter }),
      };

      const response = await outwardFlowService.partRequests.getAll(params);
      if (response.success) {
        setPendingRequests(response.data || []);
        setTotalCount(response.pagination?.totalItems || 0);
      } else {
        setError(response.message || 'Failed to load pending requests');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load pending requests');
      console.error('Error loading pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApprovalHistory = async () => {
    try {
      const response = await outwardFlowService.approvals.getHistory('all');
      if (response.success) {
        setApprovalHistory(response.data || []);
      }
    } catch (err) {
      console.error('Error loading approval history:', err);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
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

  const handleApprove = (request: SparePartRequest) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
    setActionComments('');
  };

  const handleReject = (request: SparePartRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
    setActionComments('');
    setRejectReason('');
  };

  const handleViewHistory = async (request: SparePartRequest) => {
    try {
      const response = await outwardFlowService.approvals.getHistory(request.id);
      if (response.success) {
        setSelectedHistory(response.data || []);
        setSelectedRequest(request);
        setHistoryDialogOpen(true);
      }
    } catch (err) {
      console.error('Error loading approval history:', err);
    }
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;

    try {
      const response = await outwardFlowService.partRequests.approve(selectedRequest.id, {
        comments: actionComments,
      });
      if (response.success) {
        loadPendingRequests();
        loadApprovalHistory();
        setApproveDialogOpen(false);
      } else {
        setError(response.message || 'Failed to approve request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;

    try {
      const response = await outwardFlowService.partRequests.reject(selectedRequest.id, {
        reason: rejectReason,
        comments: actionComments,
      });
      if (response.success) {
        loadPendingRequests();
        loadApprovalHistory();
        setRejectDialogOpen(false);
      } else {
        setError(response.message || 'Failed to reject request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPriorityFilter('');
    setDateFilter('');
    setPage(0);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircleIcon color="success" />;
      case 'rejected':
        return <CancelIcon color="error" />;
      case 'pending':
        return <HourglassEmptyIcon color="warning" />;
      default:
        return <HourglassEmptyIcon />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Approval Management
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadPendingRequests} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
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
            <Grid item xs={12} sm={6} md={3}>
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

      <Grid container spacing={3}>
        {/* Pending Approvals */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Approvals ({totalCount})
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Part Details</TableCell>
                      <TableCell>Service Request</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Cost</TableCell>
                      <TableCell>Requested By</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : pendingRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Box py={4}>
                            <CheckCircleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              No Pending Approvals
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              All requests have been processed.
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingRequests.map((request) => (
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
                            <Typography variant="body2" fontWeight="bold">
                              ₹{request.estimatedCost.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {request.requestedByName || request.requestedBy}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(request.requestedAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" gap={1}>
                              <Tooltip title="View History">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewHistory(request)}
                                >
                                  <HistoryIcon />
                                </IconButton>
                              </Tooltip>
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
        </Grid>

        {/* Recent Approval History */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Approvals
              </Typography>
              {approvalHistory.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    No approval history found
                  </Typography>
                </Box>
              ) : (
                <Timeline>
                  {approvalHistory.slice(0, 10).map((approval, index) => (
                    <TimelineItem key={approval.id}>
                      <TimelineSeparator>
                        <TimelineDot color={getStatusColor(approval.decision) as any}>
                          {getStatusIcon(approval.decision)}
                        </TimelineDot>
                        {index < Math.min(approvalHistory.length - 1, 9) && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="body2" fontWeight="bold">
                          {approval.decision === 'APPROVED' ? 'Approved' : 'Rejected'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          by {approval.approverName || approval.approverId}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {new Date(approval.processedAt || approval.assignedAt).toLocaleString()}
                        </Typography>
                        {approval.comments && (
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            "{approval.comments}"
                          </Typography>
                        )}
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Part Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Typography gutterBottom>
                Approve part request for "{selectedRequest.sparePart?.displayName}"?
              </Typography>
              <Box my={2}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Quantity:</strong> {selectedRequest.quantity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Estimated Cost:</strong> ₹{selectedRequest.estimatedCost.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Priority:</strong> {selectedRequest.priority}
                </Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Approval Comments (Optional)"
                value={actionComments}
                onChange={(e) => setActionComments(e.target.value)}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
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
          {selectedRequest && (
            <Box>
              <Typography gutterBottom>
                Reject part request for "{selectedRequest.sparePart?.displayName}"?
              </Typography>
              <Box my={2}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Quantity:</strong> {selectedRequest.quantity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Estimated Cost:</strong> ₹{selectedRequest.estimatedCost.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Priority:</strong> {selectedRequest.priority}
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="Rejection Reason (Required)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                sx={{ mt: 2, mb: 2 }}
                required
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Additional Comments (Optional)"
                value={actionComments}
                onChange={(e) => setActionComments(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmReject}
            color="error"
            variant="contained"
            disabled={!rejectReason.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Approval History - {selectedRequest?.sparePart?.displayName}
        </DialogTitle>
        <DialogContent>
          {selectedHistory.length === 0 ? (
            <Box textAlign="center" py={4}>
              <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No approval history found
              </Typography>
            </Box>
          ) : (
            <Timeline>
              {selectedHistory.map((approval, index) => (
                <TimelineItem key={approval.id}>
                  <TimelineSeparator>
                    <TimelineDot color={getStatusColor(approval.decision) as any}>
                      {getStatusIcon(approval.decision)}
                    </TimelineDot>
                    {index < selectedHistory.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {approval.decision === 'APPROVED' ? 'Approved' : 'Rejected'}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <PersonIcon fontSize="small" />
                        <Typography variant="body2">
                          {approval.approverName || approval.approverId}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <CalendarIcon fontSize="small" />
                        <Typography variant="body2">
                          {new Date(approval.processedAt || approval.assignedAt).toLocaleString()}
                        </Typography>
                      </Box>
                      {approval.comments && (
                        <Box display="flex" alignItems="flex-start" gap={1}>
                          <CommentIcon fontSize="small" />
                          <Typography variant="body2">
                            {approval.comments}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalManagement;
