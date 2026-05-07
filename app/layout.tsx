import type { Metadata, Viewport } from "next";
import "./globals.css";

<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#ea580c" />

export const metadata: Metadata = {
  title: "Companion - AI JAMB Study Assistant",
  description: "AI-powered JAMB study assistant for Nigerian students.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Companion",
  },
  applicationName: "Companion",
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
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
        <link rel="icon" href="/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Companion" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Companion" />
      </head>
      <body style={{margin:0,padding:0} as React.CSSProperties}>
        {children}
        <script dangerouslySetInnerHTML={{__html:`
          window.deferredPrompt = null;
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.deferredPrompt = e;
          });
          window.addEventListener('appinstalled', function() {
            window.deferredPrompt = null;
            localStorage.setItem('pwa_installed','1');
          });
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(reg) { console.log('SW registered'); })
                .catch(function(err) { console.log('SW failed:', err); });
            });
          }
        `}} />
      </body>
    </html>
  );
}