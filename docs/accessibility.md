# Mobile Accessibility Audit Checklist

Use this checklist when reviewing any UI change to PocketPay Mobile. Every applicable item must pass before a pull request that touches screens or reusable components is merged. Record not-applicable items with a reason. This checklist governs Wallet, Send, Receive, Transactions, Contacts, Vault, Settings, Diagnostics, and the shared components they use; pair it with the [UI State Catalogue](./ui-states.md).

## Definition of done

- [ ] Complete the changed flow with VoiceOver on iOS and TalkBack on Android, including loading, empty, error, success, disabled, and pending states that can occur.
- [ ] Test at the largest supported text size, in portrait and landscape where the route supports both, without clipped controls or hidden error text.
- [ ] Verify keyboard/switch navigation and focus return for changed forms, modals, sheets, and full-row actions.
- [ ] Add focused React Native Testing Library coverage using roles, labels, hints, values, and accessibility state rather than test IDs alone.
- [ ] Include manual device/simulator evidence in the pull request and document any item that cannot be exercised.

---

## 1. Labels and Hints

- [ ] Every interactive element (button, icon button, link, pressable row) has a descriptive `accessibilityLabel` that conveys its purpose — not just its visual appearance. Example: `accessibilityLabel="Send XLM"` rather than `accessibilityLabel="Arrow icon"`.
- [ ] Icon-only buttons (e.g. the QR scan icon on the address input) always carry an `accessibilityLabel`. The label should describe the action, not the icon name.
- [ ] Input fields have a visible label **and** an `accessibilityLabel` (or are associated via the `Input` component's `label` prop so screen readers announce label + value together).
- [ ] Use `accessibilityHint` for non-obvious actions where the label alone does not explain what happens next. Example: `accessibilityHint="Opens camera to scan a recipient QR code"`.
- [ ] Static decorative images and icons that carry no information are hidden from screen readers with `accessible={false}` or `importantForAccessibility="no"`.
- [ ] Amount confirmation text (e.g. "Send 50 XLM to G…") is surfaced as a single labelled unit so VoiceOver / TalkBack reads it in full without the user navigating across multiple text nodes.
- [ ] `accessibilityRole` is set where it adds context: `"button"`, `"link"`, `"header"`, `"image"`, `"text"`, `"switch"`, `"checkbox"`, etc.

---

## 2. Touch Targets

- [ ] All tappable areas are at least **44 × 44 dp** (Apple HIG / Android recommended minimum). Use `hitSlop` on small icons to enlarge the tappable area without changing the visual size:
  ```tsx
  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
  ```
- [ ] Adjacent touch targets have at least **8 dp** of visual or spatial separation to prevent mis-taps.
- [ ] Tab bar items and any bottom-navigation controls naturally meet the 44 dp height requirement — confirm after any tab bar change.
- [ ] List row items (contacts, transaction rows) are tappable on the full row, not just on a nested child element, giving a large comfortable tap area.
- [ ] Floating action buttons or icon-only controls that fall below 44 × 44 dp visually always compensate with `hitSlop` or a transparent padding wrapper.

---

## 3. Colour Contrast

- [ ] **Normal text (< 18 pt / 14 pt bold):** contrast ratio ≥ **4.5 : 1** against its background (WCAG AA).
- [ ] **Large text (≥ 18 pt regular or ≥ 14 pt bold):** contrast ratio ≥ **3 : 1**.
- [ ] **UI components and meaningful icons** (borders that convey input state, status icons, chart lines): contrast ratio ≥ **3 : 1**.
- [ ] Both **light and dark themes** are tested — the dark palette (`#0B0D17` background, `#FFFFFF` primary text) passes by default, but the light palette must be verified too after any colour token change.
- [ ] Status colours (`colors.success #00E676`, `colors.error #FF3D00`, `colors.warning #FFC400`) are **never the only signal** — pair them with an icon, label, or pattern so users who cannot perceive colour still understand the state.
- [ ] Disabled states use `colors.textMuted` / `colors.surfaceLight` and still meet a **minimum 3 : 1** ratio or are otherwise clearly communicated as inactive (e.g. `accessibilityState={{ disabled: true }}`).
- [ ] Do not rely on `textMuted (#637087)` for anything other than placeholder or supplementary copy — it does not meet 4.5 : 1 on `surface (#15192B)`.
- [ ] Placeholder text inside inputs (`colors.textMuted`) is acceptable contrast for placeholder copy but must be clearly distinguishable from entered text.

---

## 4. Focus and Keyboard Navigation

- [ ] Interactive elements receive logical focus order top-to-bottom, left-to-right. Elements that are visually reordered with `position: absolute` must have focus order corrected via `accessibilityViewIsModal` or explicit focus management.
- [ ] When a modal or bottom sheet opens, focus moves into it immediately. When it closes, focus returns to the triggering element.
- [ ] No element traps focus — the user can always navigate away from any component using assistive technology.
- [ ] Custom pressable components built with `TouchableOpacity` or `Pressable` expose `onAccessibilityTap` (iOS) and respond correctly to `TalkBack` double-tap activation on Android.
- [ ] Forms use `returnKeyType` (`"next"` / `"done"`) and `onSubmitEditing` so users can advance through inputs with the keyboard without touching the screen.
- [ ] `KeyboardAvoidingView` is present on all screens with text inputs so the focused field is never hidden behind the soft keyboard.
- [ ] The active tab in the bottom tab bar exposes `accessibilityState={{ selected: true }}` (handled by Expo Router's tab navigator — verify after custom tab bar overrides).

---

## 5. Screen-Reader Clarity

- [ ] Test the full screen flow with **VoiceOver (iOS)** and **TalkBack (Android)** enabled. Swipe through every element on the screen and verify announcements make sense out of visual context.
- [ ] Related elements that must be read together (e.g. a transaction row with icon + name + amount + timestamp) are grouped under a single accessible container using `accessible={true}` with a composed `accessibilityLabel`:
  ```tsx
  <View
    accessible={true}
    accessibilityLabel={`Received 12.5 XLM from GABCD…, 3 hours ago`}
  >
    ...
  </View>
  ```
- [ ] Wallet addresses displayed on screen are either read character-by-character (add `accessibilityLabel` with the full address spelt naturally) or hidden from screen readers if a copy button nearby carries the same label.
- [ ] Secret key display: ensure the secret key text does **not** have `accessible={true}` on the raw text — it should be read only when the user explicitly triggers a reveal action, to avoid inadvertent announcement in public spaces.
- [ ] Balance amounts include the currency unit in the `accessibilityLabel`. Example: `accessibilityLabel="Balance: 104.32 XLM"`.
- [ ] QR code images carry an `accessibilityLabel` that describes what the code represents, e.g. `accessibilityLabel="QR code for your wallet address G…"`. A copyable text address below the QR code serves as the functional alternative.
- [ ] Modals and alerts set `accessibilityViewIsModal={true}` on the container so VoiceOver constrains swipe navigation inside the modal while it is visible.

---

## 6. Error and Loading States

- [ ] **Loading indicators:** any `ActivityIndicator` or skeleton screen has `accessibilityLabel="Loading"` (or a more descriptive message) and the parent container sets `accessibilityState={{ busy: true }}` so screen readers announce the wait state.
- [ ] **Inline field errors:** validation error messages (surfaced by the `Input` component's `error` prop) are positioned immediately below the offending field, use `colors.error` text, and are announced to screen readers using `accessibilityLiveRegion="assertive"` or by moving focus to the error message:
  ```tsx
  <Text
    accessibilityLiveRegion="assertive"
    accessibilityRole="alert"
    style={{ color: colors.error, fontSize: 12 }}
  >
    {error}
  </Text>
  ```
- [ ] **Form submission errors:** critical errors returned by the network or SDK (e.g. "Transaction failed") are announced immediately via `accessibilityLiveRegion="assertive"` and are visible on screen — not only conveyed through a toast that auto-dismisses.
- [ ] **Success confirmations:** non-critical confirmations (e.g. "Address copied") may use `accessibilityLiveRegion="polite"` so they do not interrupt an ongoing screen-reader action.
- [ ] **Empty states:** empty list screens (no transactions, no contacts) have a clear `Text` element explaining why the list is empty and what action the user can take next. This text is accessible to screen readers.
- [ ] **Retry actions:** when a network error is shown, any retry button is focusable, clearly labelled, and positioned close to the error message.
- [ ] **Disabled submit buttons** during loading expose `accessibilityState={{ disabled: true, busy: true }}` so screen readers announce that the action is in progress, not merely unavailable.

---

## 7. Feature-Specific Guidelines

### Wallet and Send/Receive Flows

- [ ] The send confirmation screen reads the full transaction summary as a single logical unit: recipient address, amount, and fee.
- [ ] Amount inputs use `keyboardType="decimal-pad"` and carry `accessibilityLabel` that includes the currency, e.g. `accessibilityLabel="Amount in XLM"`.
- [ ] The "Receive" QR screen provides both the QR image (with label) and a copyable text address below so users with visual impairments or low-end camera scenarios are not blocked.

### Transactions Screen

- [ ] Each transaction row has one concise accessible summary containing direction, amount, asset, counterparty, time, and pending/confirmed/failed status.
- [ ] Sent/received and transaction status are conveyed in text, not only by arrow direction or colour.
- [ ] Filters expose their selected state, and changing a filter announces the updated result count or empty result.
- [ ] Pagination and pull-to-refresh expose busy state without moving focus to the top or hiding the last successful list.

### Contacts Screen

- [ ] Each contact row is wrapped in a single `accessible={true}` container labelled with the contact name and shortened address, e.g. `"Alice, G…XYZ"`.
- [ ] Delete / edit actions on contacts (swipe or long-press) are also accessible via an explicit button or context menu — do not rely solely on gesture-only interactions.
- [ ] QR scanning announces permission, ready, success, invalid-code, and closed states; manual address entry remains available as an equivalent path.

### Vault Screen

- [ ] The vault balance and status (mock vs live) are announced as a single accessible unit.
- [ ] Any "Coming soon" or disabled vault actions use `accessibilityState={{ disabled: true }}` and a hint that explains why the action is unavailable.
- [ ] Each lock summary includes amount, unlock date, matured/locked status, and whether withdrawal is available.
- [ ] Review, signing, submitting, and confirmation phases are announced without exposing raw contract or secret material.

### Settings and Theme Toggle

- [ ] The Light / Dark / System theme selector uses `accessibilityRole="radio"` on each option and `accessibilityState={{ checked: true/false }}`.
- [ ] The currently active theme is visually distinct **and** announced by its `accessibilityState`.
- [ ] Switches have labels describing the setting, expose checked state, and announce authentication or persistence failures without prematurely announcing success.
- [ ] Secret-key content is excluded from normal swipe order while masked and is revealed only after explicit action; reveal, hide, and copy controls have distinct labels.
- [ ] Network, environment, and vault-mode warnings are grouped with their titles and do not rely on badge colour.

### Diagnostics Screen

- [ ] Loading and refresh announce **Loading diagnostics** while keeping the last successful redacted snapshot navigable.
- [ ] Label/value rows are read as a single pair in logical section order; long host names and error messages remain available at large text sizes.
- [ ] **Export Diagnostics Log** is disabled until a valid redacted snapshot exists and its hint makes clear that the OS share sheet opens.
- [ ] Empty values such as no last reported failure are announced explicitly, and collection/parsing errors expose a nearby labelled retry action.
- [ ] Development-only destructive test actions identify their consequence in both label and hint and are absent from production builds.

---

## 8. Reusable component accessibility review

Shared components are responsible for baseline semantics so every caller receives the same behavior. Callers remain responsible for context-specific labels and hints.

| Component or pattern | Accessibility contract |
|---|---|
| `Button` / `AsyncActionButton` | Default to `button`, derive label from visible copy when possible, expose `disabled` and `busy`, keep loading copy stable, and prevent duplicate activation. |
| `Input` / `FormField` | Associate visible label, value, required/invalid/read-only state, hint, and inline error; do not use placeholder as the only label. |
| `LoadingState` / `EmptyState` | Use a descriptive announcement, distinguish busy from empty, and expose retry/next actions in logical focus order. Decorative icons stay hidden. |
| Error/status banners and `StatusBadge` | Pair tone with text/icon, expose alerts or live regions at an appropriate urgency, and avoid repeatedly announcing unchanged content. |
| Interactive list rows | Make the whole row a 44 dp target, compose one meaningful summary, expose `button` only when actionable, and keep nested actions separately reachable without duplicate announcements. |
| `ConfirmModal` / review-confirm patterns | Move focus into the modal, constrain navigation, label close/cancel/confirm, communicate destructive intent and disabled prerequisites, and restore focus to the trigger. |
| `QrScanner` / QR display | Label the camera/QR purpose, announce permission and scan status, provide a labelled close control, and offer typed/copyable content as an equivalent alternative. |

For every reusable-component change:

- [ ] Forward supported accessibility props instead of replacing caller-provided values silently.
- [ ] Keep visual `disabled`/loading/error state synchronized with `accessibilityState` and live announcements.
- [ ] Verify both text children and custom icon/child content receive a meaningful accessible name.
- [ ] Test at least one default state and every state transition owned by the component (for example enabled → busy → success/error → enabled).
- [ ] Test a representative screen integration so grouping does not hide nested controls or create duplicate announcements.

---

## 9. General Best Practices

- [ ] **Scalable text:** no `numberOfLines` limit is placed on user-facing labels unless there is explicit overflow handling. Avoid fixed heights on text containers — let content grow.
- [ ] **Reduced motion:** if animations are added (transitions, loaders), check `useReducedMotion()` (Reanimated) or `AccessibilityInfo.isReduceMotionEnabled()` and reduce or skip the animation when the user has enabled "Reduce Motion" in system settings.
- [ ] **Haptic feedback:** use haptics (`expo-haptics`) for confirmation moments (successful send, QR scan success) as a supplementary (not the only) form of feedback.
- [ ] **No flashing content:** do not introduce elements that flash more than 3 times per second (seizure risk — WCAG 2.3.1).
- [ ] **Language:** set `lang` / `accessibilityLanguage` on content that mixes languages if the app is ever localised, so screen readers switch voice profiles correctly.

---

## How to Test

| Method | Tool |
|---|---|
| Screen reader — iOS | Settings → Accessibility → VoiceOver |
| Screen reader — Android | Settings → Accessibility → TalkBack |
| Colour contrast | [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) or [Colour Contrast Analyser app](https://www.tpgi.com/color-contrast-checker/) |
| Large text / font scale | Settings → Accessibility → Larger Text (iOS) or Font Size (Android) — test at maximum scale |
| Reduced motion | Settings → Accessibility → Motion → Reduce Motion (iOS) |
| Keyboard-only navigation (iPad / Android tablet) | Connect a Bluetooth keyboard and tab through all interactive elements |

---

## References

- [React Native Accessibility Docs](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [Apple Human Interface Guidelines — Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Android Accessibility Overview](https://developer.android.com/guide/topics/ui/accessibility)
- [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)
