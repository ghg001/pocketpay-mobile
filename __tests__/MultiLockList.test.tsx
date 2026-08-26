import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MultiLockList } from '../src/components/MultiLockList';
import { vaultLockScenarios } from '../tests/fixtures';

jest.mock('lucide-react-native', () => ({
  Lock: () => null,
  Unlock: () => null,
  CheckCircle2: () => null,
  Clock: () => null,
  AlertCircle: () => null,
}));

describe('MultiLockList', () => {
  it('shows both locked and matured locks with their status label and amount', () => {
    const { getAllByText, getByText } = render(
      <MultiLockList locks={vaultLockScenarios.mixed} />
    );

    expect(getAllByText('Locked').length).toBeGreaterThan(0);
    expect(getAllByText('Matured').length).toBeGreaterThan(0);
    getByText('100.0000000 XLM');
    getByText('50.5000000 XLM');
  });

  it('renders the empty state for an empty lock list', () => {
    const { getByText, queryByText } = render(
      <MultiLockList locks={vaultLockScenarios.empty} />
    );

    getByText('No Locks Yet');
    expect(queryByText('Locked')).toBeNull();
    expect(queryByText('Matured')).toBeNull();
  });

  it('only shows a Withdraw action on matured locks', () => {
    const onWithdraw = jest.fn();
    const { getAllByText } = render(
      <MultiLockList locks={vaultLockScenarios.mixed} onWithdraw={onWithdraw} />
    );

    // vaultLockScenarios.mixed has 2 matured locks (lock-2, lock-4).
    const withdrawButtons = getAllByText('Withdraw');
    expect(withdrawButtons).toHaveLength(2);

    fireEvent.press(withdrawButtons[0]);
    expect(onWithdraw).toHaveBeenCalledTimes(1);
  });

  it('renders only locked locks, with no Withdraw action, for allLocked scenario', () => {
    const onWithdraw = jest.fn();
    const { getAllByText, queryByText } = render(
      <MultiLockList locks={vaultLockScenarios.allLocked} onWithdraw={onWithdraw} />
    );

    expect(getAllByText('Locked').length).toBe(vaultLockScenarios.allLocked.length);
    expect(queryByText('Matured')).toBeNull();
    expect(queryByText('Withdraw')).toBeNull();
  });
});
