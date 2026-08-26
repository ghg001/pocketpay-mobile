import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';

interface UseDirtyFormOptions {
  /** Whether the form is currently dirty (has unsaved changes) */
  isDirty: boolean;
  /** Message to show in the confirmation dialog */
  message?: string;
  /** Callback when user confirms leaving */
  onConfirmLeave?: () => void;
  /** Callback when user cancels leaving */
  onCancelLeave?: () => void;
}

interface UseDirtyFormReturn {
  /** Show the confirmation dialog */
  showConfirm: boolean;
  /** Set the confirmation dialog visibility */
  setShowConfirm: (show: boolean) => void;
  /** Handle confirming leave */
  handleConfirmLeave: () => void;
  /** Handle canceling leave */
  handleCancelLeave: () => void;
  /** Reset the dirty state */
  resetDirty: () => void;
}

/**
 * Hook to handle dirty form protection
 */
export function useDirtyForm({
  isDirty,
  message = 'You have unsaved changes. Are you sure you want to leave?',
  onConfirmLeave,
  onCancelLeave,
}: UseDirtyFormOptions): UseDirtyFormReturn {
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleConfirmLeave = useCallback(() => {
    setShowConfirm(false);
    if (onConfirmLeave) {
      onConfirmLeave();
    }
  }, [onConfirmLeave]);

  const handleCancelLeave = useCallback(() => {
    setShowConfirm(false);
    if (onCancelLeave) {
      onCancelLeave();
    }
  }, [onCancelLeave]);

  const resetDirty = useCallback(() => {
    setShowConfirm(false);
  }, []);

  return {
    showConfirm,
    setShowConfirm,
    handleConfirmLeave,
    handleCancelLeave,
    resetDirty,
  };
}