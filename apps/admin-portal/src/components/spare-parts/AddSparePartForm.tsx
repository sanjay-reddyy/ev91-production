import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  IconButton,
} from '@mui/material'
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useSnackbar } from 'notistack'
import { sparePartsService, suppliersService } from '../../services/sparePartsService'

interface AddSparePartFormProps {
  open: boolean
  onClose: () => void
}

// Mock categories for now - can be replaced with actual API call
const MOCK_CATEGORIES = [
  { id: 'cat1', name: 'ENGINE', displayName: 'Engine Components', code: 'ENG' },
  { id: 'cat2', name: 'BRAKE', displayName: 'Brake System', code: 'BRK' },
  { id: 'cat3', name: 'ELECTRICAL', displayName: 'Electrical Components', code: 'ELC' },
  { id: 'cat4', name: 'BODY', displayName: 'Body Parts', code: 'BDY' },
  { id: 'cat5', name: 'SUSPENSION', displayName: 'Suspension System', code: 'SUS' },
  { id: 'cat6', name: 'TRANSMISSION', displayName: 'Transmission System', code: 'TRN' },
  { id: 'cat7', name: 'COOLING', displayName: 'Cooling System', code: 'COL' },
  { id: 'cat8', name: 'FUEL', displayName: 'Fuel System', code: 'FUL' },
]

const QUALITY_GRADES = ['A', 'B', 'C']
const UNITS_OF_MEASURE = ['PCS', 'KG', 'LITER', 'METER', 'PAIR', 'SET']

const AddSparePartForm: React.FC<AddSparePartFormProps> = ({ open, onClose }) => {
  const { enqueueSnackbar } = useSnackbar()
  const queryClient = useQueryClient()

  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    displayName: '',
    partNumber: '',
    oemPartNumber: '',
    internalCode: '',
    description: '',
    
    // Classification
    categoryId: '',
    supplierId: '',
    
    // Compatibility
    compatibility: '[]', // JSON string
    
    // Technical Specifications
    specifications: '{}', // JSON string
    dimensions: '',
    weight: '',
    material: '',
    color: '',
    warranty: '',
    
    // Pricing Information
    costPrice: '',
    sellingPrice: '',
    mrp: '',
    markupPercent: '20',
    
    // Inventory Management
    unitOfMeasure: 'PCS',
    minimumStock: '10',
    maximumStock: '100',
    reorderLevel: '20',
    reorderQuantity: '50',
    leadTimeDays: '7',
    
    // Quality & Compliance
    qualityGrade: 'A',
    isOemApproved: false,
    certifications: '[]', // JSON string
    
    // Status
    isActive: true,
    isDiscontinued: false,
    isHazardous: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState(0)

  // Fetch suppliers
  const {
    data: suppliersData,
    isLoading: suppliersLoading,
  } = useQuery(
    ['suppliers'],
    () => suppliersService.getAll({ isActive: true, limit: 100 }),
    {
      enabled: open,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Create spare part mutation
  const createSparePartMutation = useMutation(
    (data: any) => sparePartsService.create(data),
    {
      onSuccess: () => {
        enqueueSnackbar('Spare part created successfully', { variant: 'success' })
        queryClient.invalidateQueries(['spare-parts'])
        handleClose()
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || 'Failed to create spare part',
          { variant: 'error' }
        )
      },
    }
  )

  const handleClose = () => {
    setFormData({
      name: '',
      displayName: '',
      partNumber: '',
      oemPartNumber: '',
      internalCode: '',
      description: '',
      categoryId: '',
      supplierId: '',
      compatibility: '[]',
      specifications: '{}',
      dimensions: '',
      weight: '',
      material: '',
      color: '',
      warranty: '',
      costPrice: '',
      sellingPrice: '',
      mrp: '',
      markupPercent: '20',
      unitOfMeasure: 'PCS',
      minimumStock: '10',
      maximumStock: '100',
      reorderLevel: '20',
      reorderQuantity: '50',
      leadTimeDays: '7',
      qualityGrade: 'A',
      isOemApproved: false,
      certifications: '[]',
      isActive: true,
      isDiscontinued: false,
      isHazardous: false,
    })
    setErrors({})
    setActiveTab(0)
    onClose()
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.partNumber.trim()) newErrors.partNumber = 'Part number is required'
    if (!formData.internalCode.trim()) newErrors.internalCode = 'Internal code is required'
    if (!formData.categoryId) newErrors.categoryId = 'Category is required'
    if (!formData.supplierId) newErrors.supplierId = 'Supplier is required'
    
    // Pricing validation
    if (!formData.costPrice || parseFloat(formData.costPrice) <= 0) {
      newErrors.costPrice = 'Cost price must be greater than 0'
    }
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      newErrors.sellingPrice = 'Selling price must be greater than 0'
    }
    if (!formData.mrp || parseFloat(formData.mrp) <= 0) {
      newErrors.mrp = 'MRP must be greater than 0'
    }

    // Stock validation
    const minStock = parseInt(formData.minimumStock)
    const maxStock = parseInt(formData.maximumStock)
    const reorderLevel = parseInt(formData.reorderLevel)

    if (minStock <= 0) newErrors.minimumStock = 'Minimum stock must be greater than 0'
    if (maxStock <= minStock) newErrors.maximumStock = 'Maximum stock must be greater than minimum stock'
    if (reorderLevel < minStock) newErrors.reorderLevel = 'Reorder level must be at least minimum stock'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      enqueueSnackbar('Please fix the validation errors', { variant: 'error' })
      return
    }

    // Prepare data for API
    const apiData = {
      ...formData,
      displayName: formData.displayName || formData.name,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      warranty: formData.warranty ? parseInt(formData.warranty) : undefined,
      costPrice: parseFloat(formData.costPrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      mrp: parseFloat(formData.mrp),
      markupPercent: parseFloat(formData.markupPercent),
      minimumStock: parseInt(formData.minimumStock),
      maximumStock: parseInt(formData.maximumStock),
      reorderLevel: parseInt(formData.reorderLevel),
      reorderQuantity: parseInt(formData.reorderQuantity),
      leadTimeDays: parseInt(formData.leadTimeDays),
    }

    createSparePartMutation.mutate(apiData)
  }

  const suppliers = suppliersData?.data?.suppliers || []

  const TabPanel = ({ children, value, index }: { children: React.ReactNode; value: number; index: number }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div">
            Add New Spare Part
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
          <Box display="flex" gap={2}>
            {[
              { label: 'Basic Info', icon: <InfoIcon /> },
              { label: 'Pricing', icon: <MoneyIcon /> },
              { label: 'Inventory', icon: <InventoryIcon /> },
              { label: 'Technical', icon: <CategoryIcon /> },
            ].map((tab, index) => (
              <Button
                key={index}
                variant={activeTab === index ? 'contained' : 'text'}
                startIcon={tab.icon}
                onClick={() => setActiveTab(index)}
                size="small"
              >
                {tab.label}
              </Button>
            ))}
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Basic Information Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardHeader 
                    title="Basic Information" 
                    avatar={<InfoIcon color="primary" />}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Part Name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          error={!!errors.name}
                          helperText={errors.name}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Display Name"
                          value={formData.displayName}
                          onChange={(e) => handleInputChange('displayName', e.target.value)}
                          helperText="If empty, will use Part Name"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Part Number"
                          value={formData.partNumber}
                          onChange={(e) => handleInputChange('partNumber', e.target.value)}
                          error={!!errors.partNumber}
                          helperText={errors.partNumber}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="OEM Part Number"
                          value={formData.oemPartNumber}
                          onChange={(e) => handleInputChange('oemPartNumber', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Internal Code"
                          value={formData.internalCode}
                          onChange={(e) => handleInputChange('internalCode', e.target.value)}
                          error={!!errors.internalCode}
                          helperText={errors.internalCode}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Description"
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardHeader 
                    title="Classification" 
                    avatar={<CategoryIcon color="primary" />}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl 
                          fullWidth 
                          error={!!errors.categoryId}
                          required
                        >
                          <InputLabel>Category</InputLabel>
                          <Select
                            value={formData.categoryId}
                            label="Category"
                            onChange={(e) => handleInputChange('categoryId', e.target.value)}
                          >
                            {MOCK_CATEGORIES.map((category) => (
                              <MenuItem key={category.id} value={category.id}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Chip 
                                    label={category.code} 
                                    size="small" 
                                    variant="outlined" 
                                  />
                                  {category.displayName}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.categoryId && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                              {errors.categoryId}
                            </Typography>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl 
                          fullWidth 
                          error={!!errors.supplierId}
                          required
                        >
                          <InputLabel>Supplier</InputLabel>
                          <Select
                            value={formData.supplierId}
                            label="Supplier"
                            onChange={(e) => handleInputChange('supplierId', e.target.value)}
                            disabled={suppliersLoading}
                          >
                            {suppliers.map((supplier: any) => (
                              <MenuItem key={supplier.id} value={supplier.id}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <BusinessIcon fontSize="small" />
                                  {supplier.displayName || supplier.name}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.supplierId && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                              {errors.supplierId}
                            </Typography>
                          )}
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Pricing Tab */}
          <TabPanel value={activeTab} index={1}>
            <Card>
              <CardHeader 
                title="Pricing Information" 
                avatar={<MoneyIcon color="primary" />}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Cost Price"
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => handleInputChange('costPrice', e.target.value)}
                      error={!!errors.costPrice}
                      helperText={errors.costPrice}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Selling Price"
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                      error={!!errors.sellingPrice}
                      helperText={errors.sellingPrice}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="MRP"
                      type="number"
                      value={formData.mrp}
                      onChange={(e) => handleInputChange('mrp', e.target.value)}
                      error={!!errors.mrp}
                      helperText={errors.mrp}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Markup %"
                      type="number"
                      value={formData.markupPercent}
                      onChange={(e) => handleInputChange('markupPercent', e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Inventory Tab */}
          <TabPanel value={activeTab} index={2}>
            <Card>
              <CardHeader 
                title="Inventory Management" 
                avatar={<InventoryIcon color="primary" />}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Unit of Measure</InputLabel>
                      <Select
                        value={formData.unitOfMeasure}
                        label="Unit of Measure"
                        onChange={(e) => handleInputChange('unitOfMeasure', e.target.value)}
                      >
                        {UNITS_OF_MEASURE.map((unit) => (
                          <MenuItem key={unit} value={unit}>
                            {unit}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Minimum Stock"
                      type="number"
                      value={formData.minimumStock}
                      onChange={(e) => handleInputChange('minimumStock', e.target.value)}
                      error={!!errors.minimumStock}
                      helperText={errors.minimumStock}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Maximum Stock"
                      type="number"
                      value={formData.maximumStock}
                      onChange={(e) => handleInputChange('maximumStock', e.target.value)}
                      error={!!errors.maximumStock}
                      helperText={errors.maximumStock}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Reorder Level"
                      type="number"
                      value={formData.reorderLevel}
                      onChange={(e) => handleInputChange('reorderLevel', e.target.value)}
                      error={!!errors.reorderLevel}
                      helperText={errors.reorderLevel}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Reorder Quantity"
                      type="number"
                      value={formData.reorderQuantity}
                      onChange={(e) => handleInputChange('reorderQuantity', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Lead Time (Days)"
                      type="number"
                      value={formData.leadTimeDays}
                      onChange={(e) => handleInputChange('leadTimeDays', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Technical Tab */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Technical Specifications" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Dimensions (L x W x H)"
                          value={formData.dimensions}
                          onChange={(e) => handleInputChange('dimensions', e.target.value)}
                          placeholder="e.g., 10 x 5 x 2 cm"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Weight"
                          type="number"
                          value={formData.weight}
                          onChange={(e) => handleInputChange('weight', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Warranty (Months)"
                          type="number"
                          value={formData.warranty}
                          onChange={(e) => handleInputChange('warranty', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Material"
                          value={formData.material}
                          onChange={(e) => handleInputChange('material', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Color"
                          value={formData.color}
                          onChange={(e) => handleInputChange('color', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Quality & Status" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <InputLabel>Quality Grade</InputLabel>
                          <Select
                            value={formData.qualityGrade}
                            label="Quality Grade"
                            onChange={(e) => handleInputChange('qualityGrade', e.target.value)}
                          >
                            {QUALITY_GRADES.map((grade) => (
                              <MenuItem key={grade} value={grade}>
                                Grade {grade}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <Box display="flex" gap={2} flexWrap="wrap">
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.isOemApproved}
                                onChange={(e) => handleInputChange('isOemApproved', e.target.checked)}
                              />
                            }
                            label="OEM Approved"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.isActive}
                                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                              />
                            }
                            label="Active"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.isHazardous}
                                onChange={(e) => handleInputChange('isHazardous', e.target.checked)}
                              />
                            }
                            label="Hazardous"
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={createSparePartMutation.isLoading}
          startIcon={
            createSparePartMutation.isLoading ? 
            <CircularProgress size={20} /> : 
            <SaveIcon />
          }
        >
          {createSparePartMutation.isLoading ? 'Creating...' : 'Create Part'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddSparePartForm
