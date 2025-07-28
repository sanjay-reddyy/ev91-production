# Shared UI Components Architecture

## Overview
This package provides a cross-platform component library that works for both:
- **Web** (React - Admin Portal)
- **Mobile** (React Native - Mobile App)

## Architecture Patterns

### 1. Platform-Specific Implementations
Each component has separate implementations but shared interfaces:

```
components/
├── Button/
│   ├── index.ts          # Exports platform-specific component
│   ├── Button.types.ts   # Shared TypeScript interfaces
│   ├── Button.web.tsx    # React (HTML) implementation
│   ├── Button.native.tsx # React Native implementation
│   └── Button.stories.tsx
```

### 2. Shared Design Tokens
Common design system values used across platforms:

```
tokens/
├── colors.ts     # Brand colors, semantic colors
├── spacing.ts    # Consistent spacing scale
├── typography.ts # Font sizes, weights, line heights
└── index.ts      # Unified export
```

### 3. Platform Detection
Automatic platform detection and component selection:

```typescript
// Platform detection utility
export const isWeb = typeof window !== 'undefined';
export const isNative = !isWeb;

// Component selection
export const Button = isWeb 
  ? require('./Button.web').Button 
  : require('./Button.native').Button;
```

## Benefits

1. **Consistent Design**: Same design tokens across platforms
2. **Shared Logic**: Common interfaces and prop types
3. **Platform Optimization**: Native feel on each platform
4. **Type Safety**: Shared TypeScript interfaces
5. **Easy Maintenance**: Single source of truth for design decisions

## Usage Examples

### Shared Interface
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'small' | 'medium' | 'large';
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}
```

### Web Implementation (Admin Portal)
```tsx
export const Button: React.FC<ButtonProps> = ({ 
  variant, size, onPress, children, ...props 
}) => (
  <button 
    className={getButtonClasses(variant, size)}
    onClick={onPress}
    {...props}
  >
    {children}
  </button>
);
```

### Native Implementation (Mobile App)
```tsx
export const Button: React.FC<ButtonProps> = ({ 
  variant, size, onPress, children, ...props 
}) => (
  <TouchableOpacity 
    style={getButtonStyles(variant, size)}
    onPress={onPress}
    {...props}
  >
    <Text style={getTextStyles(variant, size)}>{children}</Text>
  </TouchableOpacity>
);
```
