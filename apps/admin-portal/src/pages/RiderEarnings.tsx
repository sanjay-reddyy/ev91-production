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
  storeId: string
  orderId: string
  orderValue: number
  baseRate: number
  baseEarning: number
  distanceBonus: number
  timeBonus: number
  storeOfferBonus: number
  evBonus: number
  peakTimeBonus: number
  qualityBonus: number
  penaltyAmount: number
  bonusEarning: number
  totalEarning: number
  paymentStatus: string
  orderDate: string
  deliveryStartTime: string
  deliveryEndTime: string
  distanceTraveled: number
  fuelUsed: number
  energyUsed: number
  notes: string
}

const RiderEarningsPage: React.FC = () => {
  const [earnings, setEarnings] = useState<RiderEarning[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingEarning, setEditingEarning] = useState<RiderEarning | null>(null)
  const [formData, setFormData] = useState<RiderEarningFormData>({
    riderId: '',
    storeId: '',
    orderId: '',
    orderValue: 0,
    baseRate: 0,
    baseEarning: 0,
    distanceBonus: 0,
    timeBonus: 0,
    storeOfferBonus: 0,
    evBonus: 0,
    peakTimeBonus: 0,
    qualityBonus: 0,
    penaltyAmount: 0,
    bonusEarning: 0,
    totalEarning: 0,
    paymentStatus: 'pending',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryStartTime: '',
    deliveryEndTime: '',
    distanceTraveled: 0,
    fuelUsed: 0,
    energyUsed: 0,
    notes: '',
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
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
  }, [page, rowsPerPage, searchTerm, statusFilter, storeFilter, dateFromFilter, dateToFilter])

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
      formData.baseEarning +
      formData.distanceBonus +
      formData.timeBonus +
      formData.storeOfferBonus +
      formData.evBonus +
      formData.peakTimeBonus +
      formData.qualityBonus +
      formData.bonusEarning -
      formData.penaltyAmount
    )
    setFormData(prev => ({ ...prev, totalEarning: Math.max(0, total) }))
  }, [
    formData.baseEarning,
    formData.distanceBonus,
    formData.timeBonus,
    formData.storeOfferBonus,
    formData.evBonus,
    formData.peakTimeBonus,
    formData.qualityBonus,
    formData.bonusEarning,
    formData.penaltyAmount
  ])

  const handleOpenDialog = (earning?: RiderEarning) => {
    if (earning) {
      setEditingEarning(earning)
      setFormData({
        riderId: earning.riderId,
        storeId: earning.storeId,
        orderId: earning.orderId,
        orderValue: earning.orderValue || 0,
        baseRate: earning.baseRate || 0,
        baseEarning: earning.baseEarning,
        distanceBonus: earning.distanceBonus,
        timeBonus: earning.timeBonus,
        storeOfferBonus: earning.storeOfferBonus,
        evBonus: earning.evBonus,
        peakTimeBonus: earning.peakTimeBonus,
        qualityBonus: earning.qualityBonus,
        penaltyAmount: earning.penaltyAmount,
        bonusEarning: earning.bonusEarning,
        totalEarning: earning.totalEarning,
        paymentStatus: earning.paymentStatus,
        orderDate: earning.orderDate.split('T')[0],
        deliveryStartTime: earning.deliveryStartTime || '',
        deliveryEndTime: earning.deliveryEndTime || '',
        distanceTraveled: earning.distanceTraveled || 0,
        fuelUsed: earning.fuelUsed || 0,
        energyUsed: earning.energyUsed || 0,
        notes: earning.notes || '',
      })
    } else {
      setEditingEarning(null)
      setFormData({
        riderId: '',
        storeId: '',
        orderId: '',
        orderValue: 0,
        baseRate: 0,
        baseEarning: 0,
        distanceBonus: 0,
        timeBonus: 0,
        storeOfferBonus: 0,
        evBonus: 0,
        peakTimeBonus: 0,
        qualityBonus: 0,
        penaltyAmount: 0,
        bonusEarning: 0,
        totalEarning: 0,
        paymentStatus: 'pending',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryStartTime: '',
        deliveryEndTime: '',
        distanceTraveled: 0,
        fuelUsed: 0,
        energyUsed: 0,
        notes: '',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingEarning(null)
  }

  const handleSaveEarning = async () => {
    try {
      const earningData = {
        ...formData,
        orderDate: new Date(formData.orderDate).toISOString(),
        deliveryStartTime: formData.deliveryStartTime ? new Date(formData.deliveryStartTime).toISOString() : undefined,
        deliveryEndTime: formData.deliveryEndTime ? new Date(formData.deliveryEndTime).toISOString() : undefined,
      }

      if (editingEarning) {
        await clientStoreService.updateRiderEarning(editingEarning.id, earningData)
        setSnackbar({ open: true, message: 'Rider earning updated successfully', severity: 'success' })
      } else {
        await clientStoreService.createRiderEarning(earningData)
        setSnackbar({ open: true, message: 'Rider earning created successfully', severity: 'success' })
      }
      handleCloseDialog()
      loadEarnings()
    } catch (error) {
      console.error('Error saving rider earning:', error)
      setSnackbar({ open: true, message: 'Failed to save rider earning', severity: 'error' })
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

  const totalEarnings = earnings.reduce((sum, earning) => sum + earning.totalEarning, 0)
  const pendingEarnings = earnings.filter(e => e.paymentStatus === 'pending').reduce((sum, earning) => sum + earning.totalEarning, 0)
  const paidEarnings = earnings.filter(e => e.paymentStatus === 'paid').reduce((sum, earning) => sum + earning.totalEarning, 0)

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
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Date From"
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Date To"
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                  setStoreFilter('')
                  setDateFromFilter('')
                  setDateToFilter('')
                  setPage(0)
                }}
              >
                Clear Filters
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
                    <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : earnings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4 }}>
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
                          {formatCurrency(earning.baseEarning)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" color="success.main">
                            +{formatCurrency(
                              earning.distanceBonus +
                              earning.timeBonus +
                              earning.storeOfferBonus +
                              earning.evBonus +
                              earning.peakTimeBonus +
                              earning.qualityBonus +
                              earning.bonusEarning
                            )}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="error.main">
                          -{formatCurrency(earning.penaltyAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(earning.totalEarning)}
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
              <FormControl fullWidth required>
                <InputLabel>Store</InputLabel>
                <Select
                  value={formData.storeId}
                  label="Store"
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
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
                label="Order Value"
                type="number"
                value={formData.orderValue}
                onChange={(e) => setFormData({ ...formData, orderValue: parseFloat(e.target.value) || 0 })}
              />
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
                label="Base Earning"
                type="number"
                value={formData.baseEarning}
                onChange={(e) => setFormData({ ...formData, baseEarning: parseFloat(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Distance Bonus"
                type="number"
                value={formData.distanceBonus}
                onChange={(e) => setFormData({ ...formData, distanceBonus: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Time Bonus"
                type="number"
                value={formData.timeBonus}
                onChange={(e) => setFormData({ ...formData, timeBonus: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Store Offer Bonus"
                type="number"
                value={formData.storeOfferBonus}
                onChange={(e) => setFormData({ ...formData, storeOfferBonus: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="EV Bonus"
                type="number"
                value={formData.evBonus}
                onChange={(e) => setFormData({ ...formData, evBonus: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Peak Time Bonus"
                type="number"
                value={formData.peakTimeBonus}
                onChange={(e) => setFormData({ ...formData, peakTimeBonus: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Quality Bonus"
                type="number"
                value={formData.qualityBonus}
                onChange={(e) => setFormData({ ...formData, qualityBonus: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Additional Bonus"
                type="number"
                value={formData.bonusEarning}
                onChange={(e) => setFormData({ ...formData, bonusEarning: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Penalty Amount"
                type="number"
                value={formData.penaltyAmount}
                onChange={(e) => setFormData({ ...formData, penaltyAmount: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Earning"
                type="number"
                value={formData.totalEarning}
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-input': { fontWeight: 'bold' } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="textSecondary">Delivery Details</Typography>
              </Divider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery Start Time"
                type="datetime-local"
                value={formData.deliveryStartTime}
                onChange={(e) => setFormData({ ...formData, deliveryStartTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery End Time"
                type="datetime-local"
                value={formData.deliveryEndTime}
                onChange={(e) => setFormData({ ...formData, deliveryEndTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Distance Traveled (km)"
                type="number"
                value={formData.distanceTraveled}
                onChange={(e) => setFormData({ ...formData, distanceTraveled: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fuel Used (L)"
                type="number"
                value={formData.fuelUsed}
                onChange={(e) => setFormData({ ...formData, fuelUsed: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Energy Used (kWh)"
                type="number"
                value={formData.energyUsed}
                onChange={(e) => setFormData({ ...formData, energyUsed: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveEarning} variant="contained">
            {editingEarning ? 'Update' : 'Create'}
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
