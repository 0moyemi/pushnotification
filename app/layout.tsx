import type { Metadata } from "next";
import "./globals.css";
import Navigation from "./components/Navigation";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000"),
  title: "Sales Assistant",
  description: "Never lose a sale again. Sales Assistant reminds you to post and follow up, so you never forget a deal or miss out on money. Simple. Powerful. For people who want to win.",
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Sales Assistant",
    description: "Never lose a sale again. Sales Assistant reminds you to post and follow up, so you never forget a deal or miss out on money. Simple. Powerful. For people who want to win.",
    images: [
      {
        url: "/1010 Primary Logo.png",
        width: 800,
        height: 600,
        alt: "Sales Assistant Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sales Assistant",
    description: "Never lose a sale again. Sales Assistant reminds you to post and follow up, so you never forget a deal or miss out on money. Simple. Powerful. For people who want to win.",
    images: ["/1010 Primary Logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#050e23]">
        <ServiceWorkerRegister />
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}