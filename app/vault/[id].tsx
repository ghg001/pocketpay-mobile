import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useVault } from '../../src/hooks/useVault';
import { useVaultAvailability } from '../../src/hooks/useVaultAvailability';
import { VaultUnavailableState } from '../../src/components/VaultUnavailableState';
import { SIZES, RADIUS, ThemeColors } from '../../src/constants/theme';
import { Lock } from '../../src/store/vaultStore';
import { VaultLockDetail } from '../../src/components/VaultLockDetail';
import { LoadingState } from '../../src/components/LoadingState';

export default function VaultLockDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isAvailable, reasons } = useVaultAvailability();
  const { locks, isLoadingLocks, findLock } = useVault();

  if (!isAvailable) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Stack.Screen options={{ title: 'Vault Lock Details' }} />
        <VaultUnavailableState
          reasons={reasons}
          onNavigateToSettings={() => router.push('/(tabs)/settings')}
        />
      </ScrollView>
    );
  }

  const lock: Lock | undefined = findLock(typeof id === 'string' ? id : '');
  const isLoading = isLoadingLocks;


  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Vault Lock Details' }} />
        <LoadingState fullScreen message="Loading lock details..." />
      </View>
    );
  }

  if (!lock) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ title: 'Lock Not Found' }} />
        <Text style={styles.errorText}>Vault lock with ID "{id}" not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Vault Lock Details' }} />
      <VaultLockDetail lock={lock} />
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    marginTop: SIZES.md,
    fontSize: 16,
  },
});