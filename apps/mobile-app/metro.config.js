const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Support monorepo structure - include shared components
config.watchFolders = [
  path.resolve(__dirname, '../../shared')
];

// Resolve shared components as local dependencies
config.resolver.alias = {
  '@ev91/ui': path.resolve(__dirname, '../../shared/ui-components/src'),
};

// Support additional file extensions
config.resolver.sourceExts.push('tsx', 'ts');

// Tree shaking and optimization
config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

// Platform-specific resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Exclude web-specific files from native bundle
config.resolver.blacklistRE = /\.web\.(js|jsx|ts|tsx)$/;

module.exports = config;
