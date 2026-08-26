import { useState, useRef, useCallback, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';

const COPY_FEEDBACK_DURATION_MS = 2000;

export interface CopyResult {
  ok: boolean;
  error?: string;
}

/**
 * Copy text to the system clipboard with error handling.
 * Returns a result object instead of throwing.
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  try {
    await Clipboard.setStringAsync(text);
    return { ok: true };
  } catch (error) {
    console.error('Clipboard copy failed:', error);
    return { ok: false, error: String(error) };
  }
}

/**
 * React hook for clipboard copy with automatic "copied" state reset.
 *
 * Returns an object with:
 * - `copy(text, fieldKey)`: copies text and marks `fieldKey` as copied
 * - `copiedField`: the currently-copied field key (or null)
 * - `reset()`: clears the copied state immediately
 */
export function useCopyToClipboard(resetDelayMs = COPY_FEEDBACK_DURATION_MS) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setCopiedField(null);
  }, []);

  const copy = useCallback(
    async (text: string, fieldKey: string): Promise<CopyResult> => {
      const result = await copyToClipboard(text);
      if (result.ok) {
        reset();
        setCopiedField(fieldKey);
        timeoutRef.current = setTimeout(() => {
          setCopiedField(null);
          timeoutRef.current = null;
        }, resetDelayMs);
      }
      return result;
    },
    [reset, resetDelayMs],
  );

  return { copy, copiedField, reset };
}
