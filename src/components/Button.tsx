import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { RADIUS, SIZES, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'destructive' | 'muted';
  isLoading?: boolean;
  loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  isLoading = false,
  loadingText = 'Processing…',
  style,
  disabled,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceLight;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.secondary;
      case 'danger':
      case 'destructive': return colors.error;
      case 'outline': return 'transparent';
      case 'muted': return colors.surfaceLight;
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    if (variant === 'outline') return colors.primary;
    if (variant === 'muted') return colors.textPrimary;
    return colors.background; // Dark text on bright primary/secondary buttons looks premium
  };

  const getBorderColor = () => {
    if (disabled) return colors.surfaceLight;
    if (variant === 'outline') return colors.primary;
    return 'transparent';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        style
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <>
          <ActivityIndicator color={getTextColor()} style={{ marginRight: 8 }} />
          <Text style={[styles.text, { color: getTextColor() }]}>
            {loadingText}
          </Text>
        </>
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    height: 56,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.xl,
    flexDirection: 'row',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
