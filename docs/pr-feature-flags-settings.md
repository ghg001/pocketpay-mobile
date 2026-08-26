# PR: Add Development‑Safe Feature Flags Settings View

## Description
This PR introduces a **development‑only Feature Flags** view in the PocketPay mobile app. It adds:
1. A central `src/config/featureFlags.ts` file defining feature flags with metadata (`enabled`, `experimental`, `description`).
2. A new **Feature Flags** row in the Settings screen (visible only when `__DEV__` is true) that navigates to a dedicated screen.
3. The `app/(tabs)/settings/flags.tsx` screen displaying each flag, its description, an experimental warning icon, and a toggle switch for developers.

## Motivation
- Provide a safe, non‑sensitive UI for developers to inspect and toggle experimental feature flags during testing.
- Prevent accidental exposure of production‑only or secret configuration.
- Centralize flag definitions to make future flag management straightforward.

## Changes Made
- **New file:** `src/config/featureFlags.ts` – flag definitions and helper `isFeatureEnabled`.
- **Modified:** `app/(tabs)/settings.tsx` – added a **Feature Flags (Dev)** row wrapped in `__DEV__` guard.
- **New screen:** `app/(tabs)/settings/flags.tsx` – renders the flag list with descriptions, experimental icons, and switches.
- Updated navigation to include the new screen (via `router.push('/settings/flags')`).
- Documentation updates can be added to a future `docs/feature-flags.md` (not required for this PR).

## Testing / Verification
1. Run the app in development mode (`npm start`).
2. Open Settings → you should see a **Feature Flags** entry (only in dev builds).
3. Tap the entry to view the flags screen; verify that experimental flags show an alert icon and that toggles update the console log.
4. Ensure that in a production build (`expo start --no-dev`) the **Feature Flags** row is not rendered.
5. Run lint (`npm run lint`) and existing unit tests (`npm test`) – no new warnings or failures should appear.

## Review Checklist
- [ ] Documentation follows repository style guidelines.
- [ ] No new lint warnings.
- [ ] Build passes (`npm run build` / `npm start`).
- [ ] Feature Flags row only appears in `__DEV__` builds.
- [ ] Flags screen respects the design system (spacing, typography, icons).
- [ ] All new files are correctly exported/imported.
- [ ] No sensitive configuration is exposed in the UI.

## Related Issues
- None – this is a new feature addition.

---
*Generated automatically by Antigravity on 2026‑07‑25.*
