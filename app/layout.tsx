import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Push Notification Test",
  description: "To test my push notification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}