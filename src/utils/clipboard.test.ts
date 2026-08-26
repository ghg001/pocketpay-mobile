import { copyToClipboard } from './clipboard';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

import * as Clipboard from 'expo-clipboard';

const mockedClipboard = Clipboard as jest.Mocked<typeof Clipboard>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('copyToClipboard', () => {
  it('returns ok:true when clipboard write succeeds', async () => {
    mockedClipboard.setStringAsync.mockResolvedValueOnce(undefined);

    const result = await copyToClipboard('test-value');

    expect(result).toEqual({ ok: true });
    expect(mockedClipboard.setStringAsync).toHaveBeenCalledWith('test-value');
  });

  it('returns ok:false when clipboard write throws', async () => {
    mockedClipboard.setStringAsync.mockRejectedValueOnce(new Error('access denied'));

    const result = await copyToClipboard('test-value');

    expect(result.ok).toBe(false);
    expect(result.error).toContain('access denied');
  });

  it('passes the exact text to Clipboard.setStringAsync', async () => {
    mockedClipboard.setStringAsync.mockResolvedValueOnce(undefined);

    const longAddress = 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H';
    await copyToClipboard(longAddress);

    expect(mockedClipboard.setStringAsync).toHaveBeenCalledWith(longAddress);
  });
});
