import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import RouteProgress from "./components/RouteProgress";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

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
  themeColor:   "#4F46E5",
  width:        "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit:  "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <link rel="manifest"         href="/manifest.json" />
        <link rel="icon"             href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable"          content="yes" />
        <meta name="apple-mobile-web-app-title"            content="Companion" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable"                content="yes" />
        <meta name="theme-color"                           content="#4F46E5" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>

        {/* Set theme BEFORE first paint so it never flashes the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html:
          "document.documentElement.setAttribute('data-dark', localStorage.getItem('darkMode') === 'true' ? 'true' : 'false');"
        }} />

        {/* Cold-start splash. Removed from the DOM after first load. */}
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
            fontWeight: 800, fontSize: 22, color: "var(--text)",
            marginBottom: 4, letterSpacing: "-0.5px",
            fontFamily: "var(--font)",
          }}>
            companion
          </div>
          <div style={{
            fontSize: 11, color: "var(--text-muted)", marginBottom: 40,
            letterSpacing: "0.5px",
            fontFamily: "var(--font)",
          }}>
            AI JAMB STUDY ASSISTANT
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "3px solid var(--surface-3)",
            borderTopColor: "#EA580C",
            animation: "companionSpin 0.8s linear infinite",
          }} />
        </div>

        <RouteProgress />
        <div className="app-shell">
          {children}
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var splashDone = false;

            function dismissSplash() {
              if (splashDone) return;
              splashDone = true;

              var el = document.getElementById('companion-splash');
              if (!el) return;

              el.style.transition = 'opacity 0.3s ease';
              el.style.opacity = '0';
              el.style.pointerEvents = 'none';

              setTimeout(function() {
                if (el && el.parentNode) {
                  el.parentNode.removeChild(el);
                }
              }, 350);
            }

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

            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(function(){});
            }

            window.deferredPrompt = null;
            window.addEventListener('beforeinstallprompt', function(e) {
              e.preventDefault();
              window.deferredPrompt = e;
            });
          })();
        `}} />

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes companionSpin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          #companion-splash {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: var(--bg);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: var(--font);
          }
        `}} />
      </body>
    </html>
  );
}
