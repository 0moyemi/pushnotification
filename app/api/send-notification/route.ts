// app/api/send-notification/route.ts
// This route sends a test push notification using Firebase Admin SDK
import { NextRequest } from "next/server";

// --- INSERT YOUR SERVICE ACCOUNT JSON PATH BELOW ---

import { initializeApp, getApps, cert } from "firebase-admin/app";



export async function POST(req: NextRequest) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : undefined;
    if (!serviceAccount) {
        return new Response("Missing FIREBASE_SERVICE_ACCOUNT", { status: 500 });
    }
    if (!getApps().length) {
        initializeApp({
            credential: cert(serviceAccount),
        });
    }
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
            // Directly use Firebase Admin SDK for test version
            const { getMessaging } = await import("firebase-admin/messaging");
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
