"use client";

import React, { useState } from "react";
import { getFirebaseMessaging, getToken, onMessage, VAPID_PUBLIC_KEY } from "../lib/firebaseClient";
import Navigation from "./components/Navigation";
import ScheduleSection from "./components/ScheduleSection";

export default function Home() {
  // Manual test state
  const [status, setStatus] = useState("");
  const [token, setToken] = useState("");

  async function enablePush() {
    setStatus("Requesting permission...");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("Permission denied.");
        return;
      }
      setStatus("Registering service worker...");
      const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      setStatus("Getting FCM token...");
      const messaging = getFirebaseMessaging();
      const fcmToken = await getToken(messaging, {
        vapidKey: VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: reg,
      });
      if (fcmToken) {
        setToken(fcmToken);
        setStatus("Push enabled!");
        // Save token to backend
        await fetch("/api/save-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: fcmToken }),
        });
      } else {
        setStatus("Failed to get FCM token.");
      }
    } catch (err) {
      setStatus("Error: " + (err as any)?.message);
    }
  }

  React.useEffect(() => {
    // Listen for foreground messages
    try {
      const messaging = getFirebaseMessaging();
      onMessage(messaging, (payload) => {
        // Show notification even if app is open
        if (payload?.notification) {
          new Notification(payload.notification.title || "Push", {
            body: payload.notification.body,
            icon: payload.notification.icon,
          });
        }
      });
    } catch { }
  }, []);

  return (
    <>
      {/* Manual Test UI (commented out for production)
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#081f44]">
        <div className="rounded-lg shadow p-8 w-full max-w-xs flex flex-col items-center" style={{ background: '#10244d', border: '1px solid #193366' }}>
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition mb-4 w-full"
            onClick={enablePush}
            disabled={status === "Push enabled!"}
          >
            Enable Push Notifications
          </button>
          <div className="text-center text-white min-h-[2rem]">{status}</div>
          {token && (
            <>
              <div className="mt-2 break-all text-xs text-gray-300">Token: {token}</div>
              <form
                className="mt-4 w-full flex flex-col gap-2 bg-[#10244d] p-4 rounded border border-[#193366]"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setStatus("Sending test notification...");
                  const res = await fetch("/api/send-notification", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                  });
                  if (res.ok) setStatus("Test notification sent!");
                  else setStatus("Failed to send notification.");
                }}
              >
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700 transition"
                >
                  Send Test Notification
                </button>
              </form>
              <button
                className="bg-purple-600 text-white px-4 py-2 rounded w-full hover:bg-purple-700 transition mt-2"
                onClick={async () => {
                  setStatus("Scheduling notification for 1 minute later...");
                  const sendAt = new Date(Date.now() + 60 * 1000).toISOString();
                  const res = await fetch("/api/schedule", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      token,
                      sendAt,
                      title: "Scheduled Test",
                      body: "This notification was scheduled 1 minute ago.",
                    }),
                  });
                  if (res.ok) setStatus("Scheduled notification for 1 minute later!");
                  else setStatus("Failed to schedule notification.");
                }}
              >
                Schedule Test Notification (1 min later)
              </button>
            </>
          )}
        </div>
      </main>
      */}
      {/* New App UI */}
      <Navigation />
      <ScheduleSection />
    </>
  );
}

// 