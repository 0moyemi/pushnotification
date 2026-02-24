# Minimal Next.js + TailwindCSS Push Notification Test

## Setup

1. **Install dependencies:**
	```bash
	npm install
	```

2. **Add your Firebase Admin service account:**
	- Download your service account JSON from Firebase Console.
	- Place it at `my-app/service-account.json` (or update the path in `app/api/send-notification/route.ts`).

3. **Add an icon:**
	- Place a 192x192 icon at `public/icon-192x192.png` for notifications.

4. **Run the app:**
	```bash
	npm run dev
	```

5. **Test push notifications:**
	- Open the app in your browser (preferably Chrome).
	- Click "Enable Push Notifications" and allow permission.
	- Click "Send Test Notification" to trigger a push.
	- You should receive a notification even if the tab is in background or closed (if browser supports it).

## Notes
- The FCM token is stored in memory only (resets on server restart).
- The VAPID public/private keys are hardcoded for demo.
- For production, secure your keys and use persistent storage for tokens.
- Service worker is at `public/firebase-messaging-sw.js`.

## What else do you need?
- **HTTPS**: Push notifications require HTTPS in production (localhost is allowed for dev).
- **Firebase project**: You must have a Firebase project with Cloud Messaging enabled.
- **Browser support**: Not all browsers support push (Safari has limitations).

---

**Where to insert your keys/JSON:**
- Firebase client config: `lib/firebaseClient.ts` and `public/firebase-messaging-sw.js`
- VAPID public key: `app/page.tsx` (VAPID_KEY)
- Service account: `app/api/send-notification/route.ts` (see comment)
- VAPID private key: Only needed for server-side if you want to send webpush directly (not needed with FCM)

---

**You do not need anything else for a minimal test.**
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
