"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Download, Share, Plus, Check } from "lucide-react";
import { palette } from "../lib/design";
import { useDark } from "../lib/theme";

/**
 * Stage 1 install banner: a slim, dismissible bar that offers the native PWA
 * install prompt where the browser provides one (the root layout's boot script
 * stashes it on window.deferredPrompt), and Add-to-Home-Screen steps on iOS,
 * which has no install prompt. Hidden when the app is already installed, on
 * auth routes, during a mock exam (via body.exam-focus in globals.css), and
 * for 30 days after a dismissal. Stage 2 (after the Play Store launch) will
 * point this at the store listing instead.
 */
const DISMISS_KEY = "companion_install_dismissed_at";
const INSTALLED_KEY = "companion_install_done";
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
const HIDE_ROUTES = ["/auth", "/reset-password"];

type Mode = "none" | "prompt" | "ios";

function lsGet(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, value: string): void {
  try { window.localStorage.setItem(key, value); } catch { /* private mode: banner just returns next visit */ }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

function getPrompt(): { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { deferredPrompt?: unknown }).deferredPrompt as
    { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null ?? null;
}
function setPrompt(value: unknown): void {
  (window as unknown as { deferredPrompt?: unknown }).deferredPrompt = value;
}

export default function InstallBanner() {
  const pathname = usePathname() ?? "";
  const dark = useDark();
  const T = palette(dark);
  const [mode, setMode] = useState<Mode>("none");
  const [ready, setReady] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (isStandalone()) { lsSet(INSTALLED_KEY, "1"); return; }
    if (lsGet(INSTALLED_KEY)) return;
    const dismissedAt = Number(lsGet(DISMISS_KEY) ?? 0);
    if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS) return;

    let alive = true;
    const showTimer = window.setTimeout(() => { if (alive) setReady(true); }, 1200);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      if (alive) setMode("prompt");
    };
    const onInstalled = () => {
      lsSet(INSTALLED_KEY, "1");
      if (alive) setMode("none");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (getPrompt()) {
      setMode("prompt");
    } else if (isIOS()) {
      setMode("ios");
    }

    // The boot script may stash the prompt just after this mounts; poll briefly.
    let tries = 0;
    const poll = window.setInterval(() => {
      tries += 1;
      if (getPrompt()) {
        if (alive) setMode("prompt");
        window.clearInterval(poll);
      } else if (tries >= 15) {
        window.clearInterval(poll);
      }
    }, 1000);

    return () => {
      alive = false;
      window.clearTimeout(showTimer);
      window.clearInterval(poll);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const routeHidden = HIDE_ROUTES.some(p => pathname === p || pathname.startsWith(p + "/"));
  if (routeHidden || mode === "none" || !ready) return null;

  const dismiss = () => {
    lsSet(DISMISS_KEY, String(Date.now()));
    setMode("none");
  };

  const install = async () => {
    const p = getPrompt();
    if (!p) { setMode("none"); return; }
    try {
      await p.prompt();
      const choice = await p.userChoice;
      if (choice.outcome === "accepted") {
        lsSet(INSTALLED_KEY, "1");
      } else {
        lsSet(DISMISS_KEY, String(Date.now()));
      }
    } catch { /* prompt already consumed or unavailable */ }
    setPrompt(null);
    setMode("none");
  };

  const stepRow = (Icon: typeof Share, text: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
      <span style={{
        width: 26, height: 26, borderRadius: 8, flexShrink: 0,
        background: T.primaryTint, color: T.primary,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={15} strokeWidth={2} />
      </span>
      <span style={{ fontSize: 12.5, lineHeight: 1.45, color: T.sub }}>{text}</span>
    </div>
  );

  return (
    <div
      className="install-banner"
      role="dialog"
      aria-label="Install Companion"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        boxShadow: "0 12px 32px rgba(10, 8, 40, 0.22)",
        padding: 12,
        fontFamily: "var(--font)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img
          src="/icon-192.png"
          alt=""
          width={42}
          height={42}
          style={{ borderRadius: 11, flexShrink: 0, display: "block" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.25 }}>
            Install Companion
          </div>
          <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.35, marginTop: 1 }}>
            Add it to your home screen for faster, full-screen study.
          </div>
        </div>
        {mode === "prompt" ? (
          <button
            type="button"
            onClick={install}
            style={{
              background: T.primary, color: T.onPrimary, border: "none",
              borderRadius: 10, padding: "9px 14px", minHeight: 40,
              fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "var(--font)",
            }}
          >
            <Download size={15} strokeWidth={2.2} />
            Install
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowSteps(s => !s)}
            aria-expanded={showSteps}
            style={{
              background: T.primary, color: T.onPrimary, border: "none",
              borderRadius: 10, padding: "9px 14px", minHeight: 40,
              fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0,
              fontFamily: "var(--font)",
            }}
          >
            How to install
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install banner"
          style={{
            background: "transparent", border: "none", padding: 6,
            color: T.muted, cursor: "pointer", flexShrink: 0,
            alignSelf: "flex-start", display: "flex",
          }}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
      {mode === "ios" && showSteps && (
        <div style={{ borderTop: `1px solid ${T.borderLight}`, marginTop: 10, paddingTop: 8 }}>
          {stepRow(Share, "Tap the Share button in your browser's toolbar.")}
          {stepRow(Plus, "Scroll down and choose \u201CAdd to Home Screen\u201D.")}
          {stepRow(Check, "Tap Add \u2014 Companion will sit on your home screen like any app.")}
        </div>
      )}
    </div>
  );
}
