import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/Button';
import { COLORS, SIZES, RADIUS } from '../src/constants/theme';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  const handleManualEntry = () => {
    router.replace('/send');
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Camera Permission Required</Text>
          <Text style={styles.subtitle}>
            We need camera access to scan QR codes. If you prefer not to grant permission or if your camera is unavailable, please enter the recipient address manually.
          </Text>
          <Button 
            title="Enter Address Manually" 
            onPress={handleManualEntry} 
            style={styles.button}
          />
          {permission.canAskAgain && (
             <Button 
               title="Request Camera Permission" 
               variant="secondary"
               onPress={requestPermission} 
               style={styles.button}
             />
          )}
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    // Pass the scanned data to the send screen
    router.replace(`/send?destination=${encodeURIComponent(data)}`);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.scanText}>Scan QR Code</Text>
        </View>
        <View style={styles.footer}>
          <Button 
            title="Enter Address Manually" 
            onPress={handleManualEntry} 
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SIZES.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.xxl,
    lineHeight: 24,
  },
  button: {
    marginBottom: SIZES.md,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SIZES.xl,
    paddingBottom: SIZES.xxl,
  },
  header: {
    marginTop: SIZES.xxl,
    alignItems: 'center',
  },
  scanText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: RADIUS.round,
    overflow: 'hidden',
  },
  footer: {
    width: '100%',
  }
});
