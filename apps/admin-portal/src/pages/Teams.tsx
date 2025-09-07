import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Fab,
  Alert,
  Skeleton,
  Tooltip,
  TableSortLabel,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Divider,
  Stack,
  Badge,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  LocationCity as LocationCityIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  AccountTree as AccountTreeIcon,
  Description as DescriptionIcon,
  Code as CodeIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ViewList as ViewListIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { apiService } from '../services/api';
import { Team, Department, DepartmentFormData } from '../types/auth';

type SortOrder = 'asc' | 'desc';
type SortableFields = 'name' | 'department' | 'city' | 'teamLead' | 'memberCount' | 'createdAt';
type ViewMode = 'teams' | 'departments';

interface SortConfig {
  field: SortableFields;
  direction: SortOrder;
}

// Department validation schema
const departmentSchema = yup.object({
  name: yup
    .string()
    .required('Department name is required')
    .min(2, 'Department name must be at least 2 characters')
    .max(100, 'Department name must be less than 100 characters'),
  description: yup
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  code: yup
    .string()
    .matches(/^[A-Z0-9]{2,10}$/, 'Code must be 2-10 uppercase letters or numbers')
    .optional(),
  parentId: yup.string().optional(),
});

const Teams: React.FC = () => {
  const navigate = useNavigate();

  // Core state
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('teams');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartmentTab, setSelectedDepartmentTab] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Add debug logging
  useEffect(() => {
    console.log('Teams component mounted, viewMode:', viewMode);
    console.log('Loading state:', loading);
    console.log('Error state:', error);
    console.log('Teams count:', teams.length);
    console.log('Departments count:', departments.length);
  }, [viewMode, loading, error, teams.length, departments.length]);

  // Teams state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'name',
    direction: 'asc'
  });

  // Departments state
  const [openDepartmentDialog, setOpenDepartmentDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deleteDepartmentDialogOpen, setDeleteDepartmentDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Department form
  const {
    control: departmentControl,
    handleSubmit: handleDepartmentSubmit,
    formState: { errors: departmentErrors },
    reset: resetDepartmentForm,
  } = useForm<DepartmentFormData>({
    resolver: yupResolver(departmentSchema),
    defaultValues: {
      name: '',
      description: '',
      code: '',
      parentId: '',
    },
  });

  const fetchTeams = useCallback(async (departmentId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Always include inactive teams so frontend can filter them
      const response = await apiService.getTeams(departmentId, true);
      if (response.success && response.data) {
        setTeams(response.data.teams);
        console.log('Teams fetched - Total:', response.data.teams.length);
        console.log('Active teams:', response.data.teams.filter(t => t.isActive).length);
        console.log('Inactive teams:', response.data.teams.filter(t => !t.isActive).length);
      } else {
        throw new Error(response.message || 'Failed to fetch teams');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch teams';
      setError(errorMessage);
      console.error('Failed to fetch teams:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      setDepartmentsLoading(true);
      console.log('Fetching departments...');

      const response = await apiService.getDepartments();
      if (response.success && response.data) {
        console.log('Departments loaded:', response.data);
        setDepartments(response.data);
      } else {
        throw new Error(response.message || response.error || 'Failed to fetch departments');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch departments';
      console.error('Failed to fetch departments:', err);
      setError(errorMessage);
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  // Department management functions
  const handleOpenDepartmentDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      resetDepartmentForm({
        name: department.name,
        description: department.description || '',
        code: department.code || '',
        parentId: department.parentId || '',
      });
    } else {
      setEditingDepartment(null);
      resetDepartmentForm({
        name: '',
        description: '',
        code: '',
        parentId: '',
      });
    }
    setOpenDepartmentDialog(true);
  };

  const handleCloseDepartmentDialog = () => {
    setOpenDepartmentDialog(false);
    setEditingDepartment(null);
    resetDepartmentForm();
  };

  const onDepartmentSubmit = async (data: DepartmentFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const submitData = {
        ...data,
        parentId: data.parentId || undefined,
        isActive: true,
      };

      if (editingDepartment) {
        const response = await apiService.updateDepartment(editingDepartment.id, submitData);
        if (response.success) {
          setSuccess('Department updated successfully');
          fetchDepartments();
          handleCloseDepartmentDialog();
        } else {
          throw new Error(response.error || 'Failed to update department');
        }
      } else {
        const response = await apiService.createDepartment(submitData);
        if (response.success) {
          setSuccess('Department created successfully');
          fetchDepartments();
          handleCloseDepartmentDialog();
        } else {
          throw new Error(response.error || 'Failed to create department');
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = (department: Department) => {
    setDepartmentToDelete(department);
    setDeleteDepartmentDialogOpen(true);
  };

  const confirmDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    try {
      setSubmitting(true);
      const response = await apiService.deleteDepartment(departmentToDelete.id);
      if (response.success) {
        setSuccess('Department deleted successfully');
        fetchDepartments();
      } else {
        throw new Error(response.error || 'Failed to delete department');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to delete department');
    } finally {
      setSubmitting(false);
      setDeleteDepartmentDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchDepartments();
      const deptId = selectedDepartmentTab === 'all' ? undefined : selectedDepartmentTab;
      await fetchTeams(deptId);
    };

    loadData();
  }, [fetchDepartments, fetchTeams, selectedDepartmentTab]);

  // Auto-clear success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Department statistics and insights
  const departmentStats = useMemo(() => {
    const stats = new Map<string, {
      department: Department;
      teamCount: number;
      totalMembers: number;
      activeTeams: number;
      avgTeamSize: number;
    }>();

    departments.forEach(dept => {
      const deptTeams = teams.filter(team => {
        const teamDeptId = typeof team.department === 'string'
          ? team.departmentId
          : team.department?.id || team.departmentId;
        return teamDeptId === dept.id;
      });

      const totalMembers = deptTeams.reduce((sum, team) =>
        sum + (team.employees ? team.employees.length : team.memberCount || 0), 0
      );
      const activeTeams = deptTeams.filter(team =>
        team.isActive && (team.status === 'Active' || team.status !== 'Inactive')
      ).length;

      stats.set(dept.id, {
        department: dept,
        teamCount: deptTeams.length,
        totalMembers,
        activeTeams,
        avgTeamSize: deptTeams.length > 0 ? Math.round(totalMembers / deptTeams.length) : 0
      });
    });

    return stats;
  }, [departments, teams]);

  // Handle department tab changes
  const handleDepartmentTabChange = useCallback((_: React.SyntheticEvent, newValue: string) => {
    setSelectedDepartmentTab(newValue);
  }, []);

  const handleRefresh = useCallback(() => {
    const deptId = selectedDepartmentTab === 'all' ? undefined : selectedDepartmentTab;
    fetchTeams(deptId);
    fetchDepartments();
  }, [fetchTeams, fetchDepartments, selectedDepartmentTab]);

  const handleSort = useCallback((field: SortableFields) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Team handlers
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, team: Team) => {
    setAnchorEl(event.currentTarget);
    setSelectedTeam(team);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTeam(null);
  };

  const handleEdit = () => {
    if (selectedTeam) {
      navigate(`/teams/edit/${selectedTeam.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (selectedTeam) {
      try {
        const response = await apiService.deleteTeam(selectedTeam.id);
        if (response.success) {
          setTeams(teams.filter(team => team.id !== selectedTeam.id));
          setDeleteDialogOpen(false);
          setSelectedTeam(null);
          setSuccess('Team deleted successfully');
        } else {
          throw new Error(response.message || 'Failed to delete team');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete team';
        console.error('Failed to delete team:', error);
        setError(errorMessage);
      }
    }
  };

  // Enhanced filtered and sorted teams with department integration
  const filteredAndSortedTeams = useMemo(() => {
    console.log('=== TEAMS FILTERING DEBUG ===');
    console.log('Total teams:', teams.length);
    console.log('Status filter:', statusFilter);
    console.log('Search term:', searchTerm);
    console.log('Selected department tab:', selectedDepartmentTab);

    // Check the raw data
    teams.forEach((team, index) => {
      console.log(`Team ${index + 1}: ${team.name} - isActive: ${team.isActive}`);
    });

    let filtered = teams.filter(team => {
      const teamDeptId = typeof team.department === 'object'
        ? team.department?.id
        : team.departmentId;

      const departmentName = typeof team.department === 'string'
        ? team.department
        : team.department?.name || departments.find(d => d.id === teamDeptId)?.name || '';

      const teamLeadName = typeof team.teamLead === 'string'
        ? team.teamLead || ''
        : team.teamLead
          ? `${team.teamLead.firstName} ${team.teamLead.lastName}`
          : team.manager
            ? `${team.manager.firstName} ${team.manager.lastName}`
            : '';

      const matchesSearch = !searchTerm || [
        team.name,
        team.description,
        departmentName,
        team.city,
        team.state,
        teamLeadName,
        ...(Array.isArray(team.skills) ? team.skills : [])
      ].some(field =>
        field && field.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const matchesDepartment = selectedDepartmentTab === 'all' ||
        teamDeptId === selectedDepartmentTab ||
        departmentName === selectedDepartmentTab;

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && team.isActive) ||
        (statusFilter === 'inactive' && !team.isActive);

      console.log(`Team ${team.name}: search=${matchesSearch}, dept=${matchesDepartment}, status=${matchesStatus} (isActive=${team.isActive})`);

      return matchesSearch && matchesDepartment && matchesStatus;
    });

    console.log('Filtered teams count:', filtered.length);
    console.log('Active filtered teams:', filtered.filter(t => t.isActive).length);
    console.log('Inactive filtered teams:', filtered.filter(t => !t.isActive).length);
    console.log('=== END DEBUG ===');    filtered.sort((a, b) => {
      const { field, direction } = sortConfig;
      let aValue: any;
      let bValue: any;

      switch (field) {
        case 'department':
          aValue = typeof a.department === 'string'
            ? a.department
            : a.department?.name || departments.find(d => d.id === a.departmentId)?.name || '';
          bValue = typeof b.department === 'string'
            ? b.department
            : b.department?.name || departments.find(d => d.id === b.departmentId)?.name || '';
          break;
        case 'teamLead':
          aValue = typeof a.teamLead === 'string'
            ? a.teamLead || ''
            : a.teamLead
              ? `${a.teamLead.firstName} ${a.teamLead.lastName}`
              : a.manager
                ? `${a.manager.firstName} ${a.manager.lastName}`
                : '';
          bValue = typeof b.teamLead === 'string'
            ? b.teamLead || ''
            : b.teamLead
              ? `${b.teamLead.firstName} ${b.teamLead.lastName}`
              : b.manager
                ? `${b.manager.firstName} ${b.manager.lastName}`
                : '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'memberCount':
          aValue = a.employees ? a.employees.length : (a.memberCount || 0);
          bValue = b.employees ? b.employees.length : (b.memberCount || 0);
          break;
        case 'city':
          aValue = a.city || '';
          bValue = b.city || '';
          break;
        case 'name':
        default:
          aValue = a[field] || '';
          bValue = b[field] || '';
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [teams, searchTerm, selectedDepartmentTab, statusFilter, sortConfig, departments]);

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'success' : 'default';
  };

  if (loading && departmentsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="rectangular" width={140} height={36} />
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} variant="rectangular" width={120} height={32} />
            ))}
          </Box>
        </Paper>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ mb: 3, p: 2 }}>
          <Skeleton variant="rectangular" height={56} />
        </Paper>
        <Paper>
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={60} sx={{ mb: 1 }} />
          ))}
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GroupsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            Teams & Departments Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Manage your organization's teams and departments in one place
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant={viewMode === 'teams' ? 'contained' : 'outlined'}
            startIcon={<GroupsIcon />}
            onClick={() => setViewMode('teams')}
            sx={{ minWidth: 100 }}
          >
            Teams
          </Button>
          <Button
            variant={viewMode === 'departments' ? 'contained' : 'outlined'}
            startIcon={<BusinessIcon />}
            onClick={() => setViewMode('departments')}
            sx={{ minWidth: 120 }}
          >
            Departments
          </Button>
        </Box>
      </Box>

      {viewMode === 'teams' ? renderTeamsView() : renderDepartmentsView()}

      {/* Team Action FAB */}
      {viewMode === 'teams' && (
        <Fab
          color="primary"
          aria-label="add team"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => navigate('/teams/create')}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Team Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Team
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'warning.main' }}>
          <ArchiveIcon sx={{ mr: 1 }} />
          Archive Team
        </MenuItem>
      </Menu>

      {/* Team Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArchiveIcon color="warning" />
            Archive Team
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This team will be archived and marked as inactive
          </Alert>
          <Typography>
            Are you sure you want to archive the team <strong>"{selectedTeam?.name}"</strong>?
          </Typography>
          {selectedTeam && ((selectedTeam as any).employees ? (selectedTeam as any).employees.length : selectedTeam.memberCount || 0) > 0 && (
            <Typography color="warning.main" sx={{ mt: 1 }}>
              This team has {(selectedTeam as any).employees ? (selectedTeam as any).employees.length : selectedTeam.memberCount || 0} active member{((selectedTeam as any).employees ? (selectedTeam as any).employees.length : selectedTeam.memberCount || 0) !== 1 ? 's' : ''}.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="warning"
            variant="contained"
            startIcon={<ArchiveIcon />}
          >
            Archive Team
          </Button>
        </DialogActions>
      </Dialog>

      {renderDepartmentDialogs()}
    </Box>
  );

  function renderTeamsView() {

    return (
      <>
        {/* Department Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedDepartmentTab}
            onChange={handleDepartmentTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 60,
                textTransform: 'none'
              }
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="body1" fontWeight="medium">All Departments</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {teams.length} teams
                  </Typography>
                </Box>
              }
              value="all"
              icon={<BusinessIcon />}
              iconPosition="start"
            />
            {departments.map((dept) => {
              const stats = departmentStats.get(dept.id);
              return (
                <Tab
                  key={dept.id}
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="body1" fontWeight="medium">{dept.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stats?.teamCount || 0} teams • {stats?.totalMembers || 0} members
                      </Typography>
                    </Box>
                  }
                  value={dept.id}
                  icon={<Badge badgeContent={stats?.activeTeams || 0} color="primary">
                    <BusinessIcon />
                  </Badge>}
                  iconPosition="start"
                />
              );
            })}
          </Tabs>
        </Paper>

        {/* Department Overview Stats */}
        {selectedDepartmentTab !== 'all' && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {(() => {
              const currentDept = departments.find(d => d.id === selectedDepartmentTab);
              const stats = departmentStats.get(selectedDepartmentTab);

              if (!currentDept || !stats) return null;

              return (
                <>
                  <Grid item xs={12} md={8}>
                    <Card>
                      <CardHeader
                        title={currentDept.name}
                        subheader={currentDept.description || 'No description available'}
                        action={
                          <Chip
                            label={currentDept.isActive ? 'Active' : 'Inactive'}
                            color={currentDept.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        }
                      />
                      <CardContent>
                        <Grid container spacing={3}>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="primary.main" fontWeight="bold">
                                {stats.teamCount}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Total Teams
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="success.main" fontWeight="bold">
                                {stats.activeTeams}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Active Teams
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="info.main" fontWeight="bold">
                                {stats.totalMembers}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Total Members
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="warning.main" fontWeight="bold">
                                {stats.avgTeamSize}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Avg Team Size
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardHeader
                        title="Department Actions"
                        avatar={<SettingsIcon color="primary" />}
                      />
                      <CardContent>
                        <Stack spacing={2}>
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Team Utilization</Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {stats.teamCount > 0 ? Math.round((stats.activeTeams / stats.teamCount) * 100) : 0}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={stats.teamCount > 0 ? (stats.activeTeams / stats.teamCount) * 100 : 0}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          <Divider />
                          <Stack spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => navigate(`/teams/create?departmentId=${currentDept.id}`)}
                              fullWidth
                            >
                              Add Team to {currentDept.name}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenDepartmentDialog(currentDept)}
                              fullWidth
                            >
                              Edit Department
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setViewMode('departments')}
                              fullWidth
                            >
                              Manage All Departments
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              );
            })()}
          </Grid>
        )}

        {/* Enhanced Search and Filters */}
        <Paper sx={{ mb: 3, p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by team name, description, city, skills, or team lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                Quick filters:
              </Typography>
              <Chip
                label="Active Teams"
                size="small"
                variant={searchTerm.includes('active') ? 'filled' : 'outlined'}
                onClick={() => setSearchTerm(searchTerm.includes('active') ? '' : 'active')}
                clickable
              />
              <Chip
                label="Full Teams"
                size="small"
                variant={searchTerm.includes('full') ? 'filled' : 'outlined'}
                onClick={() => setSearchTerm(searchTerm.includes('full') ? '' : 'full')}
                clickable
              />
            </Box>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <MenuItem value="all">All Teams</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
              <LocationCityIcon fontSize="small" />
              <Typography variant="body2">
                {filteredAndSortedTeams.length} team{filteredAndSortedTeams.length !== 1 ? 's' : ''}
                {selectedDepartmentTab !== 'all' && (
                  <> in {departments.find(d => d.id === selectedDepartmentTab)?.name}</>
                )}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Teams Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'name'}
                    direction={sortConfig.field === 'name' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Team Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'department'}
                    direction={sortConfig.field === 'department' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('department')}
                  >
                    Department
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'city'}
                    direction={sortConfig.field === 'city' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('city')}
                  >
                    Location
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'teamLead'}
                    direction={sortConfig.field === 'teamLead' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('teamLead')}
                  >
                    Team Lead
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'memberCount'}
                    direction={sortConfig.field === 'memberCount' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('memberCount')}
                  >
                    Members
                  </TableSortLabel>
                </TableCell>
                <TableCell>Skills</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedTeams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ py: 4 }}>
                      <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No teams found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm || selectedDepartmentTab !== 'all'
                          ? 'Try adjusting your search criteria or filters'
                          : 'Create your first team to get started'
                        }
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedTeams.map((team: Team) => (
                  <TableRow key={team.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {team.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{team.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Created: {new Date(team.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          typeof team.department === 'string'
                            ? team.department || 'No Department'
                            : team.department?.name || 'No Department'
                        }
                        size="small"
                        variant="outlined"
                        color={team.department ? "primary" : "default"}
                      />
                    </TableCell>
                    <TableCell>{team.city || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {typeof team.teamLead === 'string'
                          ? team.teamLead || 'No Team Lead'
                          : team.teamLead
                            ? `${team.teamLead.firstName} ${team.teamLead.lastName}`
                            : team.manager
                              ? `${team.manager.firstName} ${team.manager.lastName}`
                              : 'No Team Lead'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {team.employees ? team.employees.length : (team.memberCount || 0)}/{team.maxMembers || 10}
                        </Typography>
                        <Box
                          sx={{
                            width: 40,
                            height: 6,
                            bgcolor: 'grey.200',
                            borderRadius: 3,
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              width: `${(team.employees ? team.employees.length : (team.memberCount || 0)) / (team.maxMembers || 10) * 100}%`,
                              height: '100%',
                              bgcolor: (team.employees ? team.employees.length : (team.memberCount || 0)) === (team.maxMembers || 10) ? 'error.main' : 'primary.main',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Array.isArray(team.skills) && team.skills.slice(0, 2).map((skill: string) => (
                          <Chip
                            key={skill}
                            label={skill}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ))}
                        {Array.isArray(team.skills) && team.skills.length > 2 && (
                          <Chip
                            label={`+${team.skills.length - 2}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={team.status || (team.isActive ? 'Active' : 'Inactive')}
                        size="small"
                        color={getStatusColor(team.status || (team.isActive ? 'Active' : 'Inactive')) as any}
                        sx={{ fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="More actions">
                        <IconButton
                          onClick={(e) => handleMenuClick(e, team)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  }
  function renderDepartmentsView() {
    const renderDepartmentTree = (department: Department & { children?: Department[] }, level = 0) => (
      <Box key={department.id} sx={{ ml: level * 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, px: 2,
                   '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1, mb: 1 }}>
          <BusinessIcon color="primary" />
          <Typography variant="body1" sx={{ flexGrow: 1 }}>
            {department.name}
          </Typography>
          {department.description && (
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {department.description}
            </Typography>
          )}
          <Chip
            label={department.isActive ? 'Active' : 'Inactive'}
            color={department.isActive ? 'success' : 'default'}
            size="small"
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => handleOpenDepartmentDialog(department)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Archive">
              <IconButton
                size="small"
                color="warning"
                onClick={() => handleDeleteDepartment(department)}
              >
                <ArchiveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {department.children?.map(child => renderDepartmentTree(child, level + 1))}
      </Box>
    );

    return (
      <>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BusinessIcon sx={{ fontSize: 24 }} />
            Department Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDepartmentDialog()}
              size="large"
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 2,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Add Department
            </Button>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <BusinessIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {departments.filter(d => d.isActive).length}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Active Departments
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                    <GroupsIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {departments.reduce((total, dept) => total + (dept.teams?.length || 0), 0)}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Total Teams
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                    <PeopleIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {departments.reduce((total, dept) => total + ((dept as any)._count?.employees || dept.employees?.length || 0), 0)}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Total Employees
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                    <TrendingUpIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {departments.filter(d => d.isActive).length > 0
                        ? Math.round(departments.reduce((total, dept) => total + ((dept as any)._count?.employees || dept.employees?.length || 0), 0) / departments.filter(d => d.isActive).length)
                        : 0
                      }
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Avg per Dept
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Department View Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value="table"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none'
              }
            }}
          >
            <Tab
              label="Table View"
              value="table"
              icon={<ViewListIcon />}
              iconPosition="start"
            />
            <Tab
              label="Hierarchy View"
              value="tree"
              icon={<AccountTreeIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Table View */}
        <Card elevation={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Teams</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Employees</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((department) => (
                  <TableRow
                    key={department.id}
                    hover
                    sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                              {department.name}
                            </Typography>
                            {department.code && (
                              <Chip
                                label={department.code}
                                size="small"
                                variant="outlined"
                                color="primary"
                                sx={{ fontWeight: 'bold' }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            ID: {department.id.slice(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {department.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {department.teams?.length || 0} team{(department.teams?.length || 0) !== 1 ? 's' : ''}
                        </Typography>
                        {department.teams && department.teams.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            {department.teams.slice(0, 2).map((team) => (
                              <Box key={team.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {team.name}
                                </Typography>
                                {team.manager && (
                                  <Typography variant="caption" color="primary">
                                    ({team.manager.firstName} {team.manager.lastName})
                                  </Typography>
                                )}
                              </Box>
                            ))}
                            {department.teams.length > 2 && (
                              <Typography variant="caption" color="text.secondary">
                                +{department.teams.length - 2} more teams
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {(department as any)._count?.employees || department.employees?.length || 0} employee{((department as any)._count?.employees || department.employees?.length || 0) !== 1 ? 's' : ''}
                        </Typography>
                        {department.teams && department.teams.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Across {department.teams.length} team{department.teams.length !== 1 ? 's' : ''}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={department.isActive ? 'Active' : 'Inactive'}
                        color={department.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="Edit Department">
                          <IconButton
                            onClick={() => handleOpenDepartmentDialog(department)}
                            size="small"
                            sx={{
                              bgcolor: 'primary.light',
                              color: 'white',
                              '&:hover': { bgcolor: 'primary.main' }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Archive Department">
                          <IconButton
                            onClick={() => handleDeleteDepartment(department)}
                            size="small"
                            sx={{
                              bgcolor: 'warning.light',
                              color: 'white',
                              '&:hover': { bgcolor: 'warning.main' }
                            }}
                          >
                            <ArchiveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </>
    );
  }

  function renderDepartmentDialogs() {
    return (
      <>
        {/* Department Dialog */}
        <Dialog open={openDepartmentDialog} onClose={handleCloseDepartmentDialog} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {editingDepartment ? 'Edit Department' : 'Create New Department'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {editingDepartment ? 'Update department information' : 'Add a new department to your organization'}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={8}>
                  <Controller
                    name="name"
                    control={departmentControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Department Name"
                        placeholder="Enter department name"
                        error={!!departmentErrors.name}
                        helperText={departmentErrors.name?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BusinessIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="code"
                    control={departmentControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Department Code"
                        placeholder="e.g., IT, HR, FIN"
                        error={!!departmentErrors.code}
                        helperText={departmentErrors.code?.message || 'Optional 2-10 character code'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CodeIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                        inputProps={{
                          style: { textTransform: 'uppercase' },
                          maxLength: 10
                        }}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={departmentControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Description"
                        placeholder="Describe the department's role and responsibilities"
                        multiline
                        rows={4}
                        error={!!departmentErrors.description}
                        helperText={departmentErrors.description?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                              <DescriptionIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="parentId"
                    control={departmentControl}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Parent Department</InputLabel>
                        <Select
                          {...field}
                          label="Parent Department"
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>None (Root Department)</em>
                          </MenuItem>
                          {departments
                            .filter(dept => editingDepartment ? dept.id !== editingDepartment.id : true)
                            .map((dept) => (
                            <MenuItem key={dept.id} value={dept.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BusinessIcon fontSize="small" color="primary" />
                                <Typography>{dept.name}</Typography>
                                {dept.code && (
                                  <Chip label={dept.code} size="small" variant="outlined" />
                                )}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>Select a parent department to create a hierarchy</FormHelperText>
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button
              onClick={handleCloseDepartmentDialog}
              variant="outlined"
              startIcon={<CancelIcon />}
              sx={{ minWidth: 120 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDepartmentSubmit(onDepartmentSubmit)}
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} /> : <SaveIcon />}
              sx={{ minWidth: 120 }}
            >
              {submitting ? 'Saving...' : (editingDepartment ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Archive Department Confirmation Dialog */}
        <Dialog open={deleteDepartmentDialogOpen} onClose={() => setDeleteDepartmentDialogOpen(false)}>
          <DialogTitle>Confirm Archive</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to archive department "{departmentToDelete?.name}"?
              This will mark the department as inactive and may affect associated employees and teams.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDepartmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmDeleteDepartment} color="warning" disabled={submitting}>
              {submitting ? <CircularProgress size={20} /> : 'Archive'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  }

export default Teams;
