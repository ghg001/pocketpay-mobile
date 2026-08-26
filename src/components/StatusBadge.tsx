import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RADIUS, SIZES, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export type BadgeTone = 'info' | 'success' | 'warning' | 'error';

interface StatusBadgeProps {
  text: string;
  tone: BadgeTone;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ text, tone }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const bg = {
    info: 'rgba(0, 229, 255, 0.12)',
    success: 'rgba(0, 230, 118, 0.12)',
    warning: 'rgba(255, 196, 0, 0.12)',
    error: 'rgba(255, 61, 0, 0.12)',
  }[tone];

  const fg = {
    info: colors.primary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    badge: {
      paddingHorizontal: SIZES.sm,
      paddingVertical: 2,
      borderRadius: RADIUS.round,
      alignSelf: 'flex-start',
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
  });
