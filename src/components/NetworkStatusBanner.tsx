import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WifiOff, AlertTriangle, CloudOff, RefreshCw } from 'lucide-react-native';
import { COLORS, SIZES, RADIUS } from '../constants/theme';
import type { NetworkState } from '../types/network';
import { describeNetworkState } from '../types/network';

export interface NetworkStatusBannerProps {
  /** The current network state. */
  state: NetworkState;
  /** Called when the user taps the Retry button. */
  onRetry?: () => void;
  /** True while a re-check or refresh is in flight. */
  isRetrying?: boolean;
  /** Optional custom test ID for the container. Defaults to 'network-status-banner'. */
  testID?: string;
  /** Optional custom test ID for the retry button. Defaults to 'network-status-retry'. */
  retryTestID?: string;
}

const ICON_MAP = {
  'wifi-off': WifiOff,
  'alert-triangle': AlertTriangle,
  'cloud-off': CloudOff,
  'help-circle': AlertTriangle,
} as const;

const STATE_COLORS: Record<NetworkState, string> = {
  online: COLORS.success,
  degraded: COLORS.warning,
  'service-unavailable': COLORS.error,
  offline: COLORS.error,
  'wrong-network': COLORS.error,
  unknown: COLORS.textMuted,
};

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({
  state,
  onRetry,
  isRetrying = false,
  testID = 'network-status-banner',
  retryTestID = 'network-status-retry',
}: NetworkStatusBannerProps) => {
  const copy = describeNetworkState(state);

  if (!copy.showBanner) return null;

  const Icon = ICON_MAP[copy.bannerIcon];
  const iconColor = STATE_COLORS[state];

  return (
    <View
      style={[styles.container, { borderColor: `${iconColor}30` }]}
      accessibilityRole="alert"
      accessibilityLabel={copy.bannerMessage}
      testID={testID}
    >
      <View style={styles.content}>
        <Icon
          color={iconColor}
          size={16}
          style={styles.icon}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text style={[styles.message, { color: iconColor }]} numberOfLines={2}>
          {copy.bannerMessage}
        </Text>
      </View>

      {onRetry && copy.retryLabel ? (
        <TouchableOpacity
          onPress={onRetry}
          disabled={isRetrying}
          style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel={copy.retryLabel}
          accessibilityState={{ disabled: isRetrying }}
          testID={retryTestID}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <RefreshCw
            color={isRetrying ? COLORS.textMuted : COLORS.primary}
            size={14}
            style={styles.retryIcon}
          />
          <Text style={[styles.retryText, isRetrying && styles.retryTextDisabled]}>
            {copy.retryLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 196, 0, 0.10)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    marginBottom: SIZES.md,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: SIZES.sm,
  },
  icon: {
    marginRight: SIZES.xs,
    marginTop: 1,
  },
  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  retryButtonDisabled: {
    borderColor: COLORS.border,
  },
  retryIcon: {
    marginRight: 4,
  },
  retryText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  retryTextDisabled: {
    color: COLORS.textMuted,
  },
});
