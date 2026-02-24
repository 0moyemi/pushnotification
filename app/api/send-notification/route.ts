// app/api/send-notification/route.ts
// This route sends a test push notification using Firebase Admin SDK
import { NextRequest } from "next/server";

// --- INSERT YOUR SERVICE ACCOUNT JSON PATH BELOW ---
// Place your service account JSON in the root or a secure location and update the path
const serviceAccount = require("../../../testing-27f81-firebase-adminsdk-fbsvc-4c300335e7.json");

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
    });
}

export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json();
        if (!token) return new Response("Missing token", { status: 400 });

        const message = {
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

        try {
            await getMessaging().send(message);
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } catch (err: any) {
            console.error("FCM send error:", err);
            return new Response(JSON.stringify({ success: false, error: err.message, details: err }), { status: 500 });
        }
    } catch (err: any) {
        console.error("API handler error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message, details: err }), { status: 500 });
    }
}
