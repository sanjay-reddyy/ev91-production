import React, { useState, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Autocomplete,
  InputAdornment,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Inventory as InventoryIcon,
  Store as StoreIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useSnackbar } from 'notistack'
import {
  sparePartsService,
  inventoryService,
  type SparePart
} from '../../services/sparePartsService'
import { vehicleService } from '../../services/vehicleService'

interface AddStockFormProps {
  open: boolean
  onClose: () => void
}

interface StockItem {
  sparePartId: string
  sparePart?: SparePart
  quantity: number
  unitPrice?: number
  notes?: string
}

// Hub interface for spare parts inventory management
const AddStockForm: React.FC<AddStockFormProps> = ({ open, onClose }) => {
  const { enqueueSnackbar } = useSnackbar()
  const queryClient = useQueryClient()

  // Helper function to safely parse image URLs
  const getImageUrl = (imageUrls?: string): string | undefined => {
    if (!imageUrls) return undefined
    try {
      const urls = JSON.parse(imageUrls)
      return Array.isArray(urls) ? urls[0] : undefined
    } catch {
      return undefined
    }
  }

  // Helper function to get unit price (prefer selling price, fallback to cost price)
  const getUnitPrice = (sparePart?: SparePart): number => {
    return sparePart?.sellingPrice || sparePart?.costPrice || 0
  }

  // Form state
  const [selectedHub, setSelectedHub] = useState('')
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [movementType, setMovementType] = useState<'IN' | 'ADJUSTMENT'>('IN')
  const [reference, setReference] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch operational hubs with service centers
  const {
    data: hubsData,
    isLoading: hubsLoading,
  } = useQuery(
    ['operational-hubs'],
    () => vehicleService.getOperationalHubs(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  // Fetch spare parts for selection
  const {
    data: sparePartsData,
    isLoading: sparePartsLoading,
  } = useQuery(
    ['spare-parts', searchTerm],
    () => sparePartsService.getAll({
      search: searchTerm || undefined,
      limit: 20
    }),
    {
      enabled: searchTerm.length >= 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        console.log('Spare parts data received:', data)
        console.log('Data structure - success:', data?.success, 'data type:', typeof data?.data, 'is array:', Array.isArray(data?.data))
        if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
          console.log('Nested data keys:', Object.keys(data.data))
          if (data.data.spareParts) {
            console.log('Found spareParts array with', data.data.spareParts.length, 'items')
          }
        }
      },
      onError: (error) => {
        console.error('Error fetching spare parts:', error)
      }
    }
  )

  // Create stock movement mutation with auto-initialization
  const createStockMutation = useMutation(
    async (data: {
      hubId: string
      hubName: string
      items: StockItem[]
      movementType: 'IN' | 'ADJUSTMENT'
      reference?: string
      notes?: string
    }) => {
      // Helper function to create a single movement with auto-initialization
      const createMovementWithInit = async (item: StockItem) => {
        try {
          // Try to create the stock movement directly
          return await inventoryService.createMovement({
            sparePartId: item.sparePartId,
            storeId: data.hubId, // Using hubId as storeId for inventory
            movementType: data.movementType,
            quantity: item.quantity,
            unitCost: item.unitPrice,
            referenceType: 'PURCHASE',
            referenceId: data.reference,
            reason: data.movementType === 'IN' ? 'Stock Purchase' : 'Stock Adjustment',
            notes: item.notes || data.notes,
          })
        } catch (error: any) {
          // Check if this is a "stock not initialized" error
          if (error.response?.status === 400 &&
              error.response?.data?.message?.includes('Stock level not found')) {

            console.log(`Initializing stock for spare part ${item.sparePartId} at hub ${data.hubId}`)

            // Show user-friendly message about initialization
            enqueueSnackbar(
              `Initializing inventory for ${item.sparePart?.name || 'spare part'} at ${data.hubName}...`,
              { variant: 'info' }
            )

            try {
              // Initialize stock first
              await inventoryService.initializeStock({
                sparePartId: item.sparePartId,
                storeId: data.hubId,
                storeName: data.hubName,
                initialStock: 0, // Start with 0, the movement will add the quantity
                minimumStock: 10,
                maximumStock: 1000,
                reorderLevel: 20,
              })

              console.log(`Stock initialized successfully for ${item.sparePartId}`)

              // Retry the stock movement
              return await inventoryService.createMovement({
                sparePartId: item.sparePartId,
                storeId: data.hubId,
                movementType: data.movementType,
                quantity: item.quantity,
                unitCost: item.unitPrice,
                referenceType: 'PURCHASE',
                referenceId: data.reference,
                reason: data.movementType === 'IN' ? 'Stock Purchase' : 'Stock Adjustment',
                notes: item.notes || data.notes,
              })
            } catch (initError: any) {
              console.error('Error during stock initialization or retry:', initError)
              enqueueSnackbar(
                `Failed to initialize stock: ${initError.response?.data?.message || initError.message}`,
                { variant: 'error' }
              )
              throw initError
            }
          }          // Re-throw other errors
          console.error('Stock movement error (not initialization-related):', error)
          console.error('Error details:', {
            status: error.response?.status,
            message: error.response?.data?.message,
            data: error.response?.data
          })
          throw error
        }
      }

      // Create movements for all items (with auto-initialization if needed)
      const movements = await Promise.all(
        data.items.map(item => createMovementWithInit(item))
      )
      return movements
    },
    {
      onSuccess: () => {
        enqueueSnackbar('Stock added successfully', { variant: 'success' })
        queryClient.invalidateQueries(['inventory'])
        queryClient.invalidateQueries(['dashboard-stats'])
        handleClose()
      },
      onError: (error: any) => {
        console.error('Error creating stock movement:', error)
        enqueueSnackbar(
          error.response?.data?.message || 'Failed to add stock',
          { variant: 'error' }
        )
      },
    }
  )

  const handleClose = () => {
    setSelectedHub('')
    setStockItems([])
    setMovementType('IN')
    setReference('')
    setGeneralNotes('')
    setSearchTerm('')
    onClose()
  }

  const addStockItem = useCallback((sparePart: any) => {
    if (typeof sparePart === 'string') return // Skip string options

    const existingIndex = stockItems.findIndex(item => item.sparePartId === sparePart.id)
    if (existingIndex >= 0) {
      // Increase quantity if part already exists
      setStockItems(prev => prev.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      // Add new item
      setStockItems(prev => [...prev, {
        sparePartId: sparePart.id,
        sparePart,
        quantity: 1,
        unitPrice: getUnitPrice(sparePart),
        notes: '',
      }])
    }
    setSearchTerm('')
  }, [stockItems])

  const updateStockItem = (index: number, field: keyof StockItem, value: any) => {
    setStockItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const removeStockItem = (index: number) => {
    setStockItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleQuantityChange = (index: number, delta: number) => {
    setStockItems(prev => prev.map((item, i) =>
      i === index
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ))
  }

  const handleSubmit = () => {
    if (!selectedHub) {
      enqueueSnackbar('Please select a hub', { variant: 'error' })
      return
    }

    if (stockItems.length === 0) {
      enqueueSnackbar('Please add at least one item', { variant: 'error' })
      return
    }

    const selectedHubData = hubsData?.data?.find((hub: any) => hub.id === selectedHub)
    if (!selectedHubData) {
      enqueueSnackbar('Invalid hub selection', { variant: 'error' })
      return
    }

    createStockMutation.mutate({
      hubId: selectedHub,
      hubName: selectedHubData.name,
      items: stockItems,
      movementType,
      reference,
      notes: generalNotes,
    })
  }

  const totalValue = stockItems.reduce((sum, item) =>
    sum + (item.quantity * (item.unitPrice || 0)), 0
  )

  // Memoize the options array to prevent focus loss
  const autocompleteOptions = useMemo(() => {
    // Handle different response structures
    if (!sparePartsData) return []

    // Handle API response structure: {success: true, data: {spareParts: [...], pagination: {...}}, message: '...'}
    if (sparePartsData.success && sparePartsData.data) {
      // Check for spareParts array in data
      if (sparePartsData.data.spareParts && Array.isArray(sparePartsData.data.spareParts)) {
        return sparePartsData.data.spareParts
      }
      // If data is an array directly (fallback)
      if (Array.isArray(sparePartsData.data)) return sparePartsData.data
      // If data has items array (fallback for other structures)
      if (sparePartsData.data.items && Array.isArray(sparePartsData.data.items)) return sparePartsData.data.items
      // If data has data array (nested fallback)
      if (sparePartsData.data.data && Array.isArray(sparePartsData.data.data)) return sparePartsData.data.data
    }

    // Fallback for direct array or simple data structure
    if (Array.isArray(sparePartsData)) return sparePartsData
    if (Array.isArray(sparePartsData.data)) return sparePartsData.data

    console.warn('Unexpected spare parts data structure:', sparePartsData)
    return []
  }, [sparePartsData])

  // Memoize the option label function
  const getOptionLabel = useCallback((option: any) =>
    typeof option === 'string' ? option : `${option.name} (${option.partNumber})`, []
  )

  // Memoize the render option function
  const renderOption = useCallback((props: any, option: any) => {
    const { key, ...otherProps } = props;
    return (
      <li key={key} {...otherProps} onClick={() => addStockItem(option)}>
        <Box display="flex" alignItems="center" gap={2} width="100%">
          <Avatar sx={{ bgcolor: 'primary.light' }}>
            <InventoryIcon />
          </Avatar>
          <Box flex={1}>
            <Typography variant="body2" fontWeight="medium">
              {option.name}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {option.partNumber} • ₹{getUnitPrice(option)}
            </Typography>
          </Box>
        </Box>
      </li>
    );
  }, [addStockItem])

  // Memoize input change handler
  const handleInputChange = useCallback((_: any, value: string) => {
    setSearchTerm(value)
  }, [])

  // Memoize the no options text
  const noOptionsText = useMemo(() =>
    searchTerm.length < 2 ? "Type at least 2 characters to search" : "No spare parts found",
    [searchTerm.length]
  )

  // Memoize all change handlers to prevent focus loss
  const handleReferenceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setReference(e.target.value)
  }, [])

  const handleGeneralNotesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGeneralNotes(e.target.value)
  }, [])

  const handleSelectedHubChange = useCallback((e: any) => {
    setSelectedHub(e.target.value)
  }, [])

  const handleMovementTypeChange = useCallback((e: any) => {
    setMovementType(e.target.value as 'IN' | 'ADJUSTMENT')
  }, [])

  // Memoize stock item handlers to prevent focus loss in nested inputs
  const handleStockItemNotesChange = useCallback((index: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateStockItem(index, 'notes', e.target.value)
    }, [])

  const handleStockItemQuantityChange = useCallback((index: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateStockItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
    }, [])

  const handleStockItemPriceChange = useCallback((index: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateStockItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
    }, [])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', display: 'flex', flexDirection: 'column' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <AddIcon color="primary" />
            <Typography variant="h6">Add Stock</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Store and Movement Type Selection */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Select Hub</InputLabel>
              <Select
                value={selectedHub}
                label="Select Hub"
                onChange={handleSelectedHubChange}
                disabled={hubsLoading}
              >
                <MenuItem value="">
                  <em>Select Hub</em>
                </MenuItem>
                {hubsData?.data?.map((hub: any) => (
                  <MenuItem key={hub.id} value={hub.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <StoreIcon fontSize="small" />
                      <Box>
                        <Typography variant="body2">{hub.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {hub.location} - {hub.type || 'Service Center'}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Movement Type</InputLabel>
              <Select
                value={movementType}
                label="Movement Type"
                onChange={handleMovementTypeChange}
              >
                <MenuItem value="IN">Stock In (New Purchase)</MenuItem>
                <MenuItem value="ADJUSTMENT">Stock Adjustment</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Reference and Notes */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Reference (PO Number, Invoice, etc.)"
              value={reference}
              onChange={handleReferenceChange}
              placeholder="PO-2025-001"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="General Notes"
              value={generalNotes}
              onChange={handleGeneralNotesChange}
              placeholder="Bulk purchase from supplier..."
            />
          </Grid>
        </Grid>

        {/* Spare Parts Search */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Add Spare Parts
          </Typography>
          <Autocomplete
            freeSolo
            options={autocompleteOptions}
            getOptionLabel={getOptionLabel}
            renderOption={renderOption}
            inputValue={searchTerm}
            onInputChange={handleInputChange}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search spare parts by name or part number..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            loading={sparePartsLoading}
            loadingText="Searching spare parts..."
            noOptionsText={noOptionsText}
            disabled={sparePartsLoading}
          />
        </Box>

        {/* Selected Items */}
        <Box flex={1}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Items ({stockItems.length})
          </Typography>
          {stockItems.length === 0 ? (
            <Alert severity="info">
              Search and select spare parts to add to stock
            </Alert>
          ) : (
            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
              <List dense>
                {stockItems.map((item, index) => (
                  <React.Fragment key={`${item.sparePartId}-${index}`}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar
                          src={getImageUrl(item.sparePart?.imageUrls)}
                          sx={{ bgcolor: 'primary.light' }}
                        >
                          <InventoryIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.sparePart?.name}
                        secondary={
                          <React.Fragment>
                            <Typography variant="caption" color="textSecondary" component="span">
                              {item.sparePart?.partNumber}
                            </Typography>
                            <br />
                            <TextField
                              size="small"
                              label="Notes"
                              value={item.notes}
                              onChange={handleStockItemNotesChange(index)}
                              fullWidth
                              margin="dense"
                              placeholder="Item-specific notes..."
                              sx={{ mt: 1 }}
                            />
                          </React.Fragment>
                        }
                        secondaryTypographyProps={{
                          component: 'div'
                        }}
                      />
                      <Box display="flex" alignItems="center" gap={1} minWidth={200}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(index, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={handleStockItemQuantityChange(index)}
                            sx={{ width: 60 }}
                            inputProps={{ min: 1 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(index, 1)}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                        <TextField
                          size="small"
                          label="Unit Price"
                          type="number"
                          value={item.unitPrice || ''}
                          onChange={handleStockItemPriceChange(index)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          sx={{ width: 80 }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeStockItem(index)}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Box>
                    </ListItem>
                    {index < stockItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        {/* Summary */}
        {stockItems.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Total Items: <strong>{stockItems.length}</strong>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Total Quantity: <strong>{stockItems.reduce((sum, item) => sum + item.quantity, 0)}</strong>
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" color="primary">
                  Total Value: ₹{totalValue.toLocaleString('en-IN')}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleClose} disabled={createStockMutation.isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedHub || stockItems.length === 0 || createStockMutation.isLoading}
          startIcon={<AddIcon />}
        >
          {createStockMutation.isLoading ? 'Adding Stock...' : 'Add Stock'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddStockForm
