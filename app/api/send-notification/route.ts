// app/api/send-notification/route.ts
// This route sends a test push notification using Firebase Admin SDK

import { NextRequest } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { sendCorePushNotification } from "../../../lib/pushCore";
import type { Message } from "firebase-admin/messaging";

export async function POST(req: NextRequest) {
    // Validate and parse service account
    let serviceAccount;
    try {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
            console.error("Missing FIREBASE_SERVICE_ACCOUNT env var");
            return new Response("Missing FIREBASE_SERVICE_ACCOUNT", { status: 500 });
        }
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (err) {
        console.error("Invalid FIREBASE_SERVICE_ACCOUNT JSON", err);
        return new Response("Invalid FIREBASE_SERVICE_ACCOUNT", { status: 500 });
    }

    // Initialize Firebase Admin if needed
    try {
        if (!getApps().length) {
            initializeApp({ credential: cert(serviceAccount) });
        }
    } catch (err) {
        console.error("Firebase Admin init error", err);
        return new Response("Firebase Admin initialization failed", { status: 500 });
    }

    // Parse and validate request body
    let token: string | undefined;
    try {
        const body = await req.json();
        token = body.token;
        if (!token || typeof token !== "string") {
            return new Response("Missing or invalid token", { status: 400 });
        }
    } catch (err) {
        console.error("Invalid JSON body", err);
        return new Response("Invalid JSON body", { status: 400 });
    }

    // Compose message
    const message: Message = {
        token,
        notification: {
            title: "Test Push",
            body: "This is a test push notification!",
        },
        data: {
            title: "Test Push",
            body: "This is a test push notification!",
            icon: "/android-chrome-192x192.png",
        },
        webpush: {
            headers: {
                Urgency: "high",
            },
            notification: {
                icon: "/android-chrome-192x192.png",
            },
        },
    };

    // Send notification
    try {
        await sendCorePushNotification(message);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err: any) {
        console.error("FCM send error:", err);
        if (err instanceof Error) {
            console.error("Stack trace:", err.stack);
        } else {
            console.error("Error details:", JSON.stringify(err));
        }
        return new Response(JSON.stringify({ success: false, error: err.message, details: err }), { status: 500 });
    }
}
