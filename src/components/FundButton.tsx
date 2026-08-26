import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AsyncActionButton } from './AsyncActionButton';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { Zap, AlertTriangle } from 'lucide-react-native';

interface FundButtonProps {
  isFunding: boolean;
  fundError: string | null;
  onFund: () => void;
  isFunded: boolean;
}

/**
 * Testnet-only funding component.
 *
 * When the account has zero balance it shows a Friendbot funding card.
 * After a successful funding the balance is > 0 and the card auto-hides.
 */
export const FundButton: React.FC<FundButtonProps> = ({
  isFunding,
  fundError,
  onFund,
  isFunded,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Do not render anything when the account is already funded
  if (isFunded) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconRow}>
          <Zap color={colors.warning} size={24} />
          <Text style={styles.title}>Unfunded Testnet Account</Text>
        </View>

        <Text style={styles.description}>
          This account hasn&apos;t been funded yet. Tap below to receive Testnet
          XLM from the Stellar Friendbot — free, no real value.
        </Text>

        {fundError ? (
          <View style={styles.errorBox}>
            <AlertTriangle color={colors.error} size={18} style={{ marginRight: SIZES.xs }} />
            <Text style={styles.errorText}>{fundError}</Text>
          </View>
        ) : null}

        <AsyncActionButton
          title="Fund with Friendbot"
          onPress={onFund}
          isLoading={isFunding}
          loadingText="Funding…"
          variant="secondary"
          style={styles.button}
        />
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: SIZES.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.lg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  title: {
    color: colors.warning,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SIZES.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SIZES.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 61, 0, 0.1)',
    borderRadius: RADIUS.sm,
    padding: SIZES.sm,
    marginBottom: SIZES.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    flex: 1,
  },
  button: {
    marginTop: SIZES.xs,
  },
});
