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
        <meta name="apple-mobile-web-app-capable"          content="yes" />
        <meta name="apple-mobile-web-app-title"            content="Companion" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable"                content="yes" />
        <meta name="theme-color"                           content="#1877F2" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>

        {/*
          Cold-start splash screen.
          Rendered in raw HTML so it shows BEFORE React hydrates.
          The script below removes it from the DOM entirely after first load.
          It is permanently destroyed — cannot reappear on page navigation.
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
          <div style={{
            fontWeight: 800, fontSize: 22, color: "#1a1a1a",
            marginBottom: 4, letterSpacing: "-0.5px",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}>
            companion
          </div>
          <div style={{
            fontSize: 11, color: "#8A8D91", marginBottom: 40,
            letterSpacing: "0.5px",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}>
            AI JAMB STUDY ASSISTANT
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "3px solid #F0F2F5",
            borderTopColor: "#EA580C",
            animation: "companionSpin 0.8s linear infinite",
          }} />
        </div>

        <div className="app-shell">
          {children}
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // ── Splash screen — cold start only ──────────────────────────
            // We track whether splash has already been dismissed.
            // Once dismissed it is REMOVED from the DOM entirely so it
            // can never reappear on client-side page navigation.
            var splashDone = false;

            function dismissSplash() {
              if (splashDone) return;
              splashDone = true;

              var el = document.getElementById('companion-splash');
              if (!el) return;

              // Fade out
              el.style.transition = 'opacity 0.3s ease';
              el.style.opacity = '0';
              el.style.pointerEvents = 'none';

              // Remove from DOM completely after fade
              // This ensures it CANNOT reappear on navigation
              setTimeout(function() {
                if (el && el.parentNode) {
                  el.parentNode.removeChild(el);
                }
              }, 350);
            }

            // Show splash for at least 600ms then remove
            var shownAt = Date.now();
            var MIN_MS  = 600;

            function scheduleDismiss() {
              var elapsed = Date.now() - shownAt;
              var wait    = Math.max(0, MIN_MS - elapsed);
              setTimeout(dismissSplash, wait);
            }

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                requestAnimationFrame(function() {
                  requestAnimationFrame(scheduleDismiss);
                });
              });
            } else {
              requestAnimationFrame(function() {
                requestAnimationFrame(scheduleDismiss);
              });
            }

            // ── Service worker ────────────────────────────────────────────
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(function(){});
            }

            // ── PWA install prompt ────────────────────────────────────────
            window.deferredPrompt = null;
            window.addEventListener('beforeinstallprompt', function(e) {
              e.preventDefault();
              window.deferredPrompt = e;
            });
          })();
        `}} />

        {/* Splash styles — scoped here, not in globals.css */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes companionSpin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          #companion-splash {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          }
        `}} />
      </body>
    </html>
  );
}
