# EV91 Admin Portal

A comprehensive administrative dashboard for the EV91 platform, providing user management, team management, and system administration capabilities.

## Overview

The Admin Portal is the central management interface for the EV91 platform, allowing administrators to:

- **User Management**: Create, edit, and manage user accounts
- **Team Management**: Organize teams, assign team leads, and manage team memberships
- **Department Management**: Structure organizational departments
- **Role & Permission Management**: Configure access control and permissions
- **System Dashboard**: Monitor platform statistics and activity

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Build Tool**: Vite
- **State Management**: React Query + Context API
- **Form Handling**: React Hook Form with Yup validation
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Auth Service running on port 4001

### Installation

```bash
# Navigate to admin portal directory
cd apps/admin-portal

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3003`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking

## Configuration

### Environment Variables

Create a `.env` file in the admin-portal directory:

```env
# Backend API URL (empty for proxy during development)
VITE_API_URL=

# Application Settings
VITE_APP_NAME=EV91 Admin Portal
VITE_APP_VERSION=1.0.0

# Development Settings
VITE_NODE_ENV=development
```

### Development Proxy

The Vite configuration includes proxy settings for development:

- `/auth/*` → `http://localhost:4001/auth/*` (Authentication endpoints)
- `/api/*` → `http://localhost:4001/api/*` (API endpoints)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── layout/         # Layout components (Sidebar, Topbar, etc.)
├── contexts/           # React contexts (Auth, etc.)
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Teams.tsx       # Team management
│   ├── CreateTeam.tsx  # Team creation
│   └── Login.tsx       # Authentication
├── services/           # API services
│   ├── api.ts          # Main API service
│   └── teams.ts        # Team-specific services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Features

### Authentication
- JWT-based authentication
- Role-based access control
- Secure token management
- Auto-logout on token expiration

### Team Management
- Create and edit teams
- Assign team leads
- Manage team members
- Department-based organization
- City/Country tracking
- Skills and capacity management

### User Interface
- Responsive design
- Material Design principles
- Dark/Light theme support
- Intuitive navigation
- Advanced data tables
- Form validation

## API Integration

The admin portal connects to the Auth Service backend:

- **Auth Endpoints**: `/auth/*` - Login, logout, profile management
- **Team Endpoints**: `/api/v1/teams/*` - Team CRUD operations
- **User Endpoints**: `/users/*` - User management
- **Department Endpoints**: `/departments/*` - Department management

## Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow React functional component patterns
- Use React hooks for state management
- Implement proper error handling
- Add loading states for async operations

### Component Structure
- Keep components focused and reusable
- Use proper TypeScript interfaces
- Implement proper props validation
- Add JSDoc comments for complex components

### API Integration
- Use the centralized API service
- Implement proper error handling
- Add loading states
- Use React Query for data fetching

## Build and Deployment

### Production Build

```bash
npm run build
```

Builds the app for production to the `dist` folder.

### Deployment Considerations

- Update `VITE_API_URL` for production API endpoint
- Configure proper CORS settings on the backend
- Set up proper environment variables
- Enable HTTPS for production
- Configure proper caching headers

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the auth service includes the admin portal's URL in `ALLOWED_ORIGINS`
2. **Port Conflicts**: The admin portal runs on port 3003 by default
3. **TypeScript Errors**: Run `npm run type-check` to identify type issues
4. **Build Failures**: Check that all dependencies are installed

### Development Tips

- Use the browser dev tools for debugging
- Check the network tab for API call issues
- Use React Developer Tools for component debugging
- Monitor the console for error messages

## Contributing

1. Follow the existing code style and patterns
2. Add proper TypeScript types for new features
3. Test thoroughly before committing
4. Update documentation as needed

## License

This project is part of the EV91 platform and follows the platform's licensing terms.
