export const sendXlmTransaction = jest.fn();
export const fetchXlmBalance = jest.fn(async () => '100.0000000');
export const fetchRecentTransactions = jest.fn(async () => []);
export const fetchTransactionsPage = jest.fn(async () => ({
  records: [],
  nextCursor: null,
  hasMore: false,
}));
export const generateKeypair = jest.fn(() => ({
  publicKey: 'GABC123',
  secretKey: 'SABC123',
}));
export const fetchAccountDetails = jest.fn();
export const fundWithFriendbot = jest.fn(async () => {});
export const mockConnectVault = jest.fn(async () => true);
export const mockFetchVaultBalance = jest.fn(async () => '0.0000000');
export const mockDepositToVault = jest.fn(async () => true);
export const mockWithdrawFromVault = jest.fn(async () => true);
