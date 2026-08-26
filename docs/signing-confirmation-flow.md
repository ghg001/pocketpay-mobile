# Signing Confirmation Flow

## Overview

The signing confirmation screen (`/sign-confirmation`) provides a clear separation between **approval to sign** and **transaction execution**. This gives users a final "last chance to cancel" moment before the transaction is cryptographically signed and sent to the Stellar network.

---

## Flow Architecture

### **3-Stage Payment Process**

```
┌─────────────────┐
│   Send Screen   │  1. User enters payment details
│  /send          │     - Destination address
│                 │     - Amount in XLM
│                 │     - Optional memo
└────────┬────────┘
         │ Validates inputs
         ▼
┌─────────────────┐
│  Sign Confirm   │  2. User reviews & confirms signing intent
│  /sign-confirm  │     - Shows transaction summary
│                 │     - Explains what signing means
│                 │     - Hides sensitive internals (XDR, sequence)
│                 │     - Clear "Cancel" option
└────────┬────────┘
         │ User confirms "Sign Transaction"
         ▼
┌─────────────────┐
│ Review & Sign   │  3. Actual signing & submission
│ /review-trans   │     - 8-phase signer state machine
│                 │     - Cryptographic signing
│                 │     - Network submission
│                 │     - Success/failure handling
└────────┬────────┘
         │ On success (replace, no back)
         ▼
┌─────────────────┐
│ Payment Success │  4. Confirmation receipt
│ /payment-success│     - Transaction hash
│                 │     - Stellar Expert link
└─────────────────┘
```

---

## User Experience Goals

### **Clear Intent Separation**
- **Sign Confirmation**: "Do you approve signing this transaction?"
- **Review & Sign**: "Signing and sending now..."

This separation helps users understand that:
1. Approving a transaction is deliberate
2. Signing is a cryptographic operation
3. Once signed and sent, transactions are irreversible

### **Enhanced Security Awareness**
The sign-confirmation screen educates users about:
- What happens when they sign
- That their private key never leaves the device
- That transactions cannot be reversed
- Technical details are hidden for security

### **Improved Cancellation UX**
Users have **two** clear cancel points:
1. **Before signing**: Cancel button on sign-confirmation screen
2. **During handoff**: Cancel button on review-transaction screen (phases: review, handoff, signing)

---

## Screen Details

### **Sign Confirmation Screen** (`/sign-confirmation`)

#### Route Parameters
```typescript
{
  source: string;          // Sender's public key
  destination: string;     // Recipient's public key
  amount: string;          // Payment amount (e.g. "10.50")
  assetCode: string;       // Asset code (e.g. "XLM")
  memo?: string;           // Optional memo text
  fee?: string;            // Network fee in stroops (e.g. "100")
  network?: string;        // Network name (e.g. "Testnet")
}
```

#### UI Components

**1. Warning Banner**
- Yellow alert with warning icon
- Message: "You are about to sign a blockchain transaction. This action cannot be undone."

**2. Transaction Summary Card**
- **From**: Truncated source address (6 chars start + 6 chars end)
- **To**: Contact name (if saved) + truncated address
- **Amount**: Formatted with asset code (e.g. "10.50 XLM")
- **Memo**: Full memo text (if provided)
- **Network Fee**: Fee in stroops
- **Network**: Network label (Testnet/Public)

**3. Security Information Card**
- Shield icon header: "What Happens Next?"
- Bullet points explaining:
  - Device signing with private key
  - Transaction sent to network
  - Irreversibility after confirmation
  - Private key never leaves device

**4. Privacy Notice**
- Small footer note
- Explains that technical details (XDR, sequence numbers) are hidden for security

**5. Action Buttons**
- **Cancel**: Confirms intent, navigates back to home
- **Sign Transaction**: Proceeds to review-transaction screen

#### Validation
- Validates all required params on mount
- Shows error card if params are missing
- Prevents progression with incomplete data

---

## Integration with Existing Architecture

### **Signer Handoff Compatibility**
The sign-confirmation screen **complements** the existing signer handoff design:

- **Does NOT replace** the 8-phase state machine
- **Does NOT modify** LocalSigner or useSignerHandoff
- **Does NOT change** the review-transaction screen logic
- **Adds** a pre-signing confirmation layer

### **Navigation Flow**
```
Send (validates) 
  → Sign Confirmation (user approves signing)
    → Review Transaction (actual signing & submission)
      → Payment Success (receipt)
```

Previous flow (direct):
```
Send (validates)
  → Review Transaction (approval + signing combined)
    → Payment Success
```

### **Backward Compatibility**
- Review-transaction screen can still be accessed directly (for other flows)
- QR code payments can be adapted to use sign-confirmation
- Future external signers will work with this flow

---

## Security Considerations

### **What Users See**
✅ Transaction amount and recipient  
✅ Network fee  
✅ Network name (Testnet/Public)  
✅ Memo text (if provided)  
✅ Contact labels (if saved)  

### **What Users DON'T See**
❌ Transaction XDR envelope  
❌ Sequence numbers  
❌ Base64-encoded transaction  
❌ Source account details (beyond truncated key)  
❌ Operation-level internals  

**Rationale**: Showing raw transaction internals can be overwhelming and doesn't improve security for most users. The summary provides sufficient information to verify intent.

### **Private Key Protection**
- Sign-confirmation screen **never accesses** the private key
- Private key is only retrieved in review-transaction screen's signing phase
- Retrieved on-demand from SecureStore, never cached
- Passed to `LocalSigner.sign()` via `getSecretKey()` callback

---

## Accessibility

### **Screen Reader Support**
- All touchables have `accessibilityLabel`
- All touchables have `accessibilityRole`
- Cards use semantic heading structure
- Error states announce changes

### **Keyboard Navigation**
- Form inputs support tab navigation
- Action buttons are keyboard-accessible
- Cancel can be triggered with back gesture

### **Visual Accessibility**
- High contrast colors for warnings
- Clear visual hierarchy (card → detail rows)
- Icons reinforce text meanings
- Sufficient touch target sizes (44pt minimum)

---

## Error Handling

### **Missing Parameters**
If required params are missing:
- Shows error card with X icon
- Displays "Invalid Transaction" message
- Provides "Go Back" button
- Prevents progression

### **Navigation Errors**
If navigation to review-transaction fails:
- Shows alert with error message
- Allows user to retry
- Prevents infinite loading state

### **User Cancellation**
On cancel button press:
- Shows confirmation alert
- Options: "Keep Reviewing" (cancel alert) or "Cancel" (navigate home)
- Destructive style for cancel option
- Clear messaging about consequences

---

## Future Enhancements

### **Fee Estimation**
Currently hardcoded to "100 stroops" (base fee).  
**Enhancement**: Fetch real-time fee from Horizon before showing screen.

```typescript
const fee = await server.fetchBaseFee();
// Use fee.toString() in params
```

### **Multi-Asset Support**
Currently XLM-only.  
**Enhancement**: Support other assets by passing full asset object.

```typescript
params: {
  assetCode: 'USDC',
  assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
}
```

### **QR Payment Request Integration**
Currently manual entry only.  
**Enhancement**: Pre-fill from scanned QR payment request.

```typescript
// In send screen after QR scan
const paymentRequest = parseQRPaymentRequest(qrData);
router.push({
  pathname: '/sign-confirmation',
  params: { ...paymentRequest },
});
```

### **Transaction Simulation**
Future: Add "Simulate" option before signing.  
Uses Horizon's transaction simulation API to preview effects.

### **Hardware Wallet Support**
When external signers are implemented:
- Sign-confirmation screen shows signer info
- "Sign Transaction" button triggers external wallet handoff
- Review-transaction handles external signer phases

---

## Testing Checklist

### **Functional Tests**
- [ ] Navigate from Send → Sign Confirmation with valid params
- [ ] Cancel button shows confirmation alert
- [ ] Cancel alert dismisses on "Keep Reviewing"
- [ ] Cancel alert navigates home on "Cancel"
- [ ] Sign button navigates to review-transaction
- [ ] Contact labels display correctly
- [ ] Memo displays when provided
- [ ] Fee displays correctly
- [ ] Network label matches env config

### **Validation Tests**
- [ ] Missing source param shows error card
- [ ] Missing destination param shows error card
- [ ] Missing amount param shows error card
- [ ] Error card "Go Back" button works
- [ ] Invalid params handled gracefully

### **Edge Cases**
- [ ] Very long memo text wraps correctly
- [ ] Very long contact names truncate properly
- [ ] Unknown contacts show truncated address
- [ ] Zero amount displays correctly
- [ ] Large amounts format with commas

### **Accessibility Tests**
- [ ] Screen reader announces all content
- [ ] All buttons have accessibility labels
- [ ] Cancel button has destructive hint
- [ ] Warning banner is announced
- [ ] Error states announce changes

### **Security Tests**
- [ ] Private key never appears in UI
- [ ] XDR never logged to console
- [ ] Params don't contain secret key
- [ ] Cancel clears sensitive data from navigation stack

---

## Related Documentation

- [Signer Handoff Design](./signer-handoff-design.md) - Complete signing architecture
- [Navigation Map](./navigation-map.md) - All app routes and flows
- [User Flows](./user-flows.md) - Journey diagrams
- [Security](./security.md) - Security best practices
- [Mobile Security Checklist](./mobile-security-checklist.md) - Pre-deployment checks

---

## Implementation Notes

### **Why Not Modify Review-Transaction?**
The review-transaction screen is tightly coupled to the 8-phase signer state machine and handles:
- Handoff phase (for external signers)
- Signing phase (cryptographic operations)
- Submitting phase (network calls)
- Success/failure state management

Adding another confirmation layer **inside** that screen would complicate the state machine.

The sign-confirmation screen is a **separate concern**: user intent confirmation.

### **Why Two Screens?**
**Sign Confirmation** = User-facing decision  
**Review Transaction** = Technical execution  

This separation follows the principle of **separation of concerns** and makes the code easier to maintain and test.

### **Component Reuse**
Both screens share:
- Theme system (`useTheme`)
- Contact resolution (`resolveAddressLabel`)
- Amount formatting (`formatAmount`)
- Address truncation (`truncateAddress`)
- Button components (`Button`)
- Screen header (`ScreenHeader`)

This ensures consistent UX and reduces code duplication.

---

## Code References

**Main Implementation:**
- `app/sign-confirmation.tsx` - Screen component

**Related Files:**
- `app/send.tsx` - Navigation to sign-confirmation
- `app/review-transaction.tsx` - Signing execution
- `src/utils/contacts.ts` - Address truncation
- `src/utils/amount.ts` - Amount formatting
- `src/components/Button.tsx` - Action buttons
- `src/components/ScreenHeader.tsx` - Header component

**Types:**
- `src/types/signer.ts` - Signer interfaces (not modified)

**Stores:**
- `src/store/signerStore.ts` - Signing state machine (not modified)
