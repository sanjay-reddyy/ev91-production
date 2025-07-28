# Mobile App Publishing Strategy with Shared UI Components

## Overview
Publishing a React Native app with shared UI components requires careful planning for dependencies, bundle optimization, and distribution strategies.

## Current Architecture Analysis

### App Structure
- **Platform**: React Native with Expo
- **Shared Components**: Cross-platform UI library (`@ev91/ui`)
- **Dependencies**: External packages + internal shared components
- **Build Tool**: Expo CLI

## Publishing Strategies

### Strategy 1: Monorepo with Local Dependencies (Current)
```
EV91-Platform/
├── apps/
│   └── mobile-app/          # React Native app
├── shared/
│   └── ui-components/       # Shared UI library
└── package.json             # Root workspace config
```

**Pros:**
- Fast development iteration
- Easy component updates
- Type safety across packages

**Cons:**
- Complex build pipeline
- Harder to version independently
- Large bundle if not optimized

### Strategy 2: Published NPM Package
Publish `@ev91/ui` as separate npm package:

```bash
# Publish shared components
cd shared/ui-components
npm publish @ev91/ui

# Install in mobile app
cd apps/mobile-app  
npm install @ev91/ui
```

**Pros:**
- Clean separation of concerns
- Independent versioning
- Can be used by other projects

**Cons:**
- Slower development cycle
- Need to publish for every change
- Version management complexity

### Strategy 3: Hybrid Approach (Recommended)
- **Development**: Use local dependencies
- **Production**: Bundle shared components directly

## Bundle Optimization for Mobile

### 1. Metro Configuration
Create optimized Metro config for shared components:

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Support monorepo structure
config.watchFolders = [
  path.resolve(__dirname, '../../shared')
];

// Resolve shared components
config.resolver.alias = {
  '@ev91/ui': path.resolve(__dirname, '../../shared/ui-components/src'),
};

// Tree shaking for smaller bundle
config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

module.exports = config;
```

### 2. Bundle Size Optimization

```typescript
// Only import what you need (tree shaking)
import { Button, Input } from '@ev91/ui';

// Instead of importing everything
// import * from '@ev91/ui'; // ❌ Imports entire library
```

### 3. Platform-Specific Bundling

```typescript
// The platform detection ensures only native code is bundled
// Web components (Button.web.tsx) are excluded from mobile bundle
// Native components (Button.native.tsx) are included
```

## App Store Publishing Considerations

### 1. Asset Optimization

```json
{
  "expo": {
    "assetBundlePatterns": [
      "**/*"
    ],
    "optimization": {
      "web": {
        "bundler": "metro"
      }
    },
    "ios": {
      "bundleIdentifier": "com.ev91.mobile",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses camera for document scanning"
      }
    },
    "android": {
      "package": "com.ev91.mobile",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

### 2. Bundle Analysis

```bash
# Analyze bundle size
npx expo export --platform android --dev false
npx react-native-bundle-visualizer

# Check shared component impact
npx webpack-bundle-analyzer build/static/js/*.js
```

## Deployment Pipeline

### 1. Build Pipeline with Shared Components

```yaml
# .github/workflows/mobile-build.yml
name: Mobile App Build

on:
  push:
    branches: [main]
    paths: 
      - 'apps/mobile-app/**'
      - 'shared/ui-components/**'  # Rebuild when shared components change

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install root dependencies
        run: npm ci
        
      - name: Build shared components
        run: |
          cd shared/ui-components
          npm run build
          
      - name: Install mobile dependencies
        run: |
          cd apps/mobile-app
          npm ci
          
      - name: Build mobile app
        run: |
          cd apps/mobile-app
          expo build:android --release-channel production
          
      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_JSON }}
          packageName: com.ev91.mobile
          releaseFiles: apps/mobile-app/build/*.aab
```

### 2. Version Management

```json
// shared/ui-components/package.json
{
  "name": "@ev91/ui",
  "version": "1.2.3"
}

// apps/mobile-app/package.json  
{
  "dependencies": {
    "@ev91/ui": "^1.2.3"
  }
}
```

## Performance Monitoring

### 1. Bundle Size Tracking

```javascript
// Track shared component bundle impact
const bundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Monitor shared component performance
import { performance } from 'perf_hooks';

const componentLoadTime = performance.measure(
  'ui-component-load',
  'component-start', 
  'component-end'
);
```

### 2. Runtime Performance

```typescript
// Monitor shared component rendering
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  // Track shared component performance
  analytics.track('component_render', {
    component: id,
    duration: actualDuration,
    phase
  });
}

<Profiler id="SharedButton" onRender={onRenderCallback}>
  <Button variant="primary">Submit</Button>
</Profiler>
```

## Security Considerations

### 1. Shared Component Security

```typescript
// Validate shared component props
import { z } from 'zod';

const ButtonPropsSchema = z.object({
  variant: z.enum(['primary', 'secondary']),
  onPress: z.function(),
  children: z.string().max(50) // Prevent XSS in text
});

export const Button: React.FC<ButtonProps> = (props) => {
  const validatedProps = ButtonPropsSchema.parse(props);
  // ... rest of component
};
```

### 2. Dependency Auditing

```bash
# Check shared component dependencies
cd shared/ui-components
npm audit --audit-level high

# Check mobile app dependencies  
cd apps/mobile-app
npm audit --audit-level critical
```

## Testing Strategy

### 1. Shared Component Testing

```typescript
// Test shared components in mobile context
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@ev91/ui';

test('Button works in mobile environment', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <Button onPress={onPress}>Test Button</Button>
  );
  
  fireEvent.press(getByText('Test Button'));
  expect(onPress).toHaveBeenCalled();
});
```

### 2. Integration Testing

```typescript
// Test full app with shared components
import { render } from '@testing-library/react-native';
import App from './App';

test('App renders with shared components', () => {
  const { getByTestId } = render(<App />);
  expect(getByTestId('shared-button')).toBeTruthy();
});
```

## Recommended Publishing Approach

### Phase 1: Development (Current)
- Use local dependencies for fast iteration
- Metro config for monorepo support
- Hot reload with shared components

### Phase 2: Pre-Production
- Build and test shared components separately
- Bundle analysis and optimization
- Performance testing

### Phase 3: Production Release
- Consider publishing `@ev91/ui` as scoped package
- Use exact versions in production
- Automated deployment pipeline

### Phase 4: Post-Release
- Monitor bundle size and performance
- Gradual rollout of component updates
- A/B testing with component variants

This strategy ensures your shared UI components work seamlessly in production while maintaining development velocity and app performance.
