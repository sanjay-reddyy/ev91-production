import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Skeleton,
  Card,
  CardContent,
  Grid,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  CircularProgress,
  Snackbar,
  TablePagination,
  Switch,
  FormControlLabel,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  LocationCity as LocationCityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Save as SaveIcon,
  ElectricCar as ElectricCarIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Import types and services
import {
  Client,
  Store,
  ClientFormData,
  StoreFormData,
  ClientStats,
  StoreStats,
  AccountManager,
  CLIENT_TYPES,
  CLIENT_STATUSES,
  CLIENT_PRIORITIES,
  INDUSTRY_SECTORS,
  BUSINESS_CATEGORIES,
  STORE_TYPES,
  STORE_STATUSES,
  CHARGING_STATION_TYPES,
  City,
  ClientFilters,
  StoreFilters,
} from '../types/clientStore';
import * as clientStoreService from '../services/clientStoreService';
import { getAccountManagers } from '../services/clientStore';

// Tab Panel Component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`client-store-tabpanel-${index}`}
      aria-labelledby={`client-store-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Validation schemas
const clientSchema = yup.object({
  clientCode: yup.string().required('Client code is required').min(2).max(20),
  clientType: yup.string().required('Client type is required'),
  name: yup.string().required('Client name is required').min(2).max(100),
  primaryContactPerson: yup.string().max(100),
  email: yup.string().email('Invalid email format').max(100),
  phone: yup.string().matches(/^[+]?[\d\s\-\(\)]{10,15}$/, 'Invalid phone number format'),
  city: yup.string(),
  state: yup.string(),
  clientStatus: yup.string().required('Client status is required'),
  pan: yup.string().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
  gst: yup.string().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format'),
  baseOrderRate: yup.number().required('Base order rate is required').min(0, 'Base order rate must be non-negative'),
  clientPriority: yup.string(),
  accountManagerId: yup.string(),
  industrySector: yup.string(),
  businessCategory: yup.string(),
});

const storeSchema = yup.object({
  clientId: yup.string().required('Client is required'),
  storeName: yup.string().required('Store name is required').min(2).max(100),
  storeCode: yup.string().required('Store code is required').min(2).max(20),
  storeType: yup.string().required('Store type is required'),
  completeAddress: yup.string().required('Complete address is required').min(10).max(500),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  pinCode: yup.string().required('PIN code is required').matches(/^[0-9]{6}$/, 'Invalid PIN code'),
  latitude: yup.number().nullable().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  longitude: yup.number().nullable().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  contactNumber: yup.string().matches(/^[+]?[\d\s\-\(\)]{10,15}$/, 'Invalid phone number format'),
  storeStatus: yup.string().required('Store status is required'),
});

// Default form values for clients
const DEFAULT_CLIENT_VALUES: ClientFormData = {
  clientCode: '',
  clientType: '',
  name: '',
  primaryContactPerson: '',
  designation: '',
  email: '',
  secondaryEmail: '',
  phone: '',
  secondaryPhone: '',
  city: '',
  state: '',
  pinCode: '',
  registrationNumber: '',
  panNumber: '',
  gstNumber: '',
  industrySector: '',
  businessCategory: '',
  evPortfolio: '',
  fleetSize: undefined,
  hasChargingInfra: false,
  chargingInfraDetails: '',
  batteryTechPreference: '',
  serviceRequirements: '',
  paymentTerms: '',
  preferredPaymentMethod: '',
  taxCategory: '',
  discountCategory: '',
  baseOrderRate: 0,
  rateEffectiveDate: '',
  rateType: 'fixed',
  minimumRate: undefined,
  maximumRate: undefined,
  bulkBonusEnabled: false,
  bulkOrdersThreshold: undefined,
  bulkBonusAmount: undefined,
  bulkResetPeriod: 'daily',
  weeklyBonusEnabled: false,
  weeklyOrderTarget: undefined,
  weeklyBonusAmount: undefined,
  performanceMultiplierEnabled: false,
  topPerformerRate: undefined,
  performanceCriteria: 'rating',
  paymentCycle: 'weekly',
  paymentMethods: '',
  minimumPayout: undefined,
  payoutDay: 'Friday',
  clientStatus: 'active',
  acquisitionDate: '',
  accountManagerId: '',
  clientPriority: 'medium',
  relationshipType: 'Direct',
};

// Default form values for stores
const DEFAULT_STORE_VALUES: StoreFormData = {
  clientId: '',
  storeName: '',
  storeCode: '',
  storeType: '',
  completeAddress: '',
  city: '',
  state: '',
  pinCode: '',
  latitude: undefined,
  longitude: undefined,
  contactNumber: '',
  emailAddress: '',
  contactPersonName: '',
  deliveryRadius: undefined,
  isEVChargingAvailable: false,
  chargingStationType: '',
  chargingPower: undefined,
  minimumOrderAmount: undefined,
  deliveryFee: undefined,
  commission: undefined,
  storeStatus: 'active',
};

const ClientStoreManagement: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Client state
  const [clients, setClients] = useState<Client[]>([]);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Store state
  const [stores, setStores] = useState<Store[]>([]);
  const [storeStats, setStoreStats] = useState<StoreStats | null>(null);
  const [storeDialogOpen, setStoreDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  // Dropdown data
  const [cities, setCities] = useState<City[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [accountManagers, setAccountManagers] = useState<AccountManager[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [clientOptions, setClientOptions] = useState<Client[]>([]);
  const [loadingCoordinates, setLoadingCoordinates] = useState(false);

  // Client filters and pagination
  const [clientFilters, setClientFilters] = useState<ClientFilters>({
    search: '',
    clientType: '',
    clientStatus: '',
    city: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [clientTotalCount, setClientTotalCount] = useState(0);

  // Store filters and pagination
  const [storeFilters, setStoreFilters] = useState<StoreFilters>({
    search: '',
    clientId: '',
    storeType: '',
    storeStatus: '',
    city: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [storeTotalCount, setStoreTotalCount] = useState(0);

  // Client form
  const {
    control: clientControl,
    handleSubmit: handleClientSubmit,
    formState: { errors: clientErrors },
    reset: resetClient,
    watch: watchClient,
  } = useForm<ClientFormData>({
    resolver: yupResolver(clientSchema),
    defaultValues: DEFAULT_CLIENT_VALUES,
  });

  // Store form
  const {
    control: storeControl,
    handleSubmit: handleStoreSubmit,
    formState: { errors: storeErrors },
    reset: resetStore,
    watch: watchStore,
    setValue: setStoreValue,
  } = useForm<StoreFormData>({
    resolver: yupResolver(storeSchema),
    defaultValues: DEFAULT_STORE_VALUES,
  });

  const watchedClientState = watchClient('state');
  const watchedStoreState = watchStore('state');

  // Load dropdown data
  const loadDropdownData = useCallback(async () => {
    try {
      setLoadingDropdowns(true);
      const [citiesResponse, statesResponse, clientsResponse, accountManagersResponse] = await Promise.all([
        clientStoreService.getCities(),
        clientStoreService.getStates(),
        clientStoreService.getClients({ limit: 1000 }), // For store form client dropdown
        getAccountManagers(),
      ]);

      if (citiesResponse.success) {
        setCities(citiesResponse.data);
      }

      if (statesResponse.success) {
        setStates(statesResponse.data);
      }

      if (clientsResponse.success) {
        setClientOptions(clientsResponse.data);
      }

      if (accountManagersResponse.success) {
        setAccountManagers(accountManagersResponse.data);
      }
    } catch (err) {
      console.error('Error loading dropdown data:', err);
    } finally {
      setLoadingDropdowns(false);
    }
  }, []);

  // Load clients
  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const [clientsResponse, statsResponse] = await Promise.all([
        clientStoreService.getClients(clientFilters),
        clientStoreService.getClientStats(),
      ]);

      if (clientsResponse.success) {
        setClients(clientsResponse.data);
        setClientTotalCount(clientsResponse.pagination?.totalItems || 0);
      }

      if (statsResponse.success) {
        setClientStats(statsResponse.data as ClientStats);
      }
    } catch (err: any) {
      console.error('Error loading clients:', err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [clientFilters]);

  // Load stores
  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      const [storesResponse, statsResponse] = await Promise.all([
        clientStoreService.getStores(storeFilters),
        clientStoreService.getStoreStats(),
      ]);

      if (storesResponse.success) {
        setStores(storesResponse.data);
        setStoreTotalCount(storesResponse.pagination?.totalItems || 0);
      }

      if (statsResponse.success) {
        setStoreStats(statsResponse.data as StoreStats);
      }
    } catch (err: any) {
      console.error('Error loading stores:', err);
      setError('Failed to load stores');
    } finally {
      setLoading(false);
    }
  }, [storeFilters]);

  // Initial load
  useEffect(() => {
    loadDropdownData();
  }, [loadDropdownData]);

  useEffect(() => {
    if (activeTab === 0) {
      loadClients();
    } else {
      loadStores();
    }
  }, [activeTab, loadClients, loadStores]);

  // Reset form when dialog opens for new client to prevent cached data
  useEffect(() => {
    if (clientDialogOpen && !editingClient) {
      // Use a small timeout to ensure the dialog is fully rendered
      const timeoutId = setTimeout(() => {
        resetClient(DEFAULT_CLIENT_VALUES, { keepDefaultValues: true });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [clientDialogOpen, editingClient, resetClient]);

  // Reset form when dialog opens for new store to prevent cached data
  useEffect(() => {
    if (storeDialogOpen && !editingStore) {
      // Use a small timeout to ensure the dialog is fully rendered
      const timeoutId = setTimeout(() => {
        resetStore(DEFAULT_STORE_VALUES, { keepDefaultValues: true });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [storeDialogOpen, editingStore, resetStore]);

  // Client handlers
  const handleAddClient = () => {
    setEditingClient(null);
    resetClient(DEFAULT_CLIENT_VALUES, { keepDefaultValues: true });
    setClientDialogOpen(true);
  };

  const handleCloseClientDialog = () => {
    setClientDialogOpen(false);
    setEditingClient(null);
    resetClient(DEFAULT_CLIENT_VALUES, { keepDefaultValues: true });
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    resetClient({
      clientCode: client.clientCode || '',
      clientType: client.clientType || '',
      name: client.name || '',
      primaryContactPerson: client.primaryContactPerson || '',
      designation: client.designation || '',
      email: client.email || '',
      secondaryEmail: client.secondaryEmail || '',
      phone: client.phone || '',
      secondaryPhone: client.secondaryPhone || '',
      city: client.city || '',
      state: client.state || '',
      pinCode: client.pinCode || '',
      registrationNumber: client.registrationNumber || '',
      panNumber: client.panNumber || '',
      gstNumber: client.gstNumber || '',
      industrySector: client.industrySector || '',
      businessCategory: client.businessCategory || '',
      evPortfolio: client.evPortfolio || '',
      fleetSize: client.fleetSize || undefined,
      hasChargingInfra: client.hasChargingInfra || false,
      chargingInfraDetails: client.chargingInfraDetails || '',
      batteryTechPreference: client.batteryTechPreference || '',
      serviceRequirements: client.serviceRequirements || '',
      paymentTerms: client.paymentTerms || '',
      preferredPaymentMethod: client.preferredPaymentMethod || '',
      taxCategory: client.taxCategory || '',
      discountCategory: client.discountCategory || '',
      baseOrderRate: client.baseOrderRate || 0,
      rateEffectiveDate: client.rateEffectiveDate || '',
      rateType: client.rateType || 'fixed',
      minimumRate: client.minimumRate || undefined,
      maximumRate: client.maximumRate || undefined,
      bulkBonusEnabled: client.bulkBonusEnabled || false,
      bulkOrdersThreshold: client.bulkOrdersThreshold || undefined,
      bulkBonusAmount: client.bulkBonusAmount || undefined,
      bulkResetPeriod: client.bulkResetPeriod || 'daily',
      weeklyBonusEnabled: client.weeklyBonusEnabled || false,
      weeklyOrderTarget: client.weeklyOrderTarget || undefined,
      weeklyBonusAmount: client.weeklyBonusAmount || undefined,
      performanceMultiplierEnabled: client.performanceMultiplierEnabled || false,
      topPerformerRate: client.topPerformerRate || undefined,
      performanceCriteria: client.performanceCriteria || 'rating',
      paymentCycle: client.paymentCycle || 'weekly',
      paymentMethods: client.paymentMethods || '',
      minimumPayout: client.minimumPayout || undefined,
      payoutDay: client.payoutDay || 'Friday',
      clientStatus: client.clientStatus || 'active',
      acquisitionDate: client.acquisitionDate || '',
      accountManagerId: client.accountManagerId || '',
      clientPriority: client.clientPriority || 'medium',
      relationshipType: client.relationshipType || 'Direct',
    });
    setClientDialogOpen(true);
  };

  const handleArchiveClient = async (client: Client, archive: boolean) => {
    try {
      setLoading(true);
      setError('');

      // Only send essential fields for update, avoiding internal DB fields
      const updatedData = {
        clientStatus: archive ? 'archived' : 'active',
        // Include required fields
        clientCode: client.clientCode,
        clientType: client.clientType,
        name: client.name,
        baseOrderRate: client.baseOrderRate,
        // Include other basic updatable fields
        primaryContactPerson: client.primaryContactPerson,
        email: client.email,
        phone: client.phone,
        city: client.city,
        state: client.state,
        pinCode: client.pinCode,
      };

      const result = await clientStoreService.updateClient(client.id, updatedData);
      if (result.success) {
        setSuccess(`Client ${archive ? 'archived' : 'unarchived'} successfully`);
        await loadClients();
      } else {
        setError(result.message || `Failed to ${archive ? 'archive' : 'unarchive'} client`);
      }
    } catch (err: any) {
      console.error('Archive client error:', err);
      if (err.name === 'AuthenticationError') {
        setError('Your session has expired. Please refresh the page to continue.');
        // Optionally auto-refresh after a delay
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setError(err.response?.data?.message || err.message || `Failed to ${archive ? 'archive' : 'unarchive'} client`);
      }
    } finally {
      setLoading(false);
    }
  };

  const onClientSubmit = async (data: ClientFormData) => {
    try {
      setLoading(true);
      setError('');

      if (editingClient) {
        const result = await clientStoreService.updateClient(editingClient.id, data);
        if (result.success) {
          setSuccess('Client updated successfully');
        } else {
          setError(result.message || 'Failed to update client');
          return;
        }
      } else {
        const result = await clientStoreService.createClient(data);
        if (result.success) {
          setSuccess('Client created successfully');
        } else {
          setError(result.message || 'Failed to create client');
          return;
        }
      }

      setClientDialogOpen(false);
      setEditingClient(null);
      resetClient(DEFAULT_CLIENT_VALUES, { keepDefaultValues: true });
      await loadClients();
    } catch (err: any) {
      console.error('Client submission error:', err);
      if (err.name === 'AuthenticationError') {
        setError('Your session has expired. The page will refresh automatically in 3 seconds...');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to save client');
      }
    } finally {
      setLoading(false);
    }
  };

  // Store handlers
  const handleAddStore = () => {
    setEditingStore(null);
    resetStore(DEFAULT_STORE_VALUES, { keepDefaultValues: true });
    setStoreDialogOpen(true);
  };

  const handleCloseStoreDialog = () => {
    setStoreDialogOpen(false);
    setEditingStore(null);
    resetStore(DEFAULT_STORE_VALUES, { keepDefaultValues: true });
  };

  const handleEditStore = (store: Store) => {
    setEditingStore(store);
    resetStore({
      clientId: store.clientId || '',
      storeName: store.storeName || '',
      storeCode: store.storeCode || '',
      storeType: store.storeType || '',
      completeAddress: store.completeAddress || '',
      city: store.city || '',
      state: store.state || '',
      pinCode: store.pinCode || '',
      latitude: store.latitude || undefined,
      longitude: store.longitude || undefined,
      contactNumber: store.contactNumber || '',
      emailAddress: store.emailAddress || '',
      // Map backend field storeManagerName to frontend field contactPersonName
      contactPersonName: (store as any).storeManagerName || store.contactPersonName || '',
      deliveryRadius: store.deliveryRadius || undefined,
      isEVChargingAvailable: store.isEVChargingAvailable || false,
      chargingStationType: store.chargingStationType || '',
      chargingPower: store.chargingPower || undefined,
      minimumOrderAmount: store.minimumOrderAmount || undefined,
      deliveryFee: store.deliveryFee || undefined,
      commission: store.commission || undefined,
      storeStatus: store.storeStatus || 'active',
    });
    setStoreDialogOpen(true);
  };

  const handleViewStoreDetails = (store: Store) => {
    // TODO: Navigate to store details or show details modal
    console.log('Viewing store details:', store.id);
  };

  const handleArchiveStore = async (store: Store, archive: boolean) => {
    try {
      setLoading(true);
      setError('');

      // Only send essential fields for update, avoiding internal DB fields and relations
      const updatedData = {
        storeStatus: archive ? 'archived' : 'active',
        // Include required fields
        clientId: store.clientId,
        storeName: store.storeName,
        storeCode: store.storeCode,
        storeType: store.storeType,
        completeAddress: store.completeAddress,
        city: store.city,
        state: store.state,
        pinCode: store.pinCode,
        // Include other basic updatable fields if they exist
        latitude: store.latitude,
        longitude: store.longitude,
        contactNumber: store.contactNumber,
        emailAddress: store.emailAddress,
        contactPersonName: store.contactPersonName,
        deliveryRadius: store.deliveryRadius,
        isEVChargingAvailable: store.isEVChargingAvailable,
        chargingStationType: store.chargingStationType,
        chargingPower: store.chargingPower,
        minimumOrderAmount: store.minimumOrderAmount,
        deliveryFee: store.deliveryFee,
        commission: store.commission,
      };

      const result = await clientStoreService.updateStore(store.id, updatedData);
      if (result.success) {
        setSuccess(`Store ${archive ? 'archived' : 'unarchived'} successfully`);
        await loadStores();
      } else {
        setError(result.message || `Failed to ${archive ? 'archive' : 'unarchive'} store`);
      }
    } catch (err: any) {
      console.error('Archive store error:', err);
      setError(err.response?.data?.message || `Failed to ${archive ? 'archive' : 'unarchive'} store`);
    } finally {
      setLoading(false);
    }
  };

  const onStoreSubmit = async (data: StoreFormData) => {
    try {
      setLoading(true);
      setError('');

      if (editingStore) {
        const result = await clientStoreService.updateStore(editingStore.id, data);
        if (result.success) {
          setSuccess('Store updated successfully');
        } else {
          setError(result.message || 'Failed to update store');
          return;
        }
      } else {
        const result = await clientStoreService.createStore(data);
        if (result.success) {
          setSuccess('Store created successfully');
        } else {
          setError(result.message || 'Failed to create store');
          return;
        }
      }

      setStoreDialogOpen(false);
      setEditingStore(null);
      resetStore(DEFAULT_STORE_VALUES, { keepDefaultValues: true });
      await loadStores();
    } catch (err: any) {
      console.error('Store submission error:', err);
      if (err.name === 'AuthenticationError') {
        setError('Your session has expired. The page will refresh automatically in 3 seconds...');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to save store');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle getting coordinates from address
  const handleGetCoordinates = async () => {
    try {
      setLoadingCoordinates(true);
      setError('');

      const address = watchStore('completeAddress');
      const city = watchStore('city');
      const state = watchStore('state');
      const pinCode = watchStore('pinCode');

      // More flexible validation - allow partial addresses
      if (!address && !city && !state) {
        setError('Please fill in at least the address or city and state to get coordinates');
        return;
      }

      // Use available information to build the best possible address
      const searchQuery = [address, city, state, pinCode].filter(Boolean).join(', ');

      if (!searchQuery.trim()) {
        setError('Please provide some address information to search for coordinates');
        return;
      }

      console.log('🔍 Searching coordinates for:', searchQuery);

      const result = await clientStoreService.getCoordinatesFromAddress(
        address || '',
        city || '',
        state || '',
        pinCode || ''
      );

      if (result.success && result.data) {
        // Set the coordinates in the form
        setStoreValue('latitude', result.data.latitude);
        setStoreValue('longitude', result.data.longitude);
        setSuccess(`Coordinates found: ${result.data.latitude.toFixed(6)}, ${result.data.longitude.toFixed(6)}`);
      } else {
        setError(result.error || 'Could not find coordinates for this address');
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
      setError('Failed to fetch coordinates. Please try again.');
    } finally {
      setLoadingCoordinates(false);
    }
  };

  // Filter cities based on selected state
  const clientFilteredCities = useMemo(() => {
    if (!watchedClientState) return cities;
    return cities.filter(city => city.state === watchedClientState);
  }, [cities, watchedClientState]);

  const storeFilteredCities = useMemo(() => {
    if (!watchedStoreState) return cities;
    return cities.filter(city => city.state === watchedStoreState);
  }, [cities, watchedStoreState]);

  // Status color helpers
  const getStatusColor = (status: string): 'success' | 'default' | 'error' | 'warning' => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      case 'maintenance': return 'warning';
      case 'onboarding': return 'warning';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'success' | 'default' => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Clients & Stores
      </Typography>

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="client store tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            label={
              <Badge badgeContent={clientTotalCount} color="primary" max={999}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  Clients
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={storeTotalCount} color="secondary" max={999}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StoreIcon />
                  Stores
                </Box>
              </Badge>
            }
          />
        </Tabs>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mx: 3, mt: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* CLIENT TAB */}
        <TabPanel value={activeTab} index={0}>
          {/* Client Stats Cards */}
          {clientStats && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {clientStats.totalClients}
                        </Typography>
                        <Typography color="text.secondary">Total Clients</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {clientStats.activeClients}
                        </Typography>
                        <Typography color="text.secondary">Active Clients</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <StoreIcon sx={{ fontSize: 40, color: 'info.main' }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {clientStats.totalStores}
                        </Typography>
                        <Typography color="text.secondary">Total Stores</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <LocationCityIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {clientStats.citiesServed}
                        </Typography>
                        <Typography color="text.secondary">Cities Served</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Client Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search clients..."
                  value={clientFilters.search || ''}
                  onChange={(e) => setClientFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={clientFilters.clientType || ''}
                    label="Type"
                    onChange={(e) => setClientFilters(prev => ({ ...prev, clientType: e.target.value, page: 1 }))}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {CLIENT_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={clientFilters.clientStatus || ''}
                    label="Status"
                    onChange={(e) => setClientFilters(prev => ({ ...prev, clientStatus: e.target.value, page: 1 }))}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    {CLIENT_STATUSES.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={2}>
                <Autocomplete
                  size="small"
                  options={cities}
                  getOptionLabel={(option) => `${option.name}, ${option.state}`}
                  value={cities.find(c => c.name === clientFilters.city) || null}
                  onChange={(_, newValue) => setClientFilters(prev => ({ ...prev, city: newValue?.name || '', page: 1 }))}
                  renderInput={(params) => <TextField {...params} label="City" />}
                  loading={loadingDropdowns}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddClient}
                  fullWidth
                >
                  Add Client
                </Button>
              </Grid>
              <Grid item xs={12} md={1}>
                <Tooltip title="Refresh">
                  <IconButton onClick={loadClients} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Paper>

          {/* Client Data Table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Client Code</TableCell>
                    <TableCell>Client Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Stores</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from({ length: clientFilters.limit || 10 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 8 }).map((_, cellIndex) => (
                          <TableCell key={cellIndex}><Skeleton /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : clients.length > 0 ? (
                    clients.map((client) => (
                      <TableRow key={client.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {client.clientCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {client.name}
                            </Typography>
                            {client.primaryContactPerson && (
                              <Typography variant="body2" color="text.secondary">
                                {client.primaryContactPerson}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={client.clientType.charAt(0).toUpperCase() + client.clientType.slice(1)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            {client.email && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <EmailIcon fontSize="small" color="disabled" />
                                <Typography variant="body2">{client.email}</Typography>
                              </Stack>
                            )}
                            {client.phone && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <PhoneIcon fontSize="small" color="disabled" />
                                <Typography variant="body2">{client.phone}</Typography>
                              </Stack>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {client.city && client.state ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <LocationCityIcon fontSize="small" color="disabled" />
                              <Typography variant="body2">
                                {client.city}, {client.state}
                              </Typography>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not specified
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Chip
                              label={client.clientStatus.charAt(0).toUpperCase() + client.clientStatus.slice(1)}
                              color={getStatusColor(client.clientStatus)}
                              size="small"
                            />
                            {client.clientPriority && (
                              <Chip
                                label={client.clientPriority.charAt(0).toUpperCase() + client.clientPriority.slice(1)}
                                color={getPriorityColor(client.clientPriority)}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" color="primary">
                            {client.storeCount || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit Client">
                            <IconButton size="small" onClick={() => handleEditClient(client)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={client.clientStatus === 'active' ? 'Archive Client' : 'Unarchive Client'}>
                            <IconButton
                              size="small"
                              color={client.clientStatus === 'active' ? 'warning' : 'success'}
                              onClick={() => handleArchiveClient(client, client.clientStatus === 'active')}
                            >
                              {client.clientStatus === 'active' ? <ArchiveIcon /> : <UnarchiveIcon />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Typography color="text.secondary">
                          No clients found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Client Pagination */}
            {clientTotalCount > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={clientTotalCount}
                rowsPerPage={clientFilters.limit || 10}
                page={(clientFilters.page || 1) - 1}
                onPageChange={(_, newPage) => setClientFilters(prev => ({ ...prev, page: newPage + 1 }))}
                onRowsPerPageChange={(e) => setClientFilters(prev => ({
                  ...prev,
                  limit: parseInt(e.target.value, 10),
                  page: 1
                }))}
              />
            )}
          </Paper>
        </TabPanel>

        {/* STORE TAB */}
        <TabPanel value={activeTab} index={1}>
          {/* Store Stats Cards */}
          {storeStats && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <StoreIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {storeStats.totalStores}
                        </Typography>
                        <Typography color="text.secondary">Total Stores</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {storeStats.activeStores}
                        </Typography>
                        <Typography color="text.secondary">Active Stores</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <ElectricCarIcon sx={{ fontSize: 40, color: 'info.main' }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {storeStats.storesWithEV || 0}
                        </Typography>
                        <Typography color="text.secondary">EV Enabled</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocationCityIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {storeStats.averageDeliveryRadius?.toFixed(1) || 0}km
                        </Typography>
                        <Typography color="text.secondary">Avg. Delivery Radius</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Store Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search stores..."
                  value={storeFilters.search || ''}
                  onChange={(e) => setStoreFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <Autocomplete
                  size="small"
                  options={clientOptions}
                  getOptionLabel={(option) => option.name}
                  value={clientOptions.find(c => c.id === storeFilters.clientId) || null}
                  onChange={(_, newValue) => setStoreFilters(prev => ({ ...prev, clientId: newValue?.id || '', page: 1 }))}
                  renderInput={(params) => <TextField {...params} label="Client" />}
                  loading={loadingDropdowns}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={storeFilters.storeType || ''}
                    label="Type"
                    onChange={(e) => setStoreFilters(prev => ({ ...prev, storeType: e.target.value, page: 1 }))}
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
              <Grid item xs={6} md={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={storeFilters.storeStatus || ''}
                    label="Status"
                    onChange={(e) => setStoreFilters(prev => ({ ...prev, storeStatus: e.target.value, page: 1 }))}
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
              <Grid item xs={6} md={2}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddStore}
                  fullWidth
                >
                  Add Store
                </Button>
              </Grid>
              <Grid item xs={12} md={1}>
                <Tooltip title="Refresh">
                  <IconButton onClick={loadStores} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Paper>

          {/* Store Data Table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Store Code</TableCell>
                    <TableCell>Store Name</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>EV Charging</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from({ length: storeFilters.limit || 10 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 8 }).map((_, cellIndex) => (
                          <TableCell key={cellIndex}><Skeleton /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : stores.length > 0 ? (
                    stores.map((store) => (
                      <TableRow key={store.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {store.storeCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {store.storeName}
                            </Typography>
                            {store.contactPersonName && (
                              <Typography variant="body2" color="text.secondary">
                                {store.contactPersonName}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {store.client ? (
                            <Typography variant="body2">
                              {store.client.name}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Unknown Client
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={store.storeType.charAt(0).toUpperCase() + store.storeType.slice(1)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <LocationCityIcon fontSize="small" color="disabled" />
                            <Box>
                              <Typography variant="body2">
                                {store.city}, {store.state}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                PIN: {store.pinCode}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {store.isEVChargingAvailable ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <ElectricCarIcon fontSize="small" color="success" />
                              <Typography variant="body2" color="success.main">
                                Available
                              </Typography>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not Available
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={store.storeStatus.charAt(0).toUpperCase() + store.storeStatus.slice(1)}
                            color={getStatusColor(store.storeStatus)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit Store">
                            <IconButton size="small" onClick={() => handleEditStore(store)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={store.storeStatus === 'active' ? 'Archive Store' : 'Unarchive Store'}>
                            <IconButton
                              size="small"
                              color={store.storeStatus === 'active' ? 'warning' : 'success'}
                              onClick={() => handleArchiveStore(store, store.storeStatus === 'active')}
                            >
                              {store.storeStatus === 'active' ? <ArchiveIcon /> : <UnarchiveIcon />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Typography color="text.secondary">
                          No stores found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Store Pagination */}
            {storeTotalCount > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={storeTotalCount}
                rowsPerPage={storeFilters.limit || 10}
                page={(storeFilters.page || 1) - 1}
                onPageChange={(_, newPage) => setStoreFilters(prev => ({ ...prev, page: newPage + 1 }))}
                onRowsPerPageChange={(e) => setStoreFilters(prev => ({
                  ...prev,
                  limit: parseInt(e.target.value, 10),
                  page: 1
                }))}
              />
            )}
          </Paper>
        </TabPanel>
      </Paper>

      {/* CLIENT FORM DIALOG */}
      <Dialog
        open={clientDialogOpen}
        onClose={handleCloseClientDialog}
        maxWidth="md"
        fullWidth
        keepMounted={false}
      >
        <form onSubmit={handleClientSubmit(onClientSubmit)}>
          <DialogTitle>
            {editingClient ? 'Edit Client' : 'Add New Client'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* Client Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="clientCode"
                  control={clientControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Client Code"
                      error={!!clientErrors.clientCode}
                      helperText={clientErrors.clientCode?.message}
                      required
                      placeholder="e.g. REST001"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="clientType"
                  control={clientControl}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!clientErrors.clientType}>
                      <InputLabel required>Client Type</InputLabel>
                      <Select {...field} label="Client Type">
                        {CLIENT_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                      {clientErrors.clientType && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {clientErrors.clientType.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={clientControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Client Name"
                      error={!!clientErrors.name}
                      helperText={clientErrors.name?.message}
                      required
                      placeholder="Enter client business name"
                    />
                  )}
                />
              </Grid>

              {/* Client Contact Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Contact Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="primaryContactPerson"
                  control={clientControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Primary Contact Person"
                      error={!!clientErrors.primaryContactPerson}
                      helperText={clientErrors.primaryContactPerson?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={clientControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      error={!!clientErrors.email}
                      helperText={clientErrors.email?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={clientControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone"
                      error={!!clientErrors.phone}
                      helperText={clientErrors.phone?.message}
                    />
                  )}
                />
              </Grid>

              {/* Client Location */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Location Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="state"
                  control={clientControl}
                  render={({ field }) => (
                    <Autocomplete
                      options={states}
                      value={field.value || null}
                      onChange={(_, newValue) => field.onChange(newValue || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="State"
                          error={!!clientErrors.state}
                          helperText={clientErrors.state?.message}
                        />
                      )}
                      loading={loadingDropdowns}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="city"
                  control={clientControl}
                  render={({ field }) => (
                    <Autocomplete
                      options={clientFilteredCities}
                      getOptionLabel={(option) => option.name}
                      value={clientFilteredCities.find(c => c.name === field.value) || null}
                      onChange={(_, newValue) => field.onChange(newValue?.name || '')}
                      disabled={!watchedClientState}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="City"
                          error={!!clientErrors.city}
                          helperText={clientErrors.city?.message || (!watchedClientState ? 'Select state first' : '')}
                        />
                      )}
                      loading={loadingDropdowns}
                    />
                  )}
                />
              </Grid>

              {/* Client Status */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Status & Settings
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="clientStatus"
                  control={clientControl}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!clientErrors.clientStatus}>
                      <InputLabel required>Status</InputLabel>
                      <Select {...field} label="Status">
                        {CLIENT_STATUSES.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                      {clientErrors.clientStatus && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {clientErrors.clientStatus.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="clientPriority"
                  control={clientControl}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select {...field} label="Priority">
                        <MenuItem value="">Not Set</MenuItem>
                        {CLIENT_PRIORITIES.map((priority) => (
                          <MenuItem key={priority} value={priority}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Business Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Business Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="panNumber"
                  control={clientControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="PAN Number"
                      error={!!clientErrors.panNumber}
                      helperText={clientErrors.panNumber?.message}
                      placeholder="ABCDE1234F"
                      inputProps={{
                        style: { textTransform: 'uppercase' }
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="gstNumber"
                  control={clientControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="GST Number"
                      error={!!clientErrors.gstNumber}
                      helperText={clientErrors.gstNumber?.message}
                      placeholder="22AAAAA0000A1Z5"
                      inputProps={{
                        style: { textTransform: 'uppercase' }
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="industrySector"
                  control={clientControl}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Industry Sector</InputLabel>
                      <Select {...field} label="Industry Sector">
                        <MenuItem value="">Not Set</MenuItem>
                        {INDUSTRY_SECTORS.map((sector) => (
                          <MenuItem key={sector} value={sector}>
                            {sector}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="businessCategory"
                  control={clientControl}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Business Category</InputLabel>
                      <Select {...field} label="Business Category">
                        <MenuItem value="">Not Set</MenuItem>
                        {BUSINESS_CATEGORIES.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="baseOrderRate"
                  control={clientControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Base Order Rate (₹)"
                      type="number"
                      error={!!clientErrors.baseOrderRate}
                      helperText={clientErrors.baseOrderRate?.message}
                      inputProps={{
                        min: 0,
                        step: 0.01
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="accountManagerId"
                  control={clientControl}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Account Manager</InputLabel>
                      <Select {...field} label="Account Manager">
                        <MenuItem value="">Not Assigned</MenuItem>
                        {accountManagers.map((manager) => (
                          <MenuItem key={manager.id} value={manager.id}>
                            {manager.firstName} {manager.lastName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseClientDialog} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {loading ? 'Saving...' : (editingClient ? 'Update Client' : 'Create Client')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* STORE FORM DIALOG */}
      <Dialog
        open={storeDialogOpen}
        onClose={handleCloseStoreDialog}
        maxWidth="lg"
        fullWidth
        keepMounted={false}
      >
        <form onSubmit={handleStoreSubmit(onStoreSubmit)}>
          <DialogTitle>
            {editingStore ? 'Edit Store' : 'Add New Store'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* Store Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="clientId"
                  control={storeControl}
                  render={({ field }) => (
                    <Autocomplete
                      options={clientOptions}
                      getOptionLabel={(option) => option.name}
                      value={clientOptions.find(c => c.id === field.value) || null}
                      onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Client"
                          error={!!storeErrors.clientId}
                          helperText={storeErrors.clientId?.message}
                          required
                        />
                      )}
                      loading={loadingDropdowns}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="storeCode"
                  control={storeControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Store Code"
                      error={!!storeErrors.storeCode}
                      helperText={storeErrors.storeCode?.message}
                      required
                      placeholder="e.g. STR001"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="storeName"
                  control={storeControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Store Name"
                      error={!!storeErrors.storeName}
                      helperText={storeErrors.storeName?.message}
                      required
                      placeholder="Enter store name"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="storeType"
                  control={storeControl}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!storeErrors.storeType}>
                      <InputLabel required>Store Type</InputLabel>
                      <Select {...field} label="Store Type">
                        {STORE_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                      {storeErrors.storeType && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {storeErrors.storeType.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Store Location */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Location Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="completeAddress"
                  control={storeControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Complete Address"
                      multiline
                      rows={3}
                      error={!!storeErrors.completeAddress}
                      helperText={storeErrors.completeAddress?.message}
                      required
                      placeholder="Enter complete store address"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="state"
                  control={storeControl}
                  render={({ field }) => (
                    <Autocomplete
                      options={states}
                      value={field.value || null}
                      onChange={(_, newValue) => field.onChange(newValue || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="State"
                          error={!!storeErrors.state}
                          helperText={storeErrors.state?.message}
                          required
                        />
                      )}
                      loading={loadingDropdowns}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="city"
                  control={storeControl}
                  render={({ field }) => (
                    <Autocomplete
                      options={storeFilteredCities}
                      getOptionLabel={(option) => option.name}
                      value={storeFilteredCities.find(c => c.name === field.value) || null}
                      onChange={(_, newValue) => field.onChange(newValue?.name || '')}
                      disabled={!watchedStoreState}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="City"
                          error={!!storeErrors.city}
                          helperText={storeErrors.city?.message || (!watchedStoreState ? 'Select state first' : '')}
                          required
                        />
                      )}
                      loading={loadingDropdowns}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="pinCode"
                  control={storeControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="PIN Code"
                      error={!!storeErrors.pinCode}
                      helperText={storeErrors.pinCode?.message}
                      required
                      placeholder="e.g. 560001"
                    />
                  )}
                />
              </Grid>

              {/* Geo Coordinates Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Geo Coordinates
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="latitude"
                  control={storeControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Latitude"
                      type="number"
                      inputProps={{ step: "any" }}
                      placeholder="e.g. 12.9716"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="longitude"
                  control={storeControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Longitude"
                      type="number"
                      inputProps={{ step: "any" }}
                      placeholder="e.g. 77.5946"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ height: '56px' }}
                  onClick={handleGetCoordinates}
                  disabled={loadingCoordinates}
                  startIcon={loadingCoordinates ? <CircularProgress size={20} /> : <LocationCityIcon />}
                >
                  {loadingCoordinates ? 'Getting Coordinates...' : 'Get Coordinates'}
                </Button>
              </Grid>

              {/* Store Contact */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Contact Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="contactPersonName"
                  control={storeControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Contact Person Name"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="contactNumber"
                  control={storeControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Contact Number"
                      error={!!storeErrors.contactNumber}
                      helperText={storeErrors.contactNumber?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="emailAddress"
                  control={storeControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email Address"
                      type="email"
                    />
                  )}
                />
              </Grid>

              {/* EV Charging */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  EV Charging & Settings
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="isEVChargingAvailable"
                  control={storeControl}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value || false}
                          onChange={field.onChange}
                        />
                      }
                      label="EV Charging Available"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="chargingStationType"
                  control={storeControl}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Charging Station Type</InputLabel>
                      <Select {...field} label="Charging Station Type">
                        <MenuItem value="">Not Specified</MenuItem>
                        {CHARGING_STATION_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="storeStatus"
                  control={storeControl}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!storeErrors.storeStatus}>
                      <InputLabel required>Status</InputLabel>
                      <Select {...field} label="Status">
                        {STORE_STATUSES.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                      {storeErrors.storeStatus && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {storeErrors.storeStatus.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseStoreDialog} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {loading ? 'Saving...' : (editingStore ? 'Update Store' : 'Create Store')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientStoreManagement;
