import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import RouteProgress from "./components/RouteProgress";
import ThemeSync from "./components/ThemeSync";
import AppChrome from "./components/AppChrome";
import InstallBanner from "./components/InstallBanner";

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
 *  - the app is dark-only, so this just stamps data-dark + color-scheme
 *  - clears the old theme keys ("themeMode" / "darkMode") left behind by the
 *    removed theme settings
 *  - marks the app as "booting" so un-themed server HTML is never visible
 */
const THEME_BOOT = `
(function () {
  var d = document.documentElement;
  try {
    var ls = window.localStorage;
    ls.removeItem('themeMode');
    ls.removeItem('darkMode');
  } catch (e) {}
  d.setAttribute('data-dark', 'true');
  d.style.colorScheme = 'dark';
  d.setAttribute('data-booting', 'true');
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <meta name="color-scheme" content="dark" />
        <link rel="icon"             href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable"                content="yes" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>

        {/* Cold-start splash. Stays until the app has hydrated, then is removed from the DOM for good. */}
        <div id="companion-splash">
          <div style={{ position: "relative", width: 112, height: 112, marginBottom: 20 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(249,115,22,0.45)", animation: "splashRing 1.6s ease-out 0.15s 2 both" }} />
            <img src="/icon-192.png" alt="Companion" width={112} height={112}
              style={{ display: "block", animation: "splashMarkIn 0.7s ease-out both" }} />
          </div>
          <div style={{
            fontWeight: 800, fontSize: 22, color: "#FFFFFF",
            marginBottom: 4, letterSpacing: "-0.5px",
            fontFamily: "var(--font)",
          }}>
            {"companion".split("").map((ch, i) => (
              <span key={i} style={{ display: "inline-block", animation: `splashRise 0.5s ease-out ${0.15 + i * 0.04}s both` }}>{ch}</span>
            ))}
          </div>
          <div style={{
            fontSize: 11, color: "rgba(255,255,255,0.65)", marginBottom: 40,
            letterSpacing: "0.5px",
            fontFamily: "var(--font)",
          }}>
            AI JAMB STUDY ASSISTANT
          </div>
          <div style={{
            width: 120, height: 3, borderRadius: 2, overflow: "hidden",
            background: "rgba(255,255,255,0.15)",
          }}>
            <div style={{
              width: "45%", height: "100%", borderRadius: 2,
              background: "linear-gradient(90deg, #6366F1, #F97316)",
              animation: "splashBar 1.1s ease-in-out infinite",
            }} />
          </div>
        </div>

        <RouteProgress />
        <ThemeSync />
        <AppChrome />
        <InstallBanner />
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
          @keyframes splashMarkIn {
            from { opacity: 0; transform: translateY(10px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes splashRing {
            from { opacity: 0.9; transform: scale(0.85); }
            to   { opacity: 0; transform: scale(1.45); }
          }
          @keyframes splashRise {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes splashBar {
            0%   { transform: translateX(-110%); }
            100% { transform: translateX(280%); }
          }
          @media (prefers-reduced-motion: reduce) {
            #companion-splash * { animation: none !important; }
          }
          #companion-splash {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: #1F1156;
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
