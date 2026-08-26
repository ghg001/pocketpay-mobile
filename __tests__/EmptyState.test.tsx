import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

import { EmptyState } from '../src/components/EmptyState';

describe('EmptyState', () => {
  it('renders the required title', () => {
    const { getByText } = render(<EmptyState title="No contacts yet" />);

    expect(getByText('No contacts yet')).toBeTruthy();
  });

  it('renders an optional message when provided', () => {
    const { getByText } = render(
      <EmptyState title="No activity yet" message="Your payments will appear here." />
    );

    expect(getByText('Your payments will appear here.')).toBeTruthy();
  });

  it('does not render a message node when none is provided', () => {
    const { queryByText } = render(<EmptyState title="No items" />);

    expect(queryByText('Your payments will appear here.')).toBeNull();
  });

  it('renders a custom icon', () => {
    const { getByTestId } = render(
      <EmptyState
        title="Empty"
        icon={<Text testID="custom-icon">icon</Text>}
      />
    );

    expect(getByTestId('custom-icon')).toBeTruthy();
  });

  it('renders the action button and fires onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="No contacts yet"
        action={{ label: 'Add Contact', onPress }}
      />
    );

    fireEvent.press(getByText('Add Contact'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not render an action button when no action is provided', () => {
    const { queryByText } = render(<EmptyState title="Empty" />);

    expect(queryByText('Add Contact')).toBeNull();
  });
});
