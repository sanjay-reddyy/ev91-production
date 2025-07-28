import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Autocomplete,
  Chip,
  FormHelperText,
} from '@mui/material'
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { apiService } from '../services/api'
import { Team } from '../types/auth'

// Validation schema
const schema = yup.object({
  name: yup
    .string()
    .required('Team name is required')
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name cannot exceed 100 characters'),
  description: yup
    .string()
    .max(500, 'Description cannot exceed 500 characters'),
  departmentId: yup
    .string()
    .required('Department is required'),
  city: yup
    .string()
    .required('City is required')
    .min(2, 'City must be at least 2 characters'),
  country: yup
    .string()
    .required('Country is required'),
  teamLeadId: yup
    .string()
    .nullable(),
  maxMembers: yup
    .number()
    .positive('Max members must be a positive number')
    .integer('Max members must be a whole number')
    .min(1, 'Team must have at least 1 member')
    .max(1000, 'Max members cannot exceed 1000'),
  skills: yup
    .array()
    .of(yup.string()),
  isActive: yup
    .boolean(),
})

interface EditTeamFormData {
  name: string
  description: string
  departmentId: string
  city: string
  country: string
  teamLeadId?: string
  maxMembers: number
  skills: string[]
  isActive: boolean
}

interface Department {
  id: string
  name: string
  description?: string
}

export default function EditTeam() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentsLoading, setDepartmentsLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)

  // Static data
  const countries = [
    'India',
  ]

  const cities = [
    'Bangalore',
    'Chennai',
    'Delhi',
    'Hyderabad',
    'Mumbai',
    'Mysore',
  ]

  const potentialTeamLeads = [
    { id: '1', name: 'John Doe', email: 'john.doe@company.com', department: 'Engineering' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@company.com', department: 'Marketing' },
    { id: '3', name: 'Michael Johnson', email: 'michael.j@company.com', department: 'Sales' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah.wilson@company.com', department: 'HR' },
  ]

  const commonSkills = [
    'Marketing',
    'Sales',
    'Customer Service',
    'Data Analysis',
    'EV Technician',
  ]

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<EditTeamFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      departmentId: '',
      city: '',
      country: '',
      teamLeadId: '',
      maxMembers: 10,
      skills: [],
      isActive: true,
    },
  })

  const selectedDepartment = watch('departmentId')
  const selectedCountry = watch('country')

  // Filter team leads by selected department
  const availableTeamLeads = potentialTeamLeads.filter(lead => {
    const dept = departments.find(d => d.id === selectedDepartment)
    return dept ? lead.department === dept.name : true
  })

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setDepartmentsLoading(true)
        console.log('Fetching departments...')
        const response = await apiService.getDepartments()
        console.log('Departments API response:', response)
        
        if (response.success && response.data) {
          console.log('Setting departments:', response.data)
          setDepartments(response.data)
        } else {
          console.error('Failed to fetch departments:', response.message || response.error)
          setError(`Failed to load departments: ${response.message || response.error || 'Unknown error'}`)
        }
      } catch (error: any) {
        console.error('Error fetching departments:', error)
        setError(`Failed to load departments: ${error.message || 'Network error'}`)
      } finally {
        setDepartmentsLoading(false)
      }
    }

    fetchDepartments()
  }, [])

  // Fetch team data on component mount
  useEffect(() => {
    const fetchTeam = async () => {
      if (!id) {
        setError('Team ID is required')
        setInitialLoading(false)
        return
      }

      try {
        setInitialLoading(true)
        console.log('Fetching team data for ID:', id)
        const response = await apiService.getTeam(id)
        console.log('Team API response:', response)
        
        if (response.success && response.data) {
          const teamData = response.data
          console.log('Team data received:', teamData)
          setTeam(teamData)
          
          // Populate form with existing data
          reset({
            name: teamData.name || '',
            description: teamData.description || '',
            departmentId: teamData.departmentId || '',
            city: teamData.city || '',
            country: teamData.country || '',
            teamLeadId: teamData.teamLeadId || '',
            maxMembers: teamData.maxMembers || 10,
            skills: teamData.skills || [],
            isActive: teamData.isActive !== undefined ? teamData.isActive : true,
          })
          console.log('Form populated with team data')
        } else {
          const errorMessage = response.message || response.error || 'Unknown error'
          console.error('Failed to fetch team - Response:', response)
          setError(`Failed to load team: ${errorMessage}`)
        }
      } catch (error: any) {
        console.error('Error fetching team:', error)
        setError(`Failed to load team: ${error.message || 'Network error'}`)
      } finally {
        setInitialLoading(false)
      }
    }

    fetchTeam()
  }, [id, reset])

  const onSubmit = async (data: EditTeamFormData) => {
    if (!id) {
      setError('Team ID is required')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      // Create team payload matching the updated Team interface
      const teamPayload = {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        departmentId: data.departmentId,
        teamLeadId: data.teamLeadId,
        city: data.city,
        country: data.country,
        maxMembers: data.maxMembers,
        skills: data.skills,
        status: data.isActive ? 'Active' as const : 'Inactive' as const,
      }
      
      const response = await apiService.updateTeam(id, teamPayload)
      
      if (response.success) {
        setSuccess('Team updated successfully!')
        
        // Redirect after success
        setTimeout(() => {
          navigate('/teams')
        }, 2000)
      } else {
        throw new Error(response.message || response.error || 'Failed to update team')
      }
      
    } catch (error: any) {
      console.error('Error updating team:', error)
      setError(error.message || 'Failed to update team')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/teams')
  }

  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading team data...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <EditIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" component="h1">
            Edit Team
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update team information and settings
          </Typography>
          {team && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Editing: {team.name}
            </Typography>
          )}
        </Box>
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Team Name"
                      placeholder="e.g., BLR Supply Team"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      required
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.departmentId} required>
                      <InputLabel>Department</InputLabel>
                      <Select
                        {...field}
                        label="Department"
                        disabled={departmentsLoading}
                      >
                        {departmentsLoading ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Loading departments...
                          </MenuItem>
                        ) : departments.length === 0 ? (
                          <MenuItem disabled>
                            No departments available
                          </MenuItem>
                        ) : (
                          departments.map((dept) => (
                            <MenuItem key={dept.id} value={dept.id}>
                              <Box>
                                <Typography variant="body1">{dept.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {dept.description}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      {errors.departmentId && (
                        <FormHelperText>{errors.departmentId.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      label="Description"
                      placeholder="Describe the team's purpose, goals, and responsibilities..."
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>

              {/* Location Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Location
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={countries}
                      onChange={(_, value) => {
                        field.onChange(value || '')
                        // Reset city when country changes
                        setValue('city', '')
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Country"
                          placeholder="Select country"
                          required
                          error={!!errors.country}
                          helperText={errors.country?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={cities}
                      disabled={!selectedCountry}
                      onChange={(_, value) => field.onChange(value || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="City"
                          placeholder="Select city"
                          required
                          error={!!errors.city}
                          helperText={errors.city?.message || (!selectedCountry ? 'Select country first' : '')}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              {/* Team Configuration */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Team Configuration
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="teamLeadId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Team Lead (Optional)</InputLabel>
                      <Select
                        {...field}
                        label="Team Lead (Optional)"
                        disabled={!selectedDepartment}
                      >
                        <MenuItem value="">
                          <em>No team lead assigned</em>
                        </MenuItem>
                        {availableTeamLeads.map((lead) => (
                          <MenuItem key={lead.id} value={lead.id}>
                            <Box>
                              <Typography variant="body1">{lead.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {lead.email}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {!selectedDepartment ? 'Select department first' : 'Choose a team lead from the selected department'}
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="maxMembers"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Maximum Members"
                      inputProps={{ min: 1, max: 1000 }}
                      error={!!errors.maxMembers}
                      helperText={errors.maxMembers?.message || 'Maximum number of team members'}
                    />
                  )}
                />
              </Grid>

              {/* Skills and Tags */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Skills & Expertise
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      multiple
                      options={commonSkills}
                      freeSolo
                      onChange={(_, value) => field.onChange(value)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                            key={index}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Required Skills"
                          placeholder="Add skills and expertise areas..."
                          helperText="Select or type skills required for this team"
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              {/* Team Status */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Team Status
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        {...field}
                        label="Status"
                        value={field.value ? 'active' : 'inactive'}
                        onChange={(e) => field.onChange(e.target.value === 'active')}
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                      <FormHelperText>
                        Active teams can accept new members and participate in projects
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={loading}
                    startIcon={<CancelIcon />}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {loading ? 'Updating...' : 'Update Team'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}
