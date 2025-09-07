import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
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
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Paper,
  InputAdornment,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Business as BusinessIcon,
  AccountTree as AccountTreeIcon,
  Description as DescriptionIcon,
  Code as CodeIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Department, DepartmentFormData } from '../types/auth'
import { apiService } from '../services/api'

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
})

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DepartmentFormData>({
    resolver: yupResolver(departmentSchema),
    defaultValues: {
      name: '',
      description: '',
      code: '',
      parentId: '',
    },
  })

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    try {
      setLoading(true)
      const response = await apiService.getDepartments(true) // Include inactive departments
      if (response.success && response.data) {
        setDepartments(response.data)
        console.log('Departments fetched - Total:', response.data.length);
        console.log('Active departments:', response.data.filter(d => d.isActive).length);
        console.log('Inactive departments:', response.data.filter(d => !d.isActive).length);
      } else {
        setError('Failed to load departments - API response not successful')
      }
    } catch (error: any) {
      console.error('Load departments error:', error)
      setError('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department)
      reset({
        name: department.name,
        description: department.description || '',
        code: department.code || '',
        parentId: department.parentId || '',
      })
    } else {
      setEditingDepartment(null)
      reset({
        name: '',
        description: '',
        code: '',
        parentId: '',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingDepartment(null)
    reset()
  }

  const onSubmit = async (data: DepartmentFormData) => {
    try {
      setSubmitting(true)
      setError('')

      const submitData = {
        ...data,
        parentId: data.parentId || undefined, // Convert empty string to undefined
        isActive: true, // Default to active for new departments
      }

      if (editingDepartment) {
        const response = await apiService.updateDepartment(editingDepartment.id, submitData)
        if (response.success) {
          setSuccess('Department updated successfully')
          loadDepartments()
          handleCloseDialog()
        } else {
          throw new Error(response.error || 'Failed to update department')
        }
      } else {
        const response = await apiService.createDepartment(submitData)
        if (response.success) {
          setSuccess('Department created successfully')
          loadDepartments()
          handleCloseDialog()
        } else {
          throw new Error(response.error || 'Failed to create department')
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save department')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDepartment = (department: Department) => {
    setDepartmentToDelete(department)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!departmentToDelete) return

    try {
      setSubmitting(true)
      const response = await apiService.deleteDepartment(departmentToDelete.id)
      if (response.success) {
        setSuccess('Department deleted successfully')
        loadDepartments()
      } else {
        throw new Error(response.error || 'Failed to delete department')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to delete department')
    } finally {
      setSubmitting(false)
      setDeleteDialogOpen(false)
      setDepartmentToDelete(null)
    }
  }

  // Filter departments based on status
  console.log('=== DEPARTMENTS FILTERING DEBUG ===');
  console.log('Total departments:', departments.length);
  console.log('Status filter:', statusFilter);

  // Check the raw data
  departments.forEach((dept, index) => {
    console.log(`Dept ${index + 1}: ${dept.name} - isActive: ${dept.isActive}`);
  });

  const filteredDepartments = departments.filter(department => {
    let matches = false;
    if (statusFilter === 'all') matches = true;
    else if (statusFilter === 'active') matches = department.isActive;
    else if (statusFilter === 'inactive') matches = !department.isActive;
    else matches = true;

    console.log(`Dept ${department.name}: statusFilter=${statusFilter}, isActive=${department.isActive}, matches=${matches}`);
    return matches;
  });

  console.log('Filtered departments count:', filteredDepartments.length);
  console.log('Active filtered departments:', filteredDepartments.filter(d => d.isActive).length);
  console.log('Inactive filtered departments:', filteredDepartments.filter(d => !d.isActive).length);
  console.log('=== END DEBUG ===');

  // Build department tree structure
  const buildDepartmentTree = (departments: Department[]): Department[] => {
    const map = new Map<string, Department & { children: Department[] }>()
    const roots: (Department & { children: Department[] })[] = []

    // Initialize all departments with children array
    departments.forEach(dept => {
      map.set(dept.id, { ...dept, children: [] })
    })

    // Build tree structure
    departments.forEach(dept => {
      const node = map.get(dept.id)!
      if (dept.parentId && map.has(dept.parentId)) {
        map.get(dept.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }

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
              onClick={() => handleOpenDialog(department)}
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
  )

  const departmentTree = buildDepartmentTree(filteredDepartments)

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Departments Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('table')}
          >
            Table View
          </Button>
          <Button
            variant={viewMode === 'tree' ? 'contained' : 'outlined'}
            startIcon={<AccountTreeIcon />}
            onClick={() => setViewMode('tree')}
          >
            Tree View
          </Button>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            >
              <MenuItem value="all">All Departments</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

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
                  <AccountTreeIcon sx={{ fontSize: 32 }} />
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

      {viewMode === 'table' ? (
        // Table View
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
                {filteredDepartments.map((department) => (
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
                            onClick={() => handleOpenDialog(department)}
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
      ) : (
        // Tree View
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Department Hierarchy
            </Typography>
            {departmentTree.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {departmentTree.map(department => renderDepartmentTree(department))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No departments found
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Department Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
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
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Department Name"
                      placeholder="Enter department name"
                      error={!!errors.name}
                      helperText={errors.name?.message}
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
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Department Code"
                      placeholder="e.g., IT, HR, FIN"
                      error={!!errors.code}
                      helperText={errors.code?.message || 'Optional 2-10 character code'}
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
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      placeholder="Describe the department's role and responsibilities"
                      multiline
                      rows={4}
                      error={!!errors.description}
                      helperText={errors.description?.message}
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
                  control={control}
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
            onClick={handleCloseDialog}
            variant="outlined"
            startIcon={<CancelIcon />}
            sx={{ minWidth: 120 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} /> : <SaveIcon />}
            sx={{ minWidth: 120 }}
          >
            {submitting ? 'Saving...' : (editingDepartment ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete department "{departmentToDelete?.name}"?
            This action cannot be undone and may affect associated employees and teams.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
