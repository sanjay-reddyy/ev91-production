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
  Switch,
  FormControlLabel,
  Autocomplete,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Store as StoreIcon,
  ElectricCar as ElectricCarIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material'
import { clientStoreService, Store, StoreStats, Client } from '../services/clientStore'

const STORE_TYPES = [
  'supermarket',
  'convenience',
  'restaurant',
  'cafe',
  'pharmacy',
  'electronics',
  'fashion',
  'automotive',
  'hardware',
  'other'
]

const STORE_STATUSES = [
  'active',
  'inactive',
  'maintenance',
  'suspended'
]

const CHARGING_STATION_TYPES = [
  'AC',
  'DC',
  'Both'
]

interface StoreFormData {
  storeCode: string
  clientId: string
  storeName: string
  storeType: string
  storeAddress: string
  city: string
  state: string
  pinCode: string
  latitude: number
  longitude: number
  contactPersonName: string
  contactPersonPhone: string
  contactPersonEmail: string
  deliveryRadius: number
  isEVChargingAvailable: boolean
  chargingStationType: string
  chargingPower: number
  minimumOrderAmount: number
  deliveryFee: number
  commission: number
  storeStatus: string
}

const StoresPage: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<StoreStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [formData, setFormData] = useState<StoreFormData>({
    storeCode: '',
    clientId: '',
    storeName: '',
    storeType: '',
    storeAddress: '',
    city: '',
    state: '',
    pinCode: '',
    latitude: 0,
    longitude: 0,
    contactPersonName: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    deliveryRadius: 5,
    isEVChargingAvailable: false,
    chargingStationType: '',
    chargingPower: 0,
    minimumOrderAmount: 0,
    deliveryFee: 0,
    commission: 0,
    storeStatus: 'active',
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [evFilter, setEvFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const loadStores = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        storeStatus: statusFilter || undefined,
        storeType: typeFilter || undefined,
        clientId: clientFilter || undefined,
        isEVChargingAvailable: evFilter ? evFilter === 'true' : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      }
      
      const response = await clientStoreService.getStores(params)
      if (response.success) {
        setStores(response.data)
        setTotalCount(response.pagination?.totalItems || 0)
      }
    } catch (error) {
      console.error('Error loading stores:', error)
      setSnackbar({ open: true, message: 'Failed to load stores', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, searchTerm, statusFilter, typeFilter, clientFilter, evFilter])

  const loadClients = useCallback(async () => {
    try {
      const response = await clientStoreService.getClients({ limit: 1000 })
      if (response.success) {
        setClients(response.data)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const response = await clientStoreService.getStoreStats()
      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error loading store stats:', error)
    }
  }, [])

  useEffect(() => {
    loadStores()
    loadStats()
    loadClients()
  }, [loadStores, loadStats, loadClients])

  const handleOpenDialog = (store?: Store) => {
    if (store) {
      setEditingStore(store)
      setFormData({
        storeCode: store.storeCode,
        clientId: store.clientId,
        storeName: store.storeName,
        storeType: store.storeType || '',
        storeAddress: store.storeAddress || '',
        city: store.city || '',
        state: store.state || '',
        pinCode: store.pinCode || '',
        latitude: store.latitude || 0,
        longitude: store.longitude || 0,
        contactPersonName: store.contactPersonName || '',
        contactPersonPhone: store.contactPersonPhone || '',
        contactPersonEmail: store.contactPersonEmail || '',
        deliveryRadius: store.deliveryRadius || 5,
        isEVChargingAvailable: store.isEVChargingAvailable,
        chargingStationType: store.chargingStationType || '',
        chargingPower: store.chargingPower || 0,
        minimumOrderAmount: store.minimumOrderAmount || 0,
        deliveryFee: store.deliveryFee || 0,
        commission: store.commission || 0,
        storeStatus: store.storeStatus,
      })
    } else {
      setEditingStore(null)
      setFormData({
        storeCode: '',
        clientId: '',
        storeName: '',
        storeType: '',
        storeAddress: '',
        city: '',
        state: '',
        pinCode: '',
        latitude: 0,
        longitude: 0,
        contactPersonName: '',
        contactPersonPhone: '',
        contactPersonEmail: '',
        deliveryRadius: 5,
        isEVChargingAvailable: false,
        chargingStationType: '',
        chargingPower: 0,
        minimumOrderAmount: 0,
        deliveryFee: 0,
        commission: 0,
        storeStatus: 'active',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingStore(null)
  }

  const handleSaveStore = async () => {
    try {
      if (editingStore) {
        await clientStoreService.updateStore(editingStore.id, formData)
        setSnackbar({ open: true, message: 'Store updated successfully', severity: 'success' })
      } else {
        await clientStoreService.createStore(formData)
        setSnackbar({ open: true, message: 'Store created successfully', severity: 'success' })
      }
      handleCloseDialog()
      loadStores()
      loadStats()
    } catch (error) {
      console.error('Error saving store:', error)
      setSnackbar({ open: true, message: 'Failed to save store', severity: 'error' })
    }
  }

  const handleDeleteStore = async (storeId: string) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return
    
    try {
      await clientStoreService.deleteStore(storeId)
      setSnackbar({ open: true, message: 'Store deleted successfully', severity: 'success' })
      loadStores()
      loadStats()
    } catch (error) {
      console.error('Error deleting store:', error)
      setSnackbar({ open: true, message: 'Failed to delete store', severity: 'error' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'default'
      case 'maintenance': return 'warning'
      case 'suspended': return 'error'
      default: return 'default'
    }
  }

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client ? client.name : 'Unknown Client'
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Store Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { loadStores(); loadStats() }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Store
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
                      Total Stores
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalStores}
                    </Typography>
                  </Box>
                  <StoreIcon color="primary" sx={{ fontSize: 40 }} />
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
                      Active Stores
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {stats.activeStores}
                    </Typography>
                  </Box>
                  <LocationIcon color="success" sx={{ fontSize: 40 }} />
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
                      EV Charging Stores
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {stats.evChargingStores}
                    </Typography>
                  </Box>
                  <ElectricCarIcon color="info" sx={{ fontSize: 40 }} />
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
                      EV Charging Rate
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {stats.totalStores > 0 ? Math.round((stats.evChargingStores / stats.totalStores) * 100) : 0}%
                    </Typography>
                  </Box>
                  <ElectricCarIcon color="warning" sx={{ fontSize: 40 }} />
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
                label="Search stores"
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
                  {STORE_STATUSES.map((status) => (
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
                  {STORE_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Client</InputLabel>
                <Select
                  value={clientFilter}
                  label="Client"
                  onChange={(e) => setClientFilter(e.target.value)}
                >
                  <MenuItem value="">All Clients</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>EV Charging</InputLabel>
                <Select
                  value={evFilter}
                  label="EV Charging"
                  onChange={(e) => setEvFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                  setTypeFilter('')
                  setClientFilter('')
                  setEvFilter('')
                  setPage(0)
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stores Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Store Code</TableCell>
                  <TableCell>Store Name</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>EV Charging</TableCell>
                  <TableCell>Status</TableCell>
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
                ) : stores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                      No stores found
                    </TableCell>
                  </TableRow>
                ) : (
                  stores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell>{store.storeCode}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {store.storeName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getClientName(store.clientId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {store.storeType && (
                          <Chip
                            label={store.storeType.charAt(0).toUpperCase() + store.storeType.slice(1)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          {store.city && store.state ? (
                            <Typography variant="body2">
                              {store.city}, {store.state}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              Not specified
                            </Typography>
                          )}
                          {store.pinCode && (
                            <Typography variant="caption" color="textSecondary">
                              {store.pinCode}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {store.contactPersonName && (
                            <Typography variant="body2">{store.contactPersonName}</Typography>
                          )}
                          {store.contactPersonPhone && (
                            <Typography variant="caption" color="textSecondary">
                              {store.contactPersonPhone}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={store.isEVChargingAvailable ? 'Yes' : 'No'}
                            color={store.isEVChargingAvailable ? 'success' : 'default'}
                            size="small"
                          />
                          {store.isEVChargingAvailable && (
                            <ElectricCarIcon color="primary" fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={store.storeStatus.charAt(0).toUpperCase() + store.storeStatus.slice(1)}
                          color={getStatusColor(store.storeStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Store">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(store)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Store">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteStore(store.id)}
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

      {/* Add/Edit Store Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStore ? 'Edit Store' : 'Add New Store'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Store Code"
                value={formData.storeCode}
                onChange={(e) => setFormData({ ...formData, storeCode: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={clients}
                getOptionLabel={(client) => client.name}
                value={clients.find(c => c.id === formData.clientId) || null}
                onChange={(_, client) => setFormData({ ...formData, clientId: client?.id || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Client" required />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Store Name"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Store Type</InputLabel>
                <Select
                  value={formData.storeType}
                  label="Store Type"
                  onChange={(e) => setFormData({ ...formData, storeType: e.target.value })}
                >
                  {STORE_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.storeStatus}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, storeStatus: e.target.value })}
                >
                  {STORE_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Store Address"
                value={formData.storeAddress}
                onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Pin Code"
                value={formData.pinCode}
                onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person Name"
                value={formData.contactPersonName}
                onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person Phone"
                value={formData.contactPersonPhone}
                onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Person Email"
                type="email"
                value={formData.contactPersonEmail}
                onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery Radius (km)"
                type="number"
                value={formData.deliveryRadius}
                onChange={(e) => setFormData({ ...formData, deliveryRadius: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Minimum Order Amount"
                type="number"
                value={formData.minimumOrderAmount}
                onChange={(e) => setFormData({ ...formData, minimumOrderAmount: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery Fee"
                type="number"
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Commission (%)"
                type="number"
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isEVChargingAvailable}
                    onChange={(e) => setFormData({ ...formData, isEVChargingAvailable: e.target.checked })}
                  />
                }
                label="EV Charging Available"
              />
            </Grid>
            {formData.isEVChargingAvailable && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Charging Station Type</InputLabel>
                    <Select
                      value={formData.chargingStationType}
                      label="Charging Station Type"
                      onChange={(e) => setFormData({ ...formData, chargingStationType: e.target.value })}
                    >
                      {CHARGING_STATION_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Charging Power (kW)"
                    type="number"
                    value={formData.chargingPower}
                    onChange={(e) => setFormData({ ...formData, chargingPower: parseFloat(e.target.value) || 0 })}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveStore} variant="contained">
            {editingStore ? 'Update' : 'Create'}
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

export default StoresPage
