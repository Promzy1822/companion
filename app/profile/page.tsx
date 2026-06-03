"use client";
import { useState, useEffect } from "react";
import { useRouter }           from "next/navigation";
import Link                    from "next/link";
import {
  User, Mail, Building2, BookOpen, Target, Calendar,
  Star, LogOut, Moon, Sun, ChevronRight, Edit3,
  Shield, Bell, Check, X,
} from "lucide-react";
import { C, palette } from "../lib/design";
import Layout from "./components/Layout";

/* ─── Types ──────────────────────────────────────────────────── */
interface UserData {
  name:        string;
  email:       string;
  institution: string;
  course:      string;
  subjects:    string[];
  target:      string;
  deadline:    string;
  selfRating:  string;
  createdAt?:  string;
}

/* ─── Small reusable row ─────────────────────────────────────── */
function InfoRow({
  icon: Icon, label, value, darkMode,
}: { icon: React.ElementType; label: string; value: string; darkMode: boolean }) {
  const T = palette(darkMode);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      paddingBottom: "14px",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: "10px",
        background: C.primaryLight, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={16} color={C.primary} strokeWidth={1.8} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "11px", color: T.sub, fontWeight: 600, marginBottom: "2px" }}>
          {label}
        </div>
        <div style={{
          fontSize: "14px", color: T.text, fontWeight: 600,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}

/* ─── Card wrapper ───────────────────────────────────────────── */
function Card({
  children, darkMode, style,
}: { children: React.ReactNode; darkMode: boolean; style?: React.CSSProperties }) {
  const T = palette(darkMode);
  return (
    <div style={{
      background:   T.surface,
      border:       `1px solid ${T.border}`,
      borderRadius: "12px",
      overflow:     "hidden",
      boxShadow:    "0 1px 3px rgba(0,0,0,0.05)",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─── Card header ────────────────────────────────────────────── */
function CardHeader({
  title, action, darkMode,
}: { title: string; action?: React.ReactNode; darkMode: boolean }) {
  const T = palette(darkMode);
  return (
    <div style={{
      padding: "16px",
      borderBottom: `1px solid ${T.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{ fontWeight: 600, fontSize: "16px", color: T.text }}>{title}</span>
      {action}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function Profile() {
  const [user,    setUser]    = useState<UserData | null>(null);
  const [dark,    setDark]    = useState(false);
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState<Partial<UserData>>({});
  const [saved,   setSaved]   = useState(false);
  const [ready,   setReady]   = useState(false);
  const router = useRouter();

  /* ── Bootstrap ────────────────────────────────────────────── */
  useEffect(() => {
    const dm = localStorage.getItem("darkMode") === "true";
    setDark(dm);
    document.documentElement.setAttribute("data-dark", String(dm));
    try {
      const raw = localStorage.getItem("companion_user");
      if (!raw) { router.replace("/landing"); return; }
      const parsed: UserData = JSON.parse(raw);
      setUser(parsed);
      setForm(parsed);
    } catch {
      router.replace("/landing");
      return;
    }
    setReady(true);
  }, [router]);

  const toggleDark = () => {
    const n = !dark;
    setDark(n);
    localStorage.setItem("darkMode", String(n));
    document.documentElement.setAttribute("data-dark", String(n));
  };

  const saveProfile = () => {
    if (!user) return;
    const updated = { ...user, ...form };
    localStorage.setItem("companion_user", JSON.stringify(updated));
    setUser(updated);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const logout = () => {
    localStorage.removeItem("companion_user");
    router.replace("/landing");
  };

  /* ── Guard ────────────────────────────────────────────────── */
  if (!ready || !user) return null;

  const T = palette(dark);

  /* ── Derived values ───────────────────────────────────────── */
  const daysLeft = user.deadline
    ? Math.max(0, Math.ceil((new Date(user.deadline).getTime() - Date.now()) / 86400000))
    : null;

  const PREP = ["", "Not ready", "Just started", "Making progress", "Almost ready"];

  /* ── Shared input style ───────────────────────────────────── */
  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 12px",
    borderRadius: "8px", border: `1px solid ${T.border}`,
    fontSize: "14px", outline: "none",
    background: T.surface2, color: T.text,
    boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color 0.15s",
  };

  const lbl: React.CSSProperties = {
    fontSize: "12px", color: T.sub, display: "block",
    marginBottom: "4px", fontWeight: 500,
  };

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <Layout title="Profile" darkMode={dark} onToggleDark={toggleDark}>
      {/* Save banner */}
      {saved && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-success/10 text-success">
          <Check size={16} strokeWidth={2} />
          <span className="font-medium">Profile saved successfully</span>
        </div>
      )}

      {/* Personal info card */}
      <Card darkMode={dark}>
        <CardHeader
          darkMode={dark}
          title="Personal Info"
          action={
            <button
              onClick={() => { setEditing(p => !p); if (editing) setForm(user); }}
              className="px-3 py-1 rounded text-sm font-medium
                      hover:bg-surface2 transition-colors"
            >
              {editing ? "Cancel" : "Edit"}
            </button>
          }
        />

        <div className="p-4">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Full Name</label>
                <input
                  className="w-full px-3 py-2 rounded border border-border/20 bg-surface2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.name || ""}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Email Address</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 rounded border border-border/20 bg-surface2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.email || ""}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">JAMB Exam Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded border border-border/20 bg-surface2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.deadline || ""}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-muted mb-1">
                  <span>Target Score</span>
                  <span className="font-semibold">{form.target}</span>
                </label>
                <input
                  type="range" min="180" max="400" step="5"
                  className="w-full"
                  value={form.target || "260"}
                  onChange={e => setForm(p => ({ ...p, target: e.target.value }))}
                />
              </div>
              <button
                onClick={saveProfile}
                className="w-full px-4 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { icon: User,      label: "Full Name",    value: user.name },
                { icon: Mail,      label: "Email",        value: user.email },
                { icon: Building2, label: "Institution",  value: user.institution || "—" },
                { icon: BookOpen,  label: "Course",       value: user.course || "—" },
                { icon: Target,    label: "Target Score", value: `${user.target} / 400` },
                {
                  icon: Calendar, label: "Exam Date",
                  value: user.deadline
                    ? new Date(user.deadline).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
                    : "Not set",
                },
                {
                  icon: Star, label: "Preparation Level",
                  value: PREP[parseInt(user.selfRating) || 2] || "Just started",
                },
              ].map((row, i, arr) => (
                <InfoRow
                  key={i}
                  icon={row.icon}
                  label={row.label}
                  value={row.value}
                  darkMode={dark}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Subjects card */}
      <Card darkMode={dark} className="mt-4">
        <CardHeader darkMode={dark} title="JAMB Subjects" />
        <div className="p-4 flex flex-wrap gap-2">
          {(user.subjects || []).map((s, i) => (
            <span key={i} className="px-3 py-1 rounded text-sm font-medium bg-primary/10 text-primary">
              {s}
            </span>
          ))}
          {(!user.subjects || user.subjects.length === 0) && (
            <span className="text-sm text-muted">No subjects added yet</span>
          )}
        </div>
      </Card>

      {/* Settings card */}
      <Card darkMode={dark} className="mt-4">
        <div className="space-y-0">
          {[
            {
              icon: dark ? Sun : Moon,
              label: dark ? "Switch to Light Mode" : "Switch to Dark Mode",
              detail: dark ? "Currently using dark theme" : "Currently using light theme",
              action: toggleDark,
              danger: false,
            },
            {
              icon: Bell,
              label: "Study Reminders",
              detail: "Coming soon",
              action: () => {},
              danger: false,
            },
            {
              icon: Shield,
              label: "Account Security",
              detail: "Password · Privacy",
              action: () => {},
              danger: false,
            },
          ].map((item, i, arr) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 border-t border-border/20 first:border-t-0
                       hover:bg-surface2 transition-colors cursor-pointer`}
              onClick={item.action}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-surface2 flex items-center justify-center">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted">{item.detail}</div>
                </div>
                <ChevronRight size={16} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full mt-6 px-4 py-3 bg-danger/10 text-danger font-semibold rounded-lg hover:bg-danger/20 transition-colors flex items-center gap-3"
      >
        <LogOut size={16} strokeWidth={2} />
        Log Out
      </button>

      {user.createdAt && (
        <p className="text-center mt-6 text-xs text-muted">
          Member since {new Date(user.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
        </p>
      )}
    </Layout>
  );
}