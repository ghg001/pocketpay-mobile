import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWalletStore, TransactionRecord } from '../../src/store/walletStore';
import { RADIUS, SIZES, ThemeColors } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/useTheme';
import { TransactionListItem } from '../../src/components/TransactionListItem';
import { NetworkStatusBanner } from '../../src/components/NetworkStatusBanner';
import { EmptyState } from '../../src/components/EmptyState';
import { WalletEmptyState } from '../../src/components/WalletEmptyState';
import { LoadingState } from '../../src/components/LoadingState';
import { useNetworkState } from '../../src/hooks/useNetworkState';
import { groupTransactionsByDate } from '../../src/utils/transactions';
import { PendingTransactionQueue } from '../../src/components/PendingTransactionQueue';

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Sent', value: 'sent' },
  { label: 'Received', value: 'received' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
  { label: 'Vault', value: 'vault' },
] as const;

type FilterType = (typeof FILTERS)[number]['value'];

// ─── Sub-components ────────────────────────────────────────────────────────────

/**
 * Footer rendered below the list while loading more items or when the
 * end-of-list has been reached.
 */
const ListFooter = ({
  isLoadingMore,
  hasMoreTransactions,
  hasTransactions,
  colors,
  styles,
}: {
  isLoadingMore: boolean;
  hasMoreTransactions: boolean;
  hasTransactions: boolean;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) => {
  if (!hasTransactions) return null;

  if (isLoadingMore) {
    return (
      <LoadingState
        inline
        message="Loading older transactions…"
        style={styles.footerLoading}
        testID="loading-more-indicator"
      />
    );
  }

  if (!hasMoreTransactions) {
    return (
      <View style={styles.footer} testID="end-of-list-indicator">
        <Text style={styles.footerText}>You've reached the beginning of your history.</Text>
      </View>
    );
  }

  return null;
};

/**
 * Shown when there are no transactions and the screen is not loading.
 */
const ActivityEmptyState = ({
  colors,
  styles,
  onReceivePress,
}: {
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  onReceivePress: () => void;
}) => (
  <View style={styles.emptyState} testID="empty-state">
    <EmptyState
      icon={<Clock color={colors.textMuted} size={48} />}
      title="No activity yet"
      message="Your payments and transfers will appear here once you send or receive XLM."
      action={{
        label: 'Receive XLM',
        onPress: onReceivePress,
        variant: 'outline',
      }}
    />
  </View>
);

/**
 * Skeleton placeholder rows shown while the activity list is initially loading.
 * Uses neutral shapes only – no fake transaction data.
 */
const ActivitySkeleton = ({
  colors,
  styles,
}: {
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) => (
  <View style={styles.skeletonContainer} testID="activity-skeleton">
    {Array.from({ length: 6 }).map((_, i) => (
      <View key={i} style={styles.skeletonRow}>
        <View style={[styles.skeletonAvatar, { backgroundColor: colors.border }]} />
        <View style={styles.skeletonLines}>
          <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '60%' }]} />
          <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '40%' }]} />
        </View>
      </View>
    ))}
  </View>
);

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const router = useRouter();
  const {
    transactions,
    isLoading,
    isLoadingMore,
    hasMoreTransactions,
    publicKey,
    error,
    refreshWalletData,
    loadMoreTransactions,
  } = useWalletStore();

  const { state: networkState, retry } = useNetworkState({ error });
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Load the first page on mount.
  useEffect(() => {
    if (publicKey) {
      refreshWalletData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  const [filter, setFilter] = useState<FilterType>('all');

  if (!publicKey) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <WalletEmptyState
          variant="missing"
          onCreate={() => router.replace('/(auth)/create')}
          onImport={() => router.replace('/(auth)/import')}
        />
      </View>
    );
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx: TransactionRecord) => {
      if (filter === 'all') return true;
      
      const isSent = tx.from === publicKey;
      const isReceived = tx.to === publicKey || tx.into === publicKey;
      const isFailed = tx.transaction_successful === false;
      const isPending = tx.is_pending === true || tx.status === 'pending';
      const isVault = tx.type === 'invoke_host_function' || tx.is_vault === true;

      if (filter === 'sent') return isSent && !isVault;
      if (filter === 'received') return isReceived && !isVault;
      if (filter === 'failed') return isFailed;
      if (filter === 'pending') return isPending;
      if (filter === 'vault') return isVault;

      return true;
    });
  }, [transactions, filter, publicKey]);

  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions]
  );

  const renderItem = useCallback(
    ({ item }: { item: TransactionRecord }) => (
      <TransactionListItem
        transaction={item}
        currentPublicKey={publicKey}
        variant="card"
        onPress={(tx: TransactionRecord) => router.push(`/transaction/${tx.id}`)}
      />
    ),
    [publicKey, router]
  );

  const keyExtractor = useCallback((item: TransactionRecord) => item.id, []);

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
    ),
    [styles]
  );

  /**
   * Triggered when the FlatList scrolls close to the end.
   * Only fires when there are more pages and we are not already fetching.
   */
  const handleEndReached = useCallback(() => {
    if (hasMoreTransactions && !isLoadingMore) {
      loadMoreTransactions();
    }
  }, [hasMoreTransactions, isLoadingMore, loadMoreTransactions]);

  const renderFooter = useCallback(
    () => (
      <ListFooter
        isLoadingMore={isLoadingMore}
        hasMoreTransactions={hasMoreTransactions}
        hasTransactions={transactions.length > 0}
        colors={colors}
        styles={styles}
      />
    ),
    [isLoadingMore, hasMoreTransactions, transactions.length, colors, styles]
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={groupedTransactions}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={[
          styles.listContent,
          transactions.length === 0 && styles.listContentEmpty,
        ]}
        // This manual refresh is what reconciles optimistic pending transactions
        // against Horizon (see walletStore.refreshWalletData). A future polling
        // hook could trigger it automatically on an interval, shaped like
        // useOnlineStatus.ts (setInterval + AppState foreground listener).
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshWalletData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        // Trigger load-more when 20 % of the list remains below the viewport.
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        ListHeaderComponent={
          <>
            <NetworkStatusBanner
              state={networkState}
              onRetry={() => { refreshWalletData(); retry(); }}
              isRetrying={isLoading}
            />
            <View style={styles.filterContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.filterScroll}
              >
                {FILTERS.map((f) => {
                  const isActive = filter === f.value;
                  return (
                    <TouchableOpacity
                      key={f.value}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setFilter(f.value)}
                    >
                      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <PendingTransactionQueue
              onRefresh={refreshWalletData}
              isRefreshing={isLoading}
            />
          </>
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          isLoading ? (
            <ActivitySkeleton colors={colors} styles={styles} />
          ) : (
            <ActivityEmptyState
              colors={colors}
              styles={styles}
              onReceivePress={() => router.push('/receive')}
            />
          )
        }
        // Avoid stale closures while also keeping rendering performant.
        extraData={{ isLoadingMore, hasMoreTransactions, colors, styles }}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: SIZES.lg,
    paddingBottom: SIZES.xxl,
  },
  /** When there are no items the FlatList should fill the screen so the
   *  empty state is centred vertically. */
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    padding: SIZES.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.xxl * 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.lg,
    gap: SIZES.sm,
  },
  // LoadingState supplies its own row layout and spacing, so this only needs
  // to match the sibling footer's vertical rhythm.
  footerLoading: {
    paddingVertical: SIZES.lg,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  sectionHeader: {
    paddingTop: SIZES.sm,
    paddingBottom: SIZES.xs,
    marginBottom: SIZES.xs,
  },
  sectionHeaderText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterContainer: {
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: SIZES.md,
  },
  filterScroll: {
    paddingHorizontal: SIZES.lg,
    gap: SIZES.xs,
  },
  filterChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: SIZES.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.background,
  },
  skeletonContainer: {
    padding: SIZES.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: SIZES.md,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
  },
  skeletonLines: {
    flex: 1,
    gap: SIZES.xs,
  },
  skeletonLine: {
    height: 12,
    borderRadius: RADIUS.sm,
  },
});
