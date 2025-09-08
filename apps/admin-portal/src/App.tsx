import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Box, CircularProgress } from '@mui/material'

// Import pages
import Login from './pages/Login'
import Layout from './components/layout/Layout'

// Import auth components
import SignUpForm from './components/auth/SignUpForm'
import ForgotPasswordForm from './components/auth/ForgotPasswordForm'
import ResetPasswordForm from './components/auth/ResetPasswordForm'
import EmailVerificationPage from './components/auth/EmailVerificationPage'
import ResendVerificationForm from './components/auth/ResendVerificationForm'

import Dashboard from './pages/Dashboard'
import Teams from './pages/Teams'
import CreateTeam from './pages/CreateTeam'
import EditTeam from './pages/EditTeam'
import ClientStoreManagement from './pages/ClientStoreManagement'
import RiderEarnings from './pages/RiderEarnings'
import RiderManagement from './pages/RiderManagement'
import RiderProfile from './pages/RiderProfile'

// Vehicle Management Pages
import VehicleDashboard from './pages/VehicleDashboard'
import VehicleInventory from './pages/VehicleInventory'
import VehicleForm from './pages/VehicleForm'
import VehicleProfile from './pages/VehicleProfile'
import DamageManagement from './pages/DamageManagement'
import DamageForm from './pages/DamageForm'

// OEM and Vehicle Model Management Pages
import OEMManagement from './pages/OEMManagement'
import OEMForm from './pages/OEMForm'
import VehicleModelManagement from './pages/VehicleModelManagement'
import VehicleModelForm from './pages/VehicleModelForm'

// Hub Management Pages
import HubManagement from './pages/HubManagement'
import HubForm from './pages/HubForm'
import HubDetails from './pages/HubDetails'

// City Management Pages
import CityManagement from './pages/CityManagement'
import CityForm from './pages/CityForm'
import CityDashboard from './pages/CityDashboard'

// Service Management Pages
import ServiceManagement from './pages/ServiceManagement'
import ServiceScheduleForm from './pages/ServiceScheduleForm'
import UnifiedServiceDashboard from './pages/UnifiedServiceDashboard'

// Spare Parts Management Pages
import SpareParts from './pages/SpareParts'
import SparePartForm from './pages/SparePartForm'
import SparePartsAnalytics from './pages/SparePartsAnalytics'
import StockManagement from './pages/StockManagement'
import Suppliers from './pages/Suppliers'
import PurchaseOrders from './pages/PurchaseOrders'
import SparePartDetails from './pages/SparePartDetails'
import SparePartsDashboard from './pages/SparePartsDashboard'

// Spare Parts Outward Flow Pages
import OutwardFlowManagement from './pages/OutwardFlowManagement'
import ServiceRequestManagement from './pages/ServiceRequestManagement'
import ServiceRequestForm from './pages/ServiceRequestForm'
import PartRequestManagement from './pages/PartRequestManagement'
import PartRequestForm from './pages/PartRequestForm'
import ApprovalManagement from './pages/ApprovalManagement'
import InstallationManagement from './pages/InstallationManagement'
import CostTrackingManagement from './pages/CostTrackingManagement'

// Debug Components
import DebugVehicleAPI from './pages/DebugVehicleAPI'

// Auth Management Pages
import Users from './pages/Users'
import Roles from './pages/Roles'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// Public Route component (redirect if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>
}

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignUpForm />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordForm />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password/:token"
        element={
          <PublicRoute>
            <ResetPasswordForm />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-email/:token"
        element={
          <PublicRoute>
            <EmailVerificationPage />
          </PublicRoute>
        }
      />
      <Route
        path="/resend-verification"
        element={
          <PublicRoute>
            <ResendVerificationForm />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/employees" element={<Users />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/teams/create" element={<CreateTeam />} />
                <Route path="/teams/edit/:id" element={<EditTeam />} />
                <Route path="/clients" element={<ClientStoreManagement />} />
                <Route path="/stores" element={<ClientStoreManagement />} />
                <Route path="/rider-earnings" element={<RiderEarnings />} />
                <Route path="/rider-management" element={<RiderManagement />} />
                <Route path="/rider-management/:riderId" element={<RiderProfile />} />

                {/* Vehicle Management Routes */}
                <Route path="/vehicle-dashboard" element={<VehicleDashboard />} />
                <Route path="/vehicles" element={<VehicleInventory />} />
                <Route path="/vehicles/add" element={<VehicleForm />} />
                <Route path="/vehicles/edit/:id" element={<VehicleForm />} />
                <Route path="/vehicles/view/:id" element={<VehicleProfile />} />
                <Route path="/vehicles/:id" element={<VehicleProfile />} />
                <Route path="/vehicle-profile/:id" element={<VehicleProfile />} />
                <Route path="/damage" element={<DamageManagement />} />
                <Route path="/damage/new" element={<DamageForm />} />
                <Route path="/damage/:id/edit" element={<DamageForm />} />

                {/* Hub Management Routes */}
                <Route path="/hubs" element={<HubManagement />} />
                <Route path="/hubs/new" element={<HubForm />} />
                <Route path="/hubs/:id" element={<HubDetails />} />
                <Route path="/hubs/:id/edit" element={<HubForm />} />

                {/* City Management Routes */}
                <Route path="/cities" element={<CityManagement />} />
                <Route path="/cities/add" element={<CityForm />} />
                <Route path="/cities/:id/edit" element={<CityForm />} />
                <Route path="/city-dashboard" element={<CityDashboard />} />

                {/* OEM Management Routes */}
                <Route path="/oems" element={<OEMManagement />} />
                <Route path="/oems/new" element={<OEMForm />} />
                <Route path="/oems/:id/edit" element={<OEMForm />} />

                {/* Vehicle Model Management Routes */}
                <Route path="/vehicle-models" element={<VehicleModelManagement />} />
                <Route path="/vehicle-models/new" element={<VehicleModelForm />} />
                <Route path="/vehicle-models/:id/edit" element={<VehicleModelForm />} />

                {/* Service Management Routes */}
                <Route path="/services" element={<ServiceManagement />} />
                <Route path="/services/schedule" element={<ServiceScheduleForm />} />
                <Route path="/unified-service" element={<UnifiedServiceDashboard />} />

                {/* Spare Parts Management Routes */}
                <Route path="/spare-parts" element={<SpareParts />} />
                <Route path="/spare-parts/add" element={<SparePartForm />} />
                <Route path="/spare-parts/edit/:id" element={<SparePartForm />} />
                <Route path="/spare-parts/view/:id" element={<SparePartDetails />} />
                <Route path="/spare-parts/analytics" element={<SparePartsAnalytics />} />
                <Route path="/spare-parts/analytics" element={<SparePartsAnalytics />} />
                <Route path="/spare-parts/stock" element={<StockManagement />} />
                <Route path="/spare-parts/suppliers" element={<Suppliers />} />
                <Route path="/spare-parts/purchase-orders" element={<PurchaseOrders />} />
                <Route path="/spare-parts/dashboard" element={<SparePartsDashboard />} />

                {/* Spare Parts Outward Flow Routes */}
                <Route path="/spare-parts/outward" element={<OutwardFlowManagement />} />
                <Route path="/spare-parts/outward/service-requests" element={<ServiceRequestManagement />} />
                <Route path="/spare-parts/outward/service-requests/create" element={<ServiceRequestForm />} />
                <Route path="/spare-parts/outward/service-requests/:id/edit" element={<ServiceRequestForm />} />
                <Route path="/spare-parts/outward/part-requests" element={<PartRequestManagement />} />
                <Route path="/spare-parts/outward/part-requests/create" element={<PartRequestForm />} />
                <Route path="/spare-parts/outward/part-requests/:id/edit" element={<PartRequestForm />} />
                <Route path="/spare-parts/outward/approvals" element={<ApprovalManagement />} />
                <Route path="/spare-parts/outward/installations" element={<InstallationManagement />} />
                <Route path="/spare-parts/outward/cost-tracking" element={<CostTrackingManagement />} />

                {/* Debug Routes */}
                <Route path="/debug/vehicle-api" element={<DebugVehicleAPI />} />

                <Route path="/roles" element={<Roles />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
