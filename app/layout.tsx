import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import RouteProgress from "./components/RouteProgress";
import ThemeSync from "./components/ThemeSync";
import AppChrome from "./components/AppChrome";

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

/*
 * Runs in <head>, before anything is painted:
 *  - works out the theme (System / Light / Dark) and sets data-dark + color-scheme
 *  - migrates the legacy "darkMode" key into "themeMode" once, then removes it
 *  - marks the app as "booting" so un-themed server HTML is never visible
 */
const THEME_BOOT = `
(function () {
  var d = document.documentElement;
  try {
    var ls = window.localStorage;
    var mode = ls.getItem('themeMode');
    if (mode !== 'light' && mode !== 'dark' && mode !== 'system') {
      var old = ls.getItem('darkMode');
      mode = old === 'true' ? 'dark' : old === 'false' ? 'light' : 'system';
      ls.setItem('themeMode', mode);
    }
    var dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    ls.removeItem('darkMode');

    d.setAttribute('data-dark', dark ? 'true' : 'false');
    d.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {
    d.setAttribute('data-dark', 'false');
  }
  d.setAttribute('data-booting', 'true');
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <meta name="color-scheme" content="light dark" />
        <link rel="icon"             href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable"                content="yes" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>

        {/* Cold-start splash. Stays until the app has hydrated, then is removed from the DOM for good. */}
        <div id="companion-splash">
          <img src="/icon-192.png" alt="Companion" width={88} height={88}
            style={{ borderRadius: 24, display: "block", marginBottom: 20, boxShadow: "0 8px 32px rgba(31,17,86,0.30)" }} />
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
            borderTopColor: "var(--primary)",
            animation: "companionSpin 0.8s linear infinite",
          }} />
        </div>

        <RouteProgress />
        <ThemeSync />
        <AppChrome />
        <div className="app-shell">
          {children}
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var splashDone = false;

            function dismissSplash() {
              if (splashDone) return;
              splashDone = true;
              document.documentElement.removeAttribute('data-booting');

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

            // Wait until the app has hydrated (ThemeSync removes data-booting), minimum 600ms, give up after 5s.
            var shownAt = Date.now();
            var MIN_MS  = 600;
            var MAX_MS  = 5000;

            function check() {
              var elapsed = Date.now() - shownAt;
              var ready   = !document.documentElement.hasAttribute('data-booting');
              if ((ready && elapsed >= MIN_MS) || elapsed >= MAX_MS) {
                dismissSplash();
              } else {
                setTimeout(check, 40);
              }
            }

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                requestAnimationFrame(function() {
                  requestAnimationFrame(check);
                });
              });
            } else {
              requestAnimationFrame(function() {
                requestAnimationFrame(check);
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
