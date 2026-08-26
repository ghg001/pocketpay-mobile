import React, { useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useWalletStore } from '../../src/store/walletStore';
import { SIZES, RADIUS, ThemeColors } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/useTheme';
import { Button } from '../../src/components/Button';
import { FundButton } from '../../src/components/FundButton';
import { TransactionListItem } from '../../src/components/TransactionListItem';
import { NetworkStatusBanner } from '../../src/components/NetworkStatusBanner';
import { WalletEmptyState } from '../../src/components/WalletEmptyState';
import { BalanceDisplay } from '../../src/components/BalanceDisplay';
import { FundingStatusBanner } from '../../src/components/FundingStatusBanner';
import { LoadingState } from '../../src/components/LoadingState';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorState } from '../../src/components/ErrorState';
import { useNetworkState } from '../../src/hooks/useNetworkState';
import { Clock } from 'lucide-react-native';
import { BackupReminderModal } from '../../src/components/BackupReminderModal';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    publicKey,
    balance,
    transactions,
    lastRefreshed,
    isLoading,
    isFunding,
    fundError,
    error,
    balanceState,
    fundingStatus,
    refreshWalletData,
    fundWallet,
    checkFundingStatus,
    showBackupReminder,
    acknowledgeBackupReminder,
  } = useWalletStore();

  const { state: networkState, disableWriteActions, retry } = useNetworkState({ error });

  useEffect(() => {
    refreshWalletData();
    checkFundingStatus();
  }, []);

  const handleRetry = useCallback(() => {
    if (publicKey) {
      refreshWalletData();
      checkFundingStatus();
    }
  }, [publicKey, refreshWalletData, checkFundingStatus]);

  const recentTransactions = transactions.slice(0, 3); // Preview

  if (!publicKey) {
    return (
      <View style={styles.container}>
        <WalletEmptyState
          variant="missing"
          onCreate={() => router.replace('/(auth)/create')}
          onImport={() => router.replace('/(auth)/import')}
        />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRetry}
            tintColor={colors.primary}
          />
        }
      >
        <NetworkStatusBanner
          state={networkState}
          onRetry={handleRetry}
          isRetrying={isLoading}
        />

        {/* Issue #329: Balance display with all states */}
        <BalanceDisplay
          state={balanceState}
          balance={balance}
          publicKey={publicKey}
          onRetry={handleRetry}
          isRetrying={isLoading}
          lastRefreshed={lastRefreshed}
        />

        {/* Issue #330: Funding status banner */}
        <FundingStatusBanner
          status={fundingStatus}
          onFund={fundWallet}
          isFunding={isFunding}
          fundError={fundError}
        />

        <View style={styles.actionsContainer}>
          <Button
            title="Send"
            onPress={() => router.push('/send')}
            disabled={disableWriteActions}
            style={styles.actionButton}
          />
          <Button
            title="Receive"
            variant="secondary"
            onPress={() => router.push('/receive')}
            style={styles.actionButton}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text
            style={styles.seeAll}
            onPress={() => router.push('/(tabs)/history')}
          >
            See All
          </Text>
        </View>

        <View style={styles.transactionsList}>
          {recentTransactions.length === 0 && isLoading && (
            <LoadingState
              message="Loading transactions…"
              testID="recent-activity-loading"
            />
          )}
          {recentTransactions.length === 0 && !isLoading && error && (
            <ErrorState
              icon={<Clock color={colors.error} size={48} />}
              title="Could not load transactions"
              message="Pull down to try again."
              testID="recent-activity-error"
            />
          )}
          {recentTransactions.length === 0 && !isLoading && !error && (
            <EmptyState
              icon={<Clock color={colors.textMuted} size={48} />}
              title="No recent transactions"
              message="Your payments will appear here once you send or receive XLM."
              testID="recent-activity-empty"
            />
          )}
          {recentTransactions.map((tx, index) => (
            <TransactionListItem
              key={tx.id || index}
              transaction={tx}
              currentPublicKey={publicKey}
              variant="inline"
              onPress={() => router.push(`/transaction/${tx.id}`)}
            />
          ))}
        </View>
      </ScrollView>
      <BackupReminderModal
        visible={showBackupReminder}
        onAcknowledge={() => acknowledgeBackupReminder()}
      />
    </>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: SIZES.lg,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.xxl,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SIZES.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsList: {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.lg,
    padding: SIZES.md,
    marginBottom: SIZES.xxl,
  },
});
