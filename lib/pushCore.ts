// lib/pushCore.ts
// DO NOT MODIFY THIS FILE: Core push notification logic. Only wrap or extend via imports.
// Any changes to this file must be additive and backward compatible.

import { getMessaging, type Message } from "firebase-admin/messaging";

/**
 * Sends a push notification using Firebase Admin SDK.
 * This is the ONLY allowed way to send push notifications in this app.
 * Do not modify this logic. Only wrap or extend it externally.
 */
/**
 * Sends a push notification using Firebase Admin SDK.
 * @param message - The FCM message payload (TokenMessage, TopicMessage, or ConditionMessage)
 */
export async function sendCorePushNotification(message: Message) {
    // Defensive: freeze the message object to prevent mutation
    Object.freeze(message);
    return await getMessaging().send(message);
}

// Optionally, freeze the exported function to prevent runtime mutation
Object.freeze(sendCorePushNotification);
