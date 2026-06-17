# PWA Readiness

Phase 5B makes Nata Connect installable as a lightweight Progressive Web App
shell. It does not add offline caching, background sync, or push notifications
yet.

## Added

- `app/manifest.ts`
- app name and Telugu brand name
- standalone display mode
- start URL and app scope
- theme and background colors
- icon references
- root metadata for manifest and Apple web app capability
- viewport theme color through Next.js `viewport`

## Android Chrome Test

1. Open the production URL in Chrome on Android.
2. Open the browser menu.
3. Confirm `Install app` or `Add to Home screen` is available.
4. Install and launch from the home screen.
5. Confirm the app opens in standalone mode and starts at `/`.

## iPhone Safari Test

1. Open the production URL in Safari.
2. Tap Share.
3. Tap `Add to Home Screen`.
4. Launch from the icon.
5. Confirm the app opens with the Nata Connect title and mobile layout.

## Icon Notes

The manifest currently uses:

- `/icon.png`
- `/nata-connect-emblem.png`

Before a major public launch, verify final icon sizes, maskable safe area, and
Apple touch icon presentation on real devices.

## Limitations

- No custom service worker.
- No offline mode.
- No push notifications.
- No Firebase Cloud Messaging registration.
- No background notification handling.

## Future Push Plan

When ready, add push notifications as a separate phase:

1. Add Firebase Cloud Messaging web configuration.
2. Add a service worker dedicated to FCM.
3. Store push subscriptions/tokens server-side by user.
4. Add notification preference controls for push categories.
5. Send push only from trusted server routes or Cloud Functions.
6. Add opt-in UX and browser permission education.
7. Add tests for signed-out behavior, token ownership, and revoke/delete flows.

Do not expose private notification content in push payloads. Use generic titles
and route users back into authenticated app screens.
