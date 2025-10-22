import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  People as PeopleIcon,
  Groups as GroupsIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import {
  getUserDepartment,
  getDefaultDashboard,
  getGreeting
} from '../utils/dashboardHelpers'
import { DepartmentType } from '../types/department'

// Mock data - replace with real API calls
const statsData = [
  {
    title: 'Total Employees',
    value: '1,234',
    change: '+12%',
    icon: <PeopleIcon />,
    color: '#2196f3',
  },
  {
    title: 'Active Teams',
    value: '89',
    change: '+5%',
    icon: <GroupsIcon />,
    color: '#4caf50',
  },
  {
    title: 'Departments',
    value: '15',
    change: '+2%',
    icon: <BusinessIcon />,
    color: '#ff9800',
  },
  {
    title: 'Roles Assigned',
    value: '456',
    change: '+8%',
    icon: <SecurityIcon />,
    color: '#9c27b0',
  },
]

const recentActivities = [
  {
    id: 1,
    user: 'John Doe',
    action: 'Joined Marketing Team',
    time: '2 hours ago',
    avatar: '/avatars/john.jpg',
  },
  {
    id: 2,
    user: 'Jane Smith',
    action: 'Role updated to Manager',
    time: '4 hours ago',
    avatar: '/avatars/jane.jpg',
  },
  {
    id: 3,
    user: 'Mike Johnson',
    action: 'New department created',
    time: '6 hours ago',
    avatar: '/avatars/mike.jpg',
  },
  {
    id: 4,
    user: 'Sarah Wilson',
    action: 'Profile updated',
    time: '8 hours ago',
    avatar: '/avatars/sarah.jpg',
  },
]

const quickActions = [
  {
    title: 'Add New Employee',
    description: 'Create a new employee account',
    action: 'Create Employee',
    link: '/employees',
  },
  {
    title: 'Create Team',
    description: 'Set up a new team',
    action: 'Create Team',
    link: '/teams/new',
  },
  {
    title: 'Manage Roles',
    description: 'Configure user roles and permissions',
    action: 'Manage Roles',
    link: '/roles',
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Redirect users to their department-specific dashboard
    if (user) {
      const userDepartment = getUserDepartment(user)

      if (userDepartment && userDepartment !== DepartmentType.MANAGEMENT) {
        // Redirect to department-specific dashboard
        setIsRedirecting(true)
        const dashboardRoute = getDefaultDashboard(user)

        // Small delay for smooth transition
        setTimeout(() => {
          navigate(dashboardRoute, { replace: true })
        }, 500)
      }
    }
  }, [user, navigate])

  // Show loading while redirecting
  if (isRedirecting) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Redirecting to your dashboard...
        </Typography>
      </Box>
    )
  }

  // Welcome message with user name
  const userName = user ? `${user.firstName} ${user.lastName}` : 'User'
  const greeting = getGreeting()

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {greeting}, {userName}!
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome to the EV91 Admin Dashboard. Here's an overview of your platform.
      </Typography>

      {/* Alert for department users */}
      {user && getUserDepartment(user) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have been granted access to specific department dashboards. Navigate using the sidebar menu.
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: stat.color,
                      width: 48,
                      height: 48,
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
                  <Typography
                    variant="body2"
                    sx={{ color: 'success.main', fontWeight: 'medium' }}
                  >
                    {stat.change}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    from last month
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              {recentActivities.map((activity) => (
                <ListItem key={activity.id} divider>
                  <ListItemAvatar>
                    <Avatar alt={activity.user} src={activity.avatar}>
                      {activity.user.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={activity.user}
                    secondary={activity.action}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {activity.time}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {quickActions.map((action, index) => (
                <Card key={index} variant="outlined">
                  <CardContent sx={{ pb: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate(action.link)}
                    >
                      {action.action}
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* System Health */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Health
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    API Response Time
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={85}
                    sx={{ mb: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    85ms avg
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Database Health
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={92}
                    color="success"
                    sx={{ mb: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Excellent
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Server Load
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={45}
                    color="info"
                    sx={{ mb: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    45% CPU
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Memory Usage
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={67}
                    color="warning"
                    sx={{ mb: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    67% RAM
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
