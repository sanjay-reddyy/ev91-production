import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Build as BuildIcon,
  CheckCircle as ResolvedIcon,
  Cancel as RejectedIcon,
  Assignment as AssignIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vehicleService, DamageRecord } from '../services/vehicleService';

const damageStatusColors = {
  'Reported': 'warning',
  'Under Review': 'info',
  'Approved for Repair': 'primary',
  'In Repair': 'warning',
  'Resolved': 'success',
  'Rejected': 'error',
} as const;

const severityColors = {
  'Minor': 'info',
  'Moderate': 'warning',
  'Major': 'error',
} as const;

const DamageManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [damageRecords, setDamageRecords] = useState<DamageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  
  // Filters
  const [filters, setFilters] = useState<{
    damageStatus?: string;
    severity?: string;
    damageType?: string;
    vehicleId?: string;
    assignedTechnician?: string;
    search?: string;
  }>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected damage for detail view
  const [selectedDamage, setSelectedDamage] = useState<DamageRecord | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  
  // Status update dialog
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    damage: DamageRecord | null;
    newStatus: string;
    notes: string;
    technician: string;
  }>({
    open: false,
    damage: null,
    newStatus: '',
    notes: '',
    technician: '',
  });

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load damage records
  const loadDamageRecords = async () => {
    try {
      setLoading(true);
      const response = await vehicleService.getDamageRecords(
        { ...filters, search: searchQuery },
        { page: page + 1, limit: rowsPerPage, sortBy: 'reportedDate', sortOrder: 'desc' }
      );

      setDamageRecords(response.data);
      setTotalCount(response.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Error loading damage records:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load damage records. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDamageRecords();
  }, [page, rowsPerPage, filters, searchQuery]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(0);
  };

  const handleStatusUpdate = async () => {
    if (!statusDialog.damage || !statusDialog.newStatus) return;

    try {
      await vehicleService.updateDamageStatus(
        statusDialog.damage.id,
        statusDialog.newStatus,
        statusDialog.notes
      );
      
      setSnackbar({
        open: true,
        message: 'Damage status updated successfully',
        severity: 'success',
      });
      
      setStatusDialog({ open: false, damage: null, newStatus: '', notes: '', technician: '' });
      loadDamageRecords();
    } catch (error) {
      console.error('Error updating status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update damage status. Please try again.',
        severity: 'error',
      });
    }
  };

  const viewDamageDetails = (damage: DamageRecord) => {
    setSelectedDamage(damage);
    setDetailDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Reported':
        return <WarningIcon color="warning" />;
      case 'Under Review':
        return <ScheduleIcon color="info" />;
      case 'Approved for Repair':
        return <AssignIcon color="primary" />;
      case 'In Repair':
        return <BuildIcon color="warning" />;
      case 'Resolved':
        return <ResolvedIcon color="success" />;
      case 'Rejected':
        return <RejectedIcon color="error" />;
      default:
        return <WarningIcon />;
    }
  };

  const renderTimelineView = () => (
    <Box sx={{ position: 'relative' }}>
      {damageRecords.map((damage, index) => (
        <Box key={damage.id} sx={{ position: 'relative', mb: 3 }}>
          {/* Timeline Line */}
          {index < damageRecords.length - 1 && (
            <Box
              sx={{
                position: 'absolute',
                left: 20,
                top: 60,
                width: 2,
                height: 'calc(100% - 40px)',
                bgcolor: 'divider',
                zIndex: 0,
              }}
            />
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            {/* Timeline Dot */}
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${damageStatusColors[damage.damageStatus]}.main`,
                color: 'white',
                mr: 2,
                flexShrink: 0,
              }}
            >
              {getStatusIcon(damage.damageStatus)}
            </Box>
            
            {/* Timeline Content */}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {format(new Date(damage.reportedDate), 'MMM dd, yyyy HH:mm')}
              </Typography>
              
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="span">
                      {damage.vehicle?.registrationNumber || 'Unknown Vehicle'}
                    </Typography>
                    <Chip
                      label={damage.damageStatus}
                      color={damageStatusColors[damage.damageStatus]}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {damage.damageType} • {damage.severity} • {damage.location}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {damage.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Reported by: {damage.reportedBy}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => viewDamageDetails(damage)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/damage/${damage.id}/edit`)}
                      >
                        Edit
                      </Button>
                      {damage.damageStatus !== 'Resolved' && damage.damageStatus !== 'Rejected' && (
                        <Button
                          size="small"
                          startIcon={<AssignIcon />}
                          onClick={() => setStatusDialog({ 
                            open: true, 
                            damage, 
                            newStatus: '', 
                            notes: '', 
                            technician: '' 
                          })}
                        >
                          Update Status
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );

  const renderTableView = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Vehicle</TableCell>
            <TableCell>Damage Type</TableCell>
            <TableCell>Severity</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Reported Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Estimated Cost</TableCell>
            <TableCell>Assigned To</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                Loading damage records...
              </TableCell>
            </TableRow>
          ) : damageRecords.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                No damage records found
              </TableCell>
            </TableRow>
          ) : (
            damageRecords.map((damage) => (
              <TableRow key={damage.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                      🏍️
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {damage.vehicle?.registrationNumber || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {damage.vehicle?.model?.oem?.name} {damage.vehicle?.model?.name}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={damage.damageType} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={damage.severity}
                    color={severityColors[damage.severity]}
                    size="small"
                  />
                </TableCell>
                <TableCell>{damage.location}</TableCell>
                <TableCell>
                  {format(new Date(damage.reportedDate), 'dd MMM yyyy')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={damage.damageStatus}
                    color={damageStatusColors[damage.damageStatus]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {damage.estimatedCost ? formatCurrency(damage.estimatedCost) : 'N/A'}
                </TableCell>
                <TableCell>
                  {damage.assignedTechnician || 'Unassigned'}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => viewDamageDetails(damage)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Damage Record">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/damage/${damage.id}/edit`)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {damage.damageStatus !== 'Resolved' && damage.damageStatus !== 'Rejected' && (
                      <Tooltip title="Update Status">
                        <IconButton
                          size="small"
                          onClick={() => setStatusDialog({ 
                            open: true, 
                            damage, 
                            newStatus: '', 
                            notes: '', 
                            technician: '' 
                          })}
                        >
                          <EditIcon />
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
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Damage Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setViewMode(viewMode === 'table' ? 'timeline' : 'table')}
          >
            {viewMode === 'table' ? 'Timeline View' : 'Table View'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/damage/new')}
            size="large"
          >
            Add Damage Record
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search damage records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.damageStatus || ''}
                  onChange={(e) => handleFilterChange('damageStatus', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Reported">Reported</MenuItem>
                  <MenuItem value="Under Review">Under Review</MenuItem>
                  <MenuItem value="Approved for Repair">Approved for Repair</MenuItem>
                  <MenuItem value="In Repair">In Repair</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filters.severity || ''}
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                >
                  <MenuItem value="">All Severities</MenuItem>
                  <MenuItem value="Minor">Minor</MenuItem>
                  <MenuItem value="Moderate">Moderate</MenuItem>
                  <MenuItem value="Major">Major</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Damage Type</InputLabel>
                <Select
                  value={filters.damageType || ''}
                  onChange={(e) => handleFilterChange('damageType', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="Cosmetic">Cosmetic</MenuItem>
                  <MenuItem value="Mechanical">Mechanical</MenuItem>
                  <MenuItem value="Electrical">Electrical</MenuItem>
                  <MenuItem value="Structural">Structural</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  disabled={!Object.keys(filters).length && !searchQuery}
                >
                  Clear Filters
                </Button>
                <IconButton onClick={loadDamageRecords} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        {viewMode === 'table' ? (
          <>
            {renderTableView()}
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        ) : (
          <CardContent>
            {renderTimelineView()}
          </CardContent>
        )}
      </Card>

      {/* Damage Detail Dialog */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Damage Details</DialogTitle>
        <DialogContent>
          {selectedDamage && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Vehicle:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold">
                      {selectedDamage.vehicle?.registrationNumber}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Type:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Chip label={selectedDamage.damageType} size="small" />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Severity:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Chip 
                      label={selectedDamage.severity} 
                      color={severityColors[selectedDamage.severity]}
                      size="small" 
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Location:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold">{selectedDamage.location}</Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Reported:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold">
                      {format(new Date(selectedDamage.reportedDate), 'dd MMM yyyy HH:mm')}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Reported By:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold">{selectedDamage.reportedBy}</Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Status & Cost</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Chip 
                      label={selectedDamage.damageStatus} 
                      color={damageStatusColors[selectedDamage.damageStatus]}
                      size="small" 
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Estimated Cost:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold">
                      {selectedDamage.estimatedCost ? formatCurrency(selectedDamage.estimatedCost) : 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Actual Cost:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold">
                      {selectedDamage.actualCost ? formatCurrency(selectedDamage.actualCost) : 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Technician:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold">
                      {selectedDamage.assignedTechnician || 'Unassigned'}
                    </Typography>
                  </Grid>
                  
                  {selectedDamage.resolvedDate && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Resolved:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold">
                          {format(new Date(selectedDamage.resolvedDate), 'dd MMM yyyy')}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Description</Typography>
                <Typography variant="body2" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  {selectedDamage.description}
                </Typography>
              </Grid>

              {selectedDamage.resolutionNotes && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Resolution Notes</Typography>
                  <Typography variant="body2" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    {selectedDamage.resolutionNotes}
                  </Typography>
                </Grid>
              )}

              {selectedDamage.mediaFiles && selectedDamage.mediaFiles.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Photos</Typography>
                  <ImageList cols={3} gap={8}>
                    {selectedDamage.mediaFiles.map((file) => (
                      <ImageListItem key={file.id}>
                        <img
                          src={file.fileUrl}
                          alt={file.fileName}
                          loading="lazy"
                          style={{ height: 140, objectFit: 'cover' }}
                        />
                        <ImageListItemBar
                          title={file.fileName}
                          subtitle={format(new Date(file.uploadDate), 'dd MMM yyyy')}
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, damage: null, newStatus: '', notes: '', technician: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Damage Status</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={statusDialog.newStatus}
                  onChange={(e) => setStatusDialog(prev => ({ ...prev, newStatus: e.target.value }))}
                >
                  <MenuItem value="Under Review">Under Review</MenuItem>
                  <MenuItem value="Approved for Repair">Approved for Repair</MenuItem>
                  <MenuItem value="In Repair">In Repair</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assigned Technician"
                value={statusDialog.technician}
                onChange={(e) => setStatusDialog(prev => ({ ...prev, technician: e.target.value }))}
                placeholder="Enter technician name"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={statusDialog.notes}
                onChange={(e) => setStatusDialog(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes or comments..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, damage: null, newStatus: '', notes: '', technician: '' })}>
            Cancel
          </Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!statusDialog.newStatus}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DamageManagementPage;
