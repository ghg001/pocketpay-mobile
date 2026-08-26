/**
 * useConfirm – shared imperative confirmation dialog
 *
 * Covers the reusable-component refactor acceptance criteria: destructive
 * confirmations behave identically wherever they are raised, async work keeps
 * the dialog busy, and the actions are labelled for assistive tech.
 */

import React from 'react';
import { Text, View } from 'react-native';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

jest.mock('lucide-react-native', () => ({
  X: () => null,
  AlertTriangle: () => null,
}));

import { useConfirm, ConfirmRequest } from '../src/hooks/useConfirm';

/** Harness that raises a confirmation on demand and records how it resolved. */
const Harness: React.FC<{
  request: ConfirmRequest;
  onResolved?: (confirmed: boolean) => void;
}> = ({ request, onResolved }) => {
  const { confirm, confirmationDialog, isVisible } = useConfirm();

  return (
    <View>
      <Text
        accessibilityRole="button"
        accessibilityLabel="raise"
        onPress={() => {
          void confirm(request).then((confirmed) => onResolved?.(confirmed));
        }}
      >
        raise
      </Text>
      <Text>{isVisible ? 'dialog-open' : 'dialog-closed'}</Text>
      {confirmationDialog}
    </View>
  );
};

const raise = async (getByLabelText: (label: string) => any) => {
  await act(async () => {
    fireEvent.press(getByLabelText('raise'));
  });
};

describe('useConfirm', () => {
  it('renders nothing until a confirmation is requested', () => {
    const { queryByText, getByText } = render(
      <Harness request={{ title: 'Delete Contact', message: 'Are you sure?' }} />
    );

    expect(getByText('dialog-closed')).toBeTruthy();
    expect(queryByText('Delete Contact')).toBeNull();
  });

  it('shows the requested title, message, and labels', async () => {
    const { getByLabelText, getByText } = render(
      <Harness
        request={{
          title: 'Delete Contact',
          message: 'Are you sure you want to delete "Ada"?',
          confirmLabel: 'Delete',
          destructive: true,
        }}
      />
    );

    await raise(getByLabelText);

    expect(getByText('Delete Contact')).toBeTruthy();
    expect(getByText('Are you sure you want to delete "Ada"?')).toBeTruthy();
    expect(getByLabelText('Delete')).toBeTruthy();
    expect(getByLabelText('Cancel')).toBeTruthy();
  });

  it('runs onConfirm and resolves true when confirmed', async () => {
    const onConfirm = jest.fn();
    const onResolved = jest.fn();

    const { getByLabelText } = render(
      <Harness
        request={{
          title: 'Delete Contact',
          message: 'Are you sure?',
          confirmLabel: 'Delete',
          destructive: true,
          onConfirm,
        }}
        onResolved={onResolved}
      />
    );

    await raise(getByLabelText);
    await act(async () => {
      fireEvent.press(getByLabelText('Delete'));
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onResolved).toHaveBeenCalledWith(true));
  });

  it('resolves false and skips onConfirm when cancelled', async () => {
    const onConfirm = jest.fn();
    const onResolved = jest.fn();

    const { getByLabelText, getByText } = render(
      <Harness
        request={{ title: 'Delete Contact', message: 'Are you sure?', onConfirm }}
        onResolved={onResolved}
      />
    );

    await raise(getByLabelText);
    await act(async () => {
      fireEvent.press(getByLabelText('Cancel'));
    });

    expect(onConfirm).not.toHaveBeenCalled();
    await waitFor(() => expect(onResolved).toHaveBeenCalledWith(false));
    expect(getByText('dialog-closed')).toBeTruthy();
  });

  it('closes the dialog once the confirmation settles', async () => {
    const { getByLabelText, getByText } = render(
      <Harness
        request={{
          title: 'Delete Contact',
          message: 'Are you sure?',
          confirmLabel: 'Delete',
          onConfirm: jest.fn(),
        }}
      />
    );

    await raise(getByLabelText);
    expect(getByText('dialog-open')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByLabelText('Delete'));
    });

    await waitFor(() => expect(getByText('dialog-closed')).toBeTruthy());
  });

  it('keeps the dialog busy and uncancellable while async work is in flight', async () => {
    let release: () => void = () => {};
    const onConfirm = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );

    const { getByLabelText, getByText } = render(
      <Harness
        request={{
          title: 'Withdraw',
          message: 'Withdraw the matured lock?',
          confirmLabel: 'Withdraw',
          onConfirm,
        }}
      />
    );

    await raise(getByLabelText);
    await act(async () => {
      fireEvent.press(getByLabelText('Withdraw'));
    });

    // Still open, with both actions locked out.
    expect(getByText('dialog-open')).toBeTruthy();
    expect(getByLabelText('Withdraw').props.accessibilityState.busy).toBe(true);
    expect(getByLabelText('Cancel').props.accessibilityState.disabled).toBe(true);

    // Cancelling mid-flight is a no-op rather than a half-applied action.
    await act(async () => {
      fireEvent.press(getByLabelText('Cancel'));
    });
    expect(getByText('dialog-open')).toBeTruthy();

    await act(async () => {
      release();
    });

    await waitFor(() => expect(getByText('dialog-closed')).toBeTruthy());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not run onConfirm twice when confirm is pressed repeatedly', async () => {
    let release: () => void = () => {};
    const onConfirm = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );

    const { getByLabelText } = render(
      <Harness
        request={{
          title: 'Delete Contact',
          message: 'Are you sure?',
          confirmLabel: 'Delete',
          onConfirm,
        }}
      />
    );

    await raise(getByLabelText);

    const confirmButton = getByLabelText('Delete');
    await act(async () => {
      fireEvent.press(confirmButton);
      fireEvent.press(confirmButton);
      fireEvent.press(confirmButton);
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);

    await act(async () => {
      release();
    });
  });
});
