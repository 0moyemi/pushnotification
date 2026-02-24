# Push Notification Core Logic

## DO NOT MODIFY

The file `lib/pushCore.ts` contains the core logic for sending push notifications. This logic is locked and must never be changed directly. All modifications or extensions must be done by wrapping or importing this module, never by editing its contents.

- All push notifications must use `sendCorePushNotification` from `lib/pushCore.ts`.
- Any changes to push notification logic must be additive (wrappers, decorators, etc.), not replacements.
- This ensures reliability and auditability of notification delivery.

## How to Extend

If you need to add features (logging, analytics, etc.), create a new module that imports and wraps `sendCorePushNotification`.

Example:

```ts
import { sendCorePushNotification } from "../lib/pushCore";

export async function sendLoggedNotification(message) {
    // Add logging or extra logic here
    await sendCorePushNotification(message);
}
```

## Enforcement

- All API routes and backend logic must use the core function.
- Code reviews should reject any direct edits to `lib/pushCore.ts`.

---

For questions, contact the project maintainer.
