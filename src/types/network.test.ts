import { describeNetworkState } from './network';
import type { NetworkState } from './network';

describe('describeNetworkState', () => {
  it('returns no banner for online state', () => {
    const result = describeNetworkState('online');
    expect(result.showBanner).toBe(false);
    expect(result.disableWriteActions).toBe(false);
  });

  it('returns banner and disables write-actions for offline', () => {
    const result = describeNetworkState('offline');
    expect(result.showBanner).toBe(true);
    expect(result.disableWriteActions).toBe(true);
    expect(result.bannerMessage).toContain('offline');
    expect(result.retryLabel).toBe('Retry');
  });

  it('returns banner and disables write-actions for service-unavailable', () => {
    const result = describeNetworkState('service-unavailable');
    expect(result.showBanner).toBe(true);
    expect(result.disableWriteActions).toBe(true);
    expect(result.bannerMessage).toContain('unavailable');
  });

  it('returns banner but allows write-actions for degraded', () => {
    const result = describeNetworkState('degraded');
    expect(result.showBanner).toBe(true);
    expect(result.disableWriteActions).toBe(false);
    expect(result.bannerMessage).toContain('unstable');
  });

  it('returns no banner for unknown state', () => {
    const result = describeNetworkState('unknown');
    expect(result.showBanner).toBe(false);
    expect(result.disableWriteActions).toBe(false);
  });

  it('returns banner and disables write-actions for wrong-network', () => {
    const result = describeNetworkState('wrong-network');
    expect(result.showBanner).toBe(true);
    expect(result.disableWriteActions).toBe(true);
    expect(result.bannerMessage).toContain('wrong blockchain network');
  });

  it('covers all network states without crashing', () => {
    const states: NetworkState[] = ['online', 'degraded', 'service-unavailable', 'offline', 'wrong-network', 'unknown'];
    states.forEach((state) => {
      const result = describeNetworkState(state);
      expect(result).toHaveProperty('showBanner');
      expect(result).toHaveProperty('disableWriteActions');
      expect(result).toHaveProperty('bannerMessage');
      expect(result).toHaveProperty('bannerIcon');
    });
  });
});
