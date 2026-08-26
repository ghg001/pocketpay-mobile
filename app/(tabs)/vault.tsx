import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { VaultLockList } from '../../src/components/VaultLockList';
import { VaultConfirmModal } from '../../src/components/VaultConfirmModal';
import { VaultIntroModal } from '../../src/components/VaultIntroModal';
import { VaultLockEducationModal } from '../../src/components/VaultLockEducationModal';
import { VaultUnavailableState } from '../../src/components/VaultUnavailableState';
import { VaultErrorBanner } from '../../src/components/VaultErrorBanner';
import { LoadingState } from '../../src/components/LoadingState';
import { VaultActionProgress } from '../../src/components/VaultActionProgress';
import { Input } from '../../src/components/Input';
import { AsyncActionButton } from '../../src/components/AsyncActionButton';
import { SIZES, RADIUS, ThemeColors } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/useTheme';
import { useVault } from '../../src/hooks/useVault';
import { useVaultAvailability } from '../../src/hooks/useVaultAvailability';
import { useVaultCapabilities } from '../../src/hooks/useVaultCapabilities';
import { useVaultDepositForm } from '../../src/features/vault/useVaultDepositForm';
import { useVaultAction } from '../../src/hooks/useVaultAction';
import { useWalletStore } from '../../src/store/walletStore';
import { formatTimeRemaining } from '../../src/utils/lockTime';
import { validateAmount } from '../../src/utils/validation';
import { WALLET_SECRET_ACCESS_MESSAGE } from '../../src/utils/walletStorageErrors';
import { PiggyBank, Info, Lock, HelpCircle, ShieldCheck, AlertTriangle, Ban } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VaultReceiptModal } from "../../src/components/VaultReceiptModal";
import { isActionSupported, getActionUnsupportedReason, getActionUnsupportedDetail } from '../../src/utils/vaultCapabilities';
import { useNetworkState } from '../../src/hooks/useNetworkState';
import { NetworkStatusBanner } from '../../src/components/NetworkStatusBanner';
import { WithdrawalPreview } from '../../src/features/vault/WithdrawalPreview';
import { DepositPreview } from '../../src/features/vault/DepositPreview';
import type { VaultLock } from '../../src/types';

const LOCK_PERIOD_SECONDS = 30 * 24 * 60 * 60; // 30 days
const VAULT_INTRO_SEEN_KEY = '@pocketpay_vault_intro_seen';

export default function VaultScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Wallet & Vault stores
  const { publicKey, getSecretKey, balance: walletBalance, error: walletError } = useWalletStore();
  const { isAvailable, reasons, isContractConfigured } = useVaultAvailability();
  const { state: networkState, disableWriteActions: networkDisabled, retry: retryNetwork } = useNetworkState({ error: walletError });
  const {
    balance,
    locks: _unused_locks,
    isConfigured,
    contractId,
    isLoadingBalance,
    isLoadingLocks: _unused_isLoadingLocks,
    isSubmitting,
    balanceError,
    vaultError,
    loadBalance,
    loadLocks,
    addLock,
    unlockLock,
    deposit,
    withdraw,
    clearVaultError,
  } = useVault();

  // Issue #331: Vault capability gates
  const capabilities = useVaultCapabilities();
  const canDeposit = isActionSupported(capabilities, 'deposit');
  const canWithdraw = isActionSupported(capabilities, 'withdraw');
  const canLock = isActionSupported(capabilities, 'lock');
  const canUnlock = isActionSupported(capabilities, 'unlock');

  // Vault form
  const depositForm = useVaultDepositForm();

  // UI state
  const [introVisible, setIntroVisible] = useState(false);
  const [lockEducationVisible, setLockEducationVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<'deposit' | 'withdraw' | 'lock' | null>(null);
  const [pendingUnlockDate, setPendingUnlockDate] = useState<string>('');
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [showWithdrawalPreview, setShowWithdrawalPreview] = useState(false);
  const [showDepositPreview, setShowDepositPreview] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  const [receiptData, setReceiptData] = useState({
    actionType: "deposit" as "deposit" | "withdraw" | "lock",
    amount: "",
    status: "Success",
    date: "",
    transactionHash: null as string | null,
  });

  // Initial setup
  useEffect(() => {
    const checkIntro = async () => {
      const seen = await AsyncStorage.getItem(VAULT_INTRO_SEEN_KEY);
      if (!seen) {
        setIntroVisible(true);
      }
    };
    checkIntro();
  }, []);

  // ---- Multi-lock state (placeholder data until contract integration) ----
  const [locks, setLocks] = useState<VaultLock[]>([]);
  const [isLoadingLocks, setIsLoadingLocks] = useState(true);
  const [locksError, setLocksError] = useState<string | null>(null);

  useEffect(() => {
    if (isAvailable && publicKey) {
      loadBalance(publicKey);
      loadLocks();
    }
  }, [isAvailable, publicKey, loadBalance, loadLocks]);


  // Handlers
  const dismissIntro = async () => {
    await AsyncStorage.setItem(VAULT_INTRO_SEEN_KEY, 'true');
    setIntroVisible(false);
  };

  const handleAmountChange = (value: string) => {
    depositForm.setAmount(value);
    depositForm.setAmountError(undefined);
  };

  const handleDepositPress = () => {
    const isValid = depositForm.validate(walletBalance);
    if (!isValid) return;

    setDepositError(null);
    setShowDepositPreview(true);
  };

  const handleDepositConfirm = () => {
    setShowDepositPreview(false);
    // Set pending action and execute the deposit flow directly —
    // the DepositPreview itself serves as the confirmation step.
    setPendingAction('deposit');
    handleConfirmAction();
  };

  const vaultAction = useVaultAction();
  const handleAction = async (action: 'deposit' | 'withdraw' | 'lock') => {
    // Validate amount
    let amountError: string | undefined;
    if (action === 'deposit') {
      const isValid = depositForm.validate(walletBalance);
      if (!isValid) return;
    } else if (action === 'withdraw') {
      amountError = validateAmount(depositForm.amount, balance) ??
        (parseFloat(depositForm.amount) > parseFloat(balance)
          ? "You don't have enough XLM in the vault for this withdrawal."
          : undefined);
      depositForm.setAmountError(amountError);
      if (amountError) return;
    } else { // lock
      amountError = validateAmount(depositForm.amount, walletBalance) ??
        (parseFloat(depositForm.amount) > parseFloat(walletBalance)
          ? "You don't have enough XLM in your wallet for this lock."
          : undefined);
      depositForm.setAmountError(amountError);
      if (amountError) return;
    }

    setPendingAction(action);
    if (action === 'lock') {
      const unlockDate = new Date(Date.now() + LOCK_PERIOD_SECONDS * 1000);
      setPendingUnlockDate(unlockDate.toLocaleDateString());
    }
    setConfirmVisible(true);
  };

 const handleConfirmAction = async () => {
    if (!publicKey || !pendingAction) return;

    await vaultAction.run({
      sign: async () => {
        if (pendingAction === 'withdraw') {
          const secret = await getSecretKey();
          if (!secret) throw new Error(WALLET_SECRET_ACCESS_MESSAGE);
          return secret;
        }
        return null;
      },
      submit: async () => {
        if (pendingAction === 'lock') {
          const unlockDate = new Date(Date.now() + LOCK_PERIOD_SECONDS * 1000);
          await addLock(depositForm.amount, unlockDate.toISOString());
          return { txHash: 'mock-lock' };
        } else if (pendingAction === 'deposit') {
          const hash = await depositForm.submit(publicKey, getSecretKey, deposit, walletBalance);
          return { txHash: hash || 'mock-deposit' };
        } else {
          const secret = await getSecretKey();
          if (!secret) throw new Error(WALLET_SECRET_ACCESS_MESSAGE);
          const hash = await withdraw(secret, publicKey, depositForm.amount);
          return { txHash: hash || 'mock-withdraw' };
        }
      },
      confirm: async () => {
        setConfirmVisible(false);
        const hash = vaultAction.status.txHash;
        setReceiptData({
          actionType: pendingAction as 'deposit' | 'withdraw' | 'lock',
          amount: depositForm.amount,
          status: vaultAction.status.state === 'confirmed' ? 'Success' : 'Failed',
          date: new Date().toLocaleString(),
          transactionHash: hash || null,
        });
        setReceiptVisible(true);

        depositForm.setAmount("");
        depositForm.setAmountError(undefined);
      },
    });

    if (vaultAction.status.state === 'failed') {
      setConfirmVisible(false);
      setReceiptData({
        actionType: pendingAction as 'deposit' | 'withdraw' | 'lock',
        amount: depositForm.amount,
        status: 'Failed',
        date: new Date().toLocaleString(),
        transactionHash: null,
      });
      setReceiptVisible(true);
      depositForm.setAmount("");
      depositForm.setAmountError(undefined);
    }
  };
  const cancelAction = () => {
    setConfirmVisible(false);
  };

  const handleUnlock = async (lockId: string) => {
    try {
      await unlockLock(lockId);
      Alert.alert('Success', 'Funds unlocked! (mock)');
    } catch (e: any) {
      Alert.alert('Unlock failed', e.message);
    }
  };

  const handleWithdrawPress = () => {
    setShowWithdrawalPreview(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <VaultIntroModal visible={introVisible} onContinue={dismissIntro} />
      <VaultLockEducationModal
        visible={lockEducationVisible}
        onClose={() => setLockEducationVisible(false)}
      />
      <VaultConfirmModal
        visible={confirmVisible}
        actionType={pendingAction || 'deposit'}
        amount={depositForm.amount}
        isLoading={isSubmitting || depositForm.isSubmitting}
        contractId={isConfigured ? contractId : undefined}
        unlockTime={pendingAction === 'lock' ? pendingUnlockDate : undefined}
        onConfirm={handleConfirmAction}
        onCancel={cancelAction}
      />

      <VaultReceiptModal
        visible={receiptVisible}
        actionType={receiptData.actionType}
        amount={receiptData.amount}
        status={receiptData.status}
        date={receiptData.date}
        transactionHash={receiptData.transactionHash}
        onClose={() => setReceiptVisible(false)}
      />

      <NetworkStatusBanner
        state={networkState}
        onRetry={() => {
          retryNetwork();
          if (publicKey) {
            loadBalance(publicKey);
            loadLocks();
          }
        }}
      />

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setIntroVisible(true)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Info color={colors.textMuted} size={18} />
        </TouchableOpacity>
        <View style={styles.iconContainer}>
          <PiggyBank color={colors.primary} size={40} />
        </View>
        <Text style={styles.cardTitle}>Soroban Savings Vault</Text>
        {isLoadingBalance ? (
          <LoadingState
            message=""
            style={styles.balanceLoader}
            accessibilityLabel="Loading vault balance"
          />
        ) : (
          <Text style={styles.balanceValue}>{balance} XLM</Text>
        )}
        <Text style={styles.cardSubtitle}>
          {isConfigured
            ? `Contract ${contractId.slice(0, 4)}…${contractId.slice(-4)}`
            : 'Mock balance'}
        </Text>
        {balanceError && (
          <View style={styles.balanceErrorBox}>
            <Text style={styles.balanceErrorText}>{balanceError}</Text>
            <TouchableOpacity onPress={() => publicKey && loadBalance(publicKey)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Issue #331: Pass unlock capability to lock list */}
      <VaultLockList
        locks={locks}
        isLoading={isLoadingLocks}
        onUnlock={canUnlock ? handleUnlock : undefined}
        onInfoPress={() => setLockEducationVisible(true)}
        unlockDisabledReason={!canUnlock ? getActionUnsupportedReason(capabilities, 'unlock') : undefined}
      />


      {isContractConfigured ? (
        <View style={styles.infoBox}>
          <ShieldCheck color={colors.success} size={24} style={{ marginRight: SIZES.sm }} />
          <Text style={styles.infoText}>
            Connected to a live Soroban smart contract on{' '}
            {process.env.EXPO_PUBLIC_STELLAR_NETWORK || 'TESTNET'}. Deposits and withdrawals
            submit real transactions.
          </Text>
        </View>
      ) : (
        <View style={styles.warningBox}>
          <AlertTriangle color={colors.warning} size={24} style={{ marginRight: SIZES.sm }} />
          <Text style={styles.warningText}>
            No vault contract configured. Set EXPO_PUBLIC_VAULT_CONTRACT_ID in your .env file to
            connect to a deployed Soroban contract. Running in mock mode — no real funds are
            moved.
          </Text>
        </View>
      )}

      {!isAvailable ? (
        <VaultUnavailableState
          reasons={reasons}
          onNavigateToSettings={() => router.push('/(tabs)/settings')}
          onRetry={() => {
            if (publicKey) {
              loadBalance(publicKey);
              loadLocks();
            }
          }}
        />
      ) : (
        <View style={styles.form}>
          <VaultActionProgress state={vaultAction.state} errorMessage={vaultAction.status.error} />

          {vaultError && (
            <VaultErrorBanner
              guidance={vaultError}
              onRetry={() => {
                clearVaultError();
              }}
              onDismiss={clearVaultError}
            />
          )}

          {/* Issue #331: Capability gate explanations */}
          {(!canDeposit || !canWithdraw || !canLock) && (
            <View style={styles.capabilityNotice}>
              <Ban color={colors.warning} size={18} style={{ marginRight: SIZES.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.capabilityNoticeTitle}>Some actions are unavailable</Text>
                <Text style={styles.capabilityNoticeText}>
                  {getActionUnsupportedReason(capabilities, 'deposit')}
                  {getActionUnsupportedReason(capabilities, 'withdraw') ? `\nWithdraw: ${getActionUnsupportedReason(capabilities, 'withdraw')}` : ''}
                  {getActionUnsupportedReason(capabilities, 'lock') ? `\nLock: ${getActionUnsupportedReason(capabilities, 'lock')}` : ''}
                </Text>
              </View>
            </View>
          )}

          <Input
            label="Amount (XLM)"
            placeholder="0.00"
            value={depositForm.amount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            error={depositForm.amountError}
            editable={!(isSubmitting || depositForm.isSubmitting)}
          />
          <View style={styles.actions}>
            <AsyncActionButton
              title={canDeposit ? 'Deposit' : 'Deposit Unavailable'}
              onPress={handleDepositPress}
              isLoading={depositForm.isSubmitting || (isSubmitting && pendingAction === 'deposit')}
              loadingText="Depositing…"
              disabled={!canDeposit || isLoadingBalance || networkDisabled}
              style={styles.actionButton}
            />
            <AsyncActionButton
              title={canWithdraw ? 'Withdraw' : 'Withdraw Unavailable'}
              variant="secondary"
              onPress={handleWithdrawPress}
              isLoading={isSubmitting && pendingAction === 'withdraw'}
              loadingText="Withdrawing…"
              disabled={!canWithdraw || isLoadingBalance || depositForm.isSubmitting || networkDisabled}
              style={styles.actionButton}
            />
          </View>
          <AsyncActionButton
            title={canLock ? 'Set Aside for 30 Days' : 'Lock Unavailable'}
            variant="outline"
            onPress={() => handleAction('lock')}
            isLoading={isSubmitting && pendingAction === 'lock'}
            loadingText="Locking…"
            disabled={!canLock || isSubmitting || depositForm.isSubmitting || networkDisabled}
            style={styles.lockButton}
          />
          {locks.length === 0 ? (
            <View style={styles.mockLockSection}>
              <Text style={styles.mockLockTitle}>No active locks yet</Text>
              <Text style={styles.mockLockHint}>
                Use "Set Aside for 30 Days" above to create a time-locked deposit.
              </Text>
            </View>
          ) : null}
        </View>
      )}

      <WithdrawalPreview
        visible={showWithdrawalPreview}
        onDismiss={() => setShowWithdrawalPreview(false)}
      />

      <DepositPreview
        visible={showDepositPreview}
        params={{
          amount: depositForm.amount,
          asset: 'XLM',
          walletBalance,
          vaultContractId: contractId,
          isConfigured,
          isSubmitting,
          error: depositError,
        }}
        onConfirm={handleDepositConfirm}
        onCancel={() => {
          setShowDepositPreview(false);
          setDepositError(null);
        }}
      />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: SIZES.xl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: SIZES.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  infoButton: {
    position: 'absolute',
    top: SIZES.md,
    right: SIZES.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  cardTitle: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: SIZES.sm,
  },
  balanceValue: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: SIZES.xs,
  },
  balanceLoader: {
    marginVertical: SIZES.sm,
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  balanceErrorBox: {
    marginTop: SIZES.md,
    alignItems: 'center',
  },
  balanceErrorText: {
    color: colors.error,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SIZES.xs,
  },
  retryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  infoText: {
    color: colors.success,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 196, 0, 0.1)',
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  warningText: {
    color: colors.warning,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  form: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SIZES.xs,
  },
  lockButton: {
    marginTop: SIZES.md,
  },
  capabilityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 196, 0, 0.08)',
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 0, 0.25)',
    marginBottom: SIZES.md,
  },
  capabilityNoticeTitle: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  capabilityNoticeText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  mockLockSection: {
    marginTop: SIZES.xl,
  },
  mockLockTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: SIZES.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mockLockHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  unavailableCard: {
    backgroundColor: colors.surface,
    padding: SIZES.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
    marginBottom: SIZES.xl,
  },
  unavailableTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
  },
  unavailableText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SIZES.lg,
  },
  unavailableDetail: {
    backgroundColor: 'rgba(255, 61, 0, 0.06)',
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    width: '100%',
    marginBottom: SIZES.sm,
  },
  unavailableDetailLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  unavailableDetailValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '600',
    marginBottom: 4,
  },
  unavailableDetailHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  unavailableDocsLink: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: SIZES.sm,
  },
});
