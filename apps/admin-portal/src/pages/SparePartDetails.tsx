import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Skeleton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Store as StoreIcon,
  Category as CategoryIcon,
  Business as SupplierIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useSnackbar } from 'notistack'
import { sparePartsService, inventoryService } from '../services/sparePartsService'

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

const SparePartDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const queryClient = useQueryClient()

  const [tabValue, setTabValue] = useState(0)
  const [adjustStockDialog, setAdjustStockDialog] = useState(false)
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [adjustQuantity, setAdjustQuantity] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  // Fetch spare part details
  const {
    data: sparePartData,
    isLoading: sparePartLoading,
    error: sparePartError,
  } = useQuery(
    ['spare-part', id],
    () => sparePartsService.getById(id!),
    {
      enabled: !!id,
      staleTime: 2 * 60 * 1000,
    }
  )

  // Fetch stock levels for this part
  const {
    data: stockData,
    isLoading: stockLoading,
  } = useQuery(
    ['spare-part-stock', id],
    () => inventoryService.getBySparePartId(id!),
    {
      enabled: !!id,
      staleTime: 2 * 60 * 1000,
    }
  )

  // Stock adjustment mutation
  const adjustStockMutation = useMutation(
    ({ storeId, data }: { storeId: string; data: any }) =>
      inventoryService.updateStock(storeId, id!, data),
    {
      onSuccess: () => {
        enqueueSnackbar('Stock level updated successfully', { variant: 'success' })
        queryClient.invalidateQueries(['spare-part-stock', id])
        setAdjustStockDialog(false)
        setSelectedStock(null)
        setAdjustQuantity('')
        setAdjustReason('')
      },
      onError: (error: any) => {
        enqueueSnackbar(error.response?.data?.message || 'Failed to update stock', {
          variant: 'error',
        })
      },
    }
  )

  const sparePart = sparePartData?.data
  const stockLevels = stockData?.data || []

  const getStockStatus = (currentStock: number, minimumStock: number) => {
    if (currentStock === 0) {
      return { status: 'out-of-stock', color: 'error', label: 'Out of Stock', icon: <ErrorIcon /> }
    } else if (currentStock <= minimumStock) {
      return { status: 'low-stock', color: 'warning', label: 'Low Stock', icon: <WarningIcon /> }
    }
    return { status: 'in-stock', color: 'success', label: 'In Stock', icon: <CheckCircleIcon /> }
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const getTotalStock = () => {
    return stockLevels.reduce((sum: number, level: any) => sum + (level.currentStock || 0), 0)
  }

  const getTotalValue = () => {
    const totalStock = getTotalStock()
    return totalStock * (sparePart?.sellingPrice || sparePart?.costPrice || 0)
  }

  const handleAdjustStock = (stockLevel: any) => {
    setSelectedStock(stockLevel)
    setAdjustQuantity(stockLevel.currentStock.toString())
    setAdjustStockDialog(true)
  }

  const confirmAdjustStock = () => {
    if (selectedStock && adjustQuantity) {
      const quantity = parseInt(adjustQuantity)
      if (!isNaN(quantity)) {
        adjustStockMutation.mutate({
          storeId: selectedStock.storeId,
          data: { quantity, reason: adjustReason },
        })
      }
    }
  }

  if (sparePartError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load spare part details. Please try again.
        </Alert>
      </Box>
    )
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/spare-parts')} size="large">
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Spare Part Details
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/spare-parts/edit/${id}`)}
          >
            Edit Part
          </Button>
        </Box>
      </Box>

      {sparePartLoading ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Skeleton variant="text" height={40} width="60%" />
                <Skeleton variant="text" height={20} width="40%" />
                <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Skeleton variant="text" height={40} width="80%" />
                <Skeleton variant="rectangular" height={150} sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <>
          {/* Basic Information */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={3} mb={3}>
                    <Avatar
                      variant="rounded"
                      sx={{ width: 80, height: 80, bgcolor: 'primary.light' }}
                    >
                      <InventoryIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {sparePart?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Part Number: {sparePart?.partNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Internal Code: {sparePart?.internalCode}
                      </Typography>
                      {sparePart?.oemPartNumber && (
                        <Typography variant="body2" color="text.secondary">
                          OEM Part Number: {sparePart?.oemPartNumber}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <CategoryIcon color="action" />
                        <Typography variant="body2">
                          <strong>Category:</strong> {sparePart?.category?.displayName || sparePart?.category?.name || 'N/A'}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <SupplierIcon color="action" />
                        <Typography variant="body2">
                          <strong>Supplier:</strong> {sparePart?.supplier?.displayName || sparePart?.supplier?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" mb={1}>
                        <strong>Cost Price:</strong> {formatCurrency(sparePart?.costPrice || 0)}
                      </Typography>
                      <Typography variant="body2" mb={1}>
                        <strong>Selling Price:</strong> {formatCurrency(sparePart?.sellingPrice || 0)}
                      </Typography>
                      <Typography variant="body2" mb={1}>
                        <strong>MRP:</strong> {formatCurrency(sparePart?.mrp || 0)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {sparePart?.description && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2">
                        <strong>Description:</strong> {sparePart.description}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              {/* Stock Summary */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Stock Summary
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2">Total Stock:</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {stockLoading ? <Skeleton width={40} /> : getTotalStock()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2">Total Value:</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {stockLoading ? <Skeleton width={60} /> : formatCurrency(getTotalValue())}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Locations:</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {stockLoading ? <Skeleton width={20} /> : stockLevels.length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Technical Details */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Technical Details
                  </Typography>
                  {sparePart?.dimensions && (
                    <Typography variant="body2" mb={1}>
                      <strong>Dimensions:</strong> {sparePart.dimensions}
                    </Typography>
                  )}
                  {sparePart?.weight && (
                    <Typography variant="body2" mb={1}>
                      <strong>Weight:</strong> {sparePart.weight} kg
                    </Typography>
                  )}
                  {sparePart?.material && (
                    <Typography variant="body2" mb={1}>
                      <strong>Material:</strong> {sparePart.material}
                    </Typography>
                  )}
                  {sparePart?.warranty && (
                    <Typography variant="body2" mb={1}>
                      <strong>Warranty:</strong> {sparePart.warranty} months
                    </Typography>
                  )}
                  <Typography variant="body2" mb={1}>
                    <strong>Status:</strong>{' '}
                    <Chip
                      label={sparePart?.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={sparePart?.isActive ? 'success' : 'default'}
                    />
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs for detailed information */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                <Tab label="Stock Levels" />
                <Tab label="Stock Movement" />
                <Tab label="Compatible Models" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              {/* Stock Levels */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Stock Levels by Location</Typography>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Store Location</TableCell>
                      <TableCell>Current Stock</TableCell>
                      <TableCell>Min Threshold</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Updated</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockLoading
                      ? Array.from(new Array(3)).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton /></TableCell>
                            <TableCell><Skeleton /></TableCell>
                            <TableCell><Skeleton /></TableCell>
                            <TableCell><Skeleton /></TableCell>
                            <TableCell><Skeleton /></TableCell>
                            <TableCell><Skeleton /></TableCell>
                          </TableRow>
                        ))
                      : stockLevels.length === 0
                      ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Typography variant="body2" color="text.secondary">
                                No stock information available
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )
                      : stockLevels.map((stock: any) => {
                          const stockStatus = getStockStatus(stock.currentStock, stock.minimumStock)
                          return (
                            <TableRow key={stock.storeId} hover>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <StoreIcon fontSize="small" color="action" />
                                  <Box>
                                    <Typography variant="body2" fontWeight="medium">
                                      {stock.storeName || 'Unknown Store'}
                                    </Typography>
                                    {(stock.rackNumber || stock.shelfNumber || stock.binLocation) && (
                                      <Typography variant="caption" color="text.secondary">
                                        {[stock.rackNumber, stock.shelfNumber, stock.binLocation].filter(Boolean).join(' - ')}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="h6" fontWeight="bold">
                                  {stock.currentStock || 0}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {stock.minimumStock || 0}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={stockStatus.label}
                                  size="small"
                                  color={stockStatus.color as any}
                                  icon={stockStatus.icon}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  {stock.updatedAt ? new Date(stock.updatedAt).toLocaleDateString() : 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<EditIcon />}
                                  onClick={() => handleAdjustStock(stock)}
                                >
                                  Adjust
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Stock Movement History */}
              <Typography variant="h6" gutterBottom>
                Recent Stock Movements
              </Typography>
              <Alert severity="info">
                Stock movement history feature coming soon.
              </Alert>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {/* Compatible Vehicle Models */}
              <Typography variant="h6" gutterBottom>
                Compatible Vehicle Models
              </Typography>
              {sparePart?.compatibility ? (
                <List>
                  {JSON.parse(sparePart.compatibility).map((modelId: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary={`Model ID: ${modelId}`} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No compatibility information available.
                </Alert>
              )}
            </TabPanel>
          </Card>
        </>
      )}

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustStockDialog} onClose={() => setAdjustStockDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Stock Level</DialogTitle>
        <DialogContent>
          {selectedStock && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedStock.storeName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Stock: {selectedStock.currentStock}
              </Typography>
              <TextField
                fullWidth
                label="New Quantity"
                type="number"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Reason for Adjustment"
                multiline
                rows={3}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                margin="normal"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustStockDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmAdjustStock}
            variant="contained"
            disabled={!adjustQuantity || adjustStockMutation.isLoading}
          >
            {adjustStockMutation.isLoading ? 'Adjusting...' : 'Adjust Stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SparePartDetails
