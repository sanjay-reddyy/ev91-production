import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material'
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Api as ApiIcon,
  Backup as BackupIcon,
  Update as UpdateIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [backupDialogOpen, setBackupDialogOpen] = useState(false)

  // General Settings
  const [systemName, setSystemName] = useState('EV91 Platform')
  const [timezone, setTimezone] = useState('UTC')
  const [language, setLanguage] = useState('en')
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  // Security Settings
  const [passwordExpiry, setPasswordExpiry] = useState(90)
  const [sessionTimeout, setSessionTimeout] = useState(30)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(5)

  // Notification Settings
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(true)
  const [systemAlertsEnabled, setSystemAlertsEnabled] = useState(true)

  // API Settings
  const [apiRateLimit, setApiRateLimit] = useState(1000)
  const [apiTimeout, setApiTimeout] = useState(30)
  const [apiLogging, setApiLogging] = useState(true)

  // Storage Settings
  const [fileUploadLimit, setFileUploadLimit] = useState(10)
  const [storageQuota, setStorageQuota] = useState(100)
  const [autoCleanup, setAutoCleanup] = useState(true)
  const [cleanupDays, setCleanupDays] = useState(30)

  const generalForm = useForm({
    defaultValues: {
      systemName,
      timezone,
      language,
    },
  })

  const handleSaveGeneral = async (data: any) => {
    try {
      setLoading(true)
      setError('')

      // Save general settings
      console.log('Saving general settings:', data)
      setSuccess('General settings saved successfully')

    } catch (error: any) {
      setError(error.message || 'Failed to save general settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSecurity = async () => {
    try {
      setLoading(true)
      setError('')

      const securityData = {
        passwordExpiry,
        sessionTimeout,
        twoFactorAuth,
        loginAttempts,
      }

      console.log('Saving security settings:', securityData)
      setSuccess('Security settings saved successfully')

    } catch (error: any) {
      setError(error.message || 'Failed to save security settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      setLoading(true)
      setError('')

      const notificationData = {
        emailEnabled,
        smsEnabled,
        pushEnabled,
        systemAlertsEnabled,
      }

      console.log('Saving notification settings:', notificationData)
      setSuccess('Notification settings saved successfully')

    } catch (error: any) {
      setError(error.message || 'Failed to save notification settings')
    } finally {
      setLoading(false)
    }
  }

  const handleBackup = async () => {
    try {
      setLoading(true)
      setError('')

      // Simulate backup process
      setTimeout(() => {
        setSuccess('Backup completed successfully')
        setLoading(false)
        setBackupDialogOpen(false)
      }, 2000)

    } catch (error: any) {
      setError(error.message || 'Failed to create backup')
      setLoading(false)
    }
  }

  const systemStats = [
    { label: 'Database Size', value: '2.4 GB', status: 'good' },
    { label: 'Active Users', value: '45', status: 'good' },
    { label: 'API Calls Today', value: '12,456', status: 'good' },
    { label: 'Storage Used', value: '68%', status: 'warning' },
    { label: 'System Uptime', value: '99.8%', status: 'good' },
    { label: 'Last Backup', value: '2 hours ago', status: 'good' },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircleIcon color="success" />
      case 'warning':
        return <WarningIcon color="warning" />
      case 'error':
        return <WarningIcon color="error" />
      default:
        return <InfoIcon color="info" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'success'
      case 'warning':
        return 'warning'
      case 'error':
        return 'error'
      default:
        return 'info'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        System Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="General" icon={<SettingsIcon />} iconPosition="start" />
            <Tab label="Security" icon={<SecurityIcon />} iconPosition="start" />
            <Tab label="Notifications" icon={<NotificationsIcon />} iconPosition="start" />
            <Tab label="API & Storage" icon={<StorageIcon />} iconPosition="start" />
            <Tab label="System Status" icon={<InfoIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {/* General Settings */}
          <Typography variant="h6" gutterBottom>
            General Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Box component="form" onSubmit={generalForm.handleSubmit(handleSaveGeneral)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="systemName"
                  control={generalForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="System Name"
                      value={systemName}
                      onChange={(e) => {
                        field.onChange(e)
                        setSystemName(e.target.value)
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={timezone}
                    label="Timezone"
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="EST">Eastern Time</MenuItem>
                    <MenuItem value="PST">Pacific Time</MenuItem>
                    <MenuItem value="GMT">Greenwich Mean Time</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={language}
                    label="Language"
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                    <MenuItem value="de">German</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                    />
                  }
                  label="Maintenance Mode"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Enable maintenance mode to prevent user access during system updates
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ mr: 2 }}
                >
                  {loading ? <CircularProgress size={20} /> : 'Save General Settings'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Security Settings */}
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password Expiry (days)"
                type="number"
                value={passwordExpiry}
                onChange={(e) => setPasswordExpiry(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Session Timeout (minutes)"
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Login Attempts"
                type="number"
                value={loginAttempts}
                onChange={(e) => setLoginAttempts(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={twoFactorAuth}
                    onChange={(e) => setTwoFactorAuth(e.target.checked)}
                  />
                }
                label="Require Two-Factor Authentication"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleSaveSecurity}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Save Security Settings'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* Notification Settings */}
          <Typography variant="h6" gutterBottom>
            Notification Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                  />
                }
                label="Email Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={smsEnabled}
                    onChange={(e) => setSmsEnabled(e.target.checked)}
                  />
                }
                label="SMS Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={pushEnabled}
                    onChange={(e) => setPushEnabled(e.target.checked)}
                  />
                }
                label="Push Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemAlertsEnabled}
                    onChange={(e) => setSystemAlertsEnabled(e.target.checked)}
                  />
                }
                label="System Alerts"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleSaveNotifications}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Save Notification Settings'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {/* API & Storage Settings */}
          <Typography variant="h6" gutterBottom>
            API & Storage Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Rate Limit (requests/hour)"
                type="number"
                value={apiRateLimit}
                onChange={(e) => setApiRateLimit(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Timeout (seconds)"
                type="number"
                value={apiTimeout}
                onChange={(e) => setApiTimeout(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="File Upload Limit (MB)"
                type="number"
                value={fileUploadLimit}
                onChange={(e) => setFileUploadLimit(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Storage Quota (GB)"
                type="number"
                value={storageQuota}
                onChange={(e) => setStorageQuota(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={apiLogging}
                    onChange={(e) => setApiLogging(e.target.checked)}
                  />
                }
                label="Enable API Logging"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoCleanup}
                    onChange={(e) => setAutoCleanup(e.target.checked)}
                  />
                }
                label="Auto Cleanup Old Files"
              />
              {autoCleanup && (
                <TextField
                  sx={{ ml: 2, mt: 1 }}
                  label="Cleanup after (days)"
                  type="number"
                  size="small"
                  value={cleanupDays}
                  onChange={(e) => setCleanupDays(Number(e.target.value))}
                />
              )}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          {/* System Status */}
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <List>
                {systemStats.map((stat, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {getStatusIcon(stat.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={stat.label}
                      secondary={stat.value}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={stat.status}
                        color={getStatusColor(stat.status) as any}
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Actions
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<BackupIcon />}
                    onClick={() => setBackupDialogOpen(true)}
                    sx={{ mb: 2 }}
                  >
                    Create Backup
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<UpdateIcon />}
                    sx={{ mb: 2 }}
                  >
                    Check Updates
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ApiIcon />}
                  >
                    API Health Check
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Backup Confirmation Dialog */}
      <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)}>
        <DialogTitle>Create System Backup</DialogTitle>
        <DialogContent>
          <Typography>
            This will create a complete backup of the system including database and files.
            The process may take several minutes to complete.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBackup} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Create Backup'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
