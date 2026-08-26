import { Stack } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.textPrimary,
      headerShadowVisible: false,
      contentStyle: {
        backgroundColor: colors.background,
      }
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ title: 'Create Wallet' }} />
      <Stack.Screen name="import" options={{ title: 'Import Wallet' }} />
      <Stack.Screen name="wallet-creation-success" options={{ title: 'Wallet Created', headerBackVisible: false }} />
    </Stack>
  );
}
