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
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  TwoWheeler as TwoWheelerIcon,
  AttachMoney as AttachMoneyIcon,
  Payment as PaymentIcon,
  DateRange as DateRangeIcon,
  Download as DownloadIcon,
} from '@mui/icons-material'
import { clientStoreService, RiderEarning, Store } from '../services/clientStore'

const PAYMENT_STATUSES = [
  'pending',
  'processing',
  'paid',
  'failed',
  'cancelled'
]

interface RiderEarningFormData {
  riderId: string
  clientRiderId?: string
  clientId: string
  storeId: string
  orderId: string
  baseRate: number
  storeOfferRate: number
  bulkOrderBonus: number
  performanceBonus: number
  weeklyTargetBonus: number
  specialEventBonus: number
  finalEarning: number
  paymentStatus: string
  orderDate: string
  deliveryTime?: number
  distance?: number
  riderRating?: number
}

const RiderEarningsPage: React.FC = () => {
  const [earnings, setEarnings] = useState<RiderEarning[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingEarning, setEditingEarning] = useState<RiderEarning | null>(null)
  const [formData, setFormData] = React.useState<RiderEarningFormData>({
    riderId: '',
    clientRiderId: '',
    clientId: '',
    storeId: '',
    orderId: '',
    baseRate: 35,
    storeOfferRate: 0,
    bulkOrderBonus: 0,
    performanceBonus: 0,
    weeklyTargetBonus: 0,
    specialEventBonus: 0,
    finalEarning: 0,
    paymentStatus: 'pending',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryTime: 0,
    distance: 0,
    riderRating: 0,
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [clientRiderIdFilter, setClientRiderIdFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const loadEarnings = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        riderId: searchTerm || undefined,
        clientRiderId: clientRiderIdFilter || undefined,
        paymentStatus: statusFilter || undefined,
        storeId: storeFilter || undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined,
        sortBy: 'orderDate',
        sortOrder: 'desc' as const,
      }

      const response = await clientStoreService.getRiderEarnings(params)
      if (response.success) {
        setEarnings(response.data)
        setTotalCount(response.pagination?.totalItems || 0)
      }
    } catch (error) {
      console.error('Error loading rider earnings:', error)
      setSnackbar({ open: true, message: 'Failed to load rider earnings', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, searchTerm, clientRiderIdFilter, statusFilter, storeFilter, dateFromFilter, dateToFilter])

  const loadStores = useCallback(async () => {
    try {
      const response = await clientStoreService.getStores({ limit: 1000 })
      if (response.success) {
        setStores(response.data)
      }
    } catch (error) {
      console.error('Error loading stores:', error)
    }
  }, [])

  useEffect(() => {
    loadEarnings()
    loadStores()
  }, [loadEarnings, loadStores])

  // Calculate total earning when other fields change
  useEffect(() => {
    const total = (
      formData.baseRate +
      formData.storeOfferRate +
      formData.bulkOrderBonus +
      formData.performanceBonus +
      formData.weeklyTargetBonus +
      formData.specialEventBonus
    )

    // Only update if the calculated value is different to avoid infinite loop
    if (formData.finalEarning !== total) {
      setFormData(prev => ({ ...prev, finalEarning: Math.max(0, total) }))
    }
  }, [
    formData.baseRate,
    formData.storeOfferRate,
    formData.bulkOrderBonus,
    formData.performanceBonus,
    formData.weeklyTargetBonus,
    formData.specialEventBonus,
    formData.finalEarning // Add this to check current value
  ])

  const handleOpenDialog = (earning?: RiderEarning) => {
    if (earning) {
      setEditingEarning(earning)
      setFormData({
        riderId: earning.riderId,
        clientRiderId: earning.clientRiderId || '',
        clientId: earning.clientId,
        storeId: earning.storeId,
        orderId: earning.orderId || '',
        baseRate: earning.baseRate || 35,
        storeOfferRate: earning.storeOfferRate || 0,
        bulkOrderBonus: earning.bulkOrderBonus || 0,
        performanceBonus: earning.performanceBonus || 0,
        weeklyTargetBonus: earning.weeklyTargetBonus || 0,
        specialEventBonus: earning.specialEventBonus || 0,
        finalEarning: earning.finalEarning || 0,
        paymentStatus: earning.paymentStatus,
        orderDate: earning.orderDate.split('T')[0],
        deliveryTime: earning.deliveryTime || 0,
        distance: earning.distance || 0,
        riderRating: earning.riderRating || 0,
      })
    } else {
      setEditingEarning(null)
      setFormData({
        riderId: '',
        clientRiderId: '',
        clientId: '',
        storeId: '',
        orderId: '',
        baseRate: 35,
        storeOfferRate: 0,
        bulkOrderBonus: 0,
        performanceBonus: 0,
        weeklyTargetBonus: 0,
        specialEventBonus: 0,
        finalEarning: 0,
        paymentStatus: 'pending',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryTime: 0,
        distance: 0,
        riderRating: 0,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingEarning(null)
  }

  const handleSaveEarning = async () => {
    // Prevent double submission
    if (saving) return

    try {
      setSaving(true)

      // Validate required fields
      if (!formData.riderId || !formData.storeId || !formData.orderId) {
        setSnackbar({ open: true, message: 'Rider ID, Store, and Order ID are required', severity: 'error' })
        return
      }

      if (!formData.clientId) {
        setSnackbar({ open: true, message: 'Please select a store first to set the client', severity: 'error' })
        return
      }

      // Calculate totalRate (base + offer)
      const totalRate = formData.baseRate + formData.storeOfferRate

      const earningData = {
        ...formData,
        totalRate, // Add the calculated totalRate
        orderDate: new Date(formData.orderDate).toISOString(),
      }

      console.log('Submitting earning data:', earningData)
      console.log('Is editing?', !!editingEarning, 'ID:', editingEarning?.id)

      if (editingEarning) {
        console.log('Updating existing earning:', editingEarning.id)
        await clientStoreService.updateRiderEarning(editingEarning.id, earningData)
        setSnackbar({ open: true, message: 'Rider earning updated successfully', severity: 'success' })
      } else {
        console.log('Creating new earning')
        await clientStoreService.createRiderEarning(earningData)
        setSnackbar({ open: true, message: 'Rider earning created successfully', severity: 'success' })
      }
      handleCloseDialog()
      loadEarnings()
    } catch (error: any) {
      console.error('Error saving rider earning:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save rider earning'
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEarning = async (earningId: string) => {
    if (!window.confirm('Are you sure you want to delete this rider earning record?')) return

    try {
      await clientStoreService.deleteRiderEarning(earningId)
      setSnackbar({ open: true, message: 'Rider earning deleted successfully', severity: 'success' })
      loadEarnings()
    } catch (error) {
      console.error('Error deleting rider earning:', error)
      setSnackbar({ open: true, message: 'Failed to delete rider earning', severity: 'error' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success'
      case 'pending': return 'warning'
      case 'processing': return 'info'
      case 'failed': return 'error'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const getStoreName = (storeId: string) => {
    const store = stores.find(s => s.id === storeId)
    return store ? store.storeName : 'Unknown Store'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const totalEarnings = earnings.reduce((sum, earning) => sum + (earning.finalEarning || 0), 0)
  const pendingEarnings = earnings.filter(e => e.paymentStatus === 'pending').reduce((sum, earning) => sum + (earning.finalEarning || 0), 0)
  const paidEarnings = earnings.filter(e => e.paymentStatus === 'paid').reduce((sum, earning) => sum + (earning.finalEarning || 0), 0)

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Rider Earnings Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setSnackbar({ open: true, message: 'Export feature coming soon', severity: 'info' })}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadEarnings}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Earning
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Earnings
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(totalEarnings)}
                  </Typography>
                </Box>
                <AttachMoneyIcon color="primary" sx={{ fontSize: 40 }} />
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
                    Paid Earnings
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(paidEarnings)}
                  </Typography>
                </Box>
                <PaymentIcon color="success" sx={{ fontSize: 40 }} />
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
                    Pending Earnings
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {formatCurrency(pendingEarnings)}
                  </Typography>
                </Box>
                <TwoWheelerIcon color="warning" sx={{ fontSize: 40 }} />
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
                    Total Records
                  </Typography>
                  <Typography variant="h6" color="info.main">
                    {totalCount}
                  </Typography>
                </Box>
                <DateRangeIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Rider ID"
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
              <TextField
                fullWidth
                label="Client Rider ID"
                value={clientRiderIdFilter}
                onChange={(e) => setClientRiderIdFilter(e.target.value)}
                placeholder="e.g., SWIG-DEL-001"
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
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Payment Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {PAYMENT_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Store</InputLabel>
                <Select
                  value={storeFilter}
                  label="Store"
                  onChange={(e) => setStoreFilter(e.target.value)}
                >
                  <MenuItem value="">All Stores</MenuItem>
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.storeName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1.5}>
              <TextField
                fullWidth
                label="Date From"
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={1.5}>
              <TextField
                fullWidth
                label="Date To"
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('')
                  setClientRiderIdFilter('')
                  setStatusFilter('')
                  setStoreFilter('')
                  setDateFromFilter('')
                  setDateToFilter('')
                  setPage(0)
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Earnings Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rider ID</TableCell>
                  <TableCell>Client Rider ID</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Store</TableCell>
                  <TableCell>Order Date</TableCell>
                  <TableCell>Base Earning</TableCell>
                  <TableCell>Bonuses</TableCell>
                  <TableCell>Penalties</TableCell>
                  <TableCell>Total Earning</TableCell>
                  <TableCell>Payment Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : earnings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} sx={{ textAlign: 'center', py: 4 }}>
                      No rider earnings found
                    </TableCell>
                  </TableRow>
                ) : (
                  earnings.map((earning) => (
                    <TableRow key={earning.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {earning.riderId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {earning.clientRiderId ? (
                          <Chip
                            label={earning.clientRiderId}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {earning.client ? (
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {earning.client.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {earning.client.clientCode}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {earning.orderId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getStoreName(earning.storeId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(earning.orderDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatCurrency(earning.baseRate || 0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          +{formatCurrency(earning.storeOfferRate || 0)} offer
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" color="success.main">
                            +{formatCurrency(
                              (earning.bulkOrderBonus || 0) +
                              (earning.performanceBonus || 0) +
                              (earning.weeklyTargetBonus || 0) +
                              (earning.specialEventBonus || 0)
                            )}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(earning.finalEarning || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={earning.paymentStatus.charAt(0).toUpperCase() + earning.paymentStatus.slice(1)}
                          color={getStatusColor(earning.paymentStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Earning">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(earning)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Earning">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteEarning(earning.id)}
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

      {/* Add/Edit Earning Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingEarning ? 'Edit Rider Earning' : 'Add New Rider Earning'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Rider ID"
                value={formData.riderId}
                onChange={(e) => setFormData({ ...formData, riderId: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Client Rider ID"
                value={formData.clientRiderId || ''}
                onChange={(e) => setFormData({ ...formData, clientRiderId: e.target.value })}
                placeholder="e.g., SWIG-DEL-001"
                helperText="Optional: Client's unique rider ID"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Store</InputLabel>
                <Select
                  value={formData.storeId}
                  label="Store"
                  onChange={(e) => {
                    const selectedStoreId = e.target.value
                    const selectedStore = stores.find(s => s.id === selectedStoreId)
                    setFormData({
                      ...formData,
                      storeId: selectedStoreId,
                      clientId: selectedStore?.clientId || ''
                    })
                  }}
                >
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.storeName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Order ID"
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="textSecondary">Order Details</Typography>
              </Divider>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Order Date"
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={formData.paymentStatus}
                  label="Payment Status"
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="textSecondary">Earnings Breakdown</Typography>
              </Divider>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Base Rate"
                type="number"
                value={formData.baseRate}
                onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Base Rate"
                type="number"
                value={formData.baseRate}
                onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                required
                helperText="Base rate from client"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Store Offer Rate"
                type="number"
                value={formData.storeOfferRate}
                onChange={(e) => setFormData({ ...formData, storeOfferRate: parseFloat(e.target.value) || 0 })}
                helperText="Additional rate from store offer"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Bulk Order Bonus"
                type="number"
                value={formData.bulkOrderBonus}
                onChange={(e) => setFormData({ ...formData, bulkOrderBonus: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Performance Bonus"
                type="number"
                value={formData.performanceBonus}
                onChange={(e) => setFormData({ ...formData, performanceBonus: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Weekly Target Bonus"
                type="number"
                value={formData.weeklyTargetBonus}
                onChange={(e) => setFormData({ ...formData, weeklyTargetBonus: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Special Event Bonus"
                type="number"
                value={formData.specialEventBonus}
                onChange={(e) => setFormData({ ...formData, specialEventBonus: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Final Earning"
                type="number"
                value={formData.finalEarning}
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-input': { fontWeight: 'bold', fontSize: '1.1rem' } }}
                helperText="Auto-calculated: Base + Offer + All Bonuses"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="textSecondary">Delivery Details</Typography>
              </Divider>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Delivery Time (minutes)"
                type="number"
                value={formData.deliveryTime}
                onChange={(e) => setFormData({ ...formData, deliveryTime: parseInt(e.target.value) || 0 })}
                helperText="Time taken for delivery"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Distance (km)"
                type="number"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: parseFloat(e.target.value) || 0 })}
                helperText="Delivery distance"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Rider Rating"
                type="number"
                inputProps={{ min: 0, max: 5, step: 0.1 }}
                value={formData.riderRating || ''}
                onChange={(e) => setFormData({ ...formData, riderRating: parseFloat(e.target.value) || undefined })}
                helperText="Customer rating (1-5)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
          <Button onClick={handleSaveEarning} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : (editingEarning ? 'Update' : 'Create')}
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

export default RiderEarningsPage
