// TypeScript declarations for development
// This file helps with type checking when react-native is a peer dependency

declare module 'react-native' {
  import React from 'react';

  export interface ViewStyle {
    [key: string]: any;
  }

  export interface TextStyle {
    [key: string]: any;
  }

  export interface StyleProp<T> {
    [key: string]: any;
  }

  export interface TouchableOpacityProps {
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    disabled?: boolean;
    testID?: string;
    activeOpacity?: number;
    children?: React.ReactNode;
  }

  export interface TextProps {
    style?: StyleProp<TextStyle>;
    children?: React.ReactNode;
  }

  export interface ViewProps {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
  }

  export interface ActivityIndicatorProps {
    color?: string;
    size?: 'small' | 'large';
  }

  export const TouchableOpacity: React.FC<TouchableOpacityProps>;
  export const Text: React.FC<TextProps>;
  export const View: React.FC<ViewProps>;
  export const ActivityIndicator: React.FC<ActivityIndicatorProps>;
  export const StyleSheet: {
    create: <T>(styles: T) => T;
  };
}
