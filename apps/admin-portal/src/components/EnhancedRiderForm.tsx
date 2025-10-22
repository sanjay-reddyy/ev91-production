import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  LinearProgress,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  LocationCity as LocationIcon,
  Business as BusinessIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ElectricCar as ElectricCarIcon,
  ContentCopy as CopyIcon,
  Badge as BadgeIcon,
  AccountBalance as AccountBalanceIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material'
import { riderService, clientStoreService, type Rider, type Client, type Store, type ClientCity, type RiderKYC } from '../services'
import { getAvailableRentalModels } from '../services/evRentalService'
import { VehicleModel, OwnVehicleType } from '../types/evRental'
import vehicleService from '../services/vehicleService'
import axios from 'axios'

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
  // EV Rental Vehicle Preference fields
  needsEvRental?: boolean
  vehiclePreference?: string
  preferredVehicleModelId?: string
  workType?: 'FULL_TIME' | 'PART_TIME' | ''
  ownVehicleType?: string
  // Bank Details (optional)
  bankDetails?: {
    accountHolderName?: string
    accountNumber?: string
    confirmAccountNumber?: string
    accountType?: 'SAVINGS' | 'CURRENT'
    ifscCode?: string
    bankName?: string
    branchName?: string
    branchAddress?: string
    isPrimary?: boolean
    notes?: string
    proofDocument?: File | null
    proofType?: 'PASSBOOK' | 'CANCELLED_CHEQUE' | 'BANK_STATEMENT'
  }
}

interface FormErrors {
  [key: string]: string
}

interface KYCDocument {
  documentType: string
  documentNumber: string
  file: File | null
  uploadProgress?: number
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'error'
  uploadError?: string
  existingDocument?: RiderKYC
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
    needsEvRental: false,
    vehiclePreference: '',
    preferredVehicleModelId: '',
    workType: '',
    ownVehicleType: '',
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      accountType: 'SAVINGS',
      ifscCode: '',
      bankName: '',
      branchName: '',
      branchAddress: '',
      isPrimary: false,
      notes: '',
      proofDocument: null,
      proofType: 'PASSBOOK',
    },
  })

  // Bank details state
  const [showBankDetails, setShowBankDetails] = useState(false)
  const [bankDetailsErrors, setBankDetailsErrors] = useState<Record<string, string>>({})
  const [existingBankDetailsId, setExistingBankDetailsId] = useState<string | null>(null)

  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  // Document uniqueness validation state
  const [validationState, setValidationState] = useState<{
    aadhaar: 'idle' | 'checking' | 'valid' | 'invalid'
    pan: 'idle' | 'checking' | 'valid' | 'invalid'
    dl: 'idle' | 'checking' | 'valid' | 'invalid'
  }>({
    aadhaar: 'idle',
    pan: 'idle',
    dl: 'idle',
  })

  // KYC Document states
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([
    { documentType: 'aadhaar', documentNumber: '', file: null, uploadStatus: 'idle' },
    { documentType: 'pan', documentNumber: '', file: null, uploadStatus: 'idle' },
    { documentType: 'dl', documentNumber: '', file: null, uploadStatus: 'idle' },
    { documentType: 'selfie', documentNumber: '', file: null, uploadStatus: 'idle' },
  ])
  const [loadingKyc, setLoadingKyc] = useState(false)
  const [kycUploadError, setKycUploadError] = useState('')

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

  // EV Rental vehicle model preference
  const [availableModels, setAvailableModels] = useState<VehicleModel[]>([])
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null)

  // City and State dropdown data (from database)
  const [allCities, setAllCities] = useState<Array<{ id: string; name: string; displayName: string; state: string }>>([])
  const [allStates, setAllStates] = useState<string[]>([])
  const [loadingCityData, setLoadingCityData] = useState(false)

  // Validate phone number (exactly 10 digits)
  const validatePhoneNumber = (phone: string): string | null => {
    if (!phone) return 'Phone number is required'

    // Remove any non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '')

    if (digitsOnly.length !== 10) {
      return 'Phone number must be exactly 10 digits'
    }

    if (!/^[6-9]/.test(digitsOnly)) {
      return 'Phone number must start with 6, 7, 8, or 9'
    }

    return null
  }

  // Validate date of birth (must be 18+ years old)
  const validateDateOfBirth = (dob: string): string | null => {
    if (!dob) return 'Date of birth is required'

    const birthDate = new Date(dob)
    const today = new Date()

    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    if (age < 18) {
      return 'Rider must be at least 18 years old'
    }

    if (birthDate > today) {
      return 'Date of birth cannot be in the future'
    }

    return null
  }

  // Validate IFSC code
  const validateIFSC = (ifsc: string): string | null => {
    if (!ifsc) return null // Optional field

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
    if (!ifscRegex.test(ifsc)) {
      return 'Invalid IFSC code format (e.g., SBIN0001234)'
    }
    return null
  }

  // Validate account number
  const validateAccountNumber = (accountNumber: string): string | null => {
    if (!accountNumber) return null // Optional field

    // Remove spaces and check if numeric
    const cleanedNumber = accountNumber.replace(/\s/g, '')
    if (!/^\d{9,18}$/.test(cleanedNumber)) {
      return 'Account number must be 9-18 digits'
    }
    return null
  }

  // Validate bank details
  const validateBankDetails = (): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!showBankDetails || !formData.bankDetails) return errors

    const { accountHolderName, accountNumber, confirmAccountNumber, ifscCode, proofDocument } = formData.bankDetails

    // Account holder name validation
    if (accountHolderName && (accountHolderName.length < 2 || accountHolderName.length > 100)) {
      errors.accountHolderName = 'Account holder name must be 2-100 characters'
    }

    // Account number validation
    if (accountNumber) {
      const accountError = validateAccountNumber(accountNumber)
      if (accountError) {
        errors.accountNumber = accountError
      }

      // Confirm account number match
      if (confirmAccountNumber && accountNumber !== confirmAccountNumber) {
        errors.confirmAccountNumber = 'Account numbers do not match'
      }
    }

    // IFSC validation
    if (ifscCode) {
      const ifscError = validateIFSC(ifscCode)
      if (ifscError) {
        errors.ifscCode = ifscError
      }
    }

    // Proof document required for new entries
    if (!rider && accountNumber && !proofDocument) {
      errors.proofDocument = 'Bank proof document is required'
    }

    return errors
  }

  // Handle bank proof file change
  const handleBankProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setBankDetailsErrors(prev => ({
        ...prev,
        proofDocument: 'Only JPG, PNG, or PDF files are allowed'
      }))
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setBankDetailsErrors(prev => ({
        ...prev,
        proofDocument: 'File size must be less than 5MB'
      }))
      return
    }

    // Update form data
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails!,
        proofDocument: file
      }
    }))

    // Clear error
    setBankDetailsErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.proofDocument
      return newErrors
    })
  }

  // Check document uniqueness
  const checkUniqueness = useCallback(
    async (field: 'aadhaar' | 'pan' | 'dl', value: string) => {
      if (!value || value.length < 8) return // Skip if too short

      setValidationState(prev => ({ ...prev, [field]: 'checking' }))

      try {
        const params: any = { [field]: value }
        if (rider?.id) {
          params.riderId = rider.id // Exclude current rider in edit mode
        }

        const response = await axios.get('/api/riders/check-unique', { params })

        if (response.data.isUnique) {
          setValidationState(prev => ({ ...prev, [field]: 'valid' }))
          // Clear any existing error for this field
          setFormErrors(prev => {
            const newErrors = { ...prev }
            const fieldName = field === 'aadhaar' ? 'aadharNumber' : field === 'pan' ? 'panNumber' : 'drivingLicenseNumber'
            delete newErrors[fieldName]
            return newErrors
          })
        } else {
          setValidationState(prev => ({ ...prev, [field]: 'invalid' }))
          const fieldName = field === 'aadhaar' ? 'aadharNumber' : field === 'pan' ? 'panNumber' : 'drivingLicenseNumber'
          setFormErrors(prev => ({
            ...prev,
            [fieldName]: `This ${field.toUpperCase()} is already registered to another rider`
          }))
        }
      } catch (error) {
        console.error(`Error checking ${field} uniqueness:`, error)
        setValidationState(prev => ({ ...prev, [field]: 'idle' }))
      }
    },
    [rider?.id]
  )

  // Check if form is valid and can be submitted
  const isFormValid = useMemo(() => {
    // Check if any validation is still in progress
    const isValidationPending =
      validationState.aadhaar === 'checking' ||
      validationState.pan === 'checking' ||
      validationState.dl === 'checking'

    if (isValidationPending) return false

    // Check if any document validation failed
    const hasValidationErrors =
      validationState.aadhaar === 'invalid' ||
      validationState.pan === 'invalid' ||
      validationState.dl === 'invalid'

    if (hasValidationErrors) return false

    // Check if there are any form errors
    if (Object.keys(formErrors).length > 0) return false

    // Check mandatory fields
    const mandatoryFields = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      dob: formData.dob,
      address1: formData.address1.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      aadharNumber: formData.aadharNumber.trim(),
      panNumber: formData.panNumber.trim(),
      drivingLicenseNumber: formData.drivingLicenseNumber.trim(),
      emergencyName: formData.emergencyName.trim(),
      emergencyPhone: formData.emergencyPhone.trim(),
      emergencyRelation: formData.emergencyRelation.trim(),
    }

    // Check if all mandatory fields are filled
    const allFieldsFilled = Object.values(mandatoryFields).every(value => value !== '')

    return allFieldsFilled
  }, [formData, formErrors, validationState])

  // Load initial data
  useEffect(() => {
    if (open) {
      loadCityStateData() // Load cities and states for form dropdowns
      loadCities() // Load cities for store assignment section
      loadRentalModels()
      if (rider) {
        loadExistingKycDocuments()
      }
    }
  }, [open, rider])

  // Load available EV rental models
  const loadRentalModels = async () => {
    try {
      const models = await getAvailableRentalModels()
      setAvailableModels(models || [])
      console.log('[EnhancedRiderForm] Loaded rental models:', models?.length || 0)
    } catch (error) {
      console.error('[EnhancedRiderForm] Error loading rental models:', error)
      setAvailableModels([]) // Ensure it's always an array even on error
    }
  }

  // Load existing KYC documents for editing
  const loadExistingKycDocuments = async () => {
    if (!rider?.id) return

    try {
      setLoadingKyc(true)
      const response = await riderService.getRiderKYC(rider.id)
      if (response.success) {
        // Update KYC documents state with existing documents
        setKycDocuments(prev => prev.map(doc => {
          const existingDoc = response.data.find(
            (d: RiderKYC) => d.documentType.toLowerCase() === doc.documentType.toLowerCase()
          )
          if (existingDoc) {
            return {
              ...doc,
              documentNumber: existingDoc.documentNumber || '',
              existingDocument: existingDoc,
              uploadStatus: 'success' as const,
            }
          }
          return doc
        }))
      }
    } catch (error) {
      console.error('Error loading existing KYC documents:', error)
    } finally {
      setLoadingKyc(false)
    }
  }

  // Reset form when rider changes
  useEffect(() => {
    if (rider) {
      // Initialize form data with rider info (bankDetails will be loaded separately)
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
        // Force needsEvRental to true if vehicle is assigned
        needsEvRental: rider.assignedVehicle ? true : (rider.needsEvRental ?? false),
        vehiclePreference: rider.vehiclePreference || '',
        preferredVehicleModelId: rider.preferredVehicleModelId || '',
        workType: rider.workType || '',
        ownVehicleType: rider.ownVehicleType || '',
        // Initialize with default bank details (will be overwritten if exists)
        bankDetails: {
          accountHolderName: '',
          accountNumber: '',
          confirmAccountNumber: '',
          accountType: 'SAVINGS',
          ifscCode: '',
          bankName: '',
          branchName: '',
          branchAddress: '',
          isPrimary: false,
          notes: '',
          proofDocument: null,
          proofType: 'PASSBOOK',
        }
      })

      // Load bank details asynchronously and update form
      const loadBankData = async () => {
        try {
          console.log('[EnhancedRiderForm] Loading bank details for rider:', rider.id)
          const response = await riderService.getRiderBankDetails(rider.id)
          if (response.success && response.data && response.data.length > 0) {
            // Get the primary account or the first account
            const primaryBank = response.data.find(b => b.isPrimary) || response.data[0]

            console.log('[EnhancedRiderForm] Loaded bank details:', primaryBank)

            // Store the bank details ID for updates
            setExistingBankDetailsId(primaryBank.id)

            // Update only bank details in form
            setFormData(prev => ({
              ...prev,
              bankDetails: {
                accountHolderName: primaryBank.accountHolderName,
                accountNumber: primaryBank.accountNumber,
                confirmAccountNumber: primaryBank.accountNumber,
                accountType: primaryBank.accountType as 'SAVINGS' | 'CURRENT',
                ifscCode: primaryBank.ifscCode,
                bankName: primaryBank.bankName,
                branchName: primaryBank.branchName || '',
                branchAddress: primaryBank.branchAddress || '',
                isPrimary: primaryBank.isPrimary,
                notes: primaryBank.notes || '',
                proofDocument: null,
                proofType: primaryBank.proofDocumentType as 'PASSBOOK' | 'CANCELLED_CHEQUE' | 'BANK_STATEMENT' || 'PASSBOOK',
              }
            }))

            // Show bank details section if data exists
            setShowBankDetails(true)
          }
        } catch (error) {
          console.error('[EnhancedRiderForm] Error loading bank details:', error)
        }
      }

      loadBankData()

      // Set current EV rental model if exists
      if (rider.preferredVehicleModelId && availableModels.length > 0) {
        const model = availableModels.find(m => m.id === rider.preferredVehicleModelId)
        setSelectedModel(model || null)
      }

      // Load store assignment if exists
      if (rider.assignedStoreId && rider.assignedClientId) {
        setAssignmentNotes(rider.storeAssignmentNotes || '')

        // Fetch client and store details to populate the dropdowns
        const loadStoreAssignment = async () => {
          try {
            console.log('[EnhancedRiderForm] Loading store assignment details:', {
              clientId: rider.assignedClientId,
              storeId: rider.assignedStoreId,
            })

            // Ensure IDs are not null
            if (!rider.assignedClientId || !rider.assignedStoreId) {
              console.warn('[EnhancedRiderForm] Missing client or store ID')
              return
            }

            // Fetch client details first
            const clientResponse = await clientStoreService.getClientById(rider.assignedClientId)
            if (clientResponse.success && clientResponse.data) {
              console.log('[EnhancedRiderForm] Client loaded:', clientResponse.data.name)
              const client = clientResponse.data
              setSelectedClient(client)

              // Set the city based on client's city and load all clients for that city
              if (client.city && client.state) {
                const cityObj = {
                  name: client.city,
                  state: client.state,
                }
                setSelectedCity(cityObj)

                // Load all clients for this city to populate the dropdown
                try {
                  const clientsByCityResponse = await clientStoreService.getClientsByCity(client.city)
                  if (clientsByCityResponse.success) {
                    setClients(clientsByCityResponse.data)
                    console.log('[EnhancedRiderForm] Loaded clients for city:', client.city)
                  }
                } catch (err) {
                  console.error('[EnhancedRiderForm] Error loading clients for city:', err)
                }
              }

              // Load all stores for this client to populate the dropdown
              try {
                const storesByClientResponse = await clientStoreService.getStoresByClient(rider.assignedClientId)
                if (storesByClientResponse.success) {
                  setStores(storesByClientResponse.data)
                  console.log('[EnhancedRiderForm] Loaded stores for client:', client.name)
                }
              } catch (err) {
                console.error('[EnhancedRiderForm] Error loading stores for client:', err)
              }
            }

            // Fetch store details
            const storeResponse = await clientStoreService.getStoreById(rider.assignedStoreId)
            if (storeResponse.success && storeResponse.data) {
              console.log('[EnhancedRiderForm] Store loaded:', storeResponse.data.storeName)
              setSelectedStore(storeResponse.data)
            }

            console.log('[EnhancedRiderForm] ✅ Store assignment details loaded successfully')
          } catch (error) {
            console.error('[EnhancedRiderForm] ❌ Error loading store assignment:', error)
            setStoreAssignmentError('Failed to load store assignment details')
          }
        }

        loadStoreAssignment()
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
        needsEvRental: false,
        vehiclePreference: '',
        preferredVehicleModelId: '',
        ownVehicleType: '',
        bankDetails: {
          accountHolderName: '',
          accountNumber: '',
          confirmAccountNumber: '',
          accountType: 'SAVINGS',
          ifscCode: '',
          bankName: '',
          branchName: '',
          branchAddress: '',
          isPrimary: false,
          notes: '',
          proofDocument: null,
          proofType: 'PASSBOOK',
        }
      })
      setShowBankDetails(false)
      setSelectedCity(null)
      setSelectedClient(null)
      setSelectedStore(null)
      setSelectedModel(null)
      setAssignmentNotes('')
      setStoreAssignmentError('')
      // Clear arrays to reset dropdowns
      setClients([])
      setStores([])
      // Reset KYC documents to default state
      setKycDocuments([
        { documentType: 'aadhaar', documentNumber: '', file: null, uploadStatus: 'idle' },
        { documentType: 'pan', documentNumber: '', file: null, uploadStatus: 'idle' },
        { documentType: 'dl', documentNumber: '', file: null, uploadStatus: 'idle' },
        { documentType: 'selfie', documentNumber: '', file: null, uploadStatus: 'idle' },
      ])
      setKycUploadError('')
    }
  }, [rider, availableModels])

  // Load cities and states for form dropdowns (from vehicle service database)
  const loadCityStateData = async () => {
    console.log('🌆 Loading city and state data for form dropdowns...')
    setLoadingCityData(true)
    try {
      const response = await vehicleService.getCities({ isActive: true })
      console.log('🏙️ Cities from vehicle service:', response)
      if (response.success && response.data) {
        const cities = response.data.map((city: any) => ({
          id: city.id,
          name: city.name,
          displayName: city.displayName || city.name,
          state: city.state
        }))
        setAllCities(cities)

        // Extract unique states
        const uniqueStates = Array.from(new Set(cities.map((c: any) => c.state)))
          .filter(Boolean) as string[]
        setAllStates(uniqueStates.sort())

        console.log(`✅ Loaded ${cities.length} cities and ${uniqueStates.length} states for dropdowns`)
      } else {
        console.error('❌ Failed to load cities from vehicle service:', response)
      }
    } catch (error) {
      console.error('💥 Error loading city/state data:', error)
    } finally {
      setLoadingCityData(false)
    }
  }

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

  // KYC Document Handlers
  const getDocumentTypeDisplay = (documentType: string): string => {
    const documentTypes: Record<string, string> = {
      'aadhaar': 'Aadhaar Card',
      'pan': 'PAN Card',
      'dl': 'Driving License',
      'selfie': 'Identity Selfie',
    }
    return documentTypes[documentType.toLowerCase()] || documentType
  }

  const getDocumentNumberExample = (documentType: string): string => {
    const examples: Record<string, string> = {
      'aadhaar': '1234 5678 9012',
      'pan': 'ABCDE1234F',
      'dl': 'DL-1420110012345',
      'selfie': 'Not applicable',
    }
    return examples[documentType.toLowerCase()] || ''
  }

  const handleKycFileChange = (documentType: string, file: File | null) => {
    setKycDocuments(prev => prev.map(doc =>
      doc.documentType === documentType
        ? { ...doc, file, uploadStatus: 'idle' as const, uploadError: undefined }
        : doc
    ))
  }

  const handleKycDocumentNumberChange = (documentType: string, documentNumber: string) => {
    setKycDocuments(prev => prev.map(doc =>
      doc.documentType === documentType
        ? { ...doc, documentNumber }
        : doc
    ))
  }

  const handleKycFileRemove = (documentType: string) => {
    setKycDocuments(prev => prev.map(doc =>
      doc.documentType === documentType
        ? { ...doc, file: null, uploadStatus: 'idle' as const, uploadError: undefined }
        : doc
    ))
  }

  const uploadKycDocument = async (riderId: string, doc: KYCDocument): Promise<boolean> => {
    if (!doc.file) return true // Skip if no file

    try {
      // Update status to uploading
      setKycDocuments(prev => prev.map(d =>
        d.documentType === doc.documentType
          ? { ...d, uploadStatus: 'uploading' as const, uploadProgress: 0 }
          : d
      ))

      const response = await riderService.submitKYC(
        riderId,
        {
          documentType: doc.documentType,
          documentNumber: doc.documentNumber,
          documentImage: doc.file,
        },
        (progress) => {
          // Update progress
          setKycDocuments(prev => prev.map(d =>
            d.documentType === doc.documentType
              ? { ...d, uploadProgress: progress }
              : d
          ))
        }
      )

      if (response.success) {
        // Update status to success
        setKycDocuments(prev => prev.map(d =>
          d.documentType === doc.documentType
            ? { ...d, uploadStatus: 'success' as const, uploadProgress: 100 }
            : d
        ))
        return true
      } else {
        throw new Error(response.message || 'Upload failed')
      }
    } catch (error: any) {
      console.error(`Error uploading ${doc.documentType}:`, error)
      // Update status to error
      setKycDocuments(prev => prev.map(d =>
        d.documentType === doc.documentType
          ? {
              ...d,
              uploadStatus: 'error' as const,
              uploadError: error.message || 'Upload failed',
              uploadProgress: 0
            }
          : d
      ))
      return false
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

    // Validate bank details if provided
    if (showBankDetails) {
      const bankErrors = validateBankDetails()
      if (Object.keys(bankErrors).length > 0) {
        setBankDetailsErrors(bankErrors)
        return
      }
    }

    try {
      setLoading(true)
      setStoreAssignmentError('')
      setKycUploadError('')

      // Prepare the complete payload with vehicle preference and store assignment
      const riderPayload = {
        ...formData,
        // Include vehicle preference in the main payload
        needsEvRental: formData.needsEvRental,
        vehiclePreference: formData.needsEvRental
          ? 'NEED_EV_RENTAL'
          : (formData.ownVehicleType || undefined),
        preferredVehicleModelId: formData.needsEvRental && selectedModel
          ? selectedModel.id
          : undefined,
        ownVehicleType: !formData.needsEvRental && formData.ownVehicleType
          ? formData.ownVehicleType
          : undefined,
        // Include store assignment if available
        ...(selectedStore && selectedClient ? {
          assignedStoreId: selectedStore.id,
          assignedClientId: selectedClient.id,
          storeAssignmentNotes: assignmentNotes,
        } : {}),
      }

      console.log('[EnhancedRiderForm] Saving rider with complete payload:', riderPayload)

      // Save rider basic information with all fields
      await onSave(riderPayload)

      // If this is an existing rider being edited,
      // and there are KYC documents to upload or bank details to add, we need the rider ID
      if (rider) {
        // Upload KYC documents for existing rider
        const documentsToUpload = kycDocuments.filter(doc => doc.file !== null)

        if (documentsToUpload.length > 0) {
          console.log(`[EnhancedRiderForm] Uploading ${documentsToUpload.length} KYC documents...`)

          const uploadResults = await Promise.allSettled(
            documentsToUpload.map(doc => uploadKycDocument(rider.id, doc))
          )

          const failedUploads = uploadResults.filter(result =>
            result.status === 'rejected' || (result.status === 'fulfilled' && !result.value)
          )

          if (failedUploads.length > 0) {
            setKycUploadError(
              `${failedUploads.length} KYC document(s) failed to upload. The rider was saved but some documents were not uploaded.`
            )
            console.error('[EnhancedRiderForm] Some KYC uploads failed:', failedUploads)
          } else {
            console.log('[EnhancedRiderForm] All KYC documents uploaded successfully')
          }
        }

        // Add or update bank details if provided
        if (showBankDetails && formData.bankDetails) {
          const { accountHolderName, accountNumber, accountType, ifscCode, bankName, branchName, branchAddress, isPrimary, notes, proofDocument, proofType } = formData.bankDetails

          // Only process if at least account number is provided
          if (accountNumber && accountNumber.trim()) {
            try {
              const bankDetailsData: {
                accountHolderName: string;
                accountNumber: string;
                accountType: 'SAVINGS' | 'CURRENT';
                ifscCode: string;
                bankName: string;
                branchName?: string;
                branchAddress?: string;
                isPrimary?: boolean;
                notes?: string;
              } = {
                accountHolderName: (accountHolderName && accountHolderName.trim()) || rider.name || 'Unknown',
                accountNumber: accountNumber.trim(),
                accountType: accountType || 'SAVINGS',
                ifscCode: ifscCode?.trim() || '',
                bankName: bankName?.trim() || '',
                branchName: branchName?.trim(),
                branchAddress: branchAddress?.trim(),
                isPrimary: isPrimary || false,
                notes: notes?.trim(),
              }

              if (existingBankDetailsId) {
                // Update existing bank details
                console.log('[EnhancedRiderForm] Updating existing bank details:', existingBankDetailsId)
                await riderService.updateBankDetails(
                  existingBankDetailsId,
                  bankDetailsData,
                  proofDocument || undefined,
                  proofType || 'PASSBOOK'
                )
                console.log('[EnhancedRiderForm] Bank details updated successfully')
              } else {
                // Add new bank details
                console.log('[EnhancedRiderForm] Adding new bank details for rider...')
                await riderService.addBankDetails(
                  rider.id,
                  bankDetailsData,
                  proofDocument || undefined,
                  proofType || 'PASSBOOK'
                )
                console.log('[EnhancedRiderForm] Bank details added successfully')
              }
            } catch (error) {
              console.error('[EnhancedRiderForm] Failed to save bank details:', error)
              setKycUploadError(
                `The rider was saved but bank details could not be ${existingBankDetailsId ? 'updated' : 'added'}. Please manage them from the rider profile.`
              )
            }
          }
        }
      }

      console.log('✅ Rider saved successfully with vehicle preference and store assignment')
      onClose()
    } catch (error) {
      console.error('❌ Error saving rider:', error)
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon />
          {rider ? 'Edit Rider' : 'Add New Rider'}
        </Box>
      </DialogTitle>

      {/* Rider ID Display - Only show for existing riders */}
      {rider?.publicRiderId && (
        <Box sx={{ px: 3, pb: 2 }}>
          <Alert
            severity="info"
            icon={<BadgeIcon />}
            action={
              <Tooltip title="Copy Rider ID">
                <IconButton
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(rider.publicRiderId!)
                    alert('Rider ID copied to clipboard!')
                  }}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            }
          >
            <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Rider ID: {rider.publicRiderId}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Permanent ID • Share with rider for easy identification
              </Typography>
            </Stack>
          </Alert>
        </Box>
      )}

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
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10) // Only digits, max 10
                        setFormData(prev => ({ ...prev, phone: value }))

                        // Validate on change
                        const error = validatePhoneNumber(value)
                        if (error) {
                          setFormErrors(prev => ({ ...prev, phone: error }))
                        } else {
                          setFormErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.phone
                            return newErrors
                          })
                        }
                      }}
                      error={!!formErrors.phone}
                      helperText={formErrors.phone || 'Enter 10-digit mobile number'}
                      placeholder="e.g., 9876543210"
                      inputProps={{
                        maxLength: 10,
                        inputMode: 'numeric',
                        pattern: '[0-9]*'
                      }}
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
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData(prev => ({ ...prev, dob: value }))

                        // Validate on change
                        const error = validateDateOfBirth(value)
                        if (error) {
                          setFormErrors(prev => ({ ...prev, dob: error }))
                        } else {
                          setFormErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.dob
                            return newErrors
                          })
                        }
                      }}
                      error={!!formErrors.dob}
                      helperText={formErrors.dob || 'Must be at least 18 years old'}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        max: new Date().toISOString().split('T')[0] // Cannot select future dates
                      }}
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
                    <Autocomplete
                      fullWidth
                      options={allCities}
                      getOptionLabel={(option) => option.displayName || option.name}
                      value={allCities.find(c => c.name === formData.city) || null}
                      onChange={(_event, newValue) => {
                        setFormData(prev => ({
                          ...prev,
                          city: newValue?.name || '',
                          state: newValue?.state || prev.state // Auto-fill state when city selected
                        }))
                      }}
                      loading={loadingCityData}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="City"
                          required
                          error={!!formErrors.city}
                          helperText={formErrors.city || 'Select city from list'}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingCityData ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required error={!!formErrors.state}>
                      <InputLabel>State</InputLabel>
                      <Select
                        value={formData.state}
                        label="State"
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      >
                        {allStates.map((state) => (
                          <MenuItem key={state} value={state}>
                            {state}
                          </MenuItem>
                        ))}
                      </Select>
                      {formErrors.state && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {formErrors.state}
                        </Typography>
                      )}
                    </FormControl>
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
                      onChange={(e) => {
                        const aadharValue = e.target.value.replace(/\D/g, '').slice(0, 12)
                        setFormData(prev => ({ ...prev, aadharNumber: aadharValue }))

                        // Check uniqueness after validation passes
                        if (aadharValue.length === 12) {
                          checkUniqueness('aadhaar', aadharValue)
                        } else {
                          setValidationState(prev => ({ ...prev, aadhaar: 'idle' }))
                        }
                      }}
                      error={!!formErrors.aadharNumber || validationState.aadhaar === 'invalid'}
                      helperText={
                        formErrors.aadharNumber
                          ? formErrors.aadharNumber
                          : validationState.aadhaar === 'invalid'
                          ? 'This Aadhaar number is already registered'
                          : '12-digit Aadhar number'
                      }
                      placeholder="123456789012"
                      inputProps={{
                        maxLength: 12,
                        inputMode: 'numeric',
                        pattern: '[0-9]*'
                      }}
                      InputProps={{
                        endAdornment: validationState.aadhaar !== 'idle' && formData.aadharNumber.length === 12 && (
                          <InputAdornment position="end">
                            {validationState.aadhaar === 'checking' && <CircularProgress size={20} />}
                            {validationState.aadhaar === 'valid' && <CheckCircleIcon color="success" />}
                            {validationState.aadhaar === 'invalid' && <ErrorIcon color="error" />}
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="PAN Number"
                      value={formData.panNumber}
                      onChange={(e) => {
                        const panValue = e.target.value.toUpperCase()
                        if (panValue.length <= 10) {
                          setFormData(prev => ({ ...prev, panNumber: panValue }))

                          // Check uniqueness after validation passes
                          if (panValue.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panValue)) {
                            checkUniqueness('pan', panValue)
                          } else {
                            setValidationState(prev => ({ ...prev, pan: 'idle' }))
                          }
                        }
                      }}
                      error={!!formErrors.panNumber || validationState.pan === 'invalid'}
                      helperText={
                        formErrors.panNumber
                          ? formErrors.panNumber
                          : validationState.pan === 'invalid'
                          ? 'This PAN number is already registered'
                          : 'Format: ABCDE1234F'
                      }
                      placeholder="ABCDE1234F"
                      inputProps={{ style: { textTransform: 'uppercase' } }}
                      InputProps={{
                        endAdornment: validationState.pan !== 'idle' && formData.panNumber.length === 10 && (
                          <InputAdornment position="end">
                            {validationState.pan === 'checking' && <CircularProgress size={20} />}
                            {validationState.pan === 'valid' && <CheckCircleIcon color="success" />}
                            {validationState.pan === 'invalid' && <ErrorIcon color="error" />}
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Driving License Number"
                      value={formData.drivingLicenseNumber}
                      onChange={(e) => {
                        const dlValue = e.target.value.trim()
                        setFormData(prev => ({ ...prev, drivingLicenseNumber: dlValue }))

                        // Check uniqueness after validation passes
                        if (dlValue.length >= 8) {
                          checkUniqueness('dl', dlValue)
                        } else {
                          setValidationState(prev => ({ ...prev, dl: 'idle' }))
                        }
                      }}
                      error={!!formErrors.drivingLicenseNumber || validationState.dl === 'invalid'}
                      helperText={
                        formErrors.drivingLicenseNumber
                          ? formErrors.drivingLicenseNumber
                          : validationState.dl === 'invalid'
                          ? 'This Driving License number is already registered'
                          : 'Minimum 8 characters'
                      }
                      placeholder="Enter driving license number"
                      InputProps={{
                        endAdornment: validationState.dl !== 'idle' && formData.drivingLicenseNumber.length >= 8 && (
                          <InputAdornment position="end">
                            {validationState.dl === 'checking' && <CircularProgress size={20} />}
                            {validationState.dl === 'valid' && <CheckCircleIcon color="success" />}
                            {validationState.dl === 'invalid' && <ErrorIcon color="error" />}
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* KYC Document Uploads */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    <DocumentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    KYC Document Uploads
                  </Typography>
                  <Chip
                    label={`${kycDocuments.filter(d => d.file || d.existingDocument).length}/${kycDocuments.length} Documents`}
                    color="primary"
                    size="small"
                  />
                </Box>

                {kycUploadError && (
                  <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setKycUploadError('')}>
                    {kycUploadError}
                  </Alert>
                )}

                {loadingKyc ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {kycDocuments.map((doc) => (
                      <Grid item xs={12} md={6} key={doc.documentType}>
                        <Card variant="outlined">
                          <CardContent>
                            <Stack spacing={2}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1" fontWeight="medium">
                                  {getDocumentTypeDisplay(doc.documentType)}
                                </Typography>
                                {doc.existingDocument && !doc.file && (
                                  <Chip
                                    label="Uploaded"
                                    color="success"
                                    size="small"
                                    icon={<CheckCircleIcon />}
                                  />
                                )}
                                {doc.uploadStatus === 'uploading' && (
                                  <Chip
                                    label="Uploading..."
                                    color="info"
                                    size="small"
                                  />
                                )}
                                {doc.uploadStatus === 'error' && (
                                  <Chip
                                    label="Error"
                                    color="error"
                                    size="small"
                                    icon={<ErrorIcon />}
                                  />
                                )}
                              </Box>

                              <TextField
                                fullWidth
                                label="Document Number (Optional)"
                                value={doc.documentNumber}
                                onChange={(e) => handleKycDocumentNumberChange(doc.documentType, e.target.value)}
                                size="small"
                                placeholder={`e.g., ${getDocumentNumberExample(doc.documentType)}`}
                                helperText="Optional - Can be added later during verification"
                              />

                              {doc.existingDocument && !doc.file ? (
                                <Box>
                                  <Alert severity="info" sx={{ mb: 1 }}>
                                    Document already uploaded on {new Date(doc.existingDocument.createdAt).toLocaleDateString()}
                                  </Alert>
                                  <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<UploadIcon />}
                                    fullWidth
                                    size="small"
                                  >
                                    Replace Document
                                    <input
                                      type="file"
                                      hidden
                                      accept="image/*,.pdf"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleKycFileChange(doc.documentType, file)
                                      }}
                                    />
                                  </Button>
                                </Box>
                              ) : doc.file ? (
                                <Box>
                                  <Alert
                                    severity={doc.uploadStatus === 'error' ? 'error' : 'success'}
                                    sx={{ mb: 1 }}
                                    action={
                                      <IconButton
                                        size="small"
                                        onClick={() => handleKycFileRemove(doc.documentType)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    }
                                  >
                                    {doc.file.name} ({(doc.file.size / 1024).toFixed(1)} KB)
                                    {doc.uploadError && (
                                      <Typography variant="caption" display="block" color="error">
                                        {doc.uploadError}
                                      </Typography>
                                    )}
                                  </Alert>
                                  {doc.uploadStatus === 'uploading' && (
                                    <LinearProgress
                                      variant="determinate"
                                      value={doc.uploadProgress || 0}
                                    />
                                  )}
                                </Box>
                              ) : (
                                <Button
                                  variant="outlined"
                                  component="label"
                                  startIcon={<UploadIcon />}
                                  fullWidth
                                  size="small"
                                >
                                  Upload Document
                                  <input
                                    type="file"
                                    hidden
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) handleKycFileChange(doc.documentType, file)
                                    }}
                                  />
                                </Button>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> KYC documents can be uploaded during rider creation or updated later.
                    Supported formats: Images (JPG, PNG) and PDF. Maximum file size: 10MB.
                  </Typography>
                </Alert>
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
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10) // Only digits, max 10
                        setFormData(prev => ({ ...prev, emergencyPhone: value }))

                        // Validate on change
                        const error = validatePhoneNumber(value)
                        if (error) {
                          setFormErrors(prev => ({ ...prev, emergencyPhone: error }))
                        } else {
                          setFormErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.emergencyPhone
                            return newErrors
                          })
                        }
                      }}
                      error={!!formErrors.emergencyPhone}
                      helperText={formErrors.emergencyPhone || 'Enter 10-digit mobile number'}
                      placeholder="e.g., 9876543210"
                      inputProps={{
                        maxLength: 10,
                        inputMode: 'numeric',
                        pattern: '[0-9]*'
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required error={!!formErrors.emergencyRelation}>
                      <InputLabel>Relation</InputLabel>
                      <Select
                        value={formData.emergencyRelation}
                        label="Relation"
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, emergencyRelation: e.target.value }))
                          // Clear error when value is selected
                          setFormErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.emergencyRelation
                            return newErrors
                          })
                        }}
                      >
                        <MenuItem value="Father">Father</MenuItem>
                        <MenuItem value="Mother">Mother</MenuItem>
                        <MenuItem value="Spouse">Spouse</MenuItem>
                        <MenuItem value="Brother">Brother</MenuItem>
                        <MenuItem value="Sister">Sister</MenuItem>
                        <MenuItem value="Son">Son</MenuItem>
                        <MenuItem value="Daughter">Daughter</MenuItem>
                        <MenuItem value="Friend">Friend</MenuItem>
                        <MenuItem value="Relative">Relative</MenuItem>
                        <MenuItem value="Guardian">Guardian</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                      {formErrors.emergencyRelation && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                          {formErrors.emergencyRelation}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Work Type Section */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Work Schedule
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Work Type</InputLabel>
                      <Select
                        value={formData.workType || ''}
                        label="Work Type"
                        onChange={(e) => setFormData(prev => ({ ...prev, workType: e.target.value as 'FULL_TIME' | 'PART_TIME' | '' }))}
                      >
                        <MenuItem value="">
                          <em>Not Specified</em>
                        </MenuItem>
                        <MenuItem value="FULL_TIME">Full-Time (7+ hours/day)</MenuItem>
                        <MenuItem value="PART_TIME">Part-Time (&lt;7 hours/day)</MenuItem>
                      </Select>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                        Select the rider's work schedule type
                      </Typography>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Bank Details Section */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Bank Account Details
                    <Chip label="Optional" size="small" sx={{ ml: 1 }} />
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showBankDetails}
                        onChange={(e) => setShowBankDetails(e.target.checked)}
                        color="primary"
                        disabled={!rider}
                      />
                    }
                    label={rider ? "Add Bank Details" : "Add Bank Details (Available after creation)"}
                  />
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {!rider
                      ? 'Bank details can be added after creating the rider from their profile page. This information is used for salary payments and reimbursements.'
                      : 'Add bank account details for salary payments and reimbursements. You can add multiple accounts and set one as primary.'
                    }
                  </Typography>
                </Alert>

                {showBankDetails && (
                  <Grid container spacing={2}>
                    {/* Account Holder Name */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Account Holder Name"
                        value={formData.bankDetails?.accountHolderName || ''}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails!,
                              accountHolderName: e.target.value
                            }
                          }))
                          setBankDetailsErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.accountHolderName
                            return newErrors
                          })
                        }}
                        error={!!bankDetailsErrors.accountHolderName}
                        helperText={bankDetailsErrors.accountHolderName || 'Full name as per bank records'}
                        inputProps={{ maxLength: 100 }}
                      />
                    </Grid>

                    {/* Account Type */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Account Type</InputLabel>
                        <Select
                          value={formData.bankDetails?.accountType || 'SAVINGS'}
                          label="Account Type"
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              bankDetails: {
                                ...prev.bankDetails!,
                                accountType: e.target.value as 'SAVINGS' | 'CURRENT'
                              }
                            }))
                          }}
                        >
                          <MenuItem value="SAVINGS">Savings Account</MenuItem>
                          <MenuItem value="CURRENT">Current Account</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Account Number */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Account Number"
                        type="password"
                        value={formData.bankDetails?.accountNumber || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '') // Only digits
                          setFormData(prev => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails!,
                              accountNumber: value
                            }
                          }))
                          setBankDetailsErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.accountNumber
                            return newErrors
                          })
                        }}
                        error={!!bankDetailsErrors.accountNumber}
                        helperText={bankDetailsErrors.accountNumber || '9-18 digit account number'}
                        inputProps={{
                          maxLength: 18,
                          inputMode: 'numeric'
                        }}
                      />
                    </Grid>

                    {/* Confirm Account Number */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Confirm Account Number"
                        type="text"
                        value={formData.bankDetails?.confirmAccountNumber || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '') // Only digits
                          setFormData(prev => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails!,
                              confirmAccountNumber: value
                            }
                          }))
                          setBankDetailsErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.confirmAccountNumber
                            return newErrors
                          })
                        }}
                        error={!!bankDetailsErrors.confirmAccountNumber}
                        helperText={bankDetailsErrors.confirmAccountNumber || 'Re-enter account number'}
                        inputProps={{
                          maxLength: 18,
                          inputMode: 'numeric'
                        }}
                      />
                    </Grid>

                    {/* IFSC Code */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="IFSC Code"
                        value={formData.bankDetails?.ifscCode || ''}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase()
                          setFormData(prev => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails!,
                              ifscCode: value
                            }
                          }))
                          setBankDetailsErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.ifscCode
                            return newErrors
                          })
                        }}
                        error={!!bankDetailsErrors.ifscCode}
                        helperText={bankDetailsErrors.ifscCode || 'e.g., SBIN0001234'}
                        inputProps={{
                          maxLength: 11,
                          style: { textTransform: 'uppercase' }
                        }}
                      />
                    </Grid>

                    {/* Bank Name */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Bank Name"
                        value={formData.bankDetails?.bankName || ''}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails!,
                              bankName: e.target.value
                            }
                          }))
                        }}
                        helperText="Name of the bank"
                        inputProps={{ maxLength: 100 }}
                      />
                    </Grid>

                    {/* Branch Name */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Branch Name"
                        value={formData.bankDetails?.branchName || ''}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails!,
                              branchName: e.target.value
                            }
                          }))
                        }}
                        helperText="Optional"
                        inputProps={{ maxLength: 100 }}
                      />
                    </Grid>

                    {/* Branch Address */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Branch Address"
                        value={formData.bankDetails?.branchAddress || ''}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails!,
                              branchAddress: e.target.value
                            }
                          }))
                        }}
                        helperText="Optional"
                        inputProps={{ maxLength: 200 }}
                      />
                    </Grid>

                    {/* Proof Type */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Proof Document Type</InputLabel>
                        <Select
                          value={formData.bankDetails?.proofType || 'PASSBOOK'}
                          label="Proof Document Type"
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              bankDetails: {
                                ...prev.bankDetails!,
                                proofType: e.target.value as 'PASSBOOK' | 'CANCELLED_CHEQUE' | 'BANK_STATEMENT'
                              }
                            }))
                          }}
                        >
                          <MenuItem value="PASSBOOK">Bank Passbook</MenuItem>
                          <MenuItem value="CANCELLED_CHEQUE">Cancelled Cheque</MenuItem>
                          <MenuItem value="BANK_STATEMENT">Bank Statement</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* File Upload */}
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<CloudUploadIcon />}
                          fullWidth
                          sx={{ height: 56 }}
                        >
                          Upload Proof Document
                          <input
                            type="file"
                            hidden
                            accept="image/*,application/pdf"
                            onChange={handleBankProofFileChange}
                          />
                        </Button>
                        {formData.bankDetails?.proofDocument && (
                          <Box display="flex" alignItems="center" mt={1}>
                            <Typography variant="caption" sx={{ flex: 1 }}>
                              {formData.bankDetails.proofDocument.name}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  bankDetails: {
                                    ...prev.bankDetails!,
                                    proofDocument: null
                                  }
                                }))
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                        {bankDetailsErrors.proofDocument && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                            {bankDetailsErrors.proofDocument}
                          </Typography>
                        )}
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                          JPG, PNG, or PDF (Max 5MB)
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Primary Account */}
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.bankDetails?.isPrimary || false}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                bankDetails: {
                                  ...prev.bankDetails!,
                                  isPrimary: e.target.checked
                                }
                              }))
                            }}
                          />
                        }
                        label="Set as Primary Account"
                      />
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 4 }}>
                        Primary account will be used for salary payments
                      </Typography>
                    </Grid>

                    {/* Notes */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Notes"
                        value={formData.bankDetails?.notes || ''}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails!,
                              notes: e.target.value
                            }
                          }))
                        }}
                        helperText="Optional - Any additional notes about this bank account"
                        inputProps={{ maxLength: 500 }}
                      />
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* EV Rental Vehicle Preference */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <ElectricCarIcon color="primary" />
                  <Typography variant="h6">
                    EV Rental Vehicle Preference
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Indicate if this rider needs an EV rental vehicle and select their preferred model.
                    This information will be used for rental assignment and payment processing.
                  </Typography>
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Needs EV Rental Vehicle?</InputLabel>
                      <Select
                        value={formData.needsEvRental ? 'yes' : 'no'}
                        label="Needs EV Rental Vehicle?"
                        onChange={(e) => {
                          const needsRental = e.target.value === 'yes'

                          setFormData(prev => ({
                            ...prev,
                            needsEvRental: needsRental,
                            // Clear model selection if "No" is selected
                            vehiclePreference: needsRental ? prev.vehiclePreference : '',
                            preferredVehicleModelId: needsRental ? prev.preferredVehicleModelId : '',
                            // Clear own vehicle type if "Yes" is selected
                            ownVehicleType: needsRental ? '' : prev.ownVehicleType,
                          }))

                          // Clear model selection when switching to "No"
                          if (!needsRental) {
                            setSelectedModel(null)
                          }
                        }}
                      >
                        <MenuItem value="no">
                          No - Rider has own vehicle
                        </MenuItem>
                        <MenuItem value="yes">Yes - Rider needs rental vehicle</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Own Vehicle Type - when rider has own vehicle */}
                  {!formData.needsEvRental && (
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Rider's Vehicle Type</InputLabel>
                        <Select
                          value={formData.ownVehicleType || ''}
                          label="Rider's Vehicle Type"
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              ownVehicleType: e.target.value,
                            }))
                          }}
                        >
                          <MenuItem value="">No Preference</MenuItem>
                          <MenuItem value={OwnVehicleType.OWN_VEHICLE}>Own Vehicle</MenuItem>
                          <MenuItem value={OwnVehicleType.RENTED_VEHICLE}>Rented Vehicle</MenuItem>
                          <MenuItem value={OwnVehicleType.CYCLE}>Cycle</MenuItem>
                          <MenuItem value={OwnVehicleType.WALK}>Walk</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  {/* Info message for EV rental riders */}
                  {formData.needsEvRental && (
                    <Grid item xs={12}>
                      <Alert severity="info">
                        <Typography variant="body2">
                          <strong>Vehicle Assignment:</strong> For riders needing EV rental, please use the
                          <strong> Vehicle Assignment</strong> section below to select a hub and assign a vehicle.
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Store Assignment */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Store Assignment {!rider && <Chip label="Optional" size="small" sx={{ ml: 1 }} />}
                  </Typography>
                  {rider && selectedStore && (
                    <Tooltip title="Unassign Store">
                      <IconButton onClick={handleUnassignStore} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {!rider && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      You can optionally assign this rider to a store during creation, or assign them later from the rider list.
                    </Typography>
                  </Alert>
                )}

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
          disabled={loading || !isFormValid}
        >
          {loading ? 'Saving...' : rider ? 'Update Rider' : 'Create Rider'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EnhancedRiderForm
