# Push Notification Project: Key Checkpoints & Lessons Learned

## 1. Initial Setup
- Started with a Next.js + Firebase + Tailwind app to test push notifications.
- Manual push worked by sending a notification from the frontend to a Next.js API route, which used Firebase Admin SDK to send the push.

## 2. Problems Encountered
- **Service Account Secret in Git:** Accidentally committed the Firebase service account JSON to git. GitHub blocked the push for security. Solution: Remove the file from git history and use environment variables for secrets.
- **Vercel Serverless Limitation:** Realized Vercel (and similar serverless hosts) cannot run background jobs or persistent processes. Cron jobs or scheduled tasks on Vercel only run on demand, not continuously.

## 3. Key Realizations & Solutions
- **Background Worker Needed:** To send scheduled notifications, you need a backend process that is always running (a background worker), not just an API route.
- **Separate Hosting for Worker:** Deployed the worker on Render as a persistent background service, while keeping the Next.js frontend on Vercel.
- **Database as the Bridge:** Used MongoDB Atlas as a shared database. The frontend schedules jobs by saving them to MongoDB; the worker reads and processes them.

## 4. Implementation Steps
- **Manual Notification:**
  - User enables push, gets FCM token.
  - Frontend sends token to backend API, which sends a push notification immediately.
- **Scheduled Notification:**
  - Added a new API route to schedule jobs (token, sendAt, title, body) in MongoDB.
  - Created a worker (Node.js script) that runs 24/7 on Render, checks MongoDB for due jobs, and sends notifications using Firebase Admin SDK.
  - Worker marks jobs as sent after processing.

## 5. Final Working Flow
- User enables push and schedules a notification from the frontend.
- The job is saved in MongoDB.
- The background worker (on Render) picks up the job at the right time and sends the notification.
- Everything works reliably because the worker is always running and MongoDB is always accessible.

## 6. Lessons Learned
- Never commit secrets to git; always use environment variables.
- Serverless platforms like Vercel are not suitable for persistent background jobs.
- Use a dedicated background worker on a platform like Render for scheduled tasks.
- Use a shared database (like MongoDB Atlas) to connect frontend and backend.