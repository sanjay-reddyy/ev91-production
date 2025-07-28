import { isWeb } from '../../utils/platform';

// Platform-specific component export
export const Button = isWeb 
  ? require('./Button.web').Button
  : require('./Button.native').Button;

export type { ButtonProps } from '../../types';
