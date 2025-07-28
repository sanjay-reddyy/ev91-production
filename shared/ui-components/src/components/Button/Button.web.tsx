import React from 'react';
import { colors, spacing, typography, borderRadius } from '../../tokens';
import type { ButtonProps } from '../../types';

// Web implementation using HTML button
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  onPress,
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  testID,
  ...props
}) => {
  const getButtonStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
      fontSize: typography.fontSizes.md,
      fontWeight: typography.fontWeights.medium,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.6 : 1,
      transition: 'all 0.2s ease',
      border: 'none',
      width: fullWidth ? '100%' : 'auto',
    };

    // Size styles
    const sizeStyles: Record<string, React.CSSProperties> = {
      small: {
        padding: `${spacing.sm}px ${spacing.md}px`,
        fontSize: typography.fontSizes.sm,
      },
      medium: {
        padding: `${spacing.md}px ${spacing.lg}px`,
        fontSize: typography.fontSizes.md,
      },
      large: {
        padding: `${spacing.lg}px ${spacing.xl}px`,
        fontSize: typography.fontSizes.lg,
      },
    };

    // Variant styles
    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: colors.primary,
        color: colors.white,
      },
      secondary: {
        backgroundColor: colors.secondary,
        color: colors.white,
      },
      outline: {
        backgroundColor: 'transparent',
        color: colors.primary,
        border: `2px solid ${colors.primary}`,
      },
      ghost: {
        backgroundColor: 'transparent',
        color: colors.primary,
      },
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <button
      style={getButtonStyles()}
      onClick={onPress}
      disabled={disabled || loading}
      data-testid={testID}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};
