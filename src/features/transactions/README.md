# Transaction Feature Module

This module provides utilities and types for handling transaction-related functionality in PocketPay.

## Overview

The transaction feature module centralizes transaction data handling, formatting, and validation to ensure consistent behavior across the app. It also includes the signing confirmation flow that provides security and UX improvements for transaction signing.
The transaction feature module centralizes transaction data handling, formatting, and validation to ensure consistent behavior across the app.

## Files

### `types.ts`
Defines TypeScript interfaces and types for transaction data:
- `TransactionDetail` - Complete transaction data structure
- `TransactionStatus` - Status types: 'successful', 'pending', 'failed'
- `TransactionStatusConfig` - Status display configuration
- `TransactionMetadata` - Computed transaction metadata

### `helpers.ts`
Utility functions for transaction operations:

#### Status & Direction
- `getTransactionStatus(tx)` - Determines transaction status
- `isSentTransaction(tx, publicKey)` - Checks if transaction was sent by user
- `getDirectionLabel(tx, publicKey)` - Returns 'Sent' or 'Received'

#### Formatting
- `formatTransactionAmount(tx, publicKey)` - Formats amount with +/- prefix
- `formatTransactionDate(tx)` - Formats timestamp to readable date
- `getTransactionHash(tx)` - Extracts hash from various fields
- `getTransactionMemo(tx)` - Extracts memo text and type

#### Validation
- `validateTransactionData(tx)` - Checks for required fields
- `getCounterpartyAddress(tx, publicKey)` - Gets sender/recipient address

## Usage Examples

```typescript
import { 
  getTransactionStatus, 
  formatTransactionAmount,
  isSentTransaction 
} from '@/features/transactions';

// Check transaction status
const status = getTransactionStatus(transaction);
// Returns: 'successful' | 'pending' | 'failed'

// Format amount with direction
const amount = formatTransactionAmount(transaction, userPublicKey);
// Returns: "+100.50 XLM" or "-25.00 XLM"

// Check if user sent the transaction
const isSent = isSentTransaction(transaction, userPublicKey);
// Returns: true | false
```

## Integration Points

### Signing Confirmation Flow
**NEW**: `app/sign-confirmation.tsx` - Pre-signing confirmation screen that:
- Shows transaction summary before signing
- Educates users about signing implications  
- Provides clear cancellation option
- Hides sensitive technical details (XDR, sequence numbers)
- Separates approval intent from execution

**Flow**: Send → **Sign Confirmation** → Review Transaction → Payment Success

See [Signing Confirmation Documentation](../../docs/features/SIGNING_CONFIRMATION.md) for details.

### Transaction Detail Screen
`app/transaction/[id].tsx` - Shows full transaction details including:
- Amount and direction
- Transaction status with visual indicators
- Sender and recipient addresses
- Transaction hash with copy functionality
- Memo (if present)
- Explorer link (when available)
- Timestamp

### Transaction List
`app/(tabs)/history.tsx` - Uses `TransactionListItem` component to display transaction summaries

### Components
- `TransactionListItem.tsx` - Reusable transaction row component
- Transaction detail screen - Full transaction viewer

## Data Sources

Transaction data comes from:
1. Stellar Horizon API via `src/services/stellar.ts`
2. Zustand store at `src/store/walletStore.ts`

## Status Handling

Transactions can have three states:
1. **Successful** - Completed and confirmed on-chain
2. **Pending** - Submitted but not yet confirmed
3. **Failed** - Transaction rejected or error occurred

The status is determined from:
- `is_pending` field (boolean)
- `transaction_successful` field (boolean)

## Missing Data Handling

All helper functions safely handle missing or undefined data:
- Returns fallback values ('N/A', 'Unknown date', empty strings)
- Uses optional chaining and nullish coalescing
- Provides `validateTransactionData()` for comprehensive checks

## Explorer Integration

Transaction hashes can be viewed on Stellar Expert:
- Uses `getExplorerTxUrl()` from `src/services/stellar.ts`
- Supports testnet and mainnet
- Returns `null` for custom networks without explorer support

## Technical Details

### Hash Fields
Multiple fields may contain the transaction hash:
- `hash`
- `transaction_hash`

Use `getTransactionHash()` to safely extract the hash.

### Date Fields
Multiple fields may contain timestamps:
- `created_at` (ISO string)
- `createdAt` (ISO string)
- `timestamp` (ISO string or number)

Use `formatTransactionDate()` to handle all variants.

### Memo Support
Memos are optional message attachments to transactions:
- `memo` - The memo text/data
- `memo_type` - Type: 'text', 'id', 'hash', or 'return'

Use `getTransactionMemo()` to safely extract both fields.

## Accessibility

- All text content is screen-reader accessible
- Copy actions provide feedback via icons and text
- Status indicators use both color and icons (not color alone)
- Touch targets meet minimum size requirements
- Selectable text for addresses and hashes

## Future Enhancements

Potential additions:
- Transaction filtering by status, type, or date range
- Export transaction history to CSV
- Transaction notes/tags
- Multi-currency support
- Fee display
- Operation details for complex transactions
