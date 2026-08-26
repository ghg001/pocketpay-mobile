/**
 * QrScanner
 *
 * A reusable camera overlay that:
 *  - Requests camera permission on mount
 *  - Scans QR codes and validates the result as a Stellar public key
 *  - Calls onScan with the valid address, or onError with a descriptive message
 *  - Exposes a close button that calls onClose
 *
 * Accessibility: all interactive elements carry accessibilityLabel / accessibilityRole.
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { X, ScanLine } from 'lucide-react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { validateAddress } from '../utils/validation';

export interface QrScannerProps {
  /** Called with a valid Stellar public-key string. */
  onScan: (address: string) => void;
  /** Called with a human-readable error message when the QR content is invalid. */
  onError: (message: string) => void;
  /** Called when the user dismisses the scanner. */
  onClose: () => void;
}

/** Pause between consecutive scan attempts (ms). Prevents duplicate rapid-fire callbacks. */
const SCAN_DEBOUNCE_MS = 1500;

export const QrScanner: React.FC<QrScannerProps> = ({ onScan, onError, onClose }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();
  const lastScanTime = useRef<number>(0);
  const [hasScanned, setHasScanned] = useState(false);

  // Request permission automatically on mount if not yet determined.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      const now = Date.now();
      if (hasScanned || now - lastScanTime.current < SCAN_DEBOUNCE_MS) return;

      lastScanTime.current = now;
      setHasScanned(true);

      const trimmed = data.trim();
      const error = validateAddress(trimmed);

      if (error) {
        onError('Invalid QR code: ' + error);
        // Allow scanning again after the debounce period.
        setTimeout(() => setHasScanned(false), SCAN_DEBOUNCE_MS);
      } else {
        onScan(trimmed);
      }
    },
    [hasScanned, onScan, onError],
  );

  // ── Permission: still loading ───────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.centred} accessibilityLiveRegion="polite">
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.statusText}>Checking camera permission…</Text>
      </View>
    );
  }

  // ── Permission: denied ─────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={styles.centred}>
        <ScanLine color={colors.textMuted} size={48} style={{ marginBottom: SIZES.md }} />
        <Text style={styles.statusText}>Camera access is required to scan QR codes.</Text>
        {permission.canAskAgain ? (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            accessibilityLabel="Grant camera permission"
            accessibilityRole="button"
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.subText}>
            Please enable camera access in your device settings, then try again.
          </Text>
        )}
        <TouchableOpacity
          style={styles.closeButtonFallback}
          onPress={onClose}
          accessibilityLabel="Close scanner"
          accessibilityRole="button"
        >
          <Text style={styles.closeButtonFallbackText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Permission: granted ────────────────────────────────────────────────────
  return (
    <View style={styles.container} accessibilityViewIsModal>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={hasScanned ? undefined : handleBarCodeScanned}
        accessibilityLabel="QR code scanner camera"
      />

      {/* Dark overlay with cut-out hint */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.topDim} />
        <View style={styles.middleRow}>
          <View style={styles.sideDim} />
          <View style={styles.scanWindow}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.sideDim} />
        </View>
        <View style={styles.bottomDim} />
      </View>

      {/* Instruction text */}
      <View style={styles.instructionContainer} pointerEvents="none">
        <Text style={styles.instructionText}>
          Point the camera at a Stellar address QR code
        </Text>
      </View>

      {/* Close button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        accessibilityLabel="Close scanner"
        accessibilityRole="button"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X color={colors.textPrimary} size={24} />
      </TouchableOpacity>
    </View>
  );
};

// ── Dimensions ──────────────────────────────────────────────────────────────
const SCAN_WINDOW_SIZE = 240;
const CORNER_SIZE = 20;
const CORNER_THICKNESS = 3;

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centred: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: SIZES.md,
  },
  subText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: SIZES.sm,
  },
  permissionButton: {
    marginTop: SIZES.lg,
    backgroundColor: colors.primary,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.xl,
    borderRadius: RADIUS.round,
  },
  permissionButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButtonFallback: {
    marginTop: SIZES.md,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.xl,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeButtonFallbackText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  // ── Camera overlay ──────────────────────────────────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  topDim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  bottomDim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  middleRow: {
    flexDirection: 'row',
    height: SCAN_WINDOW_SIZE,
  },
  sideDim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  scanWindow: {
    width: SCAN_WINDOW_SIZE,
    height: SCAN_WINDOW_SIZE,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: RADIUS.sm,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: RADIUS.sm,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: RADIUS.sm,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: RADIUS.sm,
  },
  // ── UI chrome ───────────────────────────────────────────────────────────────
  instructionContainer: {
    position: 'absolute',
    bottom: SIZES.xxl * 2,
    left: SIZES.xl,
    right: SIZES.xl,
    alignItems: 'center',
  },
  instructionText: {
    color: colors.textPrimary,
    fontSize: 15,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: SIZES.xl,
    right: SIZES.lg,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: RADIUS.round,
    padding: SIZES.sm,
  },
});
