export const errorFixtures = {
  networkError: {
    message: 'Network request failed',
    status: 0,
    code: 'ECONNRESET',
  },
  /** Request never got a response — distinct from a connection reset. */
  timeoutError: {
    message: 'Request timed out',
    status: 0,
    code: 'ETIMEDOUT',
  },
  /** Device has no network connectivity at all (checked before the request fires). */
  offlineError: {
    message: 'No internet connection',
    status: 0,
    code: 'ENETUNREACH',
  },
  rateLimitError: {
    message: 'Too many requests',
    status: 429,
    retryAfter: 30,
  },
  accountNotFound: {
    message: 'Resource not found',
    status: 404,
  },
  insufficientBalance: {
    message: 'Insufficient balance',
    code: 'tx_insufficient_balance',
  },
};
