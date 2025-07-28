# Vehicle Inventory Management UI - Admin Portal

This document outlines the complete UI/UX implementation for the 2-wheeler EV vehicle inventory management module in the admin portal.

## 🎯 Overview

The vehicle inventory management system provides a comprehensive admin dashboard for managing the full lifecycle of 2-wheeler EV vehicles, including registration, service tracking, damage management, and media documentation.

## 📋 Features Implemented

### 1. **Vehicle Inventory List Page** (`/vehicles`)
- **Features:**
  - Responsive table view with pagination
  - Advanced filtering (OEM, status, location, search)
  - Real-time stats dashboard (total vehicles, active, under maintenance, services due)
  - Bulk operations and quick actions
  - Vehicle thumbnails with OEM logos
  - Service due status indicators
  - Damage report counters

- **Columns:**
  - Vehicle (with avatar and model info)
  - Registration Number
  - Age (calculated from purchase date)
  - Operational Status (Available, Assigned, Under Maintenance, Retired)
  - Service Due Status (with color-coded alerts)
  - Active Damage Reports count
  - Location
  - Actions (View, Edit, Archive)

### 2. **Vehicle Details Page** (`/vehicles/:id`)
- **Tab-based Interface:**
  - **Basic Info**: Vehicle specifications, purchase details, current status
  - **Service History**: Complete maintenance timeline with costs
  - **Damage Records**: All reported damages with resolution status
  - **Photos & Documents**: Organized media gallery by type

- **Features:**
  - Status change capability with reason tracking
  - Photo galleries with timestamps
  - Service scheduling integration
  - Damage reporting workflows
  - Document management (RC, Insurance, Photos)

### 3. **Add/Edit Vehicle Form** (`/vehicles/add`, `/vehicles/edit/:id`)
- **4-Step Wizard:**
  - **Step 1**: Basic vehicle information (OEM, model, specs)
  - **Step 2**: Registration & insurance details
  - **Step 3**: Photo and document uploads
  - **Step 4**: Review & submit

- **Features:**
  - Form validation with Yup schema
  - File upload with preview
  - Multi-step navigation
  - Auto-save drafts
  - Comprehensive field validation

### 4. **Damage Management** (`/damage`)
- **Dual View Modes:**
  - **Table View**: Sortable table with filters
  - **Timeline View**: Chronological damage tracking

- **Features:**
  - Status workflow management (Reported → Under Review → In Repair → Resolved)
  - Technician assignment
  - Cost estimation tracking
  - Photo documentation
  - Severity classification (Minor, Moderate, Major)
  - Type categorization (Cosmetic, Mechanical, Electrical, Structural)

## 🎨 UI/UX Design Guidelines

### **Color Palette**
- **Primary**: Blue (#1976d2) - Navigation, CTAs
- **Success**: Green (#2e7d2e) - Available vehicles, completed services
- **Warning**: Orange (#ed6c02) - Due soon, under maintenance
- **Error**: Red (#d32f2f) - Overdue, major damage, retired vehicles
- **Info**: Light Blue (#0288d1) - Assigned vehicles, in review

### **Status Color Coding**
```typescript
// Vehicle Status
Available: 'success'
Assigned: 'info'
Under Maintenance: 'warning'
Retired: 'error'

// Service Status
Completed: 'success'
In Progress: 'warning'
Scheduled: 'info'
Cancelled: 'error'

// Damage Severity
Minor: 'info'
Moderate: 'warning'
Major: 'error'
```

### **Typography**
- **Headers**: Bold, clear hierarchy (h4, h5, h6)
- **Body Text**: Readable 14px base with good contrast
- **Labels**: 12px secondary text for metadata
- **Numbers**: Bold formatting for metrics and costs

### **Icons**
- **Vehicles**: 🏍️ DirectionsBike icon
- **Service**: 🔧 Build icon
- **Damage**: ⚠️ Warning icon
- **Photos**: 📷 PhotoCamera icon
- **Documents**: 📄 Description icon

## 🔗 Navigation Flow

```
Dashboard → Vehicle Inventory → Vehicle Details
    ↓              ↓                ↓
Quick Actions   Add/Edit         Service/Damage
    ↓              ↓                ↓
Add Vehicle    Form Wizard      Workflow Mgmt
```

### **Key User Flows:**

1. **Add New Vehicle**: Dashboard → Add Vehicle → 4-step wizard → Success
2. **View Vehicle**: Inventory → Search/Filter → Vehicle row → Details page
3. **Report Damage**: Vehicle details → Report damage → Form → Timeline tracking
4. **Schedule Service**: Vehicle details → Schedule → Form → Service history
5. **Status Management**: Details page → Change status → Confirmation → History log

## 📱 Mobile Responsiveness

- **Breakpoints**: sm(600px), md(900px), lg(1200px)
- **Table Adaptation**: Horizontal scroll on mobile
- **Card Layouts**: Stack vertically on small screens
- **Touch Targets**: Minimum 44px for buttons and links
- **Typography**: Responsive scaling

## 🛠️ Technical Implementation

### **Tech Stack**
- **Frontend**: React 18 + TypeScript
- **UI Library**: Material-UI v5
- **Routing**: React Router v6
- **Forms**: React Hook Form + Yup validation
- **HTTP Client**: Axios with interceptors
- **State Management**: React hooks + Context
- **Date Handling**: date-fns
- **Icons**: Material-UI Icons

### **Key Components**
```
src/
├── pages/
│   ├── VehicleInventory.tsx     # Main listing page
│   ├── VehicleDetails.tsx       # Details with tabs
│   ├── VehicleForm.tsx          # Add/edit wizard
│   └── DamageManagement.tsx     # Damage workflow
├── services/
│   └── vehicleService.ts        # API client
└── components/
    └── VehicleDashboard.tsx     # Dashboard widget
```

### **API Integration**
```typescript
// Service methods
vehicleService.getVehicles(filters, pagination)
vehicleService.getVehicle(id)
vehicleService.createVehicle(data)
vehicleService.updateVehicle(id, data)
vehicleService.updateVehicleStatus(id, status, reason)
vehicleService.uploadMedia(vehicleId, files, type)
```

## 🔄 Integration Points

### **With Vehicle Service Backend**
- **Base URL**: `http://localhost:4003/api`
- **Authentication**: JWT token in Authorization header
- **File Uploads**: Multipart form data support
- **Error Handling**: Unified error interceptors

### **With Admin Portal**
- **Routing**: Integrated with existing React Router setup
- **Navigation**: Added to sidebar menu
- **Authentication**: Uses existing auth context
- **Styling**: Consistent with existing theme

## 📊 Future Enhancements

### **Phase 2 Features**
1. **Advanced Analytics**: Usage patterns, cost analysis, predictive maintenance
2. **Bulk Operations**: Multi-select actions for vehicle management
3. **Export Functionality**: PDF reports, CSV exports
4. **Real-time Updates**: WebSocket integration for live status updates
5. **Mobile App**: Dedicated mobile interface for field operations
6. **Integration**: GPS tracking, IoT sensor data, payment systems

### **UI/UX Improvements**
1. **Dark Mode**: Theme switching capability
2. **Customizable Dashboard**: Drag-and-drop widgets
3. **Advanced Filters**: Saved filter presets, date ranges
4. **Notification System**: Real-time alerts and reminders
5. **Accessibility**: WCAG 2.1 AA compliance

## 🚀 Getting Started

### **Prerequisites**
```bash
# Install dependencies
cd apps/admin-portal
npm install

# Start development server
npm run dev
```

### **Environment Setup**
```env
# Vehicle service API endpoint
VITE_VEHICLE_SERVICE_URL=http://localhost:4003/api
```

### **Available Routes**
- `/vehicles` - Vehicle inventory listing
- `/vehicles/add` - Add new vehicle wizard
- `/vehicles/edit/:id` - Edit existing vehicle
- `/vehicles/:id` - Vehicle details page
- `/damage` - Damage management dashboard

The implementation provides a complete, production-ready vehicle inventory management system with intuitive UI/UX design optimized for operations teams managing 2-wheeler EV fleets.
