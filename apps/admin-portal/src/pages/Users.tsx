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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Avatar,
  TablePagination,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Smartphone as MobileIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { User, Department, Team, Role, UserFormData } from '../types/auth'
import { apiService } from '../services/api'

const createEmployeeSchema = (isEditing: boolean) => yup.object({
  employeeId: yup.string().required('Employee ID is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  phone: yup.string().optional()
    .matches(
      /^\d{10}$/,
      'Mobile number must be exactly 10 digits'
    ),
  departmentId: yup.string().required('Department is required'),
  teamId: yup.string().optional(),
  roleIds: yup.array().of(yup.string()).min(1, 'At least one role is required').required('Roles are required'),
  hireDate: yup.date().required('Hire date is required'),
  position: yup.string().optional(),
  managerId: yup.string().optional(),
  temporaryPassword: isEditing
    ? yup.string().optional()
    : yup.string().min(8, 'Password must be at least 8 characters').required('Temporary password is required'),
})

export default function Users() {
  const [employees, setEmployees] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<User | null>(null)
  const [formError, setFormError] = useState('')

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: yupResolver(createEmployeeSchema(!!editingEmployee)),
    defaultValues: {
      employeeId: '',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      departmentId: '',
      teamId: '',
      roleIds: [],
      hireDate: new Date(),
      position: '',
      managerId: '',
      temporaryPassword: '',
    },
  })

  const watchDepartmentId = watch('departmentId')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Filter teams based on selected department
    if (watchDepartmentId) {
      const departmentTeams = teams.filter(team => team.departmentId === watchDepartmentId)
      if (departmentTeams.length === 0) {
        setValue('teamId', '')
      }
    }
  }, [watchDepartmentId, teams, setValue])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('') // Clear previous errors

      const [employeesRes, deptRes, teamsRes, rolesRes] = await Promise.all([
        apiService.getEmployees({ limit: 100 }), // Request up to 100 employees to get all records
        apiService.getDepartments(),
        apiService.getTeams(),
        apiService.getRoles(),
      ])

      if (employeesRes.success && employeesRes.data) {
        const employeesList = employeesRes.data.employees || [];
        setEmployees(employeesList);
      } else {
        console.error('❌ Failed to load employees:', employeesRes.error || 'Unknown error');
        setError(employeesRes.error || 'Failed to load employees');
      }

      if (deptRes.success && deptRes.data) {
        setDepartments(deptRes.data || [])
      } else {
        console.error('❌ Failed to load departments:', deptRes.error)
      }

      if (teamsRes.success && teamsRes.data) {
        setTeams(teamsRes.data.teams || [])
      } else {
        console.error('❌ Failed to load teams:', teamsRes.error)
      }

      if (rolesRes.success && rolesRes.data) {
        const loadedRoles = rolesRes.data.roles || [];
        setRoles(loadedRoles);
      } else {
        console.error('❌ Failed to load roles:', rolesRes.error)
      }
    } catch (error: any) {
      console.error('💥 Load data error:', error)
      setError('Failed to load data: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (employee?: User) => {
    setFormError('') // Clear any previous form errors
    if (employee) {
      setEditingEmployee(employee)
      reset({
        employeeId: employee.employeeId || '',
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone || '',
        departmentId: employee.department?.id || '',
        teamId: employee.team?.id || '',
        roleIds: employee.roles?.map(role => role.id) || [],
        hireDate: employee.hireDate ? new Date(employee.hireDate) : new Date(),
        position: employee.position || '',
        managerId: employee.managerId || '',
        temporaryPassword: '', // Don't prefill password for editing
      })
    } else {
      setEditingEmployee(null)
      reset({
        employeeId: '',
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        departmentId: '',
        teamId: '',
        roleIds: [],
        hireDate: new Date(),
        position: '',
        managerId: '',
        temporaryPassword: '',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingEmployee(null)
    setFormError('') // Clear form errors when closing
    reset()
  }

  const onSubmit = async (data: UserFormData) => {
    console.log('🔧 Form submission started', { editingEmployee: !!editingEmployee, data });

    try {
      setSubmitting(true)
      setFormError('') // Clear form errors at start of submission

      if (editingEmployee) {
        console.log('🔄 Updating employee:', editingEmployee.id);

        // Update employee - exclude temporaryPassword from updates
        const updateData = {
          ...data,
          hireDate: data.hireDate.toISOString()
        }
        delete (updateData as any).temporaryPassword // Don't update password during edit

        console.log('📤 Sending update request with data:', updateData);

        const response = await apiService.updateEmployee(editingEmployee.id, updateData)

        console.log('📥 Update response received:', response);

        if (response.success) {
          setSuccess('Employee updated successfully')
          loadData()
          handleCloseDialog()
        } else {
          // Show error on form instead of top-level alert
          setFormError(response.error || 'Failed to update employee')
        }
      } else {
        console.log('➕ Creating new employee');

        // Create employee
        if (!data.temporaryPassword) {
          setFormError('Temporary password is required for new employees')
          return
        }

        console.log('📤 Sending create request with data:', data);

        const response = await apiService.createEmployee(data)

        console.log('📥 Create response received:', response);

        if (response.success) {
          setSuccess('Employee created successfully')
          loadData()
          handleCloseDialog()
        } else {
          // Show error on form instead of top-level alert
          setFormError(response.error || 'Failed to create employee')
        }
      }
    } catch (error: any) {
      console.error('❌ Form submission error:', error);
      // Show error on form instead of top-level alert
      setFormError(error.message || 'Failed to save employee')
    } finally {
      setSubmitting(false)
      console.log('✅ Form submission completed');
    }
  }

  const handleDeleteEmployee = (employee: User) => {
    setEmployeeToDelete(employee)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!employeeToDelete) return

    try {
      setSubmitting(true)
      const response = await apiService.deleteEmployee(employeeToDelete.id)
      if (response.success) {
        setSuccess('Employee deleted successfully')
        loadData()
      } else {
        throw new Error(response.error || 'Failed to delete employee')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to delete employee')
    } finally {
      setSubmitting(false)
      setDeleteDialogOpen(false)
      setEmployeeToDelete(null)
    }
  }

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch =
      (employee.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (employee.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (employee.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())

    const matchesDepartment = !filterDepartment || employee.department?.id === filterDepartment
    const matchesTeam = !filterTeam || employee.team?.id === filterTeam

    // Fix status filtering: show all when no filter, or match specific status
    let matchesStatus = true
    if (filterStatus === 'active') {
      matchesStatus = employee.isActive === true
    } else if (filterStatus === 'inactive') {
      matchesStatus = employee.isActive === false
    }
    // When filterStatus is empty/undefined, matchesStatus stays true (show all)

    return matchesSearch && matchesDepartment && matchesTeam && matchesStatus
  })

  // Get available teams for selected department
  const availableTeams = watchDepartmentId
    ? teams.filter(team => team.departmentId === watchDepartmentId)
    : teams

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
          Employees Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh Data'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Employee
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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2.5}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={filterDepartment}
                  label="Department"
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.5}>
              <FormControl fullWidth>
                <InputLabel>Team</InputLabel>
                <Select
                  value={filterTeam}
                  label="Team"
                  onChange={(e) => setFilterTeam(e.target.value)}
                >
                  <MenuItem value="">All Teams</MenuItem>
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('')
                  setFilterDepartment('')
                  setFilterTeam('')
                  setFilterStatus('')
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((employee) => (
                <TableRow key={employee.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          {employee.firstName || 'N/A'} {employee.lastName || ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {employee.id?.slice(0, 8) || 'N/A'}...
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="disabled" />
                        <Typography variant="body2">{employee.email || 'N/A'}</Typography>
                      </Box>
                      {employee.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MobileIcon fontSize="small" color="disabled" />
                          <Typography variant="body2">{employee.phone}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {employee.department ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" color="disabled" />
                        <Typography variant="body2">{employee.department.name}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {employee.team ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GroupIcon fontSize="small" color="disabled" />
                        <Typography variant="body2">{employee.team.name}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {employee.roles && employee.roles.length > 0 ? (
                        employee.roles.map((role) => (
                          <Chip
                            key={role.id}
                            label={role.name}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">No roles</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={employee.isActive ? 'Active' : 'Inactive'}
                      color={employee.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Employee">
                      <IconButton onClick={() => handleOpenDialog(employee)} size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={employee.isActive ? "Archive Employee" : "Reactivate Employee"}>
                      <IconButton
                        onClick={() => handleDeleteEmployee(employee)}
                        size="small"
                        color={employee.isActive ? "warning" : "success"}
                      >
                        <ArchiveIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredEmployees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
        />
      </Card>

      {/* Employee Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>
              {formError}
            </Alert>
          )}
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="employeeId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Employee ID"
                      error={!!errors.employeeId}
                      helperText={errors.employeeId?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="First Name"
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Last Name"
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <TextField
                      {...field}
                      value={value || ''}
                      onChange={(e) => {
                        // Only allow digits and limit to 10
                        const numericValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                        onChange(numericValue);
                      }}
                      fullWidth
                      label="Mobile"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      placeholder="Enter 10-digit mobile number (e.g., 9123456789)"
                      inputProps={{
                        maxLength: 10,
                        inputMode: 'numeric',
                        pattern: '[0-9]*'
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Department</InputLabel>
                      <Select {...field} label="Department">
                        <MenuItem value="">None</MenuItem>
                        {departments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="teamId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Team</InputLabel>
                      <Select {...field} label="Team" disabled={!watchDepartmentId}>
                        <MenuItem value="">None</MenuItem>
                        {availableTeams.map((team) => (
                          <MenuItem key={team.id} value={team.id}>
                            {team.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="roleIds"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Roles</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label="Roles"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((value) => {
                              const role = roles.find(r => r.id === value)
                              return (
                                <Chip
                                  key={value}
                                  label={role?.name || value}
                                  size="small"
                                />
                              )
                            })}
                          </Box>
                        )}
                      >
                        {roles.map((role) => (
                          <MenuItem key={role.id} value={role.id}>
                            {role.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="position"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Position (Optional)"
                      error={!!errors.position}
                      helperText={errors.position?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="hireDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Hire Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={field.value ? field.value.toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      error={!!errors.hireDate}
                      helperText={errors.hireDate?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="managerId"
                  control={control}
                  render={({ field }) => {
                    // Get available managers from the selected department
                    const departmentManagers = employees.filter(emp => emp.department?.id === watchDepartmentId)

                    // If editing, ensure current manager is included even if from different department
                    const currentManagerId = field.value
                    let allManagerOptions = [...departmentManagers]

                    if (currentManagerId && !allManagerOptions.some(emp => emp.id === currentManagerId)) {
                      const currentManager = employees.find(emp => emp.id === currentManagerId)
                      if (currentManager) {
                        allManagerOptions.push(currentManager)
                      }
                    }

                    return (
                      <FormControl fullWidth>
                        <InputLabel>Manager (Optional)</InputLabel>
                        <Select {...field} label="Manager (Optional)">
                          <MenuItem value="">None</MenuItem>
                          {allManagerOptions.map((manager) => (
                            <MenuItem key={manager.id} value={manager.id}>
                              {manager.firstName} {manager.lastName} - {manager.position || 'N/A'}
                              {manager.department?.id !== watchDepartmentId && (
                                <span style={{ color: '#666', fontSize: '0.8em' }}>
                                  {' '}(from {manager.department?.name})
                                </span>
                              )}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )
                  }}
                />
              </Grid>
              {!editingEmployee && (
                <Grid item xs={12}>
                  <Controller
                    name="temporaryPassword"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Temporary Password"
                        type="password"
                        error={!!errors.temporaryPassword}
                        helperText={errors.temporaryPassword?.message}
                      />
                    )}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              console.log('🔲 Update button clicked');
              console.log('📋 Current form values:', watch());
              console.log('🚨 Form errors:', errors);
              console.log('🔄 Submitting state:', submitting);
              console.log('👤 Editing employee:', editingEmployee?.id);

              handleSubmit(onSubmit)(e);
            }}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : (editingEmployee ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive/Deactivate Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          {employeeToDelete?.isActive ? 'Confirm Archive' : 'Confirm Reactivate'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {employeeToDelete?.isActive
              ? `Are you sure you want to archive employee "${employeeToDelete?.firstName} ${employeeToDelete?.lastName}"? They will be deactivated and marked as inactive.`
              : `Are you sure you want to reactivate employee "${employeeToDelete?.firstName} ${employeeToDelete?.lastName}"? They will be marked as active again.`
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color={employeeToDelete?.isActive ? "warning" : "success"}
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={20} />
            ) : (
              employeeToDelete?.isActive ? 'Archive' : 'Reactivate'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
