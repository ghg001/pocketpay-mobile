# Transaction Detail Screen - UI Specification

## Visual Layout

```
┌─────────────────────────────────────┐
│ ← Transaction Details               │  Header
├─────────────────────────────────────┤
│                                     │
│          ┌─────────┐                │
│          │   ↗️    │                │  Direction Icon
│          └─────────┘                │
│                                     │
│      -50.0000000 XLM                │  Amount (Large, Red for sent)
│      Jan 15, 2024 10:30 AM          │  Date
│                                     │
│    ┌────────────────────┐           │
│    │ ✓  Successful      │           │  Status Badge
│    └────────────────────┘           │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Type                        │   │
│  │ Sent XLM                    │   │
│  ├─────────────────────────────┤   │
│  │ Status                      │   │
│  │ ✓ Successful                │   │
│  ├─────────────────────────────┤   │
│  │ Memo (text)         [Copy]  │   │
│  │ Payment for services        │   │  Details Card
│  ├─────────────────────────────┤   │
│  │ Transaction Hash    [Copy]  │   │
│  │ abc123def456...             │   │
│  ├─────────────────────────────┤   │
│  │ Sender (From)       [Copy]  │   │
│  │ GABCD...XYZ                 │   │
│  ├─────────────────────────────┤   │
│  │ Recipient (To)      [Copy]  │   │
│  │ GXYZ...ABC                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🔗 View on Stellar Explorer│   │  Explorer Button
│  │  View full transaction...   │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

## Component Breakdown

### 1. Header Bar
- **Left:** Back arrow button
- **Center:** "Transaction Details" title
- **Background:** App surface color
- **Height:** Standard navigation bar height

### 2. Hero Section (Top)
```
┌─────────────────────┐
│   Direction Icon    │  64x64 circular background
│   (Arrow Up/Down)   │  Color: Red/Green tinted
└─────────────────────┘

  -50.0000000 XLM      28pt, Bold, Red (sent) or Green (received)
  Jan 15, 2024         14pt, Muted color

┌──────────────────┐
│ ✓ Successful     │   Badge with icon + text
└──────────────────┘   Background: Status color with 10% opacity
```

**Direction Icon Colors:**
- **Sent:** Red background (#FF3D00 at 10% opacity)
- **Received:** Green background (#00E676 at 10% opacity)

**Status Badge:**
- **Successful:** Green (#00E676)
- **Pending:** Yellow (#FFC400)
- **Failed:** Red (#FF3D00)

### 3. Details Card
A single card with multiple rows, each containing:

**Row Structure:**
```
┌────────────────────────────┐
│ Label              [Action]│  14pt, Secondary color
│ Value or Content           │  16pt, Primary color
└────────────────────────────┘
```

**Row Types:**

#### Simple Value Row
```
Type
Sent XLM
```

#### Status Row (with icon)
```
Status
✓ Successful
```

#### Copyable Text Row
```
Transaction Hash        [📋]
abc123def456abc123...
```

**Copy Button States:**
- **Default:** Copy icon (📋) in primary color
- **After Copy:** Checkmark (✓) + "Copied" text in green

**Text Styles:**
- **Addresses/Hashes:** Monospace font (Courier/monospace)
- **Regular Text:** System font
- **Selectable:** All addresses and hashes

### 4. Explorer Section
```
┌────────────────────────────────┐
│  🔗 View on Stellar Explorer  │  Button
│  View full transaction details │  Helper text
└────────────────────────────────┘
```

**Button:**
- Border: Primary color
- Background: Primary color at 10% opacity
- Text: Primary color, 15pt, Bold
- Icon: External link icon
- Border radius: 12pt

**When Unavailable:**
```
┌────────────────────────────────┐
│  ⓘ Explorer not available...  │  Muted text
└────────────────────────────────┘
```

## Color Palette

### Status Colors
```
Successful:
  Icon: #00E676 (Green)
  Background: rgba(0, 230, 118, 0.1)
  Text: #00E676

Pending:
  Icon: #FFC400 (Yellow)
  Background: rgba(255, 196, 0, 0.1)
  Text: #FFC400

Failed:
  Icon: #FF3D00 (Red)
  Background: rgba(255, 61, 0, 0.1)
  Text: #FF3D00
```

### Transaction Direction
```
Sent:
  Icon Background: rgba(255, 61, 0, 0.1)
  Icon Color: #FF3D00
  Amount Color: Default text

Received:
  Icon Background: rgba(0, 230, 118, 0.1)
  Icon Color: #00E676
  Amount Color: #00E676
```

### Text Colors (Dark Mode)
```
Primary:   #FFFFFF (white)
Secondary: #A0AABF (light gray)
Muted:     #637087 (medium gray)
```

### Surface Colors (Dark Mode)
```
Background: #0B0D17 (deep navy)
Surface:    #15192B (card background)
Border:     #2A314A (divider lines)
Primary:    #00E5FF (cyan/teal)
```

## Spacing & Sizing

### Margins & Padding
```
Screen padding:     24pt (lg)
Card padding:       24pt (lg)
Row padding:        16pt (md)
Section gaps:       24pt (lg)
Element gaps:       8pt (sm)
```

### Border Radius
```
Cards:          16pt (lg)
Badges:         9999pt (full/pill)
Buttons:        12pt (md)
Icon circles:   50% (round)
```

### Typography Scale
```
Amount:         28pt, Bold
Section header: 14pt, Medium
Row label:      14pt, Medium
Row value:      16pt, Semi-bold
Body text:      15pt, Regular
Helper text:    12pt, Regular
```

### Icons
```
Hero icon:      32pt
Status badge:   18pt
Copy button:    16pt
```

## Interactive States

### Copy Button
```
Default:
  [📋] Copy icon, primary color

Pressed:
  Slight opacity change (0.7)

After Copy:
  [✓] Checkmark icon, green
  "Copied" text appears
  Reverts after 2 seconds
```

### Explorer Button
```
Default:
  Border + light background

Pressed:
  Darker background
  Slight scale (0.98)
```

### Back Button
```
Default:
  Arrow icon, primary text color

Pressed:
  Opacity 0.7
```

## Responsive Behavior

### Long Text Handling
- **Addresses:** Wrap after first character group
- **Hashes:** Ellipsize or wrap
- **Memos:** Word wrap, no character limit
- **Dates:** Adjust format on narrow screens

### Missing Data
- **No memo:** Entire row hidden
- **No hash:** Explorer section shows unavailable message
- **No address:** Respective row hidden
- **No amount:** Shows "N/A"
- **No date:** Shows "Unknown date"

## Accessibility

### Screen Reader Labels
```
Amount: "Minus 50.0000000 XLM" or "Plus 50.0000000 XLM"
Status: "Transaction status: Successful"
Copy buttons: "Copy transaction hash"
Explorer button: "View transaction on Stellar Explorer"
```

### Touch Targets
- Minimum size: 44x44pt
- Copy buttons: Padded to meet minimum
- All interactive elements accessible via keyboard (web)

### Color Contrast
- Status text: WCAG AA compliant
- Primary text: AAA compliant
- Secondary text: AA compliant

## Animation & Feedback

### Copy Success
```
1. User taps copy button
2. Icon morphs: 📋 → ✓ (0.2s ease)
3. "Copied" text fades in (0.15s)
4. Green color applied
5. After 2s: Revert (0.3s ease-out)
```

### Page Navigation
```
Enter: Slide from right (0.3s)
Exit: Slide to right (0.3s)
```

### Error States
```
Transaction not found:
  - Centered content
  - Error icon or illustration
  - Message + back button
```

## Edge Cases UI

### Missing Transaction
```
┌─────────────────────────────┐
│                             │
│     Transaction not found   │
│                             │
│     ┌──────────────┐        │
│     │   Go Back    │        │
│     └──────────────┘        │
└─────────────────────────────┘
```

### Pending Transaction
```
Status badge: Yellow with clock icon
Status row: ⏱ Pending
Amount: Normal display (not struck through)
Explorer: May not be available yet
```

### Failed Transaction
```
Status badge: Red with X icon
Status row: ✗ Failed
Amount: Normal display
Explorer: May show error page
```

### No Explorer (Custom Network)
```
┌────────────────────────────────┐
│  ⓘ Explorer not available for │
│     this network               │
└────────────────────────────────┘
```

## Platform Differences

### iOS vs Android
- **Fonts:** San Francisco (iOS) vs Roboto (Android)
- **Haptics:** Light impact on copy (iOS only)
- **Status bar:** Respect safe area insets
- **Scrolling:** Native momentum

### Font Selection
```typescript
Platform.select({
  ios: 'Courier',
  android: 'monospace',
  default: 'monospace'
})
```

## Dark Mode vs Light Mode

All colors automatically adapt via theme system:

**Dark Mode (Default):**
- Deep navy background
- Light text on dark surface
- High contrast

**Light Mode:**
- White/light gray background
- Dark text on light surface
- Inverted but consistent accent colors

---

This UI specification ensures a consistent, accessible, and user-friendly transaction detail experience across all devices and states.
