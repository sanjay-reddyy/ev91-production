import { useState } from 'react'
import * as React from 'react'
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
  Security as SecurityIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Store as StoreIcon,
  AttachMoney as EarningsIcon,
  DirectionsBike as VehicleIcon,
  Warning as DamageIcon,
  Factory as OEMIcon,
  DirectionsCar as ModelIcon,
  ExpandLess,
  ExpandMore,
  Inventory as InventoryIcon,
  LocationCity as HubIcon,
  Build as ServiceIcon,
  Inventory2 as SparePartsIcon,
  Assessment as AnalyticsIcon,
  LocalShipping as SuppliersIcon,
  Receipt as PurchaseOrderIcon,
  TrendingUp as TrendsIcon,
  CallMade as OutwardIcon,
  Assignment as RequestIcon,
  CheckCircle as ApprovalIcon,
  Build as InstallationIcon,
  AttachMoney as CostTrackingIcon,
  MergeType as UnifiedServiceIcon,
  LocationOn as CityIcon,
} from '@mui/icons-material'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../contexts/AuthContext'

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
  // Permission requirements - if not specified, item is always visible
  requiredPermission?: {
    service: string
    resource: string
    action: string
  }
  // For items that should only be visible to super admins
  superAdminOnly?: boolean
  // For items that require ANY of multiple permissions
  anyOfPermissions?: Array<{
    service: string
    resource: string
    action: string
  }>
}

const menuItems: MenuItem[] = [
  // 1. Dashboard
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
    // Dashboard is generally accessible to all authenticated users
  },
  // 2. Rider Management (with separate Rider List and Rider Earnings)
  {
    text: 'Rider Management',
    icon: <PeopleIcon />,
    anyOfPermissions: [
      { service: 'rider', resource: 'riders', action: 'read' },
      { service: 'rider', resource: 'riders', action: 'manage' },
      { service: 'rider', resource: 'kyc', action: 'read' },
      { service: 'rider', resource: 'kyc', action: 'verify' },
      { service: 'rider', resource: 'earnings', action: 'read' }
    ],
    children: [
      {
        text: 'Rider List',
        icon: <PeopleIcon />,
        path: '/rider-management',
        anyOfPermissions: [
          { service: 'rider', resource: 'riders', action: 'read' },
          { service: 'rider', resource: 'riders', action: 'manage' },
          { service: 'rider', resource: 'kyc', action: 'read' },
          { service: 'rider', resource: 'kyc', action: 'verify' }
        ]
      },
      {
        text: 'Rider Earnings',
        icon: <EarningsIcon />,
        path: '/rider-earnings',
        anyOfPermissions: [
          { service: 'rider', resource: 'earnings', action: 'read' },
          { service: 'rider', resource: 'riders', action: 'read' },
          { service: 'rider', resource: 'riders', action: 'manage' }
        ]
      }
    ]
  },
  // 3. Vehicle Management
  {
    text: 'Vehicle Management',
    icon: <VehicleIcon />,
    anyOfPermissions: [
      { service: 'vehicle', resource: 'vehicles', action: 'read' },
      { service: 'vehicle', resource: 'maintenance', action: 'read' },
      { service: 'vehicle', resource: 'models', action: 'read' },
      { service: 'vehicle', resource: 'oems', action: 'read' },
      { service: 'vehicle', resource: 'hubs', action: 'read' },
      { service: 'vehicle', resource: 'cities', action: 'read' },
      { service: 'vehicle', resource: 'damage', action: 'read' },
      { service: 'vehicle', resource: 'documents', action: 'read' },
      { service: 'vehicle', resource: 'media', action: 'read' },
      { service: 'vehicle', resource: 'analytics', action: 'read' },
      { service: 'vehicle', resource: 'fleet', action: 'read' },
      { service: 'vehicle', resource: 'tracking', action: 'read' }
    ],
    children: [
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/vehicle-dashboard',
        requiredPermission: {
          service: 'vehicle',
          resource: 'vehicles',
          action: 'read'
        }
      },
      {
        text: 'Vehicle Inventory',
        icon: <InventoryIcon />,
        path: '/vehicles',
        requiredPermission: {
          service: 'vehicle',
          resource: 'vehicles',
          action: 'read'
        }
      },
      {
        text: 'Vehicle Models',
        icon: <ModelIcon />,
        path: '/vehicle-models',
        requiredPermission: {
          service: 'vehicle',
          resource: 'models',
          action: 'read'
        }
      },
      {
        text: 'OEM Management',
        icon: <OEMIcon />,
        path: '/oems',
        requiredPermission: {
          service: 'vehicle',
          resource: 'oems',
          action: 'read'
        }
      },
      {
        text: 'Hub Management',
        icon: <HubIcon />,
        path: '/hubs',
        requiredPermission: {
          service: 'vehicle',
          resource: 'hubs',
          action: 'read'
        }
      },
      {
        text: 'Service & Maintenance',
        icon: <ServiceIcon />,
        path: '/services',
        requiredPermission: {
          service: 'vehicle',
          resource: 'maintenance',
          action: 'read'
        }
      },
      {
        text: 'Unified Service Management',
        icon: <UnifiedServiceIcon />,
        path: '/unified-service',
        anyOfPermissions: [
          { service: 'vehicle', resource: 'maintenance', action: 'read' },
          { service: 'spare-parts', resource: 'service-requests', action: 'read' },
          { service: 'vehicle', resource: 'service-requests', action: 'read' }
        ]
      },
      {
        text: 'Damage Management',
        icon: <DamageIcon />,
        path: '/damage',
        requiredPermission: {
          service: 'vehicle',
          resource: 'damage',
          action: 'read'
        }
      },
      {
        text: 'Document Management',
        icon: <InventoryIcon />,
        path: '/vehicle-documents',
        requiredPermission: {
          service: 'vehicle',
          resource: 'documents',
          action: 'read'
        }
      },
      {
        text: 'Media Management',
        icon: <InventoryIcon />,
        path: '/vehicle-media',
        requiredPermission: {
          service: 'vehicle',
          resource: 'media',
          action: 'read'
        }
      },
      {
        text: 'Fleet Analytics',
        icon: <AnalyticsIcon />,
        path: '/vehicle-analytics',
        requiredPermission: {
          service: 'vehicle',
          resource: 'analytics',
          action: 'read'
        }
      },
      {
        text: 'Fleet Management',
        icon: <VehicleIcon />,
        path: '/fleet-management',
        requiredPermission: {
          service: 'vehicle',
          resource: 'fleet',
          action: 'read'
        }
      },
      {
        text: 'Vehicle Tracking',
        icon: <TrendsIcon />,
        path: '/vehicle-tracking',
        requiredPermission: {
          service: 'vehicle',
          resource: 'tracking',
          action: 'read'
        }
      },
    ],
  },
  // 4. Spare Parts Management
  {
    text: 'Spare Parts Management',
    icon: <SparePartsIcon />,
    anyOfPermissions: [
      { service: 'spare-parts', resource: 'parts', action: 'read' },
      { service: 'spare-parts', resource: 'inventory', action: 'read' },
      { service: 'spare-parts', resource: 'suppliers', action: 'read' },
      { service: 'spare-parts', resource: 'purchase-orders', action: 'read' },
      { service: 'spare-parts', resource: 'analytics', action: 'read' },
      { service: 'spare-parts', resource: 'dashboard', action: 'read' },
      { service: 'spare-parts', resource: 'categories', action: 'read' }
    ],
    children: [
      {
        text: 'Dashboard',
        icon: <TrendsIcon />,
        path: '/spare-parts/dashboard',
        requiredPermission: {
          service: 'spare-parts',
          resource: 'dashboard',
          action: 'read'
        }
      },
      {
        text: 'Parts Inventory',
        icon: <SparePartsIcon />,
        path: '/spare-parts',
        requiredPermission: {
          service: 'spare-parts',
          resource: 'parts',
          action: 'read'
        }
      },
      {
        text: 'Categories',
        icon: <InventoryIcon />,
        path: '/spare-parts/categories',
        requiredPermission: {
          service: 'spare-parts',
          resource: 'categories',
          action: 'read'
        }
      },
      {
        text: 'Stock Management',
        icon: <InventoryIcon />,
        path: '/spare-parts/stock',
        requiredPermission: {
          service: 'spare-parts',
          resource: 'inventory',
          action: 'read'
        }
      },
      {
        text: 'Suppliers',
        icon: <SuppliersIcon />,
        path: '/spare-parts/suppliers',
        requiredPermission: {
          service: 'spare-parts',
          resource: 'suppliers',
          action: 'read'
        }
      },
      {
        text: 'Purchase Orders',
        icon: <PurchaseOrderIcon />,
        path: '/spare-parts/purchase-orders',
        requiredPermission: {
          service: 'spare-parts',
          resource: 'purchase-orders',
          action: 'read'
        }
      },
      {
        text: 'Analytics',
        icon: <AnalyticsIcon />,
        path: '/spare-parts/analytics',
        requiredPermission: {
          service: 'spare-parts',
          resource: 'analytics',
          action: 'read'
        }
      },
      {
        text: 'Outward Flow',
        icon: <OutwardIcon />,
        anyOfPermissions: [
          { service: 'spare-parts', resource: 'outward-flow', action: 'read' },
          { service: 'spare-parts', resource: 'service-requests', action: 'read' },
          { service: 'spare-parts', resource: 'part-requests', action: 'read' },
          { service: 'spare-parts', resource: 'approvals', action: 'read' },
          { service: 'spare-parts', resource: 'installations', action: 'read' },
          { service: 'spare-parts', resource: 'cost-tracking', action: 'read' }
        ],
        children: [
          {
            text: 'Overview',
            icon: <TrendsIcon />,
            path: '/spare-parts/outward',
            requiredPermission: {
              service: 'spare-parts',
              resource: 'outward-flow',
              action: 'read'
            }
          },
          {
            text: 'Service Requests',
            icon: <RequestIcon />,
            path: '/spare-parts/outward/service-requests',
            requiredPermission: {
              service: 'spare-parts',
              resource: 'service-requests',
              action: 'read'
            }
          },
          {
            text: 'Part Requests',
            icon: <SparePartsIcon />,
            path: '/spare-parts/outward/part-requests',
            requiredPermission: {
              service: 'spare-parts',
              resource: 'part-requests',
              action: 'read'
            }
          },
          {
            text: 'Approvals',
            icon: <ApprovalIcon />,
            path: '/spare-parts/outward/approvals',
            requiredPermission: {
              service: 'spare-parts',
              resource: 'approvals',
              action: 'read'
            }
          },
          {
            text: 'Installations',
            icon: <InstallationIcon />,
            path: '/spare-parts/outward/installations',
            requiredPermission: {
              service: 'spare-parts',
              resource: 'installations',
              action: 'read'
            }
          },
          {
            text: 'Cost Tracking',
            icon: <CostTrackingIcon />,
            path: '/spare-parts/outward/cost-tracking',
            requiredPermission: {
              service: 'spare-parts',
              resource: 'cost-tracking',
              action: 'read'
            }
          },
        ]
      },
    ],
  },
  // 5. Clients & Stores
  {
    text: 'Clients & Stores',
    icon: <StoreIcon />,
    path: '/clients',
    anyOfPermissions: [
      { service: 'client', resource: 'clients', action: 'read' },
      { service: 'client', resource: 'stores', action: 'read' }
    ]
  },
  // 6. Employee Management
  {
    text: 'Employee Management',
    icon: <PeopleIcon />,
    path: '/employees',
    anyOfPermissions: [
      { service: 'auth', resource: 'employees', action: 'read' },
      { service: 'auth', resource: 'users', action: 'read' },
      { service: 'auth', resource: 'employees', action: 'manage' }
    ]
  },
  // 7. Team and Department
  {
    text: 'Teams & Departments',
    icon: <GroupsIcon />,
    path: '/teams',
    anyOfPermissions: [
      { service: 'auth', resource: 'teams', action: 'read' },
      { service: 'auth', resource: 'teams', action: 'manage' },
      { service: 'auth', resource: 'departments', action: 'read' },
      { service: 'auth', resource: 'departments', action: 'manage' }
    ]
  },
  // 8. City Management
  {
    text: 'City Management',
    icon: <CityIcon />,
    anyOfPermissions: [
      { service: 'vehicle', resource: 'cities', action: 'read' },
      { service: 'vehicle', resource: 'cities', action: 'manage' },
      { service: 'vehicle', resource: 'cities', action: 'create' },
      { service: 'vehicle', resource: 'cities', action: 'update' },
      { service: 'vehicle', resource: 'cities', action: 'delete' }
    ],
    children: [
      {
        text: 'City Dashboard',
        icon: <DashboardIcon />,
        path: '/city-dashboard',
        requiredPermission: {
          service: 'vehicle',
          resource: 'cities',
          action: 'read'
        }
      },
      {
        text: 'City Management',
        icon: <CityIcon />,
        path: '/cities',
        requiredPermission: {
          service: 'vehicle',
          resource: 'cities',
          action: 'read'
        }
      },
    ],
  },
  // 9. Roles and Permissions
  {
    text: 'Roles & Permissions',
    icon: <SecurityIcon />,
    path: '/roles',
    anyOfPermissions: [
      { service: 'auth', resource: 'roles', action: 'read' },
      { service: 'auth', resource: 'permissions', action: 'read' }
    ]
  },
  // 10. Profile
  {
    text: 'Profile',
    icon: <AccountCircleIcon />,
    path: '/profile',
    // Profile is always accessible to authenticated users
  },
  // 11. Settings
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    superAdminOnly: true
  },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { hasPermission, hasAnyOfPermissions, isSuperAdmin, getUserPermissions } = usePermissions()
  const { user } = useAuth()

  // Debug logging for permission issues
  React.useEffect(() => {
    console.log('🐛 Sidebar Debug - User:', user?.email, user?.firstName, user?.lastName)
    console.log('🐛 Sidebar Debug - User roles:', user?.roles?.map(r => r.name))
    console.log('🐛 Sidebar Debug - Is Super Admin:', isSuperAdmin())
    console.log('🐛 Sidebar Debug - User permissions count:', getUserPermissions().length)
    console.log('🐛 Sidebar Debug - First 10 permissions:', getUserPermissions().slice(0, 10).map(p => `${p.service}:${p.resource}:${p.action}`))

    // Test specific permissions
    const testPermissions = [
      { service: 'auth', resource: 'users', action: 'read' },
      { service: 'auth', resource: 'teams', action: 'read' },
      { service: 'client', resource: 'clients', action: 'read' },
      { service: 'vehicle', resource: 'vehicles', action: 'read' },
      { service: 'spare-parts', resource: 'parts', action: 'read' }
    ]

    console.log('🐛 Sidebar Debug - Permission tests:')
    testPermissions.forEach(perm => {
      const hasIt = hasPermission(perm.service, perm.resource, perm.action)
      console.log(`   ${hasIt ? '✅' : '❌'} ${perm.service}:${perm.resource}:${perm.action}`)
    })
  }, [user, hasPermission, getUserPermissions, isSuperAdmin])

  // Filter menu items based on permissions
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(item => {
        // Super Admin has access to everything - bypass all checks
        if (isSuperAdmin()) {
          console.log(`🐛 Super Admin access granted for: ${item.text}`)
          return true
        }

        // For non-super admin users, also check if user email is admin@ev91.com (fallback)
        if (user?.email === 'admin@ev91.com') {
          console.log(`🐛 Admin email fallback access granted for: ${item.text}`)
          return true
        }

        // Check super admin requirement
        if (item.superAdminOnly && !isSuperAdmin()) {
          console.log(`🐛 Super admin required, access denied for: ${item.text}`)
          return false
        }

        // Check single permission requirement
        if (item.requiredPermission) {
          const { service, resource, action } = item.requiredPermission
          const hasIt = hasPermission(service, resource, action)
          console.log(`🐛 ${item.text} - Required permission ${service}:${resource}:${action}: ${hasIt ? '✅' : '❌'}`)
          return hasIt
        }

        // Check multiple permission requirements (any of)
        if (item.anyOfPermissions) {
          const hasAny = hasAnyOfPermissions(item.anyOfPermissions)
          console.log(`🐛 ${item.text} - Any of permissions: ${hasAny ? '✅' : '❌'}`)
          return hasAny
        }

        // If no permission requirements, show the item
        console.log(`🐛 ${item.text} - No permission requirements, showing`)
        return true
      })
      .map(item => ({
        ...item,
        // Recursively filter children
        children: item.children ? filterMenuItems(item.children) : undefined
      }))
      .filter(item => {
        // Remove items with children if all children are filtered out
        if (item.children) {
          return item.children.length > 0
        }
        return true
      })
  }

  const filteredMenuItems = filterMenuItems(menuItems)

  console.log(`🐛 Sidebar Debug - Filtered menu items (${filteredMenuItems.length}):`, filteredMenuItems.map(item => item.text))

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
        {filteredMenuItems.map(item => renderMenuItem(item))}
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
