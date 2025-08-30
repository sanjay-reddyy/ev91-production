import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Tab,
  Tabs,
  IconButton,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { outwardFlowService, OutwardFlowAnalytics } from '../services/outwardFlowService';

// Tab Panel Component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`outward-flow-tabpanel-${index}`}
      aria-labelledby={`outward-flow-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `outward-flow-tab-${index}`,
    'aria-controls': `outward-flow-tabpanel-${index}`,
  };
}

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

const OutwardFlowManagement: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [analytics, setAnalytics] = useState<OutwardFlowAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data
  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await outwardFlowService.analytics.getAll();
      if (response.success) {
        setAnalytics(response.data);
      } else {
        setError(response.message || 'Failed to load analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleCreateServiceRequest = () => {
    navigate('/spare-parts/outward/service-requests/create');
  };

  const handleCreatePartRequest = () => {
    navigate('/spare-parts/outward/part-requests/create');
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, trend, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUpIcon fontSize="small" color="success" />
                <Typography variant="body2" color="success.main" ml={0.5}>
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.light`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Spare Parts Outward Flow
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Spare Parts Outward Flow
        </Typography>
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadAnalytics} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateServiceRequest}
          >
            New Service Request
          </Button>
          <Button
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={handleCreatePartRequest}
          >
            New Part Request
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Analytics Cards */}
      {analytics && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Requests"
              value={analytics.summary.totalRequests}
              icon={<AssignmentIcon />}
              color="primary"
              trend={analytics.trends.requestTrend}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Requests"
              value={analytics.summary.pendingRequests}
              icon={<PendingIcon />}
              color="warning"
              subtitle="Awaiting Approval"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Parts Installed"
              value={analytics.summary.installedParts}
              icon={<BuildIcon />}
              color="success"
              subtitle={`₹${analytics.summary.totalPartsValue.toLocaleString()}`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Avg Approval Time"
              value={`${analytics.summary.avgApprovalTime}h`}
              icon={<SpeedIcon />}
              color="info"
              subtitle={`${analytics.trends.approvalRate}% approval rate`}
            />
          </Grid>
        </Grid>
      )}

      {/* Performance Indicators */}
      {analytics && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Process Efficiency
                </Typography>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Approval Rate</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {analytics.trends.approvalRate}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={analytics.trends.approvalRate}
                    color="success"
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Installation Rate</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {analytics.trends.installationRate}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={analytics.trends.installationRate}
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<PendingIcon />}
                    onClick={() => navigate('/spare-parts/outward/approvals')}
                    fullWidth
                  >
                    Pending Approvals ({analytics.summary.pendingRequests})
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<BuildIcon />}
                    onClick={() => navigate('/spare-parts/outward/installations')}
                    fullWidth
                  >
                    Installation Tracking
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => navigate('/spare-parts/outward/analytics')}
                    fullWidth
                  >
                    Detailed Analytics
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs for different views */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="outward flow tabs">
            <Tab label="Service Requests" {...a11yProps(0)} />
            <Tab label="Part Requests" {...a11yProps(1)} />
            <Tab label="Approvals" {...a11yProps(2)} />
            <Tab label="Installations" {...a11yProps(3)} />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <Box textAlign="center" py={4}>
            <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Service Requests Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Create, track, and manage vehicle service requests with spare parts requirements.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateServiceRequest}
            >
              Create Service Request
            </Button>
            <Button
              variant="outlined"
              sx={{ ml: 2 }}
              onClick={() => navigate('/spare-parts/outward/service-requests')}
            >
              View All Requests
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Box textAlign="center" py={4}>
            <BuildIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Part Requests Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Manage individual spare part requests, approvals, and issuance.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreatePartRequest}
            >
              Create Part Request
            </Button>
            <Button
              variant="outlined"
              sx={{ ml: 2 }}
              onClick={() => navigate('/spare-parts/outward/part-requests')}
            >
              View All Part Requests
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Box textAlign="center" py={4}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Approval Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Review and process pending approvals for spare part requests.
            </Typography>
            <Button
              variant="contained"
              startIcon={<PendingIcon />}
              onClick={() => navigate('/spare-parts/outward/approvals')}
            >
              View Pending Approvals
            </Button>
            <Button
              variant="outlined"
              sx={{ ml: 2 }}
              onClick={() => navigate('/spare-parts/outward/approval-history')}
            >
              Approval History
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <Box textAlign="center" py={4}>
            <BuildIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Installation Tracking
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Track installed parts, warranties, and maintenance schedules.
            </Typography>
            <Button
              variant="contained"
              startIcon={<BuildIcon />}
              onClick={() => navigate('/spare-parts/outward/installations')}
            >
              View Installations
            </Button>
            <Button
              variant="outlined"
              sx={{ ml: 2 }}
              onClick={() => navigate('/spare-parts/outward/cost-tracking')}
            >
              Cost Tracking
            </Button>
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default OutwardFlowManagement;
