import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, Copy, Check, ExternalLink } from 'lucide-react-native';
import { Button } from '../src/components/Button';
import { COLORS, SIZES, RADIUS } from '../src/constants/theme';
import { getExplorerTxUrl } from '../src/services/stellar';
import { useAppStore } from '../src/store/appStore';
import { resolveAddressLabel } from '../src/utils/contacts';
import { formatAmount } from '../src/utils/amount';
import { useCopyToClipboard } from '../src/utils/clipboard';

/**
 * Payment receipt shown after a successful send. Never render the wallet's
 * secret key here — only the public transaction details below.
 */
export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { hash, amount, destination, date } = useLocalSearchParams<{
    hash?: string;
    amount?: string;
    destination?: string;
    date?: string;
  }>();
  const contacts = useAppStore((state) => state.contacts);
  const { copy, copiedField } = useCopyToClipboard();
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const explorerUrl = getExplorerTxUrl(hash);
  const destinationLabel = destination ? resolveAddressLabel(destination, contacts) : null;

  let formattedDate = '—';
  if (date) {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      formattedDate = parsedDate.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  const rawFormattedAmount = formatAmount(amount);
  const displayAmount = rawFormattedAmount && rawFormattedAmount !== '—' ? `${rawFormattedAmount} XLM` : '—';

  const handleCopyHash = async () => {
    if (!hash) return;
    await copy(hash, 'hash');
  };

  const handleOpenExplorer = () => {
    if (explorerUrl) Linking.openURL(explorerUrl);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.successIcon}>
        <CheckCircle color={COLORS.success} size={72} />
      </View>
      <Text style={styles.title}>Payment Confirmed</Text>
      <Text style={styles.subtitle}>Your transaction was confirmed on the network.</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Amount</Text>
          <Text style={styles.amountValue}>{displayAmount}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Date</Text>
        </View>
        <Text style={styles.addressValue}>
          {formattedDate}
        </Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>
            To{destinationLabel?.isContact ? ` · ${destinationLabel.label}` : ''}
          </Text>
        </View>
        <Text style={styles.addressValue} selectable numberOfLines={1} ellipsizeMode="middle">
          {destination ?? '—'}
        </Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Transaction Hash</Text>
        </View>
        <View style={styles.hashRow}>
          <Text style={styles.hashValue} selectable numberOfLines={1} ellipsizeMode="middle">
            {hash ?? '—'}
          </Text>
          {hash ? (
            <TouchableOpacity
              onPress={handleCopyHash}
              accessibilityLabel="Copy transaction hash"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {copiedField === 'hash' ? (
                <Check color={COLORS.success} size={20} />
              ) : (
                <Copy color={COLORS.textSecondary} size={20} />
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {explorerUrl ? (
          <TouchableOpacity
            style={styles.explorerLink}
            onPress={handleOpenExplorer}
            accessibilityLabel="View transaction on Stellar Expert"
            accessibilityRole="button"
          >
            <Text style={styles.explorerLinkText}>View on Stellar Expert</Text>
            <ExternalLink color={COLORS.primary} size={16} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          title="Back to Wallet"
          onPress={() => router.replace('/(tabs)')}
          style={styles.actionButton}
        />
        <Button
          title="View Activity"
          variant="outline"
          onPress={() => router.replace('/(tabs)/history')}
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SIZES.xl,
    paddingBottom: SIZES.xxl,
    alignItems: 'center',
  },
  successIcon: {
    marginTop: SIZES.xl,
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.xl,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SIZES.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: SIZES.xs,
  },
  amountValue: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  addressValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  hashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SIZES.sm,
  },
  hashValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.md,
  },
  explorerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.xs,
    marginTop: SIZES.lg,
    paddingVertical: SIZES.sm,
  },
  explorerLinkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: SIZES.sm,
  },
  actionButton: {
    width: '100%',
  },
});