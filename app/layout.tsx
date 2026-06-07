import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Companion - AI JAMB Study Assistant",
  description: "AI-powered JAMB study assistant for Nigerian students.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Companion" },
  applicationName: "Companion",
};

export const viewport: Viewport = {
  themeColor:   "#1877F2",
  width:        "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest"         href="/manifest.json" />
        <link rel="icon"             href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable"        content="yes" />
        <meta name="apple-mobile-web-app-title"          content="Companion" />
        <meta name="mobile-web-app-capable"              content="yes" />
        <meta name="theme-color"                         content="#1877F2" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
        {/*
          Minimal bootstrap: only registers the service worker.
          Storage migration is handled by Storage.init() called in each page's useEffect.
          No user data is touched here — eliminates the dangerouslySetInnerHTML risk.
        */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(function(){});
          }
          window.deferredPrompt = null;
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.deferredPrompt = e;
          });
        `}} />
      </body>
    </html>
  );
}
