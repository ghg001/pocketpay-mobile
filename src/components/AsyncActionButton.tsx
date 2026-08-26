import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { RADIUS, SIZES, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export interface AsyncActionButtonProps extends Omit<TouchableOpacityProps, 'onPress'> {
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'destructive' | 'muted';
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  textStyle?: StyleProp<TextStyle>;
  onPress?: (event: GestureResponderEvent) => Promise<void> | void;
  /**
   * Receives anything `onPress` throws. Without it a rejection is only logged,
   * which silently strands the user on flows that surface errors themselves.
   */
  onError?: (error: unknown) => void;
}

/**
 * AsyncActionButton
 *
 * Reusable async button component that automatically manages execution and loading states,
 * prevents concurrent multi-clicks while an async operation is pending, and strictly respects
 * the project's design system tokens (colors, dark mode, typography, radiuses, and sizes).
 */
export const AsyncActionButton: React.FC<AsyncActionButtonProps> = ({
  title,
  variant = 'primary',
  isLoading = false,
  loadingText = 'Processing…',
  disabled = false,
  icon,
  style,
  textStyle,
  onPress,
  onError,
  children,
  activeOpacity = 0.8,
  accessibilityLabel,
  accessibilityRole = 'button',
  ...props
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isExecuting, setIsExecuting] = useState(false);
  const isExecutingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const busy = isLoading || isExecuting;
  const isDisabled = disabled || busy;

  const handlePress = async (event: GestureResponderEvent) => {
    if (isDisabled || isExecutingRef.current || !onPress) return;

    isExecutingRef.current = true;
    setIsExecuting(true);

    try {
      await onPress(event);
    } catch (err) {
      // Ensure error doesn't break component execution cycle
      if (onError) {
        onError(err);
      } else {
        console.error('AsyncActionButton error:', err);
      }
    } finally {
      isExecutingRef.current = false;
      // These flows routinely navigate away on success, so the button can be
      // gone by the time the promise settles.
      if (isMountedRef.current) setIsExecuting(false);
    }
  };

  const getBackgroundColor = () => {
    if (isDisabled) return colors.surfaceLight;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'danger':
      case 'destructive':
        return colors.error;
      case 'outline':
        return 'transparent';
      case 'muted':
        return colors.surfaceLight;
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (isDisabled) return colors.textMuted;
    if (variant === 'outline') return colors.primary;
    if (variant === 'muted') return colors.textPrimary;
    return colors.background; // Dark text on bright primary/secondary/danger buttons
  };

  const getBorderColor = () => {
    if (isDisabled) return colors.surfaceLight;
    if (variant === 'outline') return colors.primary;
    return 'transparent';
  };

  const textColor = getTextColor();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={activeOpacity}
      onPress={handlePress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy }}
      {...props}
    >
      {busy ? (
        <>
          <ActivityIndicator color={textColor} style={styles.indicator} />
          <Text style={[styles.text, { color: textColor }, textStyle]}>
            {loadingText}
          </Text>
        </>
      ) : (
        <>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          {children ? (
            children
          ) : (
            <Text style={[styles.text, { color: textColor }, textStyle]}>
              {title}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      height: 56,
      borderRadius: RADIUS.lg,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SIZES.xl,
      flexDirection: 'row',
    },
    indicator: {
      marginRight: SIZES.sm,
    },
    iconContainer: {
      marginRight: SIZES.sm,
    },
    text: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
  });
