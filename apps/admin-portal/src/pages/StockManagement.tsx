import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Alert,
  Skeleton,
  Badge,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Inventory as InventoryIcon,
  Store as StoreIcon,
  SwapHoriz as TransferIcon,
  History as HistoryIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useSnackbar } from 'notistack'
import { inventoryService, type InventoryLevel } from '../services/sparePartsService'
import AddStockForm from '../components/spare-parts/AddStockForm'

const StockManagement: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar()
  const queryClient = useQueryClient()

  // State management
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryLevel | null>(null)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [adjustQuantity, setAdjustQuantity] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false)

  // Fetch inventory data
  const {
    data: inventoryData,
    isLoading,
    error,
  } = useQuery(
    ['inventory', page, rowsPerPage, searchTerm, storeFilter, lowStockOnly],
    () =>
      inventoryService.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        storeId: storeFilter || undefined,
        lowStock: lowStockOnly || undefined,
      }),
    {
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  // Stock adjustment mutation
  const adjustStockMutation = useMutation(
    ({ storeId, sparePartId, data }: { storeId: string; sparePartId: string; data: any }) =>
      inventoryService.updateStock(storeId, sparePartId, data),
    {
      onSuccess: () => {
        enqueueSnackbar('Stock level updated successfully', { variant: 'success' })
        queryClient.invalidateQueries(['inventory'])
        setAdjustDialogOpen(false)
        setSelectedItem(null)
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

  // Event handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setPage(0)
  }

  const handleStoreFilterChange = (event: any) => {
    setStoreFilter(event.target.value)
    setPage(0)
  }

  const handleLowStockToggle = () => {
    setLowStockOnly(!lowStockOnly)
    setPage(0)
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: InventoryLevel) => {
    setAnchorEl(event.currentTarget)
    setSelectedItem(item)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedItem(null)
  }

  const handleAdjustStock = () => {
    setAdjustDialogOpen(true)
    handleMenuClose()
  }

  const confirmAdjustStock = () => {
    if (selectedItem && adjustQuantity) {
      const quantity = parseInt(adjustQuantity)
      if (!isNaN(quantity)) {
        adjustStockMutation.mutate({
          storeId: selectedItem.storeId,
          sparePartId: selectedItem.sparePartId,
          data: { quantity },
        })
      }
    }
  }

  const getStockStatus = (item: InventoryLevel) => {
    const { currentStock, minimumStock } = item
    if (currentStock === 0) {
      return { status: 'out-of-stock', color: 'error', label: 'Out of Stock', icon: <ErrorIcon /> }
    } else if (currentStock <= minimumStock) {
      return { status: 'low-stock', color: 'warning', label: 'Low Stock', icon: <WarningIcon /> }
    }
    return { status: 'in-stock', color: 'success', label: 'In Stock', icon: <CheckCircleIcon /> }
  }

  // Format as INR with ₹ symbol
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  // Summary statistics
  const stats = inventoryData
    ? {
        totalItems: inventoryData.data?.pagination?.totalItems || 0,
        totalValue: inventoryData.data?.stockLevels?.reduce((sum: number, item: InventoryLevel) =>
          sum + (item.currentStock * (item.sparePart?.sellingPrice || item.sparePart?.costPrice || 0)), 0) || 0,
        lowStockItems: inventoryData.data?.stockLevels?.filter((item: InventoryLevel) =>
          item.currentStock <= item.minimumStock).length || 0,
        outOfStockItems: inventoryData.data?.stockLevels?.filter((item: InventoryLevel) =>
          item.currentStock === 0).length || 0,
      }
    : { totalItems: 0, totalValue: 0, lowStockItems: 0, outOfStockItems: 0 }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load inventory data. Please try again.
        </Alert>
      </Box>
    )
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Stock Management
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<TransferIcon />}
            onClick={() => {/* Navigate to transfer */}}
          >
            Transfer Stock
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddStockDialogOpen(true)}
          >
            Add Stock
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Items
                  </Typography>
                  <Typography variant="h4">
                    {isLoading ? <Skeleton width={60} /> : stats.totalItems.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <InventoryIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Value
                  </Typography>
                  <Typography variant="h4">
                    {isLoading ? <Skeleton width={80} /> : formatCurrency(stats.totalValue)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Low Stock Items
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {isLoading ? <Skeleton width={40} /> : stats.lowStockItems}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <WarningIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Out of Stock
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {isLoading ? <Skeleton width={40} /> : stats.outOfStockItems}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <ErrorIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search parts or stores..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Store</InputLabel>
                <Select
                  value={storeFilter}
                  onChange={handleStoreFilterChange}
                  input={<OutlinedInput label="Store" />}
                >
                  <MenuItem value="">All Stores</MenuItem>
                  <MenuItem value="main-warehouse">Main Warehouse</MenuItem>
                  <MenuItem value="service-center-1">Service Center 1</MenuItem>
                  <MenuItem value="service-center-2">Service Center 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant={lowStockOnly ? 'contained' : 'outlined'}
                color="warning"
                startIcon={<WarningIcon />}
                onClick={handleLowStockToggle}
              >
                {lowStockOnly ? 'Show All' : 'Low Stock Only'}
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setSearchTerm('')
                  setStoreFilter('')
                  setLowStockOnly(false)
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Part Details</TableCell>
                  <TableCell>Store Location</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Min Threshold</TableCell>
                  <TableCell>Stock Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading
                  ? Array.from(new Array(rowsPerPage)).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Skeleton variant="rectangular" width={40} height={40} />
                            <Box>
                              <Skeleton width={120} />
                              <Skeleton width={80} />
                            </Box>
                          </Box>
                        </TableCell>
                        {Array.from(new Array(6)).map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton width={80} />
                          </TableCell>
                        ))}
                        <TableCell>
                          <Skeleton variant="circular" width={32} height={32} />
                        </TableCell>
                      </TableRow>
                    ))
                  : inventoryData?.data?.stockLevels?.map((item: InventoryLevel) => {
                      const stockStatus = getStockStatus(item)
                      const stockValue = item.currentStock * (item.sparePart?.sellingPrice || item.sparePart?.costPrice || 0)
                      return (
                        <TableRow key={`${item.storeId}-${item.sparePartId}`} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar
                                variant="rounded"
                                src={item.sparePart?.imageUrls ? JSON.parse(item.sparePart.imageUrls)?.[0] : undefined}
                                sx={{ width: 40, height: 40 }}
                              >
                                <InventoryIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight="medium">
                                  {item.sparePart?.name || 'Unknown Part'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {item.sparePart?.partNumber || 'N/A'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <StoreIcon fontSize="small" color="action" />
                              <Box>
                                <Typography variant="body2">
                                  {item.storeName || 'Unknown Store'}
                                </Typography>
                                {(item.rackNumber || item.shelfNumber || item.binLocation) && (
                                  <Typography variant="caption" color="textSecondary">
                                    {[item.rackNumber, item.shelfNumber, item.binLocation].filter(Boolean).join(' - ')}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Badge
                              badgeContent={
                                item.currentStock <= item.minimumStock ? (
                                  <WarningIcon fontSize="small" />
                                ) : null
                              }
                              color="warning"
                            >
                              <Typography variant="h6" fontWeight="bold">
                                {item.currentStock || 0}
                              </Typography>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.minimumStock || 0}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(stockValue)}
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
                            <Typography variant="caption" color="textSecondary">
                              {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={(event) => handleMenuOpen(event, item)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )
                    }) || []}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={inventoryData?.data.pagination.totalItems || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 160 },
        }}
      >
        <MenuItem onClick={handleAdjustStock}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Adjust Stock
        </MenuItem>
        <MenuItem onClick={() => {/* View movements */}}>
          <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
          View History
        </MenuItem>
        <MenuItem onClick={() => {/* Transfer stock */}}>
          <TransferIcon fontSize="small" sx={{ mr: 1 }} />
          Transfer
        </MenuItem>
      </Menu>

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onClose={() => setAdjustDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Stock Level</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedItem.sparePart?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Current Stock: {selectedItem.currentStock}
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
          <Button onClick={() => setAdjustDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmAdjustStock}
            variant="contained"
            disabled={!adjustQuantity || adjustStockMutation.isLoading}
          >
            {adjustStockMutation.isLoading ? 'Adjusting...' : 'Adjust Stock'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Stock Dialog */}
      <AddStockForm
        open={addStockDialogOpen}
        onClose={() => setAddStockDialogOpen(false)}
      />
    </Box>
  )
}

export default StockManagement
