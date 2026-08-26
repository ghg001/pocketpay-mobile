/**
 * ReviewConfirm – shared "check the details, then commit" surface
 *
 * Covers the reusable-component refactor acceptance criteria around review
 * confirmations, consistent loading/disabled states, and accessibility.
 */

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

import { ReviewConfirm, ReviewItem } from '../src/components/ReviewConfirm';

const ITEMS: ReviewItem[] = [
  { label: 'To', value: 'Ada', secondaryValue: 'GABC…XYZ', truncate: true },
  { label: 'Amount', value: '10.5 XLM', emphasis: true },
];

describe('ReviewConfirm', () => {
  it('renders every detail row', () => {
    const { getByText } = render(
      <ReviewConfirm items={ITEMS} confirmLabel="Sign & Send" onConfirm={jest.fn()} />
    );

    expect(getByText('To')).toBeTruthy();
    expect(getByText('Ada')).toBeTruthy();
    expect(getByText('GABC…XYZ')).toBeTruthy();
    expect(getByText('Amount')).toBeTruthy();
    expect(getByText('10.5 XLM')).toBeTruthy();
  });

  it('exposes the whole summary as one screen-reader label', () => {
    const { getByTestId } = render(
      <ReviewConfirm items={ITEMS} confirmLabel="Sign & Send" onConfirm={jest.fn()} />
    );

    const card = getByTestId('review-confirm').findByProps({ accessibilityRole: 'summary' });
    expect(card.props.accessibilityLabel).toBe('To: Ada: GABC…XYZ, Amount: 10.5 XLM');
  });

  it('invokes onConfirm when the confirm action is pressed', async () => {
    const onConfirm = jest.fn();
    const { getByLabelText } = render(
      <ReviewConfirm items={ITEMS} confirmLabel="Sign & Send" onConfirm={onConfirm} />
    );

    await act(async () => {
      fireEvent.press(getByLabelText('Sign & Send'));
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('blocks a second press while an async confirm is still in flight', async () => {
    let release: () => void = () => {};
    const onConfirm = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );

    const { getByLabelText } = render(
      <ReviewConfirm items={ITEMS} confirmLabel="Sign & Send" onConfirm={onConfirm} />
    );

    const button = getByLabelText('Sign & Send');
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);

    expect(onConfirm).toHaveBeenCalledTimes(1);

    await act(async () => {
      release();
    });
  });

  it('shows the loading copy and marks the action busy while confirming', () => {
    const { getByLabelText, getByText } = render(
      <ReviewConfirm
        items={ITEMS}
        confirmLabel="Sign & Send"
        loadingText="Signing…"
        isLoading
        onConfirm={jest.fn()}
      />
    );

    expect(getByText('Signing…')).toBeTruthy();
    const button = getByLabelText('Sign & Send');
    expect(button.props.accessibilityState.busy).toBe(true);
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('disables the confirm action and explains why to assistive tech', () => {
    const onConfirm = jest.fn();
    const { getByLabelText } = render(
      <ReviewConfirm
        items={ITEMS}
        confirmLabel="Sign & Send"
        confirmDisabled
        confirmDisabledHint="Enter an amount first"
        onConfirm={onConfirm}
      />
    );

    const button = getByLabelText('Sign & Send');
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(button.props.accessibilityHint).toBe('Enter an amount first');

    fireEvent.press(button);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('renders the summary alone when no actions are supplied', () => {
    const { queryByLabelText, getByText } = render(<ReviewConfirm items={ITEMS} />);

    expect(getByText('10.5 XLM')).toBeTruthy();
    expect(queryByLabelText('Sign & Send')).toBeNull();
  });

  it('renders a cancel action only when onCancel is supplied', async () => {
    const onCancel = jest.fn();
    const { getByLabelText } = render(
      <ReviewConfirm
        items={ITEMS}
        confirmLabel="Sign & Send"
        onConfirm={jest.fn()}
        cancelLabel="Back to Edit"
        onCancel={onCancel}
      />
    );

    fireEvent.press(getByLabelText('Back to Edit'));
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
  });
});
