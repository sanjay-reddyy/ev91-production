import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Autocomplete,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material'
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  LocationCity as LocationIcon,
  Business as BusinessIcon,
  DirectionsCar as VehicleIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { riderService, clientStoreService, type Rider, type Client, type Store, type ClientCity } from '../services'

interface RiderFormData {
  name: string
  phone: string
  email: string
  dob: string
  address1: string
  address2: string
  city: string
  state: string
  pincode: string
  aadharNumber: string
  panNumber: string
  drivingLicenseNumber: string
  emergencyName: string
  emergencyPhone: string
  emergencyRelation: string
}

interface FormErrors {
  [key: string]: string
}

interface EnhancedRiderFormProps {
  open: boolean
  rider?: Rider | null
  onClose: () => void
  onSave: (data: RiderFormData) => Promise<void>
}

const EnhancedRiderForm: React.FC<EnhancedRiderFormProps> = ({
  open,
  rider,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<RiderFormData>({
    name: '',
    phone: '',
    email: '',
    dob: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
    aadharNumber: '',
    panNumber: '',
    drivingLicenseNumber: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  })

  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  // Store assignment states
  const [cities, setCities] = useState<ClientCity[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [selectedCity, setSelectedCity] = useState<ClientCity | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [assignmentNotes, setAssignmentNotes] = useState('')

  // Loading states for better UX
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingStores, setLoadingStores] = useState(false)
  const [storeAssignmentError, setStoreAssignmentError] = useState('')

  // Vehicle assignment (existing)
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([])
  const [availableHubs, setAvailableHubs] = useState<any[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [selectedHub, setSelectedHub] = useState<any>(null)

  // Load initial data
  useEffect(() => {
    if (open) {
      loadCities()
      loadHubs()
      loadVehicles()
    }
  }, [open])

  // Reset form when rider changes
  useEffect(() => {
    if (rider) {
      setFormData({
        name: rider.name || '',
        phone: rider.phone,
        email: rider.email || '',
        dob: rider.dob || '',
        address1: rider.address1 || '',
        address2: rider.address2 || '',
        city: rider.city || '',
        state: rider.state || '',
        pincode: rider.pincode || '',
        aadharNumber: rider.aadharNumber || '',
        panNumber: rider.panNumber || '',
        drivingLicenseNumber: rider.drivingLicenseNumber || '',
        emergencyName: rider.emergencyName || '',
        emergencyPhone: rider.emergencyPhone || '',
        emergencyRelation: rider.emergencyRelation || '',
      })

      // Set current assignments
      if (rider.assignedVehicle) {
        setSelectedVehicle(rider.assignedVehicle)
      }

      // Note: Store assignment will be handled differently
      // as we need to fetch store details from client-store service
      if (rider.assignedStoreId && rider.assignedClientId) {
        // Could fetch store and client details here if needed
        setAssignmentNotes(rider.storeAssignmentNotes || '')
      }
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        dob: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        pincode: '',
        aadharNumber: '',
        panNumber: '',
        drivingLicenseNumber: '',
        emergencyName: '',
        emergencyPhone: '',
        emergencyRelation: '',
      })
      setSelectedCity(null)
      setSelectedClient(null)
      setSelectedStore(null)
      setSelectedVehicle(null)
      setSelectedHub(null)
      setAssignmentNotes('')
      setStoreAssignmentError('')
      // Clear arrays to reset dropdowns
      setClients([])
      setStores([])
    }
  }, [rider])

  const loadCities = async () => {
    console.log('🔍 Loading cities...')
    setLoadingCities(true)
    setStoreAssignmentError('')
    try {
      const response = await clientStoreService.getCities()
      console.log('🏙️ Cities response:', response)
      if (response.success) {
        setCities(response.data)
        console.log('✅ Cities loaded successfully:', response.data.length, 'cities')
      } else {
        console.error('❌ Failed to load cities:', response)
        setStoreAssignmentError('Failed to load cities. Please try again.')
      }
    } catch (error) {
      console.error('💥 Error loading cities:', error)
      setStoreAssignmentError('Error loading cities. Please check your connection.')
    } finally {
      setLoadingCities(false)
    }
  }

  const loadHubs = async () => {
    try {
      const response = await riderService.getHubs()
      if (response.success) {
        setAvailableHubs(response.data)
      }
    } catch (error) {
      console.error('Error loading hubs:', error)
    }
  }

  const loadVehicles = async (hubId?: string) => {
    try {
      const response = await riderService.getAvailableVehicles(hubId)
      if (response.success) {
        setAvailableVehicles(response.data)
      }
    } catch (error) {
      console.error('Error loading vehicles:', error)
    }
  }

  const handleCityChange = async (city: ClientCity | null) => {
    console.log('🏙️ City changed to:', city)
    setSelectedCity(city)
    setSelectedClient(null)
    setSelectedStore(null)
    setClients([])
    setStores([])
    setStoreAssignmentError('')

    if (city) {
      console.log('🔍 Loading clients for city:', city.name)
      setLoadingClients(true)
      try {
        const response = await clientStoreService.getClientsByCity(city.name)
        console.log('🏢 Clients response for city:', response)
        if (response.success) {
          setClients(response.data)
          console.log('✅ Clients loaded successfully:', response.data.length, 'clients')
          if (response.data.length === 0) {
            setStoreAssignmentError(`No clients found in ${city.name}. Please select a different city.`)
          }
        } else {
          console.error('❌ Failed to load clients for city:', response)
          setStoreAssignmentError('Failed to load clients for selected city.')
        }
      } catch (error) {
        console.error('💥 Error loading clients for city:', error)
        setStoreAssignmentError('Error loading clients. Please try again.')
      } finally {
        setLoadingClients(false)
      }
    }
  }

  const handleClientChange = async (client: Client | null) => {
    console.log('🏢 Client changed to:', client)
    setSelectedClient(client)
    setSelectedStore(null)
    setStores([])
    setStoreAssignmentError('')

    if (client) {
      console.log('🔍 Loading stores for client:', client.id, client.name)
      setLoadingStores(true)
      try {
        const response = await clientStoreService.getStoresByClient(client.id)
        console.log('🏪 Stores response for client:', response)
        if (response.success) {
          setStores(response.data)
          console.log('✅ Stores loaded successfully:', response.data.length, 'stores')
          if (response.data.length === 0) {
            setStoreAssignmentError(`No stores found for ${client.name}. Please select a different client.`)
          }
        } else {
          console.error('❌ Failed to load stores for client:', response)
          setStoreAssignmentError('Failed to load stores for selected client.')
        }
      } catch (error) {
        console.error('💥 Error loading stores for client:', error)
        setStoreAssignmentError('Error loading stores. Please try again.')
      } finally {
        setLoadingStores(false)
      }
    }
  }

  const handleHubChange = (hub: any) => {
    setSelectedHub(hub)
    setSelectedVehicle(null)
    if (hub) {
      loadVehicles(hub.id)
    } else {
      loadVehicles()
    }
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.phone.trim()) errors.phone = 'Phone is required'
    if (!formData.dob) errors.dob = 'Date of birth is required'
    if (!formData.address1.trim()) errors.address1 = 'Address is required'
    if (!formData.city.trim()) errors.city = 'City is required'
    if (!formData.state.trim()) errors.state = 'State is required'
    if (!formData.pincode.trim()) errors.pincode = 'Pincode is required'
    if (!formData.aadharNumber.trim()) errors.aadharNumber = 'Aadhar number is required'
    if (!formData.panNumber.trim()) errors.panNumber = 'PAN number is required'
    if (!formData.drivingLicenseNumber.trim()) errors.drivingLicenseNumber = 'Driving license is required'
    if (!formData.emergencyName.trim()) errors.emergencyName = 'Emergency contact name is required'
    if (!formData.emergencyPhone.trim()) errors.emergencyPhone = 'Emergency contact phone is required'
    if (!formData.emergencyRelation.trim()) errors.emergencyRelation = 'Emergency contact relation is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setStoreAssignmentError('')

      // Save rider basic information
      await onSave(formData)

      // Handle store assignment if selected
      if (rider && selectedStore && selectedClient) {
        try {
          console.log('🏪 Assigning store to rider:', {
            riderId: rider.id,
            storeId: selectedStore.id,
            clientId: selectedClient.id,
            storeName: selectedStore.storeName,
            clientName: selectedClient.name
          })
          await riderService.assignStoreToRider(rider.id, {
            storeId: selectedStore.id,
            clientId: selectedClient.id,
            notes: assignmentNotes,
          })
          console.log('✅ Store assignment successful')
        } catch (error) {
          console.error('❌ Error assigning store:', error)
          setStoreAssignmentError('Failed to assign store. The rider was saved but store assignment failed.')
        }
      }

      // Handle vehicle assignment if selected
      if (rider && selectedVehicle) {
        try {
          await riderService.assignVehicleToRider(rider.id, {
            vehicleId: selectedVehicle.id,
            hubId: selectedHub?.id,
          })
        } catch (error) {
          console.error('Error assigning vehicle:', error)
        }
      }

      onClose()
    } catch (error) {
      console.error('Error saving rider:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnassignStore = async () => {
    if (!rider) return

    try {
      await riderService.unassignStoreFromRider(rider.id)
      setSelectedStore(null)
      setSelectedClient(null)
      setAssignmentNotes('')
    } catch (error) {
      console.error('Error unassigning store:', error)
    }
  }

  const handleUnassignVehicle = async () => {
    if (!rider) return

    try {
      await riderService.unassignVehicleFromRider(rider.id)
      setSelectedVehicle(null)
      setSelectedHub(null)
    } catch (error) {
      console.error('Error unassigning vehicle:', error)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon />
          {rider ? 'Edit Rider' : 'Add New Rider'}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Personal Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      error={!!formErrors.name}
                      helperText={formErrors.name}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      error={!!formErrors.phone}
                      helperText={formErrors.phone}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      error={!!formErrors.email}
                      helperText={formErrors.email}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                      error={!!formErrors.dob}
                      helperText={formErrors.dob}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Address Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Address Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address Line 1"
                      value={formData.address1}
                      onChange={(e) => setFormData(prev => ({ ...prev, address1: e.target.value }))}
                      error={!!formErrors.address1}
                      helperText={formErrors.address1}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address Line 2"
                      value={formData.address2}
                      onChange={(e) => setFormData(prev => ({ ...prev, address2: e.target.value }))}
                      error={!!formErrors.address2}
                      helperText={formErrors.address2}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="City"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      error={!!formErrors.city}
                      helperText={formErrors.city}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="State"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      error={!!formErrors.state}
                      helperText={formErrors.state}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Pincode"
                      value={formData.pincode}
                      onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                      error={!!formErrors.pincode}
                      helperText={formErrors.pincode}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Documents */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Identity Documents
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Aadhar Number"
                      value={formData.aadharNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, aadharNumber: e.target.value }))}
                      error={!!formErrors.aadharNumber}
                      helperText={formErrors.aadharNumber}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="PAN Number"
                      value={formData.panNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, panNumber: e.target.value }))}
                      error={!!formErrors.panNumber}
                      helperText={formErrors.panNumber}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Driving License Number"
                      value={formData.drivingLicenseNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, drivingLicenseNumber: e.target.value }))}
                      error={!!formErrors.drivingLicenseNumber}
                      helperText={formErrors.drivingLicenseNumber}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Emergency Contact */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Emergency Contact
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Emergency Contact Name"
                      value={formData.emergencyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyName: e.target.value }))}
                      error={!!formErrors.emergencyName}
                      helperText={formErrors.emergencyName}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Emergency Contact Phone"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                      error={!!formErrors.emergencyPhone}
                      helperText={formErrors.emergencyPhone}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Relation"
                      value={formData.emergencyRelation}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyRelation: e.target.value }))}
                      error={!!formErrors.emergencyRelation}
                      helperText={formErrors.emergencyRelation}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Store Assignment */}
          {rider && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6">
                      <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Store Assignment
                    </Typography>
                    {selectedStore && (
                      <Tooltip title="Unassign Store">
                        <IconButton onClick={handleUnassignStore} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  {storeAssignmentError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {storeAssignmentError}
                    </Alert>
                  )}

                  {selectedStore ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Rider is assigned to: <strong>{selectedStore.storeName}</strong>
                      {selectedClient && ` (${selectedClient.name})`}
                      {selectedCity && ` in ${selectedCity.name}, ${selectedCity.state}`}
                    </Alert>
                  ) : (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Autocomplete
                          options={cities}
                          getOptionLabel={(city) => `${city.name}, ${city.state}`}
                          value={selectedCity}
                          onChange={(_, value) => handleCityChange(value)}
                          loading={loadingCities}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select City"
                              fullWidth
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {loadingCities ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                ),
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Autocomplete
                          options={clients}
                          getOptionLabel={(client) => `${client.name} (${client.clientCode})`}
                          value={selectedClient}
                          onChange={(_, value) => handleClientChange(value)}
                          disabled={!selectedCity || loadingClients}
                          loading={loadingClients}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Client"
                              fullWidth
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {loadingClients ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                ),
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Autocomplete
                          options={stores}
                          getOptionLabel={(store) => `${store.storeName} (${store.storeCode})`}
                          value={selectedStore}
                          onChange={(_, value) => setSelectedStore(value)}
                          disabled={!selectedClient || loadingStores}
                          loading={loadingStores}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Store"
                              fullWidth
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {loadingStores ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                ),
                              }}
                            />
                          )}
                        />
                      </Grid>
                      {selectedStore && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Assignment Notes"
                            value={assignmentNotes}
                            onChange={(e) => setAssignmentNotes(e.target.value)}
                            multiline
                            rows={2}
                            placeholder="Optional notes about this assignment..."
                          />
                        </Grid>
                      )}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Vehicle Assignment */}
          {rider && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6">
                      <VehicleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Vehicle Assignment
                    </Typography>
                    {selectedVehicle && (
                      <Tooltip title="Unassign Vehicle">
                        <IconButton onClick={handleUnassignVehicle} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  {selectedVehicle ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Rider is assigned vehicle: <strong>{selectedVehicle.registrationNumber}</strong>
                      ({selectedVehicle.make} {selectedVehicle.model})
                    </Alert>
                  ) : (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          options={availableHubs}
                          getOptionLabel={(hub) => `${hub.name} - ${hub.city?.name || 'Unknown City'}`}
                          value={selectedHub}
                          onChange={(_, value) => handleHubChange(value)}
                          renderInput={(params) => (
                            <TextField {...params} label="Select Hub (Optional)" fullWidth />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          options={availableVehicles}
                          getOptionLabel={(vehicle) =>
                            `${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model})`
                          }
                          value={selectedVehicle}
                          onChange={(_, value) => setSelectedVehicle(value)}
                          renderInput={(params) => (
                            <TextField {...params} label="Select Vehicle" fullWidth />
                          )}
                        />
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<CancelIcon />}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={loading}
        >
          {loading ? 'Saving...' : rider ? 'Update Rider' : 'Create Rider'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EnhancedRiderForm
