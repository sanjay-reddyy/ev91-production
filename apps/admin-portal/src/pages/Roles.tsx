import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Card,
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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Autocomplete,
  TablePagination,
  InputAdornment,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  VpnKey as VpnKeyIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Role, Permission, RoleFormData, RolePermission } from '../types/auth'
import { apiService } from '../services/api'
import {
  PermissionGuard,
  ReadPermissionGuard,
  ManagePermissionGuard,
  SuperAdminGuard
} from '../components/PermissionGuard'
import { ErrorDisplay, PermissionError } from '../components/ErrorDisplay'
import { usePermissions } from '../hooks/usePermissions'

const roleSchema = yup.object({
  name: yup.string().required('Role name is required'),
  description: yup.string().optional(),
  permissionIds: yup.array().of(yup.string()).optional(),
})

const permissionSchema = yup.object({
  name: yup.string().required('Permission name is required'),
  service: yup.string().required('Service is required'),
  resource: yup.string().required('Resource is required'),
  action: yup.string().required('Action is required'),
  description: yup.string().optional(),
})

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

interface PermissionGroup {
  service: string
  permissions: Permission[]
}

export default function RolesAndPermissions() {
  const [activeTab, setActiveTab] = useState(0)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Add permissions checking
  const { hasPermission, isSuperAdmin, getUserPermissions } = usePermissions()

  // Search and filter state
  const [roleSearchQuery, setRoleSearchQuery] = useState('')
  const [permissionSearchQuery, setPermissionSearchQuery] = useState('')
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedResource, setSelectedResource] = useState<string>('')

  // Pagination state
  const [rolePage, setRolePage] = useState(0)
  const [roleRowsPerPage, setRoleRowsPerPage] = useState(10)
  const [permissionPage, setPermissionPage] = useState(0)
  const [permissionRowsPerPage, setPermissionRowsPerPage] = useState(10)

  // Dialog state
  const [openRoleDialog, setOpenRoleDialog] = useState(false)
  const [openPermissionDialog, setOpenPermissionDialog] = useState(false)
  const [openRolePermissionDialog, setOpenRolePermissionDialog] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'role' | 'permission'; item: Role | Permission } | null>(null)

  const roleForm = useForm<RoleFormData>({
    resolver: yupResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
      permissionIds: [],
    },
  })

  const permissionForm = useForm<{
    name: string
    service: string
    resource: string
    action: string
    description?: string
  }>({
    resolver: yupResolver(permissionSchema),
    defaultValues: {
      name: '',
      service: '',
      resource: '',
      action: '',
      description: '',
    },
  })

  useEffect(() => {
    loadData()
  }, [])

  // Debug: Log current user permissions
  useEffect(() => {
    console.log('🔍 Current user permissions debug:')
    console.log('- Is Super Admin:', isSuperAdmin())
    console.log('- Has auth:roles:update:', hasPermission('auth', 'roles', 'update'))
    console.log('- Has auth:roles:read:', hasPermission('auth', 'roles', 'read'))
    console.log('- All user permissions:', getUserPermissions().map(p => p.name))
  }, [])

  // Debug: Log selectedRoleForPermissions changes
  useEffect(() => {
    if (selectedRoleForPermissions) {
      console.log('🔄 selectedRoleForPermissions updated:', {
        id: selectedRoleForPermissions.id,
        name: selectedRoleForPermissions.name,
        permissionsCount: selectedRoleForPermissions.permissions?.length,
        timestamp: new Date().toISOString()
      })
    }
  }, [selectedRoleForPermissions])

  useEffect(() => {
    // Group permissions by service
    const groups = permissions.reduce((acc: PermissionGroup[], permission) => {
      const existingGroup = acc.find(g => g.service === permission.service)
      if (existingGroup) {
        existingGroup.permissions.push(permission)
      } else {
        acc.push({
          service: permission.service,
          permissions: [permission]
        })
      }
      return acc
    }, [])
    setPermissionGroups(groups)
  }, [permissions])

  const loadData = async () => {
    try {
      setLoading(true)
      const [rolesRes, permissionsRes] = await Promise.all([
        apiService.getRoles(),
        apiService.getPermissions(),
      ])

      let updatedRoles: Role[] = []
      if (rolesRes.success && rolesRes.data) {
        updatedRoles = rolesRes.data.roles || []
        setRoles(updatedRoles)
      }
      if (permissionsRes.success && permissionsRes.data) {
        setPermissions(permissionsRes.data.permissions || [])
      }

      // Return the updated roles for immediate use
      return updatedRoles
    } catch (error: any) {
      setError('Failed to load data')
      console.error('Load data error:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Filter functions
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
    (role.description || '').toLowerCase().includes(roleSearchQuery.toLowerCase())
  )

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(permissionSearchQuery.toLowerCase()) ||
      permission.resource.toLowerCase().includes(permissionSearchQuery.toLowerCase()) ||
      permission.action.toLowerCase().includes(permissionSearchQuery.toLowerCase())

    const matchesService = !selectedService || permission.service === selectedService
    const matchesResource = !selectedResource || permission.resource === selectedResource

    return matchesSearch && matchesService && matchesResource
  })

  // Get unique services and resources for filters
  const services = [...new Set(permissions.map(p => p.service))].sort()
  const resources = [...new Set(permissions.map(p => p.resource))].sort()

  // Role handlers
  const handleOpenRoleDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      // Handle both direct permissions and nested permission structure
      const permissionIds = role.permissions?.map(p => {
        // Handle RolePermission structure with permissionId
        if ('permissionId' in p && p.permissionId) {
          return p.permissionId
        }
        // If it's a RolePermission with nested permission, extract the permission ID
        if ('permission' in p && p.permission && p.permission.id) {
          return p.permission.id
        }
        // If it's a direct permission, use its ID
        return p.id
      }) || []

      roleForm.reset({
        name: role.name,
        description: role.description || '',
        permissionIds: permissionIds,
      })
    } else {
      setEditingRole(null)
      roleForm.reset({
        name: '',
        description: '',
        permissionIds: [],
      })
    }
    setOpenRoleDialog(true)
  }

  const handleCloseRoleDialog = () => {
    setOpenRoleDialog(false)
    setEditingRole(null)
    roleForm.reset()
  }

  const onSubmitRole = async (data: RoleFormData) => {
    console.log('🔄 onSubmitRole called with data:', data)

    try {
      setSubmitting(true)
      setError('')

      // Check if user has permission to update roles
      if (!hasPermission('auth', 'roles', 'update') && !isSuperAdmin()) {
        console.log('❌ User lacks permission to update roles')
        setError('You do not have permission to update roles. Required: auth:roles:update')
        return
      }

      console.log('✅ User has permission to update roles')

      // Transform data to match API expectations
      const roleData = {
        name: data.name,
        description: data.description,
        isActive: true,
        permissions: [],
        permissionIds: data.permissionIds || [],
      }

      console.log('📤 Sending role data:', roleData)

      if (editingRole) {
        console.log('🔄 Updating existing role:', editingRole.id)
        const response = await apiService.updateRole(editingRole.id, roleData)
        console.log('📥 Update response:', response)
        if (response.success) {
          setSuccess('Role updated successfully')
          await loadData()  // Make sure data is loaded before closing dialog
          handleCloseRoleDialog()
        } else {
          throw new Error(response.error || 'Failed to update role')
        }
      } else {
        console.log('🔄 Creating new role')
        const response = await apiService.createRole(roleData)
        console.log('📥 Create response:', response)
        if (response.success) {
          setSuccess('Role created successfully')
          await loadData()  // Make sure data is loaded before closing dialog
          handleCloseRoleDialog()
        } else {
          throw new Error(response.error || 'Failed to create role')
        }
      }
    } catch (error: any) {
      console.error('❌ Role submission error:', error)
      setError(error.message || 'Failed to save role')
    } finally {
      setSubmitting(false)
    }
  }

  // Permission handlers
  const handleOpenPermissionDialog = (permission?: Permission) => {
    if (permission) {
      setEditingPermission(permission)
      permissionForm.reset({
        name: permission.name,
        service: permission.service,
        resource: permission.resource,
        action: permission.action,
        description: permission.description || '',
      })
    } else {
      setEditingPermission(null)
      permissionForm.reset({
        name: '',
        service: '',
        resource: '',
        action: '',
        description: '',
      })
    }
    setOpenPermissionDialog(true)
  }

  const handleClosePermissionDialog = () => {
    setOpenPermissionDialog(false)
    setEditingPermission(null)
    permissionForm.reset()
  }

  const onSubmitPermission = async (data: {
    name: string
    service: string
    resource: string
    action: string
    description?: string
  }) => {
    try {
      setSubmitting(true)
      setError('')

      if (editingPermission) {
        const response = await apiService.updatePermission(editingPermission.id, data)
        if (response.success) {
          setSuccess('Permission updated successfully')
          loadData()
          handleClosePermissionDialog()
        } else {
          throw new Error(response.error || 'Failed to update permission')
        }
      } else {
        const response = await apiService.createPermission(data)
        if (response.success) {
          setSuccess('Permission created successfully')
          loadData()
          handleClosePermissionDialog()
        } else {
          throw new Error(response.error || 'Failed to create permission')
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save permission')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (type: 'role' | 'permission', item: Role | Permission) => {
    setItemToDelete({ type, item })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      setSubmitting(true)
      if (itemToDelete.type === 'role') {
        const response = await apiService.deleteRole(itemToDelete.item.id)
        if (response.success) {
          setSuccess('Role deleted successfully')
          loadData()
        } else {
          throw new Error(response.error || 'Failed to delete role')
        }
      } else {
        const response = await apiService.deletePermission(itemToDelete.item.id)
        if (response.success) {
          setSuccess('Permission deleted successfully')
          loadData()
        } else {
          throw new Error(response.error || 'Failed to delete permission')
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to delete item')
    } finally {
      setSubmitting(false)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  // Role-Permission management
  const handleOpenRolePermissionDialog = (role: Role) => {
    setSelectedRoleForPermissions(role)
    setOpenRolePermissionDialog(true)
  }

  const handleCloseRolePermissionDialog = () => {
    setOpenRolePermissionDialog(false)
    setSelectedRoleForPermissions(null)
  }

  const handlePermissionToggle = async (permissionId: string, isAssigned: boolean) => {
    if (!selectedRoleForPermissions) return

    // Check if current user has permission to manage role permissions
    const canManageRoles = hasPermission('auth', 'roles', 'update')
    if (!canManageRoles) {
      setError('You do not have permission to manage role permissions. Required: auth:roles:update')
      return
    }

    // Prevent removing permissions from Super Admin role
    if (isAssigned && selectedRoleForPermissions.name === 'Super Admin') {
      setError('Cannot remove permissions from Super Admin role. Super Admin must have all permissions.')
      return
    }

    try {
      setSubmitting(true)
      setError('') // Clear previous errors

      console.log(`🔍 Permission toggle: ${isAssigned ? 'Remove' : 'Assign'} permission ${permissionId} ${isAssigned ? 'from' : 'to'} role ${selectedRoleForPermissions.id}`)

      if (isAssigned) {
        console.log('🗑️ Removing permission...')
        await apiService.removePermissionFromRole(selectedRoleForPermissions.id, permissionId)
        setSuccess('Permission removed from role successfully')
      } else {
        console.log('➕ Assigning permission...')
        await apiService.assignPermissionToRole(selectedRoleForPermissions.id, permissionId)
        setSuccess('Permission assigned to role successfully')
      }

      // Reload data to get the latest state and get the fresh roles immediately
      console.log('🔄 Reloading all data after permission change...')
      const freshRoles = await loadData()

      // Update the selectedRoleForPermissions with fresh data from the loaded roles
      if (selectedRoleForPermissions && freshRoles.length > 0) {
        console.log('🔄 Refreshing selectedRoleForPermissions with updated data...')
        const updatedRole = freshRoles.find(r => r.id === selectedRoleForPermissions.id)
        if (updatedRole) {
          setSelectedRoleForPermissions(updatedRole)
          console.log('✅ Updated selectedRoleForPermissions with fresh data', updatedRole)
        } else {
          console.log('⚠️ Role not found in fresh data')
        }
      }
    } catch (error: any) {
      console.error('Permission toggle error:', error)

      // Enhanced error handling based on status code
      if (error?.response?.status === 403) {
        setError('Access denied. You don\'t have permission to modify role permissions.')
      } else if (error?.response?.status === 401) {
        setError('Authentication required. Please log in again.')
      } else if (error?.response?.status === 400) {
        const errorMessage = error?.response?.data?.error || 'Invalid request. Please check the role and permission.'
        if (errorMessage.includes('Super Admin')) {
          setError('Cannot remove permissions from Super Admin role. Super Admin must have all permissions.')
        } else {
          setError(errorMessage)
        }
      } else if (error?.response?.status === 404) {
        setError('Role or permission not found.')
      } else if (error?.response?.status >= 500) {
        setError('Server error occurred. Please try again later.')
      } else {
        setError(error?.response?.data?.error || error?.message || 'Failed to update role permissions')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const predefinedServices = ['auth', 'vehicle', 'rider', 'client', 'reports', 'spare-parts']
  const predefinedResources = [
    // Auth service resources
    'users', 'employees', 'departments', 'teams', 'roles', 'permissions',
    // Vehicle service resources
    'vehicles', 'models', 'oems', 'hubs', 'cities', 'maintenance', 'damage', 'documents', 'media',
    'analytics', 'fleet', 'tracking', 'enhanced-service', 'handover',
    // Rider service resources
    'riders', 'kyc', 'tracking',
    // Client service resources
    'clients', 'stores',
    // Spare-parts service resources
    'parts', 'inventory', 'suppliers', 'purchase-orders', 'analytics', 'dashboard', 'categories',
    // General resources
    'orders', 'reports'
  ]
  const predefinedActions = [
    'create', 'read', 'update', 'delete', 'manage',
    // Vehicle service specific actions
    'status', 'assign', 'unassign', 'history', 'stats', 'analytics', 'specs', 'metadata',
    'operational', 'counts', 'assign-vehicle', 'schedule', 'due', 'reports', 'upload',
    'verify', 'batch-upload', 'multiple-upload', 'view', 'vehicles', 'services', 'damage',
    'performance', 'real-time',
    // Spare-parts specific actions
    'pricing', 'bulk-update', 'price-history', 'usage-analytics', 'vehicle-compatibility',
    'stock-levels', 'initialize-stock', 'stock-movement', 'reserve-stock', 'release-stock', 'alerts', 'stock-count',
    'receive', 'cost-analysis', 'inventory-trends', 'supplier-performance', 'activities',
    // Rider specific actions
    'approve', 'reject',
    // Reports specific actions
    'export'
  ]

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <ReadPermissionGuard
      service="auth"
      resource="roles"
      fallback={
        <PermissionError
          action="view roles and permissions"
          requiredPermission="auth:roles:read"
        />
      }
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Roles & Permissions Management
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => {
                setRoleSearchQuery('')
                setPermissionSearchQuery('')
                setSelectedService('')
                setSelectedResource('')
              }}
            >
              Clear Filters
            </Button>
          </Stack>
        </Box>

        {error && (
          <ErrorDisplay error={error} action="manage roles and permissions" onRetry={loadData} />
        )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab
              label={`Roles (${roles.length})`}
              icon={<SecurityIcon />}
              iconPosition="start"
            />
            <Tab
              label={`Permissions (${permissions.length})`}
              icon={<VpnKeyIcon />}
              iconPosition="start"
            />
            <Tab
              label="Permission Groups"
              icon={<AssignmentIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {/* Roles Tab */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search roles..."
                  value={roleSearchQuery}
                  onChange={(e) => setRoleSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6">
                  Roles ({filteredRoles.length})
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                <PermissionGuard
                  service="auth"
                  resource="roles"
                  action="create"
                  fallback={null}
                >
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenRoleDialog()}
                    sx={{ mr: 1 }}
                  >
                    Add Role
                  </Button>
                </PermissionGuard>
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Role</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRoles
                  .slice(rolePage * roleRowsPerPage, rolePage * roleRowsPerPage + roleRowsPerPage)
                  .map((role) => (
                  <TableRow key={role.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <SecurityIcon color="primary" />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {role.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {role.id.slice(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {role.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 400 }}>
                        {role.permissions && role.permissions.length > 0 ? (
                          <>
                            {role.permissions.slice(0, 3).map((permissionItem) => {
                              // Handle both direct permissions and nested permission structure
                              const permission = 'permission' in permissionItem ? permissionItem.permission : permissionItem
                              return (
                                <Chip
                                  key={permission.id}
                                  label={`${permission.service}:${permission.resource}:${permission.action}`}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              )
                            })}
                            {role.permissions.length > 3 && (
                              <Chip
                                label={`+${role.permissions.length - 3} more`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">No permissions</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={role.isActive ? 'Active' : 'Inactive'}
                        color={role.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <PermissionGuard
                        service="auth"
                        resource="roles"
                        action="update"
                        fallback={null}
                      >
                        <Tooltip title="Manage Permissions">
                          <IconButton
                            onClick={() => handleOpenRolePermissionDialog(role)}
                            size="small"
                            color="info"
                          >
                            <VpnKeyIcon />
                          </IconButton>
                        </Tooltip>
                      </PermissionGuard>
                      <PermissionGuard
                        service="auth"
                        resource="roles"
                        action="update"
                        fallback={null}
                      >
                        <Tooltip title="Edit Role">
                          <IconButton onClick={() => handleOpenRoleDialog(role)} size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </PermissionGuard>
                      <PermissionGuard
                        service="auth"
                        resource="roles"
                        action="delete"
                        fallback={null}
                      >
                        <Tooltip title="Delete Role">
                          <IconButton
                            onClick={() => handleDelete('role', role)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </PermissionGuard>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredRoles.length}
            page={rolePage}
            onPageChange={(_, newPage) => setRolePage(newPage)}
            rowsPerPage={roleRowsPerPage}
            onRowsPerPageChange={(e) => {
              setRoleRowsPerPage(parseInt(e.target.value, 10))
              setRolePage(0)
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Permissions Tab */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search permissions..."
                  value={permissionSearchQuery}
                  onChange={(e) => setPermissionSearchQuery(e.target.value)}
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
                <FormControl fullWidth size="small">
                  <InputLabel>Service</InputLabel>
                  <Select
                    value={selectedService}
                    label="Service"
                    onChange={(e) => setSelectedService(e.target.value)}
                  >
                    <MenuItem value="">All Services</MenuItem>
                    {services.map((service) => (
                      <MenuItem key={service} value={service}>
                        {service}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Resource</InputLabel>
                  <Select
                    value={selectedResource}
                    label="Resource"
                    onChange={(e) => setSelectedResource(e.target.value)}
                  >
                    <MenuItem value="">All Resources</MenuItem>
                    {resources.map((resource) => (
                      <MenuItem key={resource} value={resource}>
                        {resource}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="h6">
                  Permissions ({filteredPermissions.length})
                </Typography>
              </Grid>
              <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
                <PermissionGuard
                  service="auth"
                  resource="permissions"
                  action="create"
                  fallback={null}
                >
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenPermissionDialog()}
                  >
                    Add Permission
                  </Button>
                </PermissionGuard>
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Permission</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPermissions
                  .slice(permissionPage * permissionRowsPerPage, permissionPage * permissionRowsPerPage + permissionRowsPerPage)
                  .map((permission) => (
                  <TableRow key={permission.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <VpnKeyIcon color="primary" />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {permission.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {permission.id.slice(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={permission.service} size="small" color="info" />
                    </TableCell>
                    <TableCell>
                      <Chip label={permission.resource} size="small" color="secondary" />
                    </TableCell>
                    <TableCell>
                      <Chip label={permission.action} size="small" color="primary" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {permission.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <PermissionGuard
                        service="auth"
                        resource="permissions"
                        action="update"
                        fallback={null}
                      >
                        <Tooltip title="Edit Permission">
                          <IconButton onClick={() => handleOpenPermissionDialog(permission)} size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </PermissionGuard>
                      <PermissionGuard
                        service="auth"
                        resource="permissions"
                        action="delete"
                        fallback={null}
                      >
                        <Tooltip title="Delete Permission">
                          <IconButton
                            onClick={() => handleDelete('permission', permission)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </PermissionGuard>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredPermissions.length}
            page={permissionPage}
            onPageChange={(_, newPage) => setPermissionPage(newPage)}
            rowsPerPage={permissionRowsPerPage}
            onRowsPerPageChange={(e) => {
              setPermissionRowsPerPage(parseInt(e.target.value, 10))
              setPermissionPage(0)
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* Permission Groups Tab */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">
              Permission Groups by Service ({permissionGroups.length} services)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage permissions organized by service
            </Typography>
          </Box>

          {permissionGroups.map((group) => (
            <Accordion key={group.service} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Chip
                    label={group.service}
                    color="primary"
                    variant="filled"
                    size="small"
                  />
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {group.service.charAt(0).toUpperCase() + group.service.slice(1)} Service
                  </Typography>
                  <Chip
                    label={`${group.permissions.length} permissions`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {group.permissions.map((permission) => (
                    <Grid item xs={12} sm={6} md={4} key={permission.id}>
                      <Paper
                        sx={{
                          p: 2,
                          border: 1,
                          borderColor: 'grey.300',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: 1
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <VpnKeyIcon color="primary" fontSize="small" />
                          <Typography variant="subtitle2" fontWeight="bold">
                            {permission.resource}.{permission.action}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {permission.name}
                        </Typography>
                        {permission.description && (
                          <Typography variant="caption" color="text.secondary">
                            {permission.description}
                          </Typography>
                        )}
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenPermissionDialog(permission)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete('permission', permission)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </TabPanel>
      </Card>

      {/* Role Dialog */}
      <Dialog open={openRoleDialog} onClose={handleCloseRoleDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRole ? 'Edit Role' : 'Add New Role'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={roleForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Role Name"
                      error={!!roleForm.formState.errors.name}
                      helperText={roleForm.formState.errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="description"
                  control={roleForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description (Optional)"
                      error={!!roleForm.formState.errors.description}
                      helperText={roleForm.formState.errors.description?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Permissions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Controller
                  name="permissionIds"
                  control={roleForm.control}
                  render={({ field }) => (
                    <Box>
                      {permissionGroups.map((group) => (
                        <Accordion key={group.service} sx={{ mb: 1 }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Chip label={group.service} size="small" color="primary" />
                              <Typography variant="subtitle1">
                                {group.service.charAt(0).toUpperCase() + group.service.slice(1)} Service
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                ({group.permissions.length} permissions)
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <FormGroup>
                              <Grid container spacing={1}>
                                {group.permissions.map((permission) => (
                                  <Grid item xs={12} sm={6} md={4} key={permission.id}>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={(field.value || []).includes(permission.id)}
                                          onChange={(e) => {
                                            const currentValues = field.value || []
                                            if (e.target.checked) {
                                              field.onChange([...currentValues, permission.id])
                                            } else {
                                              field.onChange(currentValues.filter(id => id !== permission.id))
                                            }
                                          }}
                                        />
                                      }
                                      label={
                                        <Box>
                                          <Typography variant="body2" fontWeight="bold">
                                            {permission.resource}.{permission.action}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {permission.name}
                                          </Typography>
                                        </Box>
                                      }
                                    />
                                  </Grid>
                                ))}
                              </Grid>
                            </FormGroup>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleDialog}>Cancel</Button>
          <Button
            onClick={(e) => {
              console.log('🖱️ Submit button clicked!', e)
              console.log('📝 Form data:', roleForm.getValues())
              console.log('❌ Form errors:', roleForm.formState.errors)
              console.log('✅ Form is valid:', roleForm.formState.isValid)
              roleForm.handleSubmit(onSubmitRole)(e)
            }}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : (editingRole ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permission Dialog */}
      <Dialog open={openPermissionDialog} onClose={handleClosePermissionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPermission ? 'Edit Permission' : 'Add New Permission'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={permissionForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Permission Name"
                      placeholder="e.g., auth:users:create"
                      error={!!permissionForm.formState.errors.name}
                      helperText={permissionForm.formState.errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="service"
                  control={permissionForm.control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={predefinedServices}
                      freeSolo
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Service"
                          error={!!permissionForm.formState.errors.service}
                          helperText={permissionForm.formState.errors.service?.message}
                        />
                      )}
                      onChange={(_, value) => field.onChange(value || '')}
                      value={field.value || ''}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="resource"
                  control={permissionForm.control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={predefinedResources}
                      freeSolo
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Resource"
                          error={!!permissionForm.formState.errors.resource}
                          helperText={permissionForm.formState.errors.resource?.message}
                        />
                      )}
                      onChange={(_, value) => field.onChange(value || '')}
                      value={field.value || ''}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="action"
                  control={permissionForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Action</InputLabel>
                      <Select {...field} label="Action">
                        {predefinedActions.map((action) => (
                          <MenuItem key={action} value={action}>
                            {action}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={permissionForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description (Optional)"
                      multiline
                      rows={3}
                      error={!!permissionForm.formState.errors.description}
                      helperText={permissionForm.formState.errors.description?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePermissionDialog}>Cancel</Button>
          <Button
            onClick={permissionForm.handleSubmit(onSubmitPermission)}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : (editingPermission ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Permission Management Dialog */}
      <Dialog
        open={openRolePermissionDialog}
        onClose={handleCloseRolePermissionDialog}
        maxWidth="md"
        fullWidth
        key={`role-permissions-${selectedRoleForPermissions?.id}-${selectedRoleForPermissions?.permissions?.length || 0}`}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SecurityIcon />
            <Box>
              <Typography variant="h6">
                Manage Permissions for "{selectedRoleForPermissions?.name}"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select permissions to assign to this role
              </Typography>
              {selectedRoleForPermissions?.name === 'Super Admin' && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Super Admin role has all permissions by default. Permissions cannot be removed from this role for security reasons.
                </Alert>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRoleForPermissions && permissionGroups.map((group) => (
            <Accordion key={group.service} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Chip label={group.service} size="small" color="primary" />
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {group.service.charAt(0).toUpperCase() + group.service.slice(1)} Service
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {group.permissions.filter(p => {
                      return selectedRoleForPermissions.permissions?.some(rp => {
                        // Handle RolePermission structure with permissionId
                        if ('permissionId' in rp && rp.permissionId) {
                          return rp.permissionId === p.id
                        }
                        // Handle direct permission structure
                        if ('permission' in rp && rp.permission && rp.permission.id) {
                          return rp.permission.id === p.id
                        }
                        return rp.id === p.id
                      })
                    }).length} / {group.permissions.length} assigned
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {group.permissions.map((permission) => {
                    // Calculate assignment status directly without useMemo
                    const isAssigned = selectedRoleForPermissions.permissions?.some(rp => {
                      // Handle RolePermission structure with permissionId
                      if ('permissionId' in rp && rp.permissionId) {
                        return rp.permissionId === permission.id
                      }
                      // Handle direct permission structure
                      if ('permission' in rp && rp.permission && rp.permission.id) {
                        return rp.permission.id === permission.id
                      }
                      return rp.id === permission.id
                    }) || false

                    // Debug logging for specific permission
                    if (permission.id === 'cmele31la0006j4cs5zzem65b') {
                      console.log(`🎯 Debug checkbox for ${permission.name}:`)
                      console.log(`   Permission ID: ${permission.id}`)
                      console.log(`   Is Assigned: ${isAssigned}`)
                      console.log(`   Role permissions count: ${selectedRoleForPermissions.permissions?.length}`)
                      console.log(`   Role permissions:`, selectedRoleForPermissions.permissions)
                    }

                    const isSuperAdmin = selectedRoleForPermissions.name === 'Super Admin'
                    const canInteract = !isSuperAdmin || !isAssigned // Can interact if: not Super Admin, OR Super Admin but permission not assigned (can only add to Super Admin)

                    return (
                      <Grid item xs={12} sm={6} md={4} key={permission.id}>
                        <Paper
                          sx={{
                            p: 2,
                            border: 1,
                            borderColor: isAssigned ? 'primary.main' : 'grey.300',
                            bgcolor: isAssigned ? 'primary.50' : 'background.paper',
                            cursor: canInteract ? 'pointer' : 'not-allowed',
                            opacity: canInteract ? 1 : 0.7,
                            '&:hover': {
                              borderColor: canInteract ? 'primary.main' : 'grey.300',
                              boxShadow: canInteract ? 1 : 0
                            }
                          }}
                          onClick={() => {
                            if (canInteract) {
                              handlePermissionToggle(permission.id, isAssigned)
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Checkbox
                              checked={isAssigned}
                              disabled={!canInteract}
                              size="small"
                            />
                            <Typography variant="subtitle2" fontWeight="bold">
                              {permission.resource}.{permission.action}
                            </Typography>
                            {isSuperAdmin && isAssigned && (
                              <Chip
                                label="Protected"
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ ml: 'auto' }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {permission.name}
                          </Typography>
                          {permission.description && (
                            <Typography variant="caption" color="text.secondary">
                              {permission.description}
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    )
                  })}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRolePermissionDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {itemToDelete?.type}?
            This action cannot be undone.
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
    </ReadPermissionGuard>
  )
}
