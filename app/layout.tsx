import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Companion - AI JAMB Study Assistant",
  description: "AI-powered JAMB study assistant for Nigerian students. Learn, practice, get AI help.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Companion",
    startupImage: "/icon.svg",
  },
  applicationName: "Companion",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ea580c" },
    { media: "(prefers-color-scheme: dark)", color: "#c2410c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Companion" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Companion" />
        <meta name="msapplication-TileColor" content="#ea580c" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body style={{margin:0, padding:0, WebkitFontSmoothing:"antialiased"} as React.CSSProperties}>
        {children}
        <script dangerouslySetInnerHTML={{__html:`
          // Capture install prompt immediately
          window.deferredPrompt = null;
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.deferredPrompt = e;
            console.log('PWA install prompt captured');
          });
          window.addEventListener('appinstalled', function() {
            window.deferredPrompt = null;
            localStorage.setItem('pwa_installed', '1');
            console.log("PWA installed"); if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js"); }
          });
        `}} />
      </body>
    </html>
  );
}
