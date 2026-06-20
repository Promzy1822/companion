import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Companion - AI JAMB Study Assistant",
  description: "AI-powered JAMB study assistant for Nigerian students.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Companion",
  },
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
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable"              content="yes" />
        <meta name="theme-color"                         content="#1877F2" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>

        {/*
          Native-feel splash screen rendered before React hydrates.
          Shown immediately on HTML parse — no blank screen ever.
          Fades out automatically once React takes over.
        */}
        <div id="companion-splash">
          <div style={{
            width: 88, height: 88, borderRadius: 24,
            background: "#EA580C",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20,
            boxShadow: "0 8px 32px rgba(234,88,12,0.22)",
          }}>
            <img src="/icon-192.png" alt="Companion" width={60} height={60}
              style={{ borderRadius: 12 }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, color: "#1a1a1a", marginBottom: 4, letterSpacing: "-0.5px", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
            companion
          </div>
          <div style={{ fontSize: 11, color: "#8A8D91", marginBottom: 40, letterSpacing: "0.5px", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
            AI JAMB STUDY ASSISTANT
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "3px solid #F0F2F5",
            borderTopColor: "#EA580C",
            animation: "spin 0.8s linear infinite",
          }} />
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
            #companion-splash {
              position:fixed; inset:0; z-index:99999; background:#fff;
              display:flex; flex-direction:column; align-items:center; justify-content:center;
              transition: opacity 0.35s ease;
            }
            #companion-splash.hiding { opacity:0; pointer-events:none; }
          `}} />
        </div>

        <div className="app-shell">
          {children}
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // Register service worker
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(function(){});
            }

            // PWA install prompt
            window.deferredPrompt = null;
            window.addEventListener('beforeinstallprompt', function(e) {
              e.preventDefault();
              window.deferredPrompt = e;
            });

            // Hide splash once React has hydrated and first paint is done
            // Uses a short minimum display time (600ms) so it doesn't flash
            var splashShownAt = Date.now();
            var MIN_SPLASH_MS = 600;

            function hideSplash() {
              var el = document.getElementById('companion-splash');
              if (!el) return;
              var elapsed = Date.now() - splashShownAt;
              var delay = Math.max(0, MIN_SPLASH_MS - elapsed);
              setTimeout(function() {
                el.classList.add('hiding');
                setTimeout(function() { el.style.display = 'none'; }, 350);
              }, delay);
            }

            // Hide after DOMContentLoaded + one frame
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                requestAnimationFrame(function() { requestAnimationFrame(hideSplash); });
              });
            } else {
              requestAnimationFrame(function() { requestAnimationFrame(hideSplash); });
            }
          })();
        `}} />
      </body>
    </html>
  );
}
