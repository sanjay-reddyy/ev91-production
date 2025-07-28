import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Store as StoreIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material'
import { clientStoreService, Client, ClientStats } from '../services/clientStore'

const CLIENT_TYPES = [
  'restaurant',
  'grocery',
  'pharmacy',
  'retail',
  'electronics',
  'fashion',
  'automotive',
  'healthcare',
  'other'
]

const BUSINESS_SIZES = [
  'small',
  'medium',
  'large',
  'enterprise'
]

const CLIENT_STATUSES = [
  'active',
  'inactive',
  'suspended',
  'onboarding'
]

const CLIENT_PRIORITIES = [
  'high',
  'medium',
  'low'
]

interface ClientFormData {
  clientCode: string
  clientType: string
  name: string
  primaryContactPerson: string
  email: string
  phone: string
  gstNumber: string
  city: string
  state: string
  businessSize: string
  baseOrderRate: number
  bulkBonusEnabled: boolean
  weeklyBonusEnabled: boolean
  clientStatus: string
  clientPriority: string
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState<ClientFormData>({
    clientCode: '',
    clientType: '',
    name: '',
    primaryContactPerson: '',
    email: '',
    phone: '',
    gstNumber: '',
    city: '',
    state: '',
    businessSize: '',
    baseOrderRate: 0,
    bulkBonusEnabled: false,
    weeklyBonusEnabled: false,
    clientStatus: 'active',
    clientPriority: 'medium',
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const loadClients = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        clientStatus: statusFilter || undefined,
        clientType: typeFilter || undefined,
        city: cityFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      }
      
      console.log('Loading clients with params:', params)
      const response = await clientStoreService.getClients(params)
      console.log('Get clients response:', response)
      if (response.success) {
        setClients(response.data)
        setTotalCount(response.pagination?.totalItems || 0)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      setSnackbar({ open: true, message: 'Failed to load clients', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, searchTerm, statusFilter, typeFilter, cityFilter])

  const loadStats = useCallback(async () => {
    try {
      const response = await clientStoreService.getClientStats()
      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error loading client stats:', error)
    }
  }, [])

  useEffect(() => {
    loadClients()
    loadStats()
  }, [loadClients, loadStats])

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client)
      setFormData({
        clientCode: client.clientCode,
        clientType: client.clientType,
        name: client.name,
        primaryContactPerson: client.primaryContactPerson || '',
        email: client.email || '',
        phone: client.phone || '',
        gstNumber: client.gstNumber || '',
        city: client.city || '',
        state: client.state || '',
        businessSize: client.businessSize || '',
        baseOrderRate: client.baseOrderRate,
        bulkBonusEnabled: client.bulkBonusEnabled,
        weeklyBonusEnabled: client.weeklyBonusEnabled,
        clientStatus: client.clientStatus,
        clientPriority: client.clientPriority,
      })
    } else {
      setEditingClient(null)
      setFormData({
        clientCode: '',
        clientType: '',
        name: '',
        primaryContactPerson: '',
        email: '',
        phone: '',
        gstNumber: '',
        city: '',
        state: '',
        businessSize: '',
        baseOrderRate: 0,
        bulkBonusEnabled: false,
        weeklyBonusEnabled: false,
        clientStatus: 'active',
        clientPriority: 'medium',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingClient(null)
  }

  const handleSaveClient = async () => {
    try {
      console.log('Saving client with data:', formData)
      if (editingClient) {
        const response = await clientStoreService.updateClient(editingClient.id, formData)
        console.log('Update response:', response)
        setSnackbar({ open: true, message: 'Client updated successfully', severity: 'success' })
      } else {
        const response = await clientStoreService.createClient(formData)
        console.log('Create response:', response)
        setSnackbar({ open: true, message: 'Client created successfully', severity: 'success' })
      }
      handleCloseDialog()
      loadClients()
      loadStats()
    } catch (error) {
      console.error('Error saving client:', error)
      setSnackbar({ open: true, message: 'Failed to save client', severity: 'error' })
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return
    
    try {
      await clientStoreService.deleteClient(clientId)
      setSnackbar({ open: true, message: 'Client deleted successfully', severity: 'success' })
      loadClients()
      loadStats()
    } catch (error) {
      console.error('Error deleting client:', error)
      setSnackbar({ open: true, message: 'Failed to delete client', severity: 'error' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'default'
      case 'suspended': return 'error'
      case 'onboarding': return 'warning'
      default: return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Client Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { loadClients(); loadStats() }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Client
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Clients
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalClients}
                    </Typography>
                  </Box>
                  <BusinessIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Active Clients
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {stats.activeClients}
                    </Typography>
                  </Box>
                  <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Inactive Clients
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {stats.inactiveClients}
                    </Typography>
                  </Box>
                  <TrendingDownIcon color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Active Rate
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {stats.totalClients > 0 ? Math.round((stats.activeClients / stats.totalClients) * 100) : 0}%
                    </Typography>
                  </Box>
                  <StoreIcon color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search clients"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {CLIENT_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {CLIENT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="City"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Filter by city"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                  setTypeFilter('')
                  setCityFilter('')
                  setPage(0)
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Client Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Stores</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                      No clients found
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.clientCode}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {client.name}
                          </Typography>
                          {client.primaryContactPerson && (
                            <Typography variant="caption" color="textSecondary">
                              {client.primaryContactPerson}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={client.clientType.charAt(0).toUpperCase() + client.clientType.slice(1)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          {client.email && (
                            <Typography variant="body2">{client.email}</Typography>
                          )}
                          {client.phone && (
                            <Typography variant="caption" color="textSecondary">
                              {client.phone}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {client.city && client.state ? (
                          <Typography variant="body2">
                            {client.city}, {client.state}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Not specified
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={client.clientStatus.charAt(0).toUpperCase() + client.clientStatus.slice(1)}
                          color={getStatusColor(client.clientStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={client.clientPriority.charAt(0).toUpperCase() + client.clientPriority.slice(1)}
                          color={getPriorityColor(client.clientPriority) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {client._count?.stores || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Client">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(client)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Client">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClient(client.id)}
                              color="error"
                            >
                              <DeleteIcon />
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
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Client Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingClient ? 'Edit Client' : 'Add New Client'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Client Code"
                value={formData.clientCode}
                onChange={(e) => setFormData({ ...formData, clientCode: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Client Type</InputLabel>
                <Select
                  value={formData.clientType}
                  label="Client Type"
                  onChange={(e) => setFormData({ ...formData, clientType: e.target.value })}
                >
                  {CLIENT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Client Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Primary Contact Person"
                value={formData.primaryContactPerson}
                onChange={(e) => setFormData({ ...formData, primaryContactPerson: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="GST Number"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Business Size</InputLabel>
                <Select
                  value={formData.businessSize}
                  label="Business Size"
                  onChange={(e) => setFormData({ ...formData, businessSize: e.target.value })}
                >
                  {BUSINESS_SIZES.map((size) => (
                    <MenuItem key={size} value={size}>
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Base Order Rate"
                type="number"
                value={formData.baseOrderRate}
                onChange={(e) => setFormData({ ...formData, baseOrderRate: parseFloat(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Bulk Bonus Enabled</InputLabel>
                <Select
                  value={formData.bulkBonusEnabled.toString()}
                  label="Bulk Bonus Enabled"
                  onChange={(e) => setFormData({ ...formData, bulkBonusEnabled: e.target.value === 'true' })}
                >
                  <MenuItem value="false">Disabled</MenuItem>
                  <MenuItem value="true">Enabled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Weekly Bonus Enabled</InputLabel>
                <Select
                  value={formData.weeklyBonusEnabled.toString()}
                  label="Weekly Bonus Enabled"
                  onChange={(e) => setFormData({ ...formData, weeklyBonusEnabled: e.target.value === 'true' })}
                >
                  <MenuItem value="false">Disabled</MenuItem>
                  <MenuItem value="true">Enabled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.clientStatus}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, clientStatus: e.target.value })}
                >
                  {CLIENT_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.clientPriority}
                  label="Priority"
                  onChange={(e) => setFormData({ ...formData, clientPriority: e.target.value })}
                >
                  {CLIENT_PRIORITIES.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveClient} variant="contained">
            {editingClient ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ClientsPage
