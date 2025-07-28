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
  TableSortLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Team } from '../types/auth';

type SortOrder = 'asc' | 'desc';
type SortableFields = 'name' | 'department' | 'city' | 'teamLead' | 'memberCount' | 'createdAt';

interface SortConfig {
  field: SortableFields;
  direction: SortOrder;
}

const Teams: React.FC = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'name',
    direction: 'asc'
  });
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Mock data for testing - will be replaced with API calls
  const mockTeams: Team[] = [
    {
      id: '1',
      name: 'Frontend Development',
      description: 'Responsible for user interface development',
      isActive: true,
      departmentId: 'dept-1',
      teamLeadId: 'user-1',
      city: 'Mumbai',
      country: 'India',
      memberCount: 8,
      maxMembers: 10,
      skills: ['React', 'TypeScript', 'Node.js'],
      status: 'Active',
      createdAt: '2024-01-15',
      // Virtual fields populated by backend
      department: 'Engineering',
      teamLead: 'John Doe'
    },
    {
      id: '2',
      name: 'Backend Services',
      description: 'Server-side development and APIs',
      isActive: true,
      departmentId: 'dept-1',
      teamLeadId: 'user-2',
      city: 'Bangalore',
      country: 'India',
      memberCount: 6,
      maxMembers: 8,
      skills: ['Node.js', 'PostgreSQL', 'Docker'],
      status: 'Active',
      createdAt: '2024-01-10',
      department: 'Engineering',
      teamLead: 'Jane Smith'
    },
    {
      id: '3',
      name: 'Quality Assurance',
      description: 'Testing and quality control',
      isActive: true,
      departmentId: 'dept-1',
      teamLeadId: 'user-3',
      city: 'Delhi',
      country: 'India',
      memberCount: 4,
      maxMembers: 6,
      skills: ['Testing', 'Automation', 'Selenium'],
      status: 'Active',
      createdAt: '2024-01-12',
      department: 'Engineering',
      teamLead: 'Mike Johnson'
    },
    {
      id: '4',
      name: 'DevOps & Infrastructure',
      description: 'Infrastructure and deployment automation',
      isActive: true,
      departmentId: 'dept-1',
      teamLeadId: 'user-4',
      city: 'Pune',
      country: 'India',
      memberCount: 5,
      maxMembers: 7,
      skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform'],
      status: 'Active',
      createdAt: '2024-01-08',
      department: 'Engineering',
      teamLead: 'Sarah Wilson'
    },
    {
      id: '5',
      name: 'Product Management',
      description: 'Product strategy and roadmap',
      isActive: true,
      departmentId: 'dept-2',
      teamLeadId: 'user-5',
      city: 'Hyderabad',
      country: 'India',
      memberCount: 3,
      maxMembers: 5,
      skills: ['Strategy', 'Analytics', 'UX Research'],
      status: 'Active',
      createdAt: '2024-01-20',
      department: 'Product',
      teamLead: 'Raj Patel'
    },
    {
      id: '6',
      name: 'Legacy Systems',
      description: 'Maintenance of legacy applications',
      isActive: false,
      departmentId: 'dept-1',
      teamLeadId: 'user-6',
      city: 'Chennai',
      country: 'India',
      memberCount: 2,
      maxMembers: 4,
      skills: ['Java', 'COBOL', 'Mainframe'],
      status: 'Inactive',
      createdAt: '2023-12-15',
      department: 'Engineering',
      teamLead: 'Alex Kumar'
    }
  ];

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use API service to fetch teams
      const response = await apiService.getTeams();
      if (response.success && response.data) {
        setTeams(response.data.teams);
      } else {
        throw new Error(response.message || 'Failed to fetch teams');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch teams';
      setError(errorMessage);
      console.error('Failed to fetch teams:', err);
      // Use mock data as fallback during development
      setTeams(mockTeams);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleSort = useCallback((field: SortableFields) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchTeams();
  }, [fetchTeams]);

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

  // Memoized filtered and sorted teams
  const filteredAndSortedTeams = useMemo(() => {
    let filtered = teams.filter(team => {
      const matchesSearch = 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.department && team.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        team.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.teamLead && team.teamLead.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDepartment = departmentFilter === 'all' || team.department === departmentFilter;
      
      return matchesSearch && matchesDepartment;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      const { field, direction } = sortConfig;
      let aValue: any;
      let bValue: any;

      // Get values based on field
      switch (field) {
        case 'department':
          aValue = a.department || '';
          bValue = b.department || '';
          break;
        case 'teamLead':
          aValue = a.teamLead || '';
          bValue = b.teamLead || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'memberCount':
          aValue = a.memberCount;
          bValue = b.memberCount;
          break;
        default:
          aValue = a[field] || '';
          bValue = b[field] || '';
      }

      // Handle string comparisons
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [teams, searchTerm, departmentFilter, sortConfig]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const uniqueDepts = Array.from(new Set(
      teams
        .map(team => team.department)
        .filter((dept): dept is string => dept !== undefined)
    ));
    return uniqueDepts.sort();
  }, [teams]);

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'success' : 'default';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rectangular" width={140} height={36} />
        </Box>
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
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Teams Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Manage your organization's teams and members
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh teams">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/teams/create')}
            sx={{ minWidth: 140 }}
          >
            Create Team
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search teams by name, department, city, or team lead..."
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
          <TextField
            select
            label="Department"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            sx={{ minWidth: 150 }}
            SelectProps={{
              native: true,
            }}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <Typography variant="body2">
              {filteredAndSortedTeams.length} team{filteredAndSortedTeams.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
      </Paper>

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
                      {searchTerm || departmentFilter !== 'all' 
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
                      label={team.department || 'No Department'} 
                      size="small" 
                      variant="outlined"
                      color={team.department ? "primary" : "default"}
                    />
                  </TableCell>
                  <TableCell>{team.city}, {team.country}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {team.teamLead || 'No Team Lead'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {team.memberCount}/{team.maxMembers}
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
                            width: `${(team.memberCount / team.maxMembers) * 100}%`,
                            height: '100%',
                            bgcolor: team.memberCount === team.maxMembers ? 'error.main' : 'primary.main',
                            transition: 'width 0.3s ease'
                          }} 
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {team.skills.slice(0, 2).map((skill: string) => (
                        <Chip
                          key={skill}
                          label={skill}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                      {team.skills.length > 2 && (
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
                      label={team.status}
                      size="small"
                      color={getStatusColor(team.status) as any}
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

      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => navigate('/teams/create')}
      >
        <AddIcon />
      </Fab>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Team
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Team
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            Delete Team
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone
          </Alert>
          <Typography>
            Are you sure you want to delete the team <strong>"{selectedTeam?.name}"</strong>?
          </Typography>
          {selectedTeam && selectedTeam.memberCount > 0 && (
            <Typography color="error" sx={{ mt: 1 }}>
              This team has {selectedTeam.memberCount} active member{selectedTeam.memberCount !== 1 ? 's' : ''}.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Delete Team
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Teams;
