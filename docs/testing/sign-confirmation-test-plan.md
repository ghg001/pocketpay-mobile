# Sign Confirmation Screen - Test Plan

## Overview
This document outlines the testing strategy for the `/sign-confirmation` screen, which provides a pre-signing confirmation layer in the transaction flow.

---

## Test Categories

### 1. Navigation Tests

#### 1.1 Entry Point: From Send Screen
**Test Case**: Navigate from Send to Sign Confirmation
```
Given: User on Send screen with valid destination, amount, memo
When: User taps "Send Payment" button
Then: Navigates to /sign-confirmation with correct params
```

**Expected Params:**
- source: Current wallet public key
- destination: Entered destination address
- amount: Entered amount (trimmed)
- assetCode: "XLM"
- memo: Entered memo (trimmed, can be empty)
- fee: "100" (base fee estimate)
- network: Current network label

**Validation:**
- [ ] All params present in route
- [ ] Params match form values exactly
- [ ] Trimmed strings have no whitespace
- [ ] Empty memo handled correctly

#### 1.2 Back Navigation
**Test Case**: Navigate back from Sign Confirmation
```
Given: User on Sign Confirmation screen
When: User taps back button in header
Then: Shows "Cancel Signing" confirmation alert
```

**Expected Behavior:**
- [ ] Alert has title "Cancel Signing"
- [ ] Alert has message explaining consequences
- [ ] Alert has "Keep Reviewing" button (cancel)
- [ ] Alert has "Cancel" button (destructive)
- [ ] "Cancel" button navigates to /(tabs)
- [ ] "Keep Reviewing" dismisses alert, stays on screen

#### 1.3 Forward Navigation
**Test Case**: Proceed to signing
```
Given: User on Sign Confirmation screen
When: User taps "Sign Transaction" button
Then: Navigates to /review-transaction with transaction params
```

**Expected Behavior:**
- [ ] Navigation uses router.push()
- [ ] Params include: destination, amount, memo
- [ ] Review-transaction screen loads
- [ ] Sign confirmation screen remains in back stack

---

### 2. Display Tests

#### 2.1 Transaction Summary Display
**Test Case**: All transaction details shown correctly

**Source Address:**
- [ ] Displays truncated format (6 chars + ... + 6 chars)
- [ ] Matches current wallet public key
- [ ] Gray label, black value

**Destination Address:**
- [ ] Displays truncated format if not in contacts
- [ ] Displays contact name + truncated address if in contacts
- [ ] Contact name in bold, address in smaller gray text

**Amount:**
- [ ] Formatted with formatAmount() utility
- [ ] Displays asset code (XLM)
- [ ] Larger font, primary color
- [ ] Decimal places shown correctly

**Memo (if provided):**
- [ ] Full text shown (not truncated)
- [ ] Wraps to multiple lines if needed
- [ ] Shows "Memo" label
- [ ] Not shown if empty

**Fee:**
- [ ] Displays "100 stroops" or actual fee value
- [ ] Shows "stroops" unit

**Network:**
- [ ] Shows correct network label
- [ ] Matches EXPO_PUBLIC_STELLAR_NETWORK env var
- [ ] "Testnet" for TESTNET
- [ ] "Public Network" for PUBLIC/MAINNET

#### 2.2 Warning Banner
**Test Case**: Warning banner displays correctly
- [ ] Yellow background
- [ ] Warning icon (AlertTriangle)
- [ ] Message: "You are about to sign a blockchain transaction. This action cannot be undone."
- [ ] Text is bold and readable

#### 2.3 Security Information Card
**Test Case**: Security info displays correctly
- [ ] Shield icon in header
- [ ] Title: "What Happens Next?"
- [ ] Four bullet points with icons:
  - CheckCircle: Device signing with private key
  - CheckCircle: Transaction sent to network
  - CheckCircle: Cannot be reversed
  - Shield: Private key never leaves device
- [ ] All text readable and left-aligned

#### 2.4 Privacy Notice
**Test Case**: Privacy notice displays
- [ ] Clock icon
- [ ] Gray italic text
- [ ] Message about hidden technical details
- [ ] Positioned at bottom of scroll content

---

### 3. Validation Tests

#### 3.1 Missing Required Parameters
**Test Case**: Missing source parameter
```
Given: Navigate to /sign-confirmation without source param
Then: Shows error card with "Invalid Transaction" message
```
- [ ] Error icon (XCircle) displayed
- [ ] Error title: "Invalid Transaction"
- [ ] Error message: "Missing required transaction parameters."
- [ ] "Go Back" button displayed
- [ ] Go Back navigates to previous screen

**Repeat for:**
- [ ] Missing destination
- [ ] Missing amount
- [ ] All params missing

#### 3.2 Valid Parameters
**Test Case**: All required params present
```
Given: Navigate with source, destination, amount
Then: Screen renders successfully with transaction details
```
- [ ] No error card shown
- [ ] All cards visible
- [ ] Action buttons enabled

---

### 4. Interaction Tests

#### 4.1 Cancel Button
**Test Case**: Cancel button shows confirmation
```
Given: User on Sign Confirmation screen
When: User taps "Cancel" button
Then: Shows confirmation alert
```
- [ ] Button labeled "Cancel"
- [ ] Button uses secondary variant (gray)
- [ ] Alert appears with confirmation
- [ ] Alert text explains transaction won't be sent

**Test Case**: Cancel confirmed
```
Given: User taps "Cancel" in alert
Then: Navigates to home screen (/(tabs))
```
- [ ] Uses router.replace() to prevent back navigation
- [ ] Lands on home tab
- [ ] Transaction flow cleared

**Test Case**: Cancel dismissed
```
Given: User taps "Keep Reviewing" in alert
Then: Alert dismisses, stays on screen
```
- [ ] Alert closes
- [ ] Screen remains visible
- [ ] No navigation occurs

#### 4.2 Sign Transaction Button
**Test Case**: Sign button triggers navigation
```
Given: User on Sign Confirmation screen
When: User taps "Sign Transaction" button
Then: Navigates to /review-transaction
```
- [ ] Button labeled "Sign Transaction"
- [ ] Button uses primary variant (blue)
- [ ] Button takes 2/3 of width (flex: 2)
- [ ] Navigation occurs immediately

**Test Case**: Sign button loading state
```
Given: User taps "Sign Transaction"
When: Navigation in progress
Then: Button shows loading state
```
- [ ] Button text changes to "Processing..."
- [ ] Button shows loading spinner
- [ ] Button disabled during processing
- [ ] Cancel button also disabled

#### 4.3 Disabled State
**Test Case**: Buttons disabled during processing
- [ ] isProcessing state prevents multiple clicks
- [ ] Both buttons grayed out
- [ ] Loading spinner shown on Sign button
- [ ] No navigation occurs on additional taps

---

### 5. Contact Integration Tests

#### 5.1 Known Contact
**Test Case**: Destination is saved contact
```
Given: Destination address exists in contacts as "Alice"
When: Screen loads
Then: Shows contact name and truncated address
```
- [ ] Contact name displayed above address
- [ ] Contact name in bold, larger font
- [ ] Address still shown but in smaller gray text
- [ ] Truncated format used for address

#### 5.2 Unknown Contact
**Test Case**: Destination not in contacts
```
Given: Destination address not saved
When: Screen loads
Then: Shows only truncated address
```
- [ ] Only truncated address shown
- [ ] No contact name label
- [ ] Same text style as source address

#### 5.3 Contact Resolution
**Test Case**: resolveAddressLabel called correctly
- [ ] Passes destination.trim() to resolver
- [ ] Passes contacts array from appStore
- [ ] Uses returned label correctly
- [ ] Uses returned isContact flag correctly

---

### 6. Edge Cases

#### 6.1 Very Long Memo
**Test Case**: Memo exceeds 28 characters (Stellar limit)
```
Given: Memo is 28 characters
When: Screen displays
Then: Memo wraps to multiple lines
```
- [ ] Memo fully visible (not truncated)
- [ ] numberOfLines={2} prop allows wrapping
- [ ] Text doesn't overflow card

#### 6.2 Very Long Contact Name
**Test Case**: Contact name is very long
```
Given: Contact name is "Alice Elizabeth Johnson-Smith"
When: Screen displays
Then: Name wraps or truncates gracefully
```
- [ ] Name visible
- [ ] Doesn't break layout
- [ ] Address still visible below

#### 6.3 Zero Amount
**Test Case**: Amount is "0" or "0.0"
```
Given: Amount is "0"
When: Screen displays
Then: Shows "0.00 XLM" or formats correctly
```
- [ ] formatAmount() handles zero
- [ ] Doesn't show negative or blank

#### 6.4 Large Amount
**Test Case**: Amount has many digits
```
Given: Amount is "123456789.1234567"
When: Screen displays
Then: Formats with proper separators
```
- [ ] formatAmount() adds commas or spaces
- [ ] Decimal precision maintained (7 places)
- [ ] Value readable

#### 6.5 Special Characters in Memo
**Test Case**: Memo contains emoji or special chars
```
Given: Memo is "Payment for 🚀 to the moon!"
When: Screen displays
Then: Shows full memo with emoji
```
- [ ] Emoji renders correctly
- [ ] Special characters don't break layout
- [ ] Text fully visible

---

### 7. Accessibility Tests

#### 7.1 Screen Reader Support
**Test Case**: All elements have accessibility labels
- [ ] "Cancel" button: accessibilityLabel present
- [ ] "Sign Transaction" button: accessibilityLabel present
- [ ] Header back button: accessibilityLabel "Cancel Signing"
- [ ] All cards: accessibilityRole="summary"
- [ ] Warning banner announced as warning

#### 7.2 Focus Order
**Test Case**: Tab navigation follows logical order
1. [ ] Header back button
2. [ ] Scroll view content (if focused)
3. [ ] Cancel button
4. [ ] Sign Transaction button

#### 7.3 Disabled State Announcements
**Test Case**: Disabled buttons announce correctly
- [ ] Screen reader says "button, disabled"
- [ ] Visual opacity reduced
- [ ] Touch feedback prevented

#### 7.4 Dynamic Content
**Test Case**: Loading state changes are announced
- [ ] "Processing..." text announced
- [ ] Loading spinner has accessibilityLabel
- [ ] State change announced to screen reader

---

### 8. Theme Tests

#### 8.1 Light Theme
**Test Case**: All colors correct in light theme
- [ ] Background: light gray
- [ ] Surface: white
- [ ] Text: dark
- [ ] Primary: blue
- [ ] Warning: yellow/orange
- [ ] Error: red
- [ ] Borders: light gray

#### 8.2 Dark Theme
**Test Case**: All colors correct in dark theme
- [ ] Background: dark gray/black
- [ ] Surface: dark gray
- [ ] Text: white
- [ ] Primary: blue (adjusted)
- [ ] Warning: yellow (adjusted)
- [ ] Error: red (adjusted)
- [ ] Borders: dark gray

#### 8.3 Theme Switching
**Test Case**: Theme change applies immediately
```
Given: User on Sign Confirmation screen
When: User changes theme in system settings
Then: Colors update without navigation
```
- [ ] useMemo rebuilds styles
- [ ] Colors update reactively
- [ ] No layout shift occurs

---

### 9. Platform Tests

#### 9.1 iOS Specific
- [ ] Shadow under cards renders correctly
- [ ] Alert buttons use iOS style
- [ ] Back gesture works
- [ ] Status bar color matches theme

#### 9.2 Android Specific
- [ ] Elevation under cards renders correctly
- [ ] Alert buttons use Android style
- [ ] Hardware back button triggers cancel alert
- [ ] Status bar color matches theme

---

### 10. Performance Tests

#### 10.1 Render Performance
**Test Case**: Screen renders quickly
- [ ] Initial render < 500ms
- [ ] No visible layout shifts
- [ ] ScrollView scrolls smoothly
- [ ] No frame drops during scroll

#### 10.2 Navigation Performance
**Test Case**: Navigation is smooth
- [ ] Forward navigation < 300ms
- [ ] Back navigation < 300ms
- [ ] No flash of content

#### 10.3 Memory Usage
**Test Case**: No memory leaks
- [ ] Navigate in and out 10 times
- [ ] Memory usage remains stable
- [ ] No retained closures

---

### 11. Security Tests

#### 11.1 Private Key Exposure
**Test Case**: Private key never appears
- [ ] Not in route params
- [ ] Not in screen state
- [ ] Not in console logs
- [ ] Not in screenshots (mark sensitive views)

#### 11.2 XDR Exposure
**Test Case**: Transaction internals never shown
- [ ] XDR envelope not visible
- [ ] Sequence number not shown
- [ ] Raw transaction object not logged

#### 11.3 Param Tampering
**Test Case**: Malicious params handled
```
Given: Attacker modifies route params in memory
When: Screen validates params
Then: Shows error or sanitizes input
```
- [ ] validateAddress() called on destination
- [ ] Amount validated as number
- [ ] No code execution from params

---

### 12. Integration Tests

#### 12.1 Full Payment Flow
**Test Case**: Complete flow from Send to Success
```
1. Enter payment on Send screen
2. Navigate to Sign Confirmation
3. Review and confirm
4. Navigate to Review Transaction
5. Sign and submit
6. Navigate to Payment Success
```
- [ ] All screens load correctly
- [ ] Data persists across navigation
- [ ] Back stack behaves correctly
- [ ] Success screen receives correct params

#### 12.2 Cancellation Flow
**Test Case**: Cancel at each step
- [ ] Cancel from Send: navigates back
- [ ] Cancel from Sign Confirmation: shows alert, navigates home
- [ ] Cancel from Review Transaction: shows warning, navigates home

#### 12.3 Error Recovery
**Test Case**: Handle errors gracefully
- [ ] Network error during fee fetch: uses default
- [ ] Invalid destination: caught in Send screen
- [ ] Missing params: shows error card
- [ ] Navigation error: shows alert, allows retry

---

## Test Execution Checklist

### Manual Testing
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test with VoiceOver (iOS)
- [ ] Test with TalkBack (Android)
- [ ] Test in light theme
- [ ] Test in dark theme
- [ ] Test with very small font
- [ ] Test with very large font (accessibility)
- [ ] Test with poor network connection
- [ ] Test with airplane mode

### Automated Testing
- [ ] Unit tests for utility functions
- [ ] Component tests for Sign Confirmation
- [ ] Navigation tests with mock router
- [ ] Integration tests for full flow
- [ ] Snapshot tests for UI consistency

### Regression Testing
- [ ] Existing payment flows still work
- [ ] Review Transaction screen unaffected
- [ ] Payment Success screen unaffected
- [ ] Wallet balance updates correctly
- [ ] Transaction history updates

---

## Known Limitations

1. **Fee is hardcoded**: Currently "100 stroops". Real fee fetching not implemented.
2. **XLM only**: No multi-asset support yet.
3. **No transaction simulation**: Cannot preview effects before signing.
4. **No external signer info**: Shows "This Device" only.

---

## Related Documentation

- [Signing Confirmation Flow](../signing-confirmation-flow.md)
- [Signer Handoff Design](../signer-handoff-design.md)
- [Mobile Security Checklist](../mobile-security-checklist.md)
- [Accessibility Guide](../accessibility.md)
