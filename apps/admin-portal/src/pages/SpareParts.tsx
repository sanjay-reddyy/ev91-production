import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  FormControl,
  InputLabel,
  Select,
  Alert,
  Skeleton,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { sparePartsService } from '../services/sparePartsService'

// Define interfaces matching backend response
interface Category {
  id: string
  name: string
  displayName: string
  code: string
}

interface Supplier {
  id: string
  name: string
  displayName: string
  code: string
  supplierType: string
}

interface StockLevel {
  storeId: string
  storeName: string
  currentStock: number
  availableStock: number
  minimumStock: number
}

interface SparePart {
  id: string
  partNumber: string
  name: string
  description?: string
  internalCode: string
  barcode?: string
  costPrice: number
  sellingPrice: number
  currency: string
  weight?: number
  dimensions?: string
  categoryId: string
  supplierId: string
  hsn?: string
  compatibility?: string
  warranty?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  category: Category
  supplier: Supplier
  stockLevels: StockLevel[]
  _count: {
    servicePartUsages: number
    purchaseOrderItems: number
  }
}

const SpareParts: React.FC = () => {
  const navigate = useNavigate()

  // State management
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null)

  // Fetch spare parts data
  const {
    data: sparePartsData,
    isLoading,
    error,
  } = useQuery(
    ['spare-parts', page, rowsPerPage, searchTerm, categoryFilter, supplierFilter, stockFilter],
    () =>
      sparePartsService.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
    {
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  // Event handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setPage(0)
  }

  const handleCategoryFilterChange = (event: any) => {
    setCategoryFilter(event.target.value)
    setPage(0)
  }

  const handleSupplierFilterChange = (event: any) => {
    setSupplierFilter(event.target.value)
    setPage(0)
  }

  const handleStockFilterChange = (event: any) => {
    setStockFilter(event.target.value)
    setPage(0)
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, part: SparePart) => {
    setAnchorEl(event.currentTarget)
    setSelectedPart(part)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedPart(null)
  }

  const handleEditPart = () => {
    if (selectedPart) {
      navigate(`/spare-parts/edit/${selectedPart.id}`)
    }
    handleMenuClose()
  }

  const handleViewStock = () => {
    if (selectedPart) {
      navigate(`/spare-parts/view/${selectedPart.id}`)
    }
    handleMenuClose()
  }

  const getStockStatus = (stockLevels: StockLevel[]) => {
    if (!stockLevels || stockLevels.length === 0) {
      return { status: 'unknown', color: 'default', label: 'No Stock Info', icon: <ErrorIcon /> }
    }

    const totalStock = stockLevels.reduce((sum, level) => sum + level.currentStock, 0)
    const totalMinimum = stockLevels.reduce((sum, level) => sum + level.minimumStock, 0)

    if (totalStock === 0) {
      return { status: 'out-of-stock', color: 'error', label: 'Out of Stock', icon: <ErrorIcon /> }
    } else if (totalStock <= totalMinimum) {
      return { status: 'low-stock', color: 'warning', label: 'Low Stock', icon: <WarningIcon /> }
    }
    return { status: 'in-stock', color: 'success', label: 'In Stock', icon: <CheckCircleIcon /> }
  }

  // Format as INR with ₹ symbol
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const getTotalStock = (stockLevels: StockLevel[]) => {
    return stockLevels?.reduce((sum, level) => sum + level.currentStock, 0) || 0
  }

  // Summary statistics
  const stats = sparePartsData
    ? {
        total: sparePartsData.data.pagination.totalItems,
        categories: [...new Set(sparePartsData.data.spareParts.map((part: SparePart) => part.category?.name))].filter(Boolean).length,
        outOfStock: sparePartsData.data.spareParts.filter((part: SparePart) => getTotalStock(part.stockLevels) === 0).length,
        lowStock: sparePartsData.data.spareParts.filter((part: SparePart) => {
          const totalStock = getTotalStock(part.stockLevels)
          const totalMinimum = part.stockLevels?.reduce((sum, level) => sum + level.minimumStock, 0) || 0
          return totalStock > 0 && totalStock <= totalMinimum
        }).length,
      }
    : { total: 0, categories: 0, outOfStock: 0, lowStock: 0 }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load spare parts data. Please try again.
        </Alert>
      </Box>
    )
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Spare Parts Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/spare-parts/add')}
        >
          Add New Part
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <InventoryIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Parts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CategoryIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.categories}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Categories
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WarningIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.lowStock}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Low Stock
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ErrorIcon color="error" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.outOfStock}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Out of Stock
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search parts..."
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
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={handleCategoryFilterChange}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {/* We'll populate this dynamically later */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={supplierFilter}
                  label="Supplier"
                  onChange={handleSupplierFilterChange}
                >
                  <MenuItem value="">All Suppliers</MenuItem>
                  {/* We'll populate this dynamically later */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Stock Status</InputLabel>
                <Select
                  value={stockFilter}
                  label="Stock Status"
                  onChange={handleStockFilterChange}
                >
                  <MenuItem value="">All Stock</MenuItem>
                  <MenuItem value="in-stock">In Stock</MenuItem>
                  <MenuItem value="low-stock">Low Stock</MenuItem>
                  <MenuItem value="out-of-stock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                fullWidth
              >
                Advanced Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Part Details</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock Status</TableCell>
                  <TableCell>Actions</TableCell>
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
                        <TableCell><Skeleton width={80} /></TableCell>
                        <TableCell><Skeleton width={100} /></TableCell>
                        <TableCell><Skeleton width={60} /></TableCell>
                        <TableCell><Skeleton width={80} /></TableCell>
                        <TableCell><Skeleton width={40} /></TableCell>
                      </TableRow>
                    ))
                  : sparePartsData?.data.spareParts.map((part: SparePart) => {
                      const stockStatus = getStockStatus(part.stockLevels)
                      const totalStock = getTotalStock(part.stockLevels)
                      return (
                        <TableRow key={part.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar
                                variant="rounded"
                                sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}
                              >
                                <InventoryIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight="medium">
                                  {part.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {part.partNumber}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={part.category?.displayName || part.category?.name || 'No Category'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {part.supplier?.displayName || part.supplier?.name || 'No Supplier'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(part.sellingPrice)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Cost: {formatCurrency(part.costPrice)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip
                                icon={stockStatus.icon}
                                label={stockStatus.label}
                                size="small"
                                color={stockStatus.color as any}
                              />
                              <Typography variant="caption" color="text.secondary">
                                ({totalStock} units)
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(event) => handleMenuOpen(event, part)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )
                    })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={sparePartsData?.data.pagination.totalItems || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditPart}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Part
        </MenuItem>
        <MenuItem onClick={handleViewStock}>
          <InventoryIcon sx={{ mr: 1 }} />
          View Stock
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default SpareParts
