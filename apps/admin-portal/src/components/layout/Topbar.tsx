import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Menu as MenuIcon,
  AccountCircle,
  Notifications,
  Logout,
  Settings,
} from '@mui/icons-material'

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null)

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget)
  }

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null)
  }

  const handleLogout = async () => {
    try {
      await logout()
      handleProfileMenuClose()
    } catch (error) {
      console.error('Logout failed:', error)
      handleProfileMenuClose()
    }
  }

  const menuId = 'primary-search-account-menu'
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={Boolean(anchorEl)}
      onClose={handleProfileMenuClose}
    >
      <MenuItem onClick={handleProfileMenuClose}>
        <AccountCircle sx={{ mr: 1 }} />
        Profile
      </MenuItem>
      <MenuItem onClick={handleProfileMenuClose}>
        <Settings sx={{ mr: 1 }} />
        Settings
      </MenuItem>
      <MenuItem onClick={handleLogout}>
        <Logout sx={{ mr: 1 }} />
        Logout
      </MenuItem>
    </Menu>
  )

  const notificationsMenu = (
    <Menu
      anchorEl={notificationsAnchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={Boolean(notificationsAnchorEl)}
      onClose={handleNotificationsClose}
    >
      <MenuItem onClick={handleNotificationsClose}>
        <Typography variant="body2" color="text.secondary">
          No new notifications
        </Typography>
      </MenuItem>
    </Menu>
  )

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onMenuClick}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {isMobile ? 'EV91' : 'EV91 Admin Dashboard'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notifications */}
            <IconButton
              size="large"
              aria-label="show notifications"
              color="inherit"
              onClick={handleNotificationsOpen}
            >
              <Badge badgeContent={0} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            {/* User Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls={menuId}
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar
                  sx={{ width: 32, height: 32 }}
                  alt={user?.firstName || 'User'}
                  src={user?.avatar}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      {renderMenu}
      {notificationsMenu}
    </Box>
  )
}
