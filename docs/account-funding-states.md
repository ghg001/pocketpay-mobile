# Account Funding & Balance States

This document describes the mobile client's handling of account funding status and balance availability states.

## Account Funding States (Issue #330)

The app tracks whether the account exists on the Stellar network using four states:

| State       | Meaning                                    | UI Treatment                                |
|-------------|--------------------------------------------|---------------------------------------------|
| `unknown`   | Haven't checked yet (network error)         | Show info banner, no action                 |
| `checking`  | In the process of checking                  | Loading spinner + message                   |
| `unfunded`  | Account does not exist on the network       | Show Friendbot funding card                 |
| `funded`    | Account exists on the network               | No banner (or minimal success indicator)    |

### Detection

Funding status is determined by `walletStore.checkFundingStatus()` which calls `fetchAccountDetails()`:

- **404 / "Not Found"** → account doesn't exist → `unfunded`
- **Network error** → can't determine → `unknown` (user may retry)
- **Success** → account exists → `funded`

### Impact on Payment Actions

| State       | Send Payment | Receive | Vault Actions |
|-------------|--------------|---------|---------------|
| `unknown`   | Allowed      | Allowed | Depends       |
| `checking`  | Allowed      | Allowed | Depends       |
| `unfunded`  | **Blocked**  | Allowed | Blocked*      |
| `funded`    | Allowed      | Allowed | Allowed       |

\* Vault deposit/withdraw/lock are also blocked by the vault capability gate when there is no wallet.

### Friendbot Testnet Funding

The `FundWallet` action calls `friendbot.stellar.org` to fund the testnet account. This is only available on Testnet.

## Balance States (Issue #329)

The app distinguishes between four balance states to avoid conflating "no data" with "zero XLM":

| State          | Meaning                                   | UI Treatment                                      |
|----------------|-------------------------------------------|---------------------------------------------------|
| `idle`         | No fetch attempted yet                    | Spinner + "No balance data yet"                   |
| `loading`      | Fetch in progress                         | Spinner + "Loading your balance"                  |
| `available`    | Balance fetched (zero or positive)        | Show numeric balance (muted if zero)              |
| `unavailable`  | Network error, failed fetch               | Warning card + Retry button                       |

### Balance Display Component

`BalanceDisplay` (`src/components/BalanceDisplay.tsx`) renders a card with:

- **idle/loading**: Activity spinner with descriptive text
- **available (positive)**: Bold numeric balance with public key and last-refreshed timestamp
- **available (zero)**: Same as positive but muted with a banner explaining zero balance
- **unavailable**: Warning-styled card with error message and retry button

### Recovery

When balance is unavailable, the user can:
1. Pull-to-refresh on the home screen
2. Tap the "Retry" button on the balance card
3. Navigate away and back to trigger a new fetch

## Related Documentation

- [Vault SDK Capability Assumptions](./vault-sdk-capability-assumptions.md)
- [Vault Integration Assumptions](./vault-integration-assumptions.md)
- [Vault UI Guidance](./vault-ui-guidance.md)
- [Mobile Security Checklist](./mobile-security-checklist.md)
