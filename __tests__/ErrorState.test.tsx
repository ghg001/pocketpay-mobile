import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

jest.mock('lucide-react-native', () => ({
  AlertTriangle: () => null,
}));

import { ErrorState } from '../src/components/ErrorState';

describe('ErrorState', () => {
  it('renders with the default title and alert role', () => {
    const { getByTestId } = render(<ErrorState />);

    const node = getByTestId('error-state');
    expect(node.props.accessibilityRole).toBe('alert');
    expect(node.props.accessibilityLabel).toBe('Something went wrong');
  });

  it('renders a custom title and message', () => {
    const { getByText } = render(
      <ErrorState title="Could not load data" message="Pull down to try again." />
    );

    expect(getByText('Could not load data')).toBeTruthy();
    expect(getByText('Pull down to try again.')).toBeTruthy();
  });

  it('does not render a message when none is provided', () => {
    const { queryByText } = render(<ErrorState title="Failed" />);

    expect(queryByText('Pull down to try again.')).toBeNull();
  });

  it('renders the action button and fires onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ErrorState
        title="Error"
        action={{ label: 'Retry', onPress }}
      />
    );

    fireEvent.press(getByText('Retry'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('accepts a caller-supplied testID', () => {
    const { getByTestId } = render(
      <ErrorState testID="recent-activity-error" />
    );

    expect(getByTestId('recent-activity-error')).toBeTruthy();
  });
});
