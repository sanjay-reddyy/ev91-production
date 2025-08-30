import { useState, useEffect } from 'react'
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
  Avatar,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'

const profileSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().optional(),
})

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
})

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function Profile() {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)

  const profileForm = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
  }, [user, profileForm])

  const onSubmitProfile = async (data: ProfileFormData) => {
    if (!user) return

    try {
      setSubmitting(true)
      setError('')

      const response = await apiService.updateEmployee(user.id, data)
      if (response.success) {
        setSuccess('Profile updated successfully')
        setEditMode(false)
        // Refresh user data would be handled here
      } else {
        throw new Error(response.error || 'Failed to update profile')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      setSubmitting(true)
      setError('')

      // Call password change API (not implemented yet)
      // const response = await apiService.changePassword(data)
      setError('Password change not yet implemented')
      console.log('Password change data:', data)

    } catch (error: any) {
      setError(error.message || 'Failed to change password')
    } finally {
      setSubmitting(false)
      setPasswordDialogOpen(false)
      passwordForm.reset()
    }
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    if (user) {
      profileForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase()
  }

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
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

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Profile Information</Typography>
                <Box>
                  {editMode ? (
                    <>
                      <Button
                        onClick={handleCancelEdit}
                        startIcon={<CancelIcon />}
                        sx={{ mr: 1 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={profileForm.handleSubmit(onSubmitProfile)}
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={submitting}
                      >
                        {submitting ? <CircularProgress size={20} /> : 'Save'}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setEditMode(true)}
                      startIcon={<EditIcon />}
                      variant="outlined"
                    >
                      Edit Profile
                    </Button>
                  )}
                </Box>
              </Box>

              <Box component="form">
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="firstName"
                      control={profileForm.control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="First Name"
                          disabled={!editMode}
                          error={!!profileForm.formState.errors.firstName}
                          helperText={profileForm.formState.errors.firstName?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="lastName"
                      control={profileForm.control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Last Name"
                          disabled={!editMode}
                          error={!!profileForm.formState.errors.lastName}
                          helperText={profileForm.formState.errors.lastName?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="email"
                      control={profileForm.control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Email"
                          type="email"
                          disabled={!editMode}
                          error={!!profileForm.formState.errors.email}
                          helperText={profileForm.formState.errors.email?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="phone"
                      control={profileForm.control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Phone Number"
                          disabled={!editMode}
                          error={!!profileForm.formState.errors.phone}
                          helperText={profileForm.formState.errors.phone?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {getInitials(user.firstName, user.lastName)}
              </Avatar>
              <Typography variant="h6" gutterBottom>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {user.roles && user.roles.length > 0 && (
                  <Chip
                    label={user.roles[0].name}
                    color="primary"
                    size="small"
                    icon={<SecurityIcon />}
                  />
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Details
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="User ID"
                    secondary={user.id.slice(0, 8) + '...'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <BusinessIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Department"
                    secondary={user.department?.name || 'Not assigned'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <GroupIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Team"
                    secondary={user.team?.name || 'Not assigned'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Status"
                    secondary={
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Button
                fullWidth
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={() => setPasswordDialogOpen(true)}
                sx={{ mb: 2 }}
              >
                Change Password
              </Button>

              <Typography variant="subtitle2" gutterBottom>
                Account Security
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last login: {new Date().toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Preferences */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notification Preferences
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                }
                label="Email Notifications"
              />
              <br />
              <FormControlLabel
                control={
                  <Switch
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                  />
                }
                label="Push Notifications"
              />
              <br />
              <FormControlLabel
                control={
                  <Switch
                    checked={securityAlerts}
                    onChange={(e) => setSecurityAlerts(e.target.checked)}
                  />
                }
                label="Security Alerts"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="currentPassword"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Current Password"
                      type="password"
                      error={!!passwordForm.formState.errors.currentPassword}
                      helperText={passwordForm.formState.errors.currentPassword?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="newPassword"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="New Password"
                      type="password"
                      error={!!passwordForm.formState.errors.newPassword}
                      helperText={passwordForm.formState.errors.newPassword?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="confirmPassword"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Confirm New Password"
                      type="password"
                      error={!!passwordForm.formState.errors.confirmPassword}
                      helperText={passwordForm.formState.errors.confirmPassword?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={passwordForm.handleSubmit(onSubmitPassword)}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
