import { useState } from 'react'
import { useLocation, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Groups as GroupsIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Store as StoreIcon,
  Person as ClientIcon,
  AttachMoney as EarningsIcon,
  DirectionsBike as VehicleIcon,
  Warning as DamageIcon,
  Factory as OEMIcon,
  DirectionsCar as ModelIcon,
  ExpandLess,
  ExpandMore,
  Inventory as InventoryIcon,
} from '@mui/icons-material'

const drawerWidth = 240

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface MenuItem {
  text: string
  icon: React.ReactNode
  path?: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
  },
  {
    text: 'Users',
    icon: <PeopleIcon />,
    path: '/users',
  },
  {
    text: 'Teams',
    icon: <GroupsIcon />,
    path: '/teams',
  },
  {
    text: 'Departments',
    icon: <BusinessIcon />,
    path: '/departments',
  },
  {
    text: 'Clients',
    icon: <ClientIcon />,
    path: '/clients',
  },
  {
    text: 'Stores',
    icon: <StoreIcon />,
    path: '/stores',
  },
  {
    text: 'Vehicle Management',
    icon: <VehicleIcon />,
    children: [
      {
        text: 'Vehicle Inventory',
        icon: <InventoryIcon />,
        path: '/vehicles',
      },
      {
        text: 'OEM Management',
        icon: <OEMIcon />,
        path: '/oems',
      },
      {
        text: 'Vehicle Models',
        icon: <ModelIcon />,
        path: '/vehicle-models',
      },
      {
        text: 'Damage Management',
        icon: <DamageIcon />,
        path: '/damage',
      },
    ],
  },
  {
    text: 'Rider Earnings',
    icon: <EarningsIcon />,
    path: '/rider-earnings',
  },
  {
    text: 'Roles & Permissions',
    icon: <SecurityIcon />,
    path: '/roles',
  },
  {
    text: 'Profile',
    icon: <AccountCircleIcon />,
    path: '/profile',
  },
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
  },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))
  const [expandedItems, setExpandedItems] = useState<string[]>(['Vehicle Management'])

  const handleToggleExpand = (itemText: string) => {
    setExpandedItems(prev => 
      prev.includes(itemText) 
        ? prev.filter(item => item !== itemText)
        : [...prev, itemText]
    )
  }

  const isPathSelected = (path?: string, children?: MenuItem[]) => {
    if (path) {
      return location.pathname === path
    }
    if (children) {
      return children.some(child => child.path && location.pathname === child.path)
    }
    return false
  }

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.text)
    const isSelected = isPathSelected(item.path, item.children)

    if (hasChildren) {
      return (
        <Box key={item.text}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleToggleExpand(item.text)}
              selected={isSelected}
              sx={{
                pl: 2 + depth * 2,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '20',
                  color: theme.palette.primary.main,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => renderMenuItem(child, depth + 1))}
            </List>
          </Collapse>
        </Box>
      )
    }

    return (
      <ListItem key={item.text} disablePadding>
        <ListItemButton
          component={RouterLink}
          to={item.path!}
          selected={isSelected}
          onClick={isMobile ? onClose : undefined}
          sx={{
            pl: 2 + depth * 2,
            '&.Mui-selected': {
              backgroundColor: theme.palette.primary.main + '20',
              color: theme.palette.primary.main,
              '& .MuiListItemIcon-root': {
                color: theme.palette.primary.main,
              },
            },
          }}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      </ListItem>
    )
  }

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" color="primary" fontWeight="bold">
          EV91 Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map(item => renderMenuItem(item))}
      </List>
    </Box>
  )

  return (
    <Box
      component="nav"
      sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  )
}
