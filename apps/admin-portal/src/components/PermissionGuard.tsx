import React, { ReactNode } from 'react'
import { Alert, Typography } from '@mui/material'
import { Security as SecurityIcon } from '@mui/icons-material'
import { usePermissions, PermissionCheck } from '../hooks/usePermissions'

interface PermissionGuardProps {
  children: ReactNode
  service: string
  resource: string
  action: string
  fallback?: ReactNode
  showError?: boolean
  errorMessage?: string
}

interface MultiplePermissionGuardProps {
  children: ReactNode
  permissions: PermissionCheck[]
  requireAll?: boolean // If true, requires ALL permissions. If false, requires ANY permission
  fallback?: ReactNode
  showError?: boolean
  errorMessage?: string
}

// Single permission guard
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  service,
  resource,
  action,
  fallback = null,
  showError = false,
  errorMessage,
}) => {
  const { hasPermission, getRequiredPermission } = usePermissions()

  const hasAccess = hasPermission(service, resource, action)

  if (hasAccess) {
    return <>{children}</>
  }

  if (showError) {
    const defaultErrorMessage = errorMessage ||
      `Access denied. Required permission: ${getRequiredPermission(service, resource, action)}`

    return (
      <Alert
        severity="error"
        sx={{ m: 2 }}
        icon={<SecurityIcon />}
      >
        <Typography variant="h6" gutterBottom>
          Insufficient Permissions
        </Typography>
        <Typography variant="body2">
          {defaultErrorMessage}
        </Typography>
      </Alert>
    )
  }

  return <>{fallback}</>
}

// Multiple permissions guard
export const MultiplePermissionGuard: React.FC<MultiplePermissionGuardProps> = ({
  children,
  permissions,
  requireAll = true,
  fallback = null,
  showError = false,
  errorMessage,
}) => {
  const { hasPermissions, hasAnyOfPermissions } = usePermissions()

  const hasAccess = requireAll
    ? hasPermissions(permissions)
    : hasAnyOfPermissions(permissions)

  if (hasAccess) {
    return <>{children}</>
  }

  if (showError) {
    const permissionList = permissions.map(p => `${p.service}:${p.resource}:${p.action}`).join(', ')
    const defaultErrorMessage = errorMessage ||
      `Access denied. Required permissions: ${permissionList}`

    return (
      <Alert
        severity="error"
        sx={{ m: 2 }}
        icon={<SecurityIcon />}
      >
        <Typography variant="h6" gutterBottom>
          Insufficient Permissions
        </Typography>
        <Typography variant="body2">
          {defaultErrorMessage}
        </Typography>
      </Alert>
    )
  }

  return <>{fallback}</>
}

// Read permission guard (commonly used for showing/hiding UI sections)
export const ReadPermissionGuard: React.FC<{
  children: ReactNode
  service: string
  resource: string
  fallback?: ReactNode
}> = ({ children, service, resource, fallback = null }) => {
  return (
    <PermissionGuard
      service={service}
      resource={resource}
      action="read"
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

// Manage permission guard (for admin sections)
export const ManagePermissionGuard: React.FC<{
  children: ReactNode
  service: string
  resource: string
  fallback?: ReactNode
  showError?: boolean
}> = ({ children, service, resource, fallback = null, showError = false }) => {
  return (
    <PermissionGuard
      service={service}
      resource={resource}
      action="manage"
      fallback={fallback}
      showError={showError}
    >
      {children}
    </PermissionGuard>
  )
}

// Super Admin guard
export const SuperAdminGuard: React.FC<{
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}> = ({ children, fallback = null, showError = false }) => {
  const { isSuperAdmin } = usePermissions()

  if (isSuperAdmin()) {
    return <>{children}</>
  }

  if (showError) {
    return (
      <Alert
        severity="error"
        sx={{ m: 2 }}
        icon={<SecurityIcon />}
      >
        <Typography variant="h6" gutterBottom>
          Super Admin Access Required
        </Typography>
        <Typography variant="body2">
          This feature is only available to Super Administrators.
        </Typography>
      </Alert>
    )
  }

  return <>{fallback}</>
}
