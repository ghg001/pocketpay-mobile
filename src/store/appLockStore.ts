import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  hasHardwareAsync,
  isEnrolledAsync,
  authenticateAsync,
  AuthenticationType,
  SecurityLevel,
} from 'expo-local-authentication';

const LOCK_ENABLED_KEY = '@pocketpay_app_lock';
const LAST_AUTH_KEY = '@pocketpay_last_auth';

interface AppLockState {
  /** Whether the user has enabled app lock in settings */
  isLockEnabled: boolean;
  /** Whether the current session has been authenticated */
  isAuthenticated: boolean;
  /** Whether we're currently checking biometrics */
  isAuthenticating: boolean;
  /** Whether the device supports any form of biometric/passcode auth */
  hasBiometrics: boolean;
  /** Available auth types on this device */
  availableTypes: AuthenticationType[];
  /** Error from last auth attempt */
  authError: string | null;

  // Actions
  initializeLock: () => Promise<void>;
  enableLock: () => Promise<void>;
  disableLock: () => Promise<void>;
  authenticate: () => Promise<boolean>;
  lock: () => void;
}

export const useAppLockStore = create<AppLockState>((set, get) => ({
  isLockEnabled: false,
  isAuthenticated: false,
  isAuthenticating: false,
  hasBiometrics: false,
  availableTypes: [],
  authError: null,

  initializeLock: async () => {
    try {
      const [storedLock, bioAvailable, enrolled] = await Promise.all([
        AsyncStorage.getItem(LOCK_ENABLED_KEY),
        hasHardwareAsync(),
        isEnrolledAsync(),
      ]);

      const hasBio = bioAvailable && enrolled;

      set({
        isLockEnabled: storedLock === 'true',
        hasBiometrics: hasBio,
        availableTypes: hasBio
          ? [AuthenticationType.FINGERPRINT, AuthenticationType.FACIAL_RECOGNITION].filter(Boolean)
          : [],
        isAuthenticated: !(storedLock === 'true'), // If lock is enabled, start unauthenticated
      });
    } catch (err) {
      console.error('Failed to initialize app lock:', err);
      set({ isLockEnabled: false, isAuthenticated: true, hasBiometrics: false });
    }
  },

  enableLock: async () => {
    try {
      // Verify biometrics are available before enabling
      const [hasHW, enrolled] = await Promise.all([
        hasHardwareAsync(),
        isEnrolledAsync(),
      ]);

      if (!hasHW || !enrolled) {
        // Allow enabling even without biometrics — will fall back to device PIN/pattern
        set({
          isLockEnabled: true,
          hasBiometrics: false,
          availableTypes: [],
        });
        await AsyncStorage.setItem(LOCK_ENABLED_KEY, 'true');
        return;
      }

      set({
        isLockEnabled: true,
        hasBiometrics: true,
        availableTypes: [AuthenticationType.FINGERPRINT, AuthenticationType.FACIAL_RECOGNITION],
      });
      await AsyncStorage.setItem(LOCK_ENABLED_KEY, 'true');
    } catch (err) {
      console.error('Failed to enable app lock:', err);
    }
  },

  disableLock: async () => {
    set({ isLockEnabled: false, isAuthenticated: true, authError: null });
    await AsyncStorage.setItem(LOCK_ENABLED_KEY, 'false');
    try {
      await AsyncStorage.removeItem(LAST_AUTH_KEY);
    } catch {
      // Non-critical
    }
  },

  authenticate: async () => {
    const { isAuthenticating } = get();
    if (isAuthenticating) return false;

    set({ isAuthenticating: true, authError: null });

    try {
      const result = await authenticateAsync({
        promptMessage: 'Unlock PocketPay',
        fallbackLabel: 'Use device passcode',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        set({ isAuthenticated: true, isAuthenticating: false, authError: null });
        try {
          await AsyncStorage.setItem(LAST_AUTH_KEY, Date.now().toString());
        } catch { /* non-critical */ }
        return true;
      }

      // User cancelled or failed
      if (result.error === 'user_cancel' || result.error === 'system_cancel') {
        set({ isAuthenticating: false, authError: null });
      } else {
        set({
          isAuthenticating: false,
          authError: result.error || 'Authentication failed',
        });
      }
      return false;
    } catch (err: any) {
      set({
        isAuthenticating: false,
        authError: err?.message || 'Authentication error',
      });
      return false;
    }
  },

  lock: () => {
    set({ isAuthenticated: false, authError: null });
  },
}));
