import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { SIZES, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export interface LoadingStateProps {
  /** Shown beneath the spinner and announced to screen readers. */
  message?: string;
  size?: 'small' | 'large';
  /** Fills and centres within the available space — for whole-screen waits. */
  fullScreen?: boolean;
  /** Lays the spinner and message out on one line — for inline/section waits. */
  inline?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * LoadingState
 *
 * The single way to render a "waiting" surface. Centralising it keeps spinner
 * size, spacing, and copy consistent, and guarantees every wait is announced to
 * assistive tech rather than being a silent spinner.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading…',
  size = 'large',
  fullScreen = false,
  inline = false,
  style,
  accessibilityLabel,
  testID = 'loading-state',
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        inline && styles.inline,
        style,
      ]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? message}
      accessibilityState={{ busy: true }}
      testID={testID}
    >
      <ActivityIndicator size={inline ? 'small' : size} color={colors.primary} />
      {message ? (
        <Text style={[styles.message, inline && styles.messageInline]}>{message}</Text>
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: SIZES.lg,
    },
    fullScreen: {
      flex: 1,
    },
    inline: {
      flexDirection: 'row',
      padding: SIZES.sm,
    },
    message: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: SIZES.md,
      textAlign: 'center',
    },
    messageInline: {
      marginTop: 0,
      marginLeft: SIZES.sm,
      textAlign: 'left',
    },
  });
