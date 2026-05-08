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
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Companion" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ea580c" />
      </head>
      <body style={{ margin: 0, padding: 0 } as React.CSSProperties}>
        {children}
        <script dangerouslySetInnerHTML={{__html:`
          window.deferredPrompt=null;
          window.addEventListener('beforeinstallprompt',function(e){
            e.preventDefault();window.deferredPrompt=e;
          });
          window.addEventListener('appinstalled',function(){
            window.deferredPrompt=null;localStorage.setItem('pwa_installed','1');
          });
          if('serviceWorker' in navigator){
            navigator.serviceWorker.register('/sw.js').catch(function(){});
          }
        `}} />
      </body>
    </html>
  );
}
