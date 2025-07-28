# Mobile App Architecture

This document outlines the architecture and organization for the EV91 mobile app.

## Directory Structure

```
/
├── src/
│   ├── api/               # API client and service calls
│   ├── assets/            # Static assets (images, fonts)
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # Basic UI elements
│   │   ├── forms/         # Form components
│   │   └── layout/        # Layout components
│   ├── constants/         # App constants and config
│   ├── hooks/             # Custom React hooks
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # App screens
│   │   ├── auth/          # Authentication screens
│   │   ├── registration/  # User registration flow
│   │   ├── booking/       # Vehicle booking flow
│   │   ├── ride/          # Active ride screens
│   │   ├── profile/       # User profile screens
│   │   └── payment/       # Payment screens
│   ├── services/          # Business logic services
│   ├── store/             # State management
│   │   ├── slices/        # Redux slices 
│   │   └── hooks.ts       # Store hooks
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── App.tsx                # App entry point
└── index.js               # React Native entry point
```

## State Management

We use RTK Query for data fetching and caching, with Redux for global state management when needed.

## Navigation

React Navigation with a structured stack:
- Authentication Stack
- Registration Stack
- Main App Stack (Tab Navigator)
  - Home Stack
  - Booking Stack
  - Profile Stack

## Styling

We use a combination of:
- React Native Paper for UI components
- Tailwind (via NativeWind) for styling

## Data Fetching

API calls are centralized in the `/api` directory with RTK Query for caching and real-time updates.

## Form Management

We use React Hook Form for all form state management with Zod for validation.
