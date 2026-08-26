/**
 * OfflineBanner
 *
 * A reusable, non-intrusive banner that displays when the device has no
 * internet connectivity. The banner is purely visual — it does not block
 * any read-only cached screens or prevent user interaction.
 *
 * Usage:
 * ```tsx
 * <OfflineBanner />
 * ```
 *
 * Or with manual control:
 * ```tsx
 * <OfflineBanner isOnline={false} />
 * ```
 *
 * Accessibility: uses accessibilityRole="alert" so screen readers announce
 * the offline state without requiring focus.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { WifiOff } from "lucide-react-native";
import { SIZES, RADIUS } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

interface OfflineBannerProps {
  /**
   * If provided, the component uses this value instead of auto-detecting
   * via `useOnlineStatus`. Useful for testing or parent-driven control.
   */
  isOnline?: boolean;
}

/**
 * OfflineBanner is displayed at the top of the screen when the device is
 * offline. It auto-detects connectivity via useOnlineStatus by default,
 * but callers can pass `isOnline` for manual control.
 *
 * The banner renders nothing when online.
 */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline: isOnlineProp,
}) => {
  const { colors } = useTheme();
  const { isOnline: detectedOnline } = useOnlineStatus();
  const isOnline = isOnlineProp !== undefined ? isOnlineProp : detectedOnline;

  if (isOnline) return null;

  const styles = createStyles(colors);

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel="You are offline"
      testID="offline-banner"
    >
      <WifiOff
        color={colors.warning}
        size={16}
        style={styles.icon}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={styles.message}>
        You are offline. Some features may not work until you reconnect.
      </Text>
    </View>
  );
};

const createStyles = (colors: {
  background: string;
  warning: string;
  textSecondary: string;
  border: string;
}) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 196, 0, 0.10)",
      borderWidth: 1,
      borderColor: "rgba(255, 196, 0, 0.30)",
      borderRadius: RADIUS.sm,
      paddingHorizontal: SIZES.md,
      paddingVertical: SIZES.sm,
      marginBottom: SIZES.sm,
    },
    icon: {
      marginRight: SIZES.xs,
      marginTop: 1,
    },
    message: {
      flex: 1,
      color: colors.warning,
      fontSize: 13,
      lineHeight: 18,
    },
  });
