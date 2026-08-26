import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { SIZES, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';

interface ErrorStateAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface ErrorStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  action?: ErrorStateAction;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  icon,
  title = 'Something went wrong',
  message,
  action,
  style,
  testID = 'error-state',
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="alert"
      accessibilityLabel={title}
      testID={testID}
    >
      <View style={styles.iconWrapper}>
        {icon ?? <AlertTriangle color={colors.error} size={48} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action ? (
        <Button
          title={action.label}
          onPress={action.onPress}
          variant={action.variant ?? 'outline'}
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
