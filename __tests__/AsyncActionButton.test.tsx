import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

import { AsyncActionButton } from '../src/components/AsyncActionButton';

describe('AsyncActionButton', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<AsyncActionButton title="Submit Payment" />);
    expect(getByText('Submit Payment')).toBeTruthy();
  });

  it('triggers onPress callback when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <AsyncActionButton title="Submit" onPress={onPressMock} />
    );

    fireEvent.press(getByText('Submit'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('prevents multiple concurrent clicks while executing async operation', async () => {
    let resolvePromise!: () => void;
    const asyncOperation = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    const { getByText } = render(
      <AsyncActionButton title="Confirm" onPress={asyncOperation} loadingText="Processing..." />
    );

    const button = getByText('Confirm');

    // First press
    fireEvent.press(button);
    expect(asyncOperation).toHaveBeenCalledTimes(1);

    // Concurrent second and third presses while pending
    fireEvent.press(button);
    fireEvent.press(button);

    // Verify onPress was NOT invoked again
    expect(asyncOperation).toHaveBeenCalledTimes(1);

    // Complete the async operation
    await act(async () => {
      resolvePromise();
    });

    await waitFor(() => {
      expect(getByText('Confirm')).toBeTruthy();
    });
  });

  it('shows loadingText and ActivityIndicator while executing', async () => {
    let resolvePromise!: () => void;
    const asyncOperation = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    const { getByText, queryByText } = render(
      <AsyncActionButton title="Save" loadingText="Saving..." onPress={asyncOperation} />
    );

    fireEvent.press(getByText('Save'));

    // Should now show loading text
    expect(getByText('Saving...')).toBeTruthy();
    expect(queryByText('Save')).toBeNull();

    await act(async () => {
      resolvePromise();
    });

    // Should return to normal state
    await waitFor(() => {
      expect(getByText('Save')).toBeTruthy();
    });
  });

  it('resets executing state even if onPress throws an error', async () => {
    const failingOperation = jest.fn().mockImplementation(async () => {
      throw new Error('Network error');
    });

    const { getByText } = render(
      <AsyncActionButton title="Retry" loadingText="Retrying..." onPress={failingOperation} />
    );

    await act(async () => {
      try {
        await fireEvent.press(getByText('Retry'));
      } catch (e) {
        // Suppress expected error in test handler
      }
    });

    await waitFor(() => {
      expect(getByText('Retry')).toBeTruthy();
    });
  });

  it('does not trigger onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <AsyncActionButton title="Disabled Button" disabled onPress={onPressMock} />
    );

    fireEvent.press(getByText('Disabled Button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });
});
