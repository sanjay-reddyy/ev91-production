import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../tokens';
import type { ButtonProps } from '../../types';

// React Native implementation using TouchableOpacity
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  onPress,
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  testID,
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: borderRadius.md,
      opacity: disabled || loading ? 0.6 : 1,
      width: fullWidth ? '100%' : undefined,
    };

    const sizeStyles = {
      small: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
      },
      medium: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
      },
      large: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: colors.primary,
      },
      secondary: {
        backgroundColor: colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return [baseStyle, sizeStyles[size], variantStyles[variant]];
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontWeight: typography.fontWeights.medium,
      textAlign: 'center' as const,
    };

    const sizeTextStyles = {
      small: {
        fontSize: typography.fontSizes.sm,
      },
      medium: {
        fontSize: typography.fontSizes.md,
      },
      large: {
        fontSize: typography.fontSizes.lg,
      },
    };

    const variantTextStyles = {
      primary: {
        color: colors.white,
      },
      secondary: {
        color: colors.white,
      },
      outline: {
        color: colors.primary,
      },
      ghost: {
        color: colors.primary,
      },
    };

    return [baseTextStyle, sizeTextStyles[size], variantTextStyles[variant]];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <Text style={getTextStyle()}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};
