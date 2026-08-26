# Signing Confirmation Feature

## Quick Start

### For Developers
The signing confirmation screen is automatically integrated into the payment flow. When a user initiates a payment from the Send screen, they'll see the sign-confirmation screen before the actual signing happens.

**Navigation Flow:**
```
/send → /sign-confirmation → /review-transaction → /payment-success
```

**No additional configuration needed** - the feature works out of the box.

---

## For Users

### What Is This?
The signing confirmation screen is a security feature that gives you a final chance to review your transaction before it's cryptographically signed and sent to the Stellar network.

### What You'll See
When you tap "Send Payment", you'll see a screen showing:

1. **Warning Banner** (yellow)
   - Reminds you that signing is irreversible

2. **Transaction Summary**
   - Who you're sending from (your address)
   - Who you're sending to (recipient address or contact name)
   - How much you're sending
   - Your memo message (if you added one)
   - Network fee
   - Which network (Testnet or Public)

3. **Security Information**
   - Explains what happens when you sign
   - Confirms your private key stays on your device
   - Reminds you that transactions can't be reversed

4. **Two Buttons**
   - **Cancel**: Stops the transaction (nothing is sent)
   - **Sign Transaction**: Proceeds with signing and sending

### Why This Exists
This extra confirmation step:
- Helps prevent accidental payments
- Educates you about what signing means
- Gives you a clear "last chance to cancel"
- Separates the decision to pay from the technical execution

---

## For Product Managers

### Business Value
- **Reduced support tickets**: Users are less likely to accidentally send payments
- **Increased trust**: Transparency about what's happening builds confidence
- **Compliance ready**: Clear consent before irreversible actions
- **Better onboarding**: Educational content helps new users understand crypto transactions

### User Metrics to Track
- Confirmation rate: % of users who proceed from sign-confirmation to completion
- Cancellation rate: % of users who cancel at sign-confirmation
- Time on screen: Average time spent reviewing
- Cancel reasons: Track why users cancel (future enhancement)

### A/B Testing Ideas
- Message variations in the warning banner
- Different layouts for transaction summary
- Security information placement
- Button label variations

---

## For QA / Testers

### Critical Test Paths

#### Happy Path
1. Enter valid payment on Send screen
2. Tap "Send Payment"
3. Verify sign-confirmation loads
4. Verify all transaction details match input
5. Tap "Sign Transaction"
6. Verify review-transaction loads
7. Verify transaction completes successfully

#### Cancel Path
1. Enter payment on Send screen
2. Tap "Send Payment"
3. Sign-confirmation loads
4. Tap "Cancel"
5. Verify alert appears
6. Tap "Cancel" in alert
7. Verify navigation to home screen
8. Verify transaction was NOT sent

#### Error Handling
1. Navigate to sign-confirmation with missing params
2. Verify error card displays
3. Tap "Go Back"
4. Verify navigation back

### Edge Cases to Test
- Very long memo (28 characters)
- Destination is a saved contact
- Destination is unknown
- Zero amount
- Very large amount (millions)
- Special characters in memo (emoji)
- Network switching between views
- Theme switching (light/dark)

### Accessibility Testing
- VoiceOver (iOS): All elements announced correctly
- TalkBack (Android): All elements announced correctly
- Font scaling: Screen readable at largest font size
- Touch targets: All buttons at least 44pt x 44pt

### Performance Testing
- Screen loads in < 500ms
- Navigation smooth (no jank)
- No memory leaks after 10+ navigations

---

## For Security Reviewers

### Security Properties

#### Private Key Protection
✅ **Private key never accessed by this screen**
- The sign-confirmation screen only displays transaction parameters
- Private key retrieval happens in review-transaction screen
- Private key stays in SecureStore until signing phase

#### No Sensitive Data in Route Params
✅ **Route parameters contain only public data**
- Source public key (public)
- Destination public key (public)
- Amount (transaction-specific, not sensitive)
- Memo (user-provided, assumed public)
- Fee (public network parameter)
- Network name (public configuration)

**No private keys, no secrets, no auth tokens**

#### Transaction Data Validation
✅ **All inputs validated before display**
- Source address validated as Stellar public key
- Destination address validated on Send screen
- Amount validated as positive number
- Memo validated as ≤28 bytes

#### Information Hiding
✅ **Technical internals hidden**
- No XDR envelope shown
- No sequence numbers displayed
- No raw transaction object logged
- No base64-encoded transaction

**Rationale**: Showing internals doesn't improve security for most users and can be confusing or misleading.

#### Cancellation Security
✅ **Clean cancellation flow**
- Cancel button shows confirmation alert
- Confirmation prevents accidental dismissal
- Navigation uses `router.replace()` to clear back-stack
- No transaction submitted after cancellation

#### Screenshot Security
⚠️ **Consider marking screen as secure**
Currently, the screen can be captured in screenshots. Consider:
```typescript
// In React Native
import { View } from 'react-native';
import { setScreenCaptureEnabled } from 'expo-screen-capture';

useEffect(() => {
  setScreenCaptureEnabled(false);
  return () => setScreenCaptureEnabled(true);
}, []);
```

**Trade-off**: Prevents screenshots but also affects legitimate use cases (user documentation, support tickets).

---

## For Designers

### Design System Integration

#### Components Used
- `Button` - Primary action component
- `ScreenHeader` - Standard header with back button
- Theme system - All colors from `useTheme()`
- Icons - Lucide React Native (Shield, AlertTriangle, CheckCircle, Clock, XCircle)

#### Typography Scale
- Screen title: 18pt, semibold
- Card title: 18pt, semibold
- Detail labels: 14pt, medium, secondary color
- Detail values: 14pt or 16pt (amount), regular
- Body text: 14pt, regular
- Small text: 12pt, italic (privacy notice)

#### Color Palette
- **Primary**: Action buttons, emphasized values
- **Warning**: Alert banner, warning states
- **Error**: Error cards, destructive actions
- **Success**: Checkmarks, positive indicators
- **Text**: Primary content
- **Text Secondary**: Labels, descriptions
- **Surface**: Card backgrounds
- **Background**: Screen background
- **Border**: Dividers, card outlines

#### Spacing
- Padding: `SIZES.md` (16px) for screen edges
- Gap: `SIZES.sm` (8px) for icon-text pairs
- Margin: `SIZES.md` (16px) between cards
- Card padding: `SIZES.lg` (24px)

#### Border Radius
- Cards: `RADIUS.lg` (12px)
- Banner: `RADIUS.md` (8px)
- Buttons: Per Button component default

### Design Decisions

#### Why Full-Screen Instead of Modal?
**Decision**: Use full-screen stack push, not modal overlay

**Rationale**:
- More space for educational content
- Clearer separation from Send screen
- Better for accessibility (full screen reader context)
- Consistent with review-transaction pattern

#### Why Show Truncated Addresses?
**Decision**: Show truncated addresses (6...6 format), not full addresses

**Rationale**:
- Improves readability
- Reduces cognitive load
- Full address shown in review-transaction if needed
- Contact names shown for known addresses

#### Why Yellow Warning Banner?
**Decision**: Use warning color (yellow/orange), not error (red)

**Rationale**:
- This is a caution, not an error
- Signing is normal behavior, not a mistake
- Red would imply something is wrong
- Yellow draws attention without alarming

---

## For DevOps / Release Engineers

### Deployment Checklist

Before releasing to production:

- [ ] Feature flag enabled (if using feature flags)
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Performance metrics acceptable
- [ ] Accessibility audit complete
- [ ] Security review approved
- [ ] Documentation updated
- [ ] Analytics events firing (if tracked)
- [ ] Error monitoring configured
- [ ] Rollback plan documented

### Monitoring

#### Key Metrics
- **Screen load time**: Target < 500ms
- **Navigation success rate**: Target > 99.9%
- **Cancellation rate**: Baseline TBD
- **Error rate**: Target < 0.1%

#### Error Scenarios to Monitor
- Missing route parameters
- Navigation failures
- Theme loading failures
- Contact resolution failures

#### Logging
```typescript
// Important events to log (without PII)
- Screen mounted
- User cancelled
- User confirmed
- Navigation error
- Validation error
```

**Do NOT log**:
- Full public keys
- Transaction amounts
- Memo content
- User identities

### Rollback Plan
If issues are discovered post-deployment:

1. **Quick rollback**: Revert `app/send.tsx` to navigate directly to `/review-transaction`
2. **Partial rollback**: Add feature flag to conditionally show sign-confirmation
3. **Fix-forward**: Deploy hotfix for specific issue

---

## API Reference

### Route Parameters

```typescript
interface SignConfirmationParams {
  source: string;          // Required. Sender's Stellar public key
  destination: string;     // Required. Recipient's Stellar public key
  amount: string;          // Required. Payment amount as string (e.g., "10.50")
  assetCode: string;       // Required. Asset code (e.g., "XLM")
  memo?: string;           // Optional. Memo text (max 28 bytes)
  fee?: string;            // Optional. Network fee in stroops (default: "Unknown")
  network?: string;        // Optional. Network name (default: from env)
}
```

### Navigation Usage

**From Send Screen:**
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

router.push({
  pathname: '/sign-confirmation',
  params: {
    source: walletPublicKey,
    destination: recipientAddress,
    amount: paymentAmount,
    assetCode: 'XLM',
    memo: memoText,
    fee: '100',
    network: 'Testnet',
  },
});
```

**From Other Screens:**
Can be used from any screen that needs transaction signing confirmation.

### Hooks Used

```typescript
// Navigation
const router = useRouter();
const params = useLocalSearchParams<SignConfirmationParams>();

// Theme
const { colors } = useTheme();

// Contacts
const contacts = useAppStore((state) => state.contacts);
```

### Utilities

```typescript
// From src/utils/contacts.ts
import { truncateAddress, resolveAddressLabel } from '../src/utils/contacts';

// From src/utils/amount.ts
import { formatAmount } from '../src/utils/amount';
```

---

## Troubleshooting

### Common Issues

#### Issue: Screen shows "Invalid Transaction"
**Cause**: Missing required route parameters  
**Fix**: Ensure `source`, `destination`, and `amount` are all provided in navigation

#### Issue: Contact name not showing
**Cause**: Public key doesn't match exactly  
**Fix**: Verify contact public key matches destination exactly (case-sensitive)

#### Issue: Theme colors look wrong
**Cause**: Theme hook not returning valid colors  
**Fix**: Check `useTheme()` implementation and theme provider

#### Issue: Cancel button doesn't work
**Cause**: Alert mock interfering in tests  
**Fix**: Ensure Alert is properly mocked in test environment

#### Issue: Navigation fails
**Cause**: Missing Expo Router configuration  
**Fix**: Verify Expo Router is set up in `app/_layout.tsx`

### Debug Mode

To enable debug logging (development only):

```typescript
// In sign-confirmation.tsx
const DEBUG = __DEV__;

if (DEBUG) {
  console.log('[SignConfirmation] Params:', params);
  console.log('[SignConfirmation] Contacts:', contacts);
  console.log('[SignConfirmation] Destination contact:', destinationContact);
}
```

---

## Future Roadmap

### Version 1.1 (Short Term)
- [ ] Real-time fee fetching
- [ ] Animation between screens
- [ ] Haptic feedback on buttons
- [ ] Analytics events

### Version 2.0 (Medium Term)
- [ ] Multi-asset support
- [ ] Transaction simulation preview
- [ ] QR payment request integration
- [ ] Biometric confirmation option

### Version 3.0 (Long Term)
- [ ] External signer support
- [ ] Hardware wallet integration
- [ ] Multi-operation transactions
- [ ] Smart contract interactions

---

## Related Resources

- [Implementation Summary](../IMPLEMENTATION_SUMMARY.md)
- [Signing Confirmation Flow](../signing-confirmation-flow.md)
- [Test Plan](../testing/sign-confirmation-test-plan.md)
- [Signer Handoff Design](../signer-handoff-design.md)
- [Navigation Map](../navigation-map.md)
- [Security Guide](../security.md)

---

## Support

For questions or issues:
1. Check this documentation first
2. Review the test plan for expected behaviors
3. Check the implementation summary for architecture details
4. Open an issue with reproduction steps

---

*Last Updated: [Current Date]*  
*Version: 1.0.0*
