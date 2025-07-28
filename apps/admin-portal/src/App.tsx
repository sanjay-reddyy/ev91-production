import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Box, CircularProgress } from '@mui/material'

// Import pages
import Login from './pages/Login'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Teams from './pages/Teams'
import CreateTeam from './pages/CreateTeam'
import EditTeam from './pages/EditTeam'
import Clients from './pages/Clients'
import Stores from './pages/Stores'
import RiderEarnings from './pages/RiderEarnings'

// Vehicle Management Pages
import VehicleInventory from './pages/VehicleInventory'
import VehicleDetails from './pages/VehicleDetails'
import VehicleForm from './pages/VehicleForm'
import DamageManagement from './pages/DamageManagement'
import DamageForm from './pages/DamageForm'

// OEM and Vehicle Model Management Pages
import OEMManagement from './pages/OEMManagement'
import OEMForm from './pages/OEMForm'
import VehicleModelManagement from './pages/VehicleModelManagement'
import VehicleModelForm from './pages/VehicleModelForm'

// Placeholder components - replace with actual components later
const Users = () => <div>Users Management</div>
const Departments = () => <div>Departments Management</div>
const Roles = () => <div>Roles & Permissions</div>
const Profile = () => <div>User Profile</div>
const Settings = () => <div>Settings</div>

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

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/teams/create" element={<CreateTeam />} />
                <Route path="/teams/edit/:id" element={<EditTeam />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/stores" element={<Stores />} />
                <Route path="/rider-earnings" element={<RiderEarnings />} />
                
                {/* Vehicle Management Routes */}
                <Route path="/vehicles" element={<VehicleInventory />} />
                <Route path="/vehicles/add" element={<VehicleForm />} />
                <Route path="/vehicles/edit/:id" element={<VehicleForm />} />
                <Route path="/vehicles/:id" element={<VehicleDetails />} />
                <Route path="/damage" element={<DamageManagement />} />
                <Route path="/damage/new" element={<DamageForm />} />
                <Route path="/damage/:id/edit" element={<DamageForm />} />
                
                {/* OEM Management Routes */}
                <Route path="/oems" element={<OEMManagement />} />
                <Route path="/oems/new" element={<OEMForm />} />
                <Route path="/oems/:id/edit" element={<OEMForm />} />
                
                {/* Vehicle Model Management Routes */}
                <Route path="/vehicle-models" element={<VehicleModelManagement />} />
                <Route path="/vehicle-models/new" element={<VehicleModelForm />} />
                <Route path="/vehicle-models/:id/edit" element={<VehicleModelForm />} />
                
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
