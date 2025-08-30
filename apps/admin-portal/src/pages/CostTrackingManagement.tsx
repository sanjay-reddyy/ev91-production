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
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
  GetApp as GetAppIcon,
  DateRange as DateRangeIcon,
  Build as BuildIcon,
  LocalShipping as LocalShippingIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { outwardFlowService, ServiceCostBreakdown, InstalledPart } from '../services/outwardFlowService';

interface CostSummary {
  totalCost: number;
  partsCost: number;
  serviceCost: number;
  laborCost: number;
  averageCostPerInstallation: number;
  totalInstallations: number;
}

interface CostTrend {
  period: string;
  cost: number;
  installations: number;
}

const CostTrackingManagement: React.FC = () => {
  const [costBreakdowns, setCostBreakdowns] = useState<ServiceCostBreakdown[]>([]);
  const [installedParts, setInstalledParts] = useState<InstalledPart[]>([]);
  const [costSummary, setCostSummary] = useState<CostSummary>({
    totalCost: 0,
    partsCost: 0,
    serviceCost: 0,
    laborCost: 0,
    averageCostPerInstallation: 0,
    totalInstallations: 0,
  });
  const [costTrends, setCostTrends] = useState<CostTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [costRangeMin, setCostRangeMin] = useState('');
  const [costRangeMax, setCostRangeMax] = useState('');

  // Dialog states
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [selectedCostBreakdown, setSelectedCostBreakdown] = useState<ServiceCostBreakdown | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  // Load data
  useEffect(() => {
    loadCostData();
  }, [page, rowsPerPage, searchTerm, startDate, endDate, vehicleFilter, technicianFilter, costRangeMin, costRangeMax]);

  const loadCostData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(vehicleFilter && { vehicleId: vehicleFilter }),
        ...(technicianFilter && { technicianId: technicianFilter }),
        ...(costRangeMin && { minCost: parseFloat(costRangeMin) }),
        ...(costRangeMax && { maxCost: parseFloat(costRangeMax) }),
      };

      // Load cost breakdowns (service not implemented yet)
      // const costResponse = await outwardFlowService.costTracking.getCostBreakdowns(params);
      // if (costResponse.success) {
      //   setCostBreakdowns(costResponse.data || []);
      //   setTotalCount(costResponse.pagination?.totalItems || 0);
      // }
      setCostBreakdowns([]);
      setTotalCount(0);

      // Load installed parts for summary calculations
      const installationsResponse = await outwardFlowService.installations.getAll({
        ...params,
        limit: 1000, // Get more data for better summary calculations
      });
      if (installationsResponse.success) {
        const installations = installationsResponse.data || [];
        setInstalledParts(installations);
        calculateCostSummary(installations);
      }

      // Load cost trends
      const trendsResponse = await outwardFlowService.analytics.getCostTrends({
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
        period: 'weekly',
      });
      if (trendsResponse.success) {
        setCostTrends(trendsResponse.data || []);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load cost data');
      console.error('Error loading cost data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateCostSummary = (installations: InstalledPart[]) => {
    const totalInstallations = installations.length;
    const partsCost = installations.reduce((sum, inst) => sum + inst.unitCost, 0);
    const serviceCost = installations.reduce((sum, inst) => sum + (inst.serviceCost || 0), 0);
    const laborCost = installations.reduce((sum, inst) => sum + (inst.laborCost || 0), 0);
    const totalCost = partsCost + serviceCost + laborCost;
    const averageCostPerInstallation = totalInstallations > 0 ? totalCost / totalInstallations : 0;

    setCostSummary({
      totalCost,
      partsCost,
      serviceCost,
      laborCost,
      averageCostPerInstallation,
      totalInstallations,
    });
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

  const handleViewDetails = (costBreakdown: ServiceCostBreakdown) => {
    setSelectedCostBreakdown(costBreakdown);
    setViewDetailsDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setVehicleFilter('');
    setTechnicianFilter('');
    setCostRangeMin('');
    setCostRangeMax('');
    setPage(0);
  };

  const exportCostReport = async () => {
    try {
      const params = {
        startDate,
        endDate,
        format: 'excel',
        ...(vehicleFilter && { vehicleId: vehicleFilter }),
        ...(technicianFilter && { technicianId: technicianFilter }),
      };

      const response = await outwardFlowService.costTracking.exportReport(params);
      if (response.success) {
        // Handle file download
        console.log('Report export initiated');
      }
    } catch (err) {
      setError('Failed to export cost report');
    }
  };

  const getTotalCost = (installation: InstalledPart) => {
    return installation.unitCost + (installation.serviceCost || 0) + (installation.laborCost || 0);
  };

  const getCostTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'parts':
        return 'primary';
      case 'service':
        return 'secondary';
      case 'labor':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Cost Tracking & Analytics
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>View</InputLabel>
            <Select
              value={viewMode}
              label="View"
              onChange={(e) => setViewMode(e.target.value as any)}
            >
              <MenuItem value="summary">Summary</MenuItem>
              <MenuItem value="detailed">Detailed</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Export Report">
            <Button
              variant="outlined"
              startIcon={<GetAppIcon />}
              onClick={exportCostReport}
              size="small"
            >
              Export
            </Button>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={loadCostData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Cost Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Cost
                  </Typography>
                  <Typography variant="h5" color="primary.main">
                    ₹{costSummary.totalCost.toLocaleString()}
                  </Typography>
                </Box>
                <AttachMoneyIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Parts Cost
                  </Typography>
                  <Typography variant="h5" color="secondary.main">
                    ₹{costSummary.partsCost.toLocaleString()}
                  </Typography>
                </Box>
                <BuildIcon color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Service + Labor
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    ₹{(costSummary.serviceCost + costSummary.laborCost).toLocaleString()}
                  </Typography>
                </Box>
                <PersonIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Avg Per Installation
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    ₹{costSummary.averageCostPerInstallation.toLocaleString()}
                  </Typography>
                </Box>
                <AssessmentIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Advanced Filters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
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
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Vehicle Filter"
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="number"
                label="Min Cost (₹)"
                value={costRangeMin}
                onChange={(e) => setCostRangeMin(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={clearFilters}
                size="small"
                fullWidth
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {viewMode === 'summary' ? (
        <Grid container spacing={3}>
          {/* Cost Breakdown Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cost Distribution
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Parts Cost"
                      secondary={`₹${costSummary.partsCost.toLocaleString()}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={`${((costSummary.partsCost / costSummary.totalCost) * 100).toFixed(1)}%`}
                        color="primary"
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Service Cost"
                      secondary={`₹${costSummary.serviceCost.toLocaleString()}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={`${((costSummary.serviceCost / costSummary.totalCost) * 100).toFixed(1)}%`}
                        color="secondary"
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Labor Cost"
                      secondary={`₹${costSummary.laborCost.toLocaleString()}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={`${((costSummary.laborCost / costSummary.totalCost) * 100).toFixed(1)}%`}
                        color="warning"
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Cost Trends */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cost Trends
                </Typography>
                {costTrends.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <TrendingUpIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      No trend data available
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {costTrends.slice(0, 5).map((trend, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={trend.period}
                            secondary={`${trend.installations} installations`}
                          />
                          <ListItemSecondaryAction>
                            <Typography variant="body2" fontWeight="bold">
                              ₹{trend.cost.toLocaleString()}
                            </Typography>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < costTrends.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent High-Cost Installations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  High-Cost Installations (Top 10)
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Part</TableCell>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Installation Date</TableCell>
                        <TableCell>Technician</TableCell>
                        <TableCell>Total Cost</TableCell>
                        <TableCell>Cost Breakdown</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {installedParts
                        .sort((a, b) => getTotalCost(b) - getTotalCost(a))
                        .slice(0, 10)
                        .map((installation) => (
                          <TableRow key={installation.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {installation.sparePart?.displayName || installation.sparePart?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {installation.sparePart?.partNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {installation.serviceRequest?.vehicleDetails?.vehicleNumber || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(installation.installedAt).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {installation.technicianName || 'Unknown'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold" color="primary">
                                ₹{getTotalCost(installation).toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={0.5}>
                                <Chip
                                  label={`P: ₹${installation.unitCost.toLocaleString()}`}
                                  size="small"
                                  color="primary"
                                />
                                {installation.serviceCost && (
                                  <Chip
                                    label={`S: ₹${installation.serviceCost.toLocaleString()}`}
                                    size="small"
                                    color="secondary"
                                  />
                                )}
                                {installation.laborCost && (
                                  <Chip
                                    label={`L: ₹${installation.laborCost.toLocaleString()}`}
                                    size="small"
                                    color="warning"
                                  />
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        // Detailed View
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Detailed Cost Breakdown ({totalCount} records)
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Service Request</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Installation Date</TableCell>
                    <TableCell>Parts Cost</TableCell>
                    <TableCell>Service Cost</TableCell>
                    <TableCell>Labor Cost</TableCell>
                    <TableCell>Total Cost</TableCell>
                    <TableCell>Technician</TableCell>
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
                  ) : installedParts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Box py={4}>
                          <AssessmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No Cost Data Found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            No installations match your filter criteria.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    installedParts.map((installation) => (
                      <TableRow key={installation.id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {installation.serviceRequest?.requestNumber || installation.serviceRequestId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {installation.serviceRequest?.vehicleDetails?.vehicleNumber || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(installation.installedAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            ₹{installation.unitCost.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            ₹{(installation.serviceCost || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            ₹{(installation.laborCost || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            ₹{getTotalCost(installation).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {installation.technicianName || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(installation as any)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
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
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDetailsDialogOpen} onClose={() => setViewDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Cost Breakdown Details</DialogTitle>
        <DialogContent>
          {selectedCostBreakdown && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Service Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Service Request"
                        secondary={selectedCostBreakdown.serviceRequestId}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Installation Date"
                        secondary={new Date(selectedCostBreakdown.createdAt).toLocaleDateString()}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Cost Summary
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Parts Cost"
                        secondary={`₹${selectedCostBreakdown.partsCost.toLocaleString()}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Service Cost"
                        secondary={`₹${selectedCostBreakdown.serviceCost.toLocaleString()}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Labor Cost"
                        secondary={`₹${selectedCostBreakdown.laborCost.toLocaleString()}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Total Cost"
                        secondary={`₹${selectedCostBreakdown.totalCost.toLocaleString()}`}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CostTrackingManagement;
