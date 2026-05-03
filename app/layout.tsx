import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Companion - JAMB Study Assistant",
  description: "AI-powered JAMB study assistant for Nigerian students.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Companion" },
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Companion" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ea580c" />
        <meta name="msapplication-TileColor" content="#ea580c" />
      </head>
      <body style={{ margin:0, padding:0, WebkitFontSmoothing:"antialiased" } as React.CSSProperties}>
        {children}
        <script dangerouslySetInnerHTML={{__html:`
          let deferredPrompt;
          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            window.deferredPrompt = e;
            const banner = document.getElementById('pwa-banner');
            if (banner) banner.style.display = 'flex';
          });
          window.addEventListener('appinstalled', () => {
            const banner = document.getElementById('pwa-banner');
            if (banner) banner.style.display = 'none';
          });
        `}} />
      </body>
    </html>
  );
}
