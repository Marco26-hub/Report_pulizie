import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import ServiceWorker from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "Daily Cleaning Report",
  description: "Report giornalieri impresa di pulizie",
  manifest: "/manifest.webmanifest",
  applicationName: "Daily Cleaning Report",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DCR" }
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}
