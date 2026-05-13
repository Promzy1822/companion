import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "./context/AppContext";

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
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Companion" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ea580c" />
      </head>
      <body style={{ margin: 0, padding: 0 } as React.CSSProperties}>
        <AppProvider>
          {children}
        </AppProvider>
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            try {
              var version = parseInt(localStorage.getItem('companion_storage_version') || '1');
              if (version < 2) {
                var userStr = localStorage.getItem('companion_user');
                if (userStr) {
                  var user = JSON.parse(userStr);
                  if (user.password && !user.passwordHash) {
                    var salted = "companion_salt_2025_" + user.password;
                    var hash = 0;
                    for (var i = 0; i < salted.length; i++) {
                      var char = salted.charCodeAt(i);
                      hash = ((hash << 5) - hash) + char;
                      hash = hash & hash;
                    }
                    user.passwordHash = Math.abs(hash).toString(16) +
                      Math.abs(hash * 2654435761).toString(16) +
                      Math.abs(hash ^ 0xdeadbeef).toString(16);
                    delete user.password;
                    localStorage.setItem('companion_user', JSON.stringify(user));
                  }
                }
                localStorage.setItem('companion_storage_version', '2');
              }
            } catch(e) {}
          })();
          window.deferredPrompt = null;
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault(); window.deferredPrompt = e;
          });
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(function(){});
          }
        `}} />
      </body>
    </html>
  );
}
