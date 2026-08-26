import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SIZES, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: EmptyStateAction;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action ? (
        <Button
          title={action.label}
          onPress={action.onPress}
          variant={action.variant ?? 'primary'}
          style={styles.action}
        />
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: SIZES.xl,
    },
    iconWrapper: {
      marginBottom: SIZES.md,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: SIZES.xs,
    },
    message: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    action: {
      marginTop: SIZES.lg,
      minWidth: 140,
    },
  });
