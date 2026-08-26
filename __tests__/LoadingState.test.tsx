/**
 * LoadingState – shared loading surface
 *
 * Covers the reusable-component refactor acceptance criteria around consistent
 * loading states and accessibility.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

import { LoadingState } from '../src/components/LoadingState';

describe('LoadingState', () => {
  it('announces the wait to assistive tech with a busy progressbar role', () => {
    const { getByTestId } = render(<LoadingState message="Loading lock details…" />);

    const node = getByTestId('loading-state');
    expect(node.props.accessibilityRole).toBe('progressbar');
    expect(node.props.accessibilityLabel).toBe('Loading lock details…');
    expect(node.props.accessibilityState).toEqual({ busy: true });
  });

  it('renders the visible message alongside the spinner', () => {
    const { getByText } = render(<LoadingState message="Loading older transactions…" />);

    expect(getByText('Loading older transactions…')).toBeTruthy();
  });

  it('falls back to an explicit accessibilityLabel when there is no visible message', () => {
    const { getByTestId, queryByText } = render(
      <LoadingState message="" accessibilityLabel="Loading vault balance" />
    );

    expect(getByTestId('loading-state').props.accessibilityLabel).toBe('Loading vault balance');
    expect(queryByText('Loading vault balance')).toBeNull();
  });

  it('supports a caller-supplied testID so existing screen tests keep working', () => {
    const { getByTestId } = render(
      <LoadingState inline message="Loading…" testID="loading-more-indicator" />
    );

    expect(getByTestId('loading-more-indicator')).toBeTruthy();
  });
});
