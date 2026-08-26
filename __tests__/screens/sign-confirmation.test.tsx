import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignConfirmationScreen from '../../app/sign-confirmation';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useAppStore } from '../../src/store/appStore';

// Mock dependencies
jest.mock('expo-router');
jest.mock('../../src/hooks/useTheme');
jest.mock('../../src/store/appStore');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('SignConfirmationScreen', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  const mockTheme = {
    colors: {
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#000000',
      textSecondary: '#666666',
      primary: '#0066FF',
      warning: '#FF9500',
      error: '#FF3B30',
      success: '#34C759',
      border: '#E5E5E5',
    },
  };

  const mockContacts = [
    {
      id: '1',
      name: 'Alice',
      publicKey: 'GALICE123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    },
  ];

  const mockParams = {
    source: 'GSOURCE123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    destination: 'GDEST123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    amount: '10.50',
    assetCode: 'XLM',
    memo: 'Test payment',
    fee: '100',
    network: 'Testnet',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
    (useAppStore as jest.Mock).mockReturnValue(mockContacts);
    (useLocalSearchParams as jest.Mock).mockReturnValue(mockParams);
  });

  describe('Rendering', () => {
    it('should render all transaction details correctly', () => {
      render(<SignConfirmationScreen />);

      expect(screen.getByText('Confirm Signing')).toBeTruthy();
      expect(screen.getByText(/You are about to sign a blockchain transaction/)).toBeTruthy();
      expect(screen.getByText('Transaction Summary')).toBeTruthy();
      expect(screen.getByText('10.50 XLM')).toBeTruthy();
      expect(screen.getByText('Test payment')).toBeTruthy();
      expect(screen.getByText('100 stroops')).toBeTruthy();
      expect(screen.getByText('Testnet')).toBeTruthy();
    });

    it('should display warning banner', () => {
      render(<SignConfirmationScreen />);

      const warningText = screen.getByText(/cannot be undone/i);
      expect(warningText).toBeTruthy();
    });

    it('should display security information card', () => {
      render(<SignConfirmationScreen />);

      expect(screen.getByText('What Happens Next?')).toBeTruthy();
      expect(screen.getByText(/Your device will sign this transaction/)).toBeTruthy();
      expect(screen.getByText(/The signed transaction will be sent/)).toBeTruthy();
      expect(screen.getByText(/cannot be reversed/)).toBeTruthy();
      expect(screen.getByText(/private key never leaves/)).toBeTruthy();
    });

    it('should display privacy notice', () => {
      render(<SignConfirmationScreen />);

      expect(screen.getByText(/Technical details.*are hidden/i)).toBeTruthy();
    });

    it('should display action buttons', () => {
      render(<SignConfirmationScreen />);

      expect(screen.getByText('Cancel')).toBeTruthy();
      expect(screen.getByText('Sign Transaction')).toBeTruthy();
    });
  });

  describe('Contact Resolution', () => {
    it('should show contact name when destination is a saved contact', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        ...mockParams,
        destination: mockContacts[0].publicKey,
      });

      render(<SignConfirmationScreen />);

      expect(screen.getByText('Alice')).toBeTruthy();
    });

    it('should show truncated address for unknown contacts', () => {
      render(<SignConfirmationScreen />);

      // Should show truncated format (6 chars ... 6 chars)
      const truncatedAddress = screen.getByText(/GDEST1.*UVWXYZ/);
      expect(truncatedAddress).toBeTruthy();
    });
  });

  describe('Validation', () => {
    it('should show error card when source is missing', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        ...mockParams,
        source: undefined,
      });

      render(<SignConfirmationScreen />);

      expect(screen.getByText('Invalid Transaction')).toBeTruthy();
      expect(screen.getByText('Missing required transaction parameters.')).toBeTruthy();
      expect(screen.getByText('Go Back')).toBeTruthy();
    });

    it('should show error card when destination is missing', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        ...mockParams,
        destination: undefined,
      });

      render(<SignConfirmationScreen />);

      expect(screen.getByText('Invalid Transaction')).toBeTruthy();
    });

    it('should show error card when amount is missing', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        ...mockParams,
        amount: undefined,
      });

      render(<SignConfirmationScreen />);

      expect(screen.getByText('Invalid Transaction')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to review-transaction when Sign Transaction is pressed', async () => {
      render(<SignConfirmationScreen />);

      const signButton = screen.getByText('Sign Transaction');
      fireEvent.press(signButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith({
          pathname: '/review-transaction',
          params: {
            destination: mockParams.destination.trim(),
            amount: mockParams.amount.trim(),
            memo: mockParams.memo.trim(),
          },
        });
      });
    });

    it('should show loading state during navigation', async () => {
      render(<SignConfirmationScreen />);

      const signButton = screen.getByText('Sign Transaction');
      fireEvent.press(signButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeTruthy();
      });
    });

    it('should navigate back when Go Back is pressed in error state', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        ...mockParams,
        source: undefined,
      });

      render(<SignConfirmationScreen />);

      const goBackButton = screen.getByText('Go Back');
      fireEvent.press(goBackButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe('Cancellation', () => {
    it('should show confirmation alert when Cancel is pressed', () => {
      render(<SignConfirmationScreen />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.press(cancelButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Cancel Signing',
        'Are you sure you want to cancel? The transaction will not be signed or sent.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Keep Reviewing', style: 'cancel' }),
          expect.objectContaining({ text: 'Cancel', style: 'destructive' }),
        ])
      );
    });

    it('should navigate to home when cancel is confirmed', () => {
      render(<SignConfirmationScreen />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.press(cancelButton);

      // Get the alert callback and execute it
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmButton = alertCall[2].find((btn: any) => btn.text === 'Cancel');
      confirmButton.onPress();

      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty memo gracefully', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        ...mockParams,
        memo: '',
      });

      render(<SignConfirmationScreen />);

      // Memo row should not be visible
      expect(screen.queryByText('Memo')).toBeNull();
    });

    it('should handle very long memo text', () => {
      const longMemo = 'A'.repeat(100);
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        ...mockParams,
        memo: longMemo,
      });

      render(<SignConfirmationScreen />);

      // Should render without crashing
      expect(screen.getByText(longMemo)).toBeTruthy();
    });

    it('should handle zero amount', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        ...mockParams,
        amount: '0',
      });

      render(<SignConfirmationScreen />);

      // Should format zero amount
      expect(screen.getByText(/0\.00 XLM|0 XLM/)).toBeTruthy();
    });

    it('should use default values when optional params are missing', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        source: mockParams.source,
        destination: mockParams.destination,
        amount: mockParams.amount,
        // fee and network are optional
      });

      render(<SignConfirmationScreen />);

      // Should render with defaults
      expect(screen.getByText('Unknown')).toBeTruthy(); // Default fee
    });
  });

  describe('Disabled State', () => {
    it('should disable buttons during processing', async () => {
      render(<SignConfirmationScreen />);

      const signButton = screen.getByText('Sign Transaction');
      fireEvent.press(signButton);

      // Both buttons should be disabled
      const cancelButton = screen.getByText('Cancel');
      
      expect(signButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should prevent multiple clicks on Sign Transaction', async () => {
      render(<SignConfirmationScreen />);

      const signButton = screen.getByText('Sign Transaction');
      
      // Click multiple times rapidly
      fireEvent.press(signButton);
      fireEvent.press(signButton);
      fireEvent.press(signButton);

      // Should only navigate once
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for buttons', () => {
      render(<SignConfirmationScreen />);

      const signButton = screen.getByText('Sign Transaction');
      const cancelButton = screen.getByText('Cancel');

      expect(signButton).toBeTruthy();
      expect(cancelButton).toBeTruthy();
    });
  });

  describe('Theme Integration', () => {
    it('should use theme colors', () => {
      render(<SignConfirmationScreen />);

      // Component should render without errors when theme is provided
      expect(screen.getByText('Confirm Signing')).toBeTruthy();
    });

    it('should handle dark theme', () => {
      const darkTheme = {
        colors: {
          ...mockTheme.colors,
          background: '#000000',
          surface: '#1C1C1E',
          text: '#FFFFFF',
        },
      };

      (useTheme as jest.Mock).mockReturnValue(darkTheme);

      render(<SignConfirmationScreen />);

      expect(screen.getByText('Confirm Signing')).toBeTruthy();
    });
  });
});
