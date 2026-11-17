"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Mail, Building2, BookOpen, Target, Calendar,
  Star, LogOut, ChevronRight, Edit3,
  Check, X, Eye, EyeOff, KeyRound, Lock, TrendingUp,
  GraduationCap, AlertCircle,
} from "lucide-react";
import { NAVBAR_HEIGHT } from "../components/NavbarView";
import { palette, R, TY, SP, FW, subjectColor } from "../lib/design";
import { Session } from "../lib/session";
import { Sync } from "../lib/sync";
import { createClient } from "../lib/supabase/client";
import { validatePassword } from "../lib/auth";
import { CUTOFF_DB, getCutoff } from "../lib/cutoffs";
import { Progress } from "../lib/progress";
import { JAMB_SYLLABUS } from "../lib/syllabus";
import { readFlameData } from "../lib/flame";
import { getEffectiveExam, daysUntil, saveExamChoice, WINDOW_LABEL, WINDOW_START } from "../lib/exam-date";

interface UserData {
  name: string; email: string; institution: string; course: string;
  subjects: string[]; target: string; deadline: string;
  selfRating: string; createdAt?: string; passwordHash?: string;
}

// English is compulsory; the student picks up to 3 more — 4 in total.
// Same rule as signup (AuthForm: "Pick 3 subjects — English is already
// included"), same 8 subjects the app supports.
const ENGLISH = "English Language";
const ALL_SUBJECTS = [
  ENGLISH, "Mathematics", "Physics", "Chemistry",
  "Biology", "Government", "Economics", "Literature in English",
];
const MAX_SUBJECTS = 4;

// Signup's preparation levels (AuthForm PREP_LEVELS). "Not set" is shown
// when nothing was ever picked — never a invented default (P6).
const PREP_LABELS: Record<string, string> = {
  "1": "Not ready",
  "2": "Just started",
  "3": "Good progress",
  "4": "Almost ready",
};

// Same institution / course lists as signup (AuthForm), so a saved pair
// always matches the cutoff table and the target hint can fire.
const INSTITUTIONS = ["University of Lagos", "University of Ibadan", "OAU Ile-Ife", "UNILORIN", "UNIBEN", "ABU Zaria", "University of Nigeria Nsukka", "LASU", "UNIPORT", "FUTO", "FUNAAB", "Other"];
const COURSES = ["Medicine & Surgery", "Law", "Engineering", "Computer Science", "Pharmacy", "Accounting", "Mass Communication", "Economics", "Agriculture", "Education", "Architecture", "Nursing", "Other"];

// Same display-name to syllabus-key map as CoverageView.
const DISPLAY_TO_KEY: Record<string, string> = {
  "English Language": "english",
  "Mathematics": "mathematics",
  "Physics": "physics",
  "Chemistry": "chemistry",
  "Biology": "biology",
  "Government": "government",
  "Economics": "economics",
  "Literature in English": "literature",
};

function initials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function fmtLongDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "Not set";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const T = palette();
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: R.xl, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, icon, action }: { title: string; icon: React.ReactNode; action?: React.ReactNode }) {
  const T = palette();
  return (
    <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: SP[2] }}>
      {icon}
      <span style={{ fontWeight: FW.bold, fontSize: TY.base, color: T.text }}>{title}</span>
      <span style={{ marginLeft: "auto", display: "flex" }}>{action}</span>
    </div>
  );
}

export default function Profile() {
  const [user, setUser] = useState<UserData | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("companion_user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  // Exam-date choice as recorded by the wizard / Home date sheet — the
  // one home for "is this date estimated?" (exam-date.ts).
  const [examChoice] = useState(() => {
    try { return getEffectiveExam(); } catch { return { deadline: WINDOW_START, estimated: true, mode: "window" as const }; }
  });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<UserData>>(() => user || {});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [recApplied, setRecApplied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [subjEdit, setSubjEdit] = useState(false);
  const [subjDraft, setSubjDraft] = useState<string[]>([]);
  const [subjMsg, setSubjMsg] = useState("");
  const [subjBusy, setSubjBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // H3: same reason-carrying redirect as Home (see app/page.tsx).
    if (!user) { router.replace(Session.consumeExpiredFlag() ? "/landing?session=expired" : "/landing"); }
  }, [router]);

  // Arriving from the account menu's "Change Password" row: open the form
  // and scroll it into view.
  useEffect(() => {
    if (window.location.hash !== "#password") return;
    setShowPwForm(true);
    const t = setTimeout(() => {
      document.getElementById("password")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(t);
  }, []);

  // ── Progress (P12): only numbers that really exist on this device ──
  // Streak + best mock from readFlameData (localStorage, same source as
  // Flame); coverage exactly as CoverageView computes it — topics done
  // over the student's own subjects (all 8 when nothing is stored).
  const progress = useMemo(() => {
    if (!user) return null;
    const flame = readFlameData();
    const studied = Progress.getSyllabusProgress();
    const keys = (user.subjects || []).map((s) => DISPLAY_TO_KEY[s]).filter(Boolean);
    const visible = keys.length
      ? Object.entries(JAMB_SYLLABUS).filter(([k]) => keys.includes(k))
      : Object.entries(JAMB_SYLLABUS);
    const allIds = visible.flatMap(([, s]) => s.topics.map((t) => t.id));
    const done = allIds.filter((id) => studied.has(id)).length;
    return {
      streak: flame.streak,
      bestMock: flame.bestMock,
      coveragePct: allIds.length ? Math.round((done / allIds.length) * 100) : 0,
      coverageDone: done,
      coverageTotal: allIds.length,
    };
  }, [user]);

  // A2 guard (M9): the cutoff recommendation prefills the target ONLY
  // the first time — when this account has no institution/course saved
  // yet. After that it is only a hint under the slider, and the target
  // is never silently overwritten by an institution/course change.
  const recPairKnown = Boolean(
    form.institution && form.course &&
    form.institution !== "Other" && form.course !== "Other" &&
    CUTOFF_DB[form.institution]?.[form.course]
  );
  const recJamb = recPairKnown ? getCutoff(form.institution || "", form.course || "").recommendedJamb : null;
  useEffect(() => {
    if (!editing || !recPairKnown || recJamb === null || recApplied) return;
    if (user?.institution?.trim() || user?.course?.trim()) return;
    setForm((p) => ({ ...p, target: String(recJamb) }));
    setRecApplied(true);
  }, [editing, recPairKnown, recJamb, recApplied, user?.institution, user?.course]);

  if (!user) return null;

  const T = palette();
  const daysLeft = user.deadline ? daysUntil(user.deadline) : null;
  const examDateLabel = !user.deadline
    ? "Not set"
    : examChoice.estimated && user.deadline === WINDOW_START
      ? `${fmtLongDate(user.deadline)} (estimated — window ${WINDOW_LABEL}, proposed)`
      : fmtLongDate(user.deadline);
  const prepLabel = (user.selfRating && PREP_LABELS[user.selfRating]) || "Not set";
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" })
    : null;

  // Deterministic avatar gradient from token colours only (P4): one of
  // three token pairs, picked by a hash of the name — no photo upload
  // exists, so the avatar is full initials, never a single-letter
  // placeholder look.
  const avatarPairs: Array<[string, string]> = [
    [T.accent, T.primary],
    [T.primary, T.success],
    [T.accent, T.warning],
  ];
  let hash = 0;
  for (const ch of user.name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const [avFrom, avTo] = avatarPairs[hash % avatarPairs.length];

  const inpBase: React.CSSProperties = {
    width: "100%", padding: "11px 13px", borderRadius: R.lg,
    border: `1.5px solid ${T.border}`, fontSize: TY.base, outline: "none",
    background: T.s2, color: T.text, boxSizing: "border-box",
    fontFamily: "inherit", transition: "border-color 0.15s", minHeight: 44,
  };
  const lbl: React.CSSProperties = { fontSize: TY.xs, color: T.sub, display: "block", marginBottom: "5px", fontWeight: FW.semibold };
  const fieldErr = (key: string) => fieldErrors[key] ? (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: TY.xs, color: T.dangerText, fontWeight: FW.semibold, marginTop: "5px" }}>
      <AlertCircle size={13} style={{ flexShrink: 0 }} />{fieldErrors[key]}
    </div>
  ) : null;
  const inpFor = (key: string): React.CSSProperties => ({
    ...inpBase,
    borderColor: fieldErrors[key] ? T.danger : T.border,
  });
  const clearFieldError = (key: string) => {
    if (!fieldErrors[key]) return;
    setFieldErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  // ── Edit mode ────────────────────────────────────────────────────────
  const isDirty = editing && JSON.stringify({
    name: (form.name || "").trim(),
    institution: (form.institution || "").trim(),
    course: (form.course || "").trim(),
    target: String(parseInt(form.target || "", 10) || ""),
    deadline: form.deadline || "",
    selfRating: form.selfRating || "",
  }) !== JSON.stringify({
    name: (user.name || "").trim(),
    institution: (user.institution || "").trim(),
    course: (user.course || "").trim(),
    target: String(parseInt(user.target || "", 10) || ""),
    deadline: user.deadline || "",
    selfRating: user.selfRating || "",
  });

  const startEditing = () => {
    setForm(user);
    setFieldErrors({});
    setSaveError("");
    setDiscardConfirm(false);
    setEditing(true);
  };
  const exitEditing = () => {
    setForm(user);
    setFieldErrors({});
    setSaveError("");
    setDiscardConfirm(false);
    setEditing(false);
  };
  const requestCancelEdit = () => {
    // P11: a dirty form is never silently discarded.
    if (isDirty) { setDiscardConfirm(true); return; }
    exitEditing();
  };

  const validateProfile = (f: Partial<UserData>): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!(f.name || "").trim()) errs.name = "Enter your full name.";
    const t = parseInt(f.target || "", 10);
    if (Number.isNaN(t) || t < 180 || t > 400) errs.target = "Target must be a whole number between 180 and 400.";
    if (f.deadline) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f.deadline)) errs.deadline = "Pick a valid exam date.";
      else if (f.deadline < todayISO()) errs.deadline = "That exam date has already passed — pick a date in the future.";
    }
    return errs;
  };

  const saveProfile = async () => {
    if (!user) return;
    const errs = validateProfile(form);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const updated: UserData = {
      ...user,
      name: (form.name || "").trim(),
      institution: (form.institution || "").trim(),
      course: (form.course || "").trim(),
      target: String(parseInt(form.target || "260", 10)),
      deadline: form.deadline || "",
      selfRating: form.selfRating || "",
    };
    setSaveError("");
    setSaveBusy(true);
    try {
      // M10: local persistence is verified (write + re-read) before any
      // success is shown. Sync.pushProfile swallows its own errors
      // (sync.ts catches everything and returns void), so a cloud failure
      // cannot be detected from this page — the notice below only ever
      // claims the on-device save. See report.
      localStorage.setItem("companion_user", JSON.stringify(updated));
      const check = localStorage.getItem("companion_user");
      if (!check || JSON.parse(check).name !== updated.name) throw new Error("local verify failed");
      await Sync.pushProfile({
        name: updated.name, institution: updated.institution, course: updated.course,
        subjects: updated.subjects, target: updated.target, deadline: updated.deadline,
        selfRating: updated.selfRating,
      });
      // Keep the exam-window record in step: the window record lives in
      // exam-date.ts, one fact one home — a changed deadline here updates
      // it instead of leaving two sources disagreeing.
      if (updated.deadline && updated.deadline !== user.deadline) {
        saveExamChoice(updated.deadline === WINDOW_START
          ? { mode: "window" }
          : { mode: "exact", date: updated.deadline });
      }
      setUser(updated);
      setEditing(false);
      setDiscardConfirm(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError("Could not save your profile on this device. Your changes are still in the form — try again.");
    } finally {
      setSaveBusy(false);
    }
  };

  // ── Subjects (P2 / M9) ──────────────────────────────────────────────
  const startSubjEdit = () => {
    const draft = [...(user.subjects || [])];
    if (!draft.includes(ENGLISH)) draft.unshift(ENGLISH);
    setSubjDraft(draft);
    setSubjMsg("");
    setSubjEdit(true);
  };
  const toggleSubject = (s: string) => {
    if (s === ENGLISH) return; // English is compulsory and locked.
    if (subjDraft.includes(s)) {
      setSubjDraft(subjDraft.filter((x) => x !== s));
      setSubjMsg("");
      return;
    }
    if (subjDraft.length >= MAX_SUBJECTS) {
      setSubjMsg(`Pick up to ${MAX_SUBJECTS} subjects in total — English plus 3 more. Remove one first.`);
      return;
    }
    setSubjDraft([...subjDraft, s]);
    setSubjMsg("");
  };
  const saveSubjects = async () => {
    if (!user) return;
    if (!subjDraft.includes(ENGLISH)) {
      setSubjMsg("English Language is compulsory — it stays in your combination.");
      return;
    }
    if (subjDraft.length > MAX_SUBJECTS) {
      setSubjMsg(`Pick up to ${MAX_SUBJECTS} subjects in total — English plus 3 more.`);
      return;
    }
    const updated: UserData = { ...user, subjects: subjDraft };
    setSubjMsg("");
    setSubjBusy(true);
    try {
      localStorage.setItem("companion_user", JSON.stringify(updated));
      const check = localStorage.getItem("companion_user");
      if (!check || JSON.parse(check).subjects?.length !== subjDraft.length) throw new Error("local verify failed");
      await Sync.pushProfile({ subjects: subjDraft });
      setUser(updated);
      setSubjEdit(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSubjMsg("Could not save your subjects on this device. Try again.");
    } finally {
      setSubjBusy(false);
    }
  };

  // ── Password (P8 / P9 / P10 / L9) ────────────────────────────────────
  const changePassword = async () => {
    setPwError(""); setPwSuccess(false);
    if (!user) return;
    if (!oldPw) { setPwError("Enter your current password first."); return; }
    if (!newPw) { setPwError("Enter a new password."); return; }
    if (!confirmPw) { setPwError("Repeat your new password in the confirm field."); return; }
    // Shared rule (auth.ts): at least 8 characters. No inline length
    // check anywhere on this page.
    const pwCheck = validatePassword(newPw);
    if (!pwCheck.valid) { setPwError(pwCheck.message + "."); return; }
    if (newPw !== confirmPw) { setPwError("The new passwords don't match — check both and try again."); return; }
    if (newPw === oldPw) { setPwError("Your new password must be different from your current one."); return; }
    setPwBusy(true);
    try {
      const supabase = createClient();
      const { error: reauthErr } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPw });
      if (reauthErr) { setPwError("That current password doesn't match — check it and try again."); return; }
      const { error: updErr } = await supabase.auth.updateUser({ password: newPw });
      // L9: never render raw server text.
      if (updErr) { setPwError("Could not change your password. Try again."); return; }
      const updated = { ...user }; delete updated.passwordHash;
      localStorage.setItem("companion_user", JSON.stringify(updated));
      try {
        const accs = JSON.parse(localStorage.getItem("companion_accounts") || "[]");
        const idx = accs.findIndex((a: any) => a.email === updated.email);
        if (idx >= 0) { delete accs[idx].passwordHash; localStorage.setItem("companion_accounts", JSON.stringify(accs)); }
      } catch {}
      setUser(updated); setOldPw(""); setNewPw(""); setConfirmPw("");
      // P9: the form stays open with the success message until the user
      // closes it — no auto-close timer.
      setPwSuccess(true);
    } finally { setPwBusy(false); }
  };
  const closePwForm = () => {
    setShowPwForm(false);
    setPwError(""); setPwSuccess(false);
    setOldPw(""); setNewPw(""); setConfirmPw("");
  };

  // H3 logout ordering: confirm first, then Session.logout() signs out
  // of Supabase FIRST (so sync no-ops and cannot delete the cloud
  // backup), then clears the companion_* local keys — only then redirect.
  const logout = async () => {
    setLoggingOut(true);
    try { await Session.logout(); } finally { setLoggingOut(false); }
    router.replace("/landing");
  };

  const infoRows: Array<{ icon: React.ElementType; color: string; label: string; value: string }> = [
    { icon: User, color: T.primaryText, label: "Full name", value: user.name || "Not set" },
    { icon: Mail, color: T.primaryText, label: "Email", value: user.email || "Not set" },
    { icon: Building2, color: T.accent, label: "Institution", value: user.institution || "Not set" },
    { icon: GraduationCap, color: T.successText, label: "Course", value: user.course || "Not set" },
    { icon: Calendar, color: subjectColor("Literature in English"), label: "Exam date", value: examDateLabel },
    { icon: Target, color: T.accent, label: "Target score", value: `${user.target}/400` },
    { icon: Star, color: T.warning, label: "How prepared do you feel?", value: prepLabel },
  ];

  const pwField = (
    label: string, value: string, setValue: (v: string) => void,
    show: boolean, setShow: (v: boolean) => void, placeholder: string,
  ) => (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          style={{ ...inpBase, paddingRight: "52px" }}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={`${show ? "Hide" : "Show"} ${label}`}
          style={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  const editActionBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "5px", padding: "8px 14px",
    minHeight: 44, borderRadius: R.lg, border: "none",
    background: editing ? T.primaryTint : T.s2,
    color: editing ? T.primary : T.sub,
    fontWeight: FW.semibold, fontSize: TY.sm, cursor: "pointer", fontFamily: "inherit",
  };

  const institutionOptions = INSTITUTIONS.includes(form.institution || "")
    ? INSTITUTIONS
    : form.institution ? [form.institution, ...INSTITUTIONS] : INSTITUTIONS;
  const courseOptions = COURSES.includes(form.course || "")
    ? COURSES
    : form.course ? [form.course, ...COURSES] : COURSES;
  const extraSubjects = subjEdit
    ? subjDraft.filter((s) => !ALL_SUBJECTS.includes(s))
    : [];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "var(--font)" }}>

      <main className="profile-page-pad" style={{
        paddingTop: `${NAVBAR_HEIGHT}px`,
        overflowX: "hidden",
      }}>
        {/* Identity card (P3/P4/P13): solid surface, no gradient hero.
            Member since lives here, under the email — not orphaned
            centred text under Logout. */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: R.xl, padding: SP[5] }}>
            <div style={{ display: "flex", gap: SP[4], alignItems: "center" }}>
              <div style={{
                width: 76, height: 76, borderRadius: R.pill, flexShrink: 0,
                background: `linear-gradient(135deg, ${avFrom}, ${avTo})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: TY.xxl, fontWeight: FW.bold, color: T.onPrimary,
              }}>
                {initials(user.name)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: T.text, fontSize: TY.xl, fontWeight: FW.bold, letterSpacing: "-0.3px", overflowWrap: "break-word", lineHeight: 1.25 }}>{user.name}</div>
                <div style={{ color: T.sub, fontSize: TY.sm, overflowWrap: "break-word", marginTop: "2px" }}>{user.email}</div>
                {memberSince && (
                  <div style={{ color: T.muted, fontSize: TY.xs, marginTop: "5px" }}>Member since {memberSince}</div>
                )}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "18px" }}>
              {[
                { label: "Target", value: `${user.target}/400` },
                { label: "Days left", value: daysLeft !== null ? `${daysLeft}d` : "—" },
                { label: "Subjects", value: String(user.subjects?.length ?? 0) },
              ].map((s, i) => (
                <div key={i} style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: R.lg, padding: "11px 8px", textAlign: "center" }}>
                  <div style={{ color: T.accent, fontWeight: FW.bold, fontSize: TY.lg, letterSpacing: "-0.5px", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ color: T.muted, fontSize: TY.xs, marginTop: "4px", fontWeight: FW.semibold }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="profile-cols" style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="profile-main">

            {/* Save banner — shown only after a verified save (M10). */}
            {saved && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: R.lg, background: T.successTint, border: `1px solid ${T.success}` }}>
                <Check size={16} color={T.successText} strokeWidth={2.5} />
                <span style={{ fontSize: TY.sm, color: T.successText, fontWeight: FW.semibold }}>Profile saved successfully</span>
              </div>
            )}

            {/* Personal info card */}
            <Card>
              <CardHeader
                title="Personal Information"
                icon={<User size={19} color={T.primaryText} strokeWidth={1.8} />}
                action={
                  <button onClick={() => { if (editing) requestCancelEdit(); else startEditing(); }} style={editActionBtn}>
                    {editing ? <><X size={13} strokeWidth={2} /> Cancel</> : <><Edit3 size={13} strokeWidth={2} /> Edit</>}
                  </button>
                }
              />
              <div style={{ padding: "16px 18px" }}>
                {editing ? (
                  <div>
                    <div className="profile-edit-grid">
                      <div>
                        <label style={lbl} htmlFor="pf-name">Full name</label>
                        <input id="pf-name" style={inpFor("name")} value={form.name || ""} onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); clearFieldError("name"); }} />
                        {fieldErr("name")}
                      </div>
                      <div>
                        <label style={lbl} htmlFor="pf-date">Exam date</label>
                        <input id="pf-date" style={inpFor("deadline")} type="date" value={form.deadline || ""} onChange={(e) => { setForm((p) => ({ ...p, deadline: e.target.value })); clearFieldError("deadline"); }} />
                        <div style={{ fontSize: TY.xs, color: T.muted, marginTop: "5px", lineHeight: 1.5 }}>JAMB has not confirmed the day — the plan counts down to 15 March 2027 (estimated).</div>
                        {fieldErr("deadline")}
                      </div>
                      <div>
                        <label style={lbl} htmlFor="pf-inst">Institution</label>
                        <select id="pf-inst" style={inpFor("institution")} value={form.institution || ""} onChange={(e) => setForm((p) => ({ ...p, institution: e.target.value }))}>
                          <option value="">Select institution…</option>
                          {institutionOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl} htmlFor="pf-course">Course</label>
                        <select id="pf-course" style={inpFor("course")} value={form.course || ""} onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))}>
                          <option value="">Select course…</option>
                          {courseOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="profile-edit-wide">
                        <label style={{ ...lbl, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>Target score</span>
                          <span style={{ color: T.primary, fontWeight: FW.bold, fontSize: TY.lg }}>{form.target || "260"}/400</span>
                        </label>
                        <div className="profile-target-slider" style={{ display: "flex", alignItems: "center", gap: SP[3], minHeight: 44 }}>
                          <input
                            type="range" min="180" max="400" step="1" value={form.target || "260"}
                            aria-label="Target score slider"
                            onChange={(e) => { setForm((p) => ({ ...p, target: e.target.value })); clearFieldError("target"); }}
                            style={{ flex: 1, accentColor: T.primary, minWidth: 0 }}
                          />
                          <input
                            type="number" min="180" max="400" value={form.target || ""}
                            aria-label="Target score number"
                            onChange={(e) => { setForm((p) => ({ ...p, target: e.target.value })); clearFieldError("target"); }}
                            onBlur={() => {
                              const t = parseInt(form.target || "", 10);
                              if (Number.isNaN(t)) setForm((p) => ({ ...p, target: "260" }));
                              else if (t < 180) setForm((p) => ({ ...p, target: "180" }));
                              else if (t > 400) setForm((p) => ({ ...p, target: "400" }));
                            }}
                            style={{ ...inpFor("target"), width: 84, flexShrink: 0, textAlign: "center", padding: "11px 8px" }}
                          />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: TY.xs, color: T.muted, fontWeight: FW.semibold, marginTop: "2px" }}>
                          <span>180</span><span>400</span>
                        </div>
                        {recJamb !== null && form.institution && form.course && (
                          <div style={{ fontSize: TY.xs, color: T.primaryText, marginTop: "6px", lineHeight: 1.5 }}>
                            For {form.course} at {form.institution}, {recJamb} is a competitive target.
                          </div>
                        )}
                        {fieldErr("target")}
                      </div>
                      <div className="profile-edit-wide">
                        <label style={lbl} htmlFor="pf-prep">How prepared do you feel?</label>
                        <select id="pf-prep" style={inpBase} value={form.selfRating || ""} onChange={(e) => setForm((p) => ({ ...p, selfRating: e.target.value }))}>
                          <option value="">Not set</option>
                          {Object.entries(PREP_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                      <div className="profile-edit-wide">
                        <label style={lbl}>Email</label>
                        <input style={{ ...inpBase, opacity: 0.6 }} type="email" value={form.email || ""} readOnly />
                        <div style={{ fontSize: TY.xs, color: T.muted, marginTop: "5px" }}>Email can&apos;t be changed here — it is your sign-in email.</div>
                      </div>
                    </div>
                    {saveError && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 14px", background: T.dangerTint, border: `1px solid ${T.danger}`, borderRadius: R.lg, color: T.dangerText, fontSize: TY.sm, marginTop: SP[4] }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
                        <span>{saveError}</span>
                      </div>
                    )}
                    {discardConfirm ? (
                      <div style={{ marginTop: SP[4], border: `1px solid ${T.warning}`, background: T.warningTint, borderRadius: R.lg, padding: "12px 14px", fontSize: TY.base, color: T.text, lineHeight: 1.5 }}>
                        Discard your changes? Nothing you typed will be saved.
                        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                          <button onClick={exitEditing} style={{ padding: "11px 18px", borderRadius: R.pill, border: "none", background: T.danger, color: T.onPrimary, fontWeight: FW.bold, fontSize: TY.sm, cursor: "pointer", minHeight: 44 }}>Discard changes</button>
                          <button onClick={() => setDiscardConfirm(false)} style={{ padding: "11px 18px", borderRadius: R.pill, border: `1px solid ${T.border}`, background: "transparent", color: T.text, fontWeight: FW.bold, fontSize: TY.sm, cursor: "pointer", minHeight: 44 }}>Keep editing</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: SP[4] }}>
                        <button onClick={() => void saveProfile()} disabled={saveBusy} style={{ width: "100%", padding: "13px", borderRadius: R.lg, border: "none", background: T.primary, color: T.onPrimary, fontWeight: FW.bold, fontSize: TY.base, cursor: "pointer", minHeight: 48, opacity: saveBusy ? 0.6 : 1 }}>
                          {saveBusy ? "Saving…" : "Save Changes"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {infoRows.map((row, i, arr) => {
                      const Icon = row.icon;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", paddingBottom: i < arr.length - 1 ? "14px" : 0, borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                          <div style={{ width: 38, height: 38, borderRadius: R.lg, background: T.primaryTint, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon size={16} color={row.color} strokeWidth={1.8} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: TY.xs, color: T.sub, fontWeight: FW.semibold, marginBottom: "2px" }}>{row.label}</div>
                            <div style={{ fontSize: TY.base, color: T.text, fontWeight: FW.semibold, overflowWrap: "break-word", lineHeight: 1.45 }}>{row.value}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Your progress (P12) — real local numbers only, each cell a
                link to where the number lives. */}
            <Card style={{ marginTop: "16px" }}>
              <CardHeader
                title="Your progress"
                icon={<TrendingUp size={19} color={T.primaryText} strokeWidth={1.8} />}
              />
              <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link href="/studyplan" style={{ display: "block", width: "100%", textAlign: "left", background: T.s2, border: `1px solid ${T.border}`, borderRadius: R.lg, padding: "12px 13px", textDecoration: "none" }}>
                  <span style={{ display: "block", fontSize: TY.lg, fontWeight: FW.bold, color: T.accent, lineHeight: 1.25 }}>
                    {progress && progress.streak > 0 ? `${progress.streak} day${progress.streak === 1 ? "" : "s"}` : "No streak yet"}
                  </span>
                  <span style={{ display: "block", fontSize: TY.xs, color: T.sub, fontWeight: FW.semibold, marginTop: "2px", lineHeight: 1.4 }}>Study streak · see Plan</span>
                </Link>
                <Link href="/practice" style={{ display: "block", width: "100%", textAlign: "left", background: T.s2, border: `1px solid ${T.border}`, borderRadius: R.lg, padding: "12px 13px", textDecoration: "none" }}>
                  <span style={{ display: "block", fontSize: TY.lg, fontWeight: FW.bold, color: T.text, lineHeight: 1.25 }}>
                    {progress && progress.bestMock !== null ? <>{progress.bestMock}<small style={{ fontSize: TY.xs, color: T.muted, fontWeight: FW.semibold }}> /400</small></> : "No mock yet"}
                  </span>
                  <span style={{ display: "block", fontSize: TY.xs, color: T.sub, fontWeight: FW.semibold, marginTop: "2px", lineHeight: 1.4 }}>Best mock score</span>
                </Link>
                <Link href="/studyplan?view=coverage" style={{ display: "block", width: "100%", textAlign: "left", background: T.s2, border: `1px solid ${T.border}`, borderRadius: R.lg, padding: "12px 13px", textDecoration: "none" }}>
                  <span style={{ display: "block", fontSize: TY.lg, fontWeight: FW.bold, color: T.text, lineHeight: 1.25 }}>
                    {progress ? `${progress.coveragePct}%` : "—"}
                  </span>
                  <span style={{ display: "block", fontSize: TY.xs, color: T.sub, fontWeight: FW.semibold, marginTop: "2px", lineHeight: 1.4 }}>
                    Syllabus coverage{progress ? ` · ${progress.coverageDone} of ${progress.coverageTotal} topics done` : ""}
                  </span>
                </Link>
              </div>
            </Card>
          </div>

          <div className="profile-side">

            {/* Subjects card (P2) — editable in place, English locked. */}
            <Card>
              <CardHeader
                title="JAMB Subjects"
                icon={<BookOpen size={19} color={T.primaryText} strokeWidth={1.8} />}
                action={
                  <button
                    onClick={() => { if (subjEdit) { setSubjEdit(false); setSubjMsg(""); } else startSubjEdit(); }}
                    style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 14px", minHeight: 44, borderRadius: R.lg, border: "none", background: subjEdit ? T.primaryTint : T.s2, color: subjEdit ? T.primary : T.sub, fontWeight: FW.semibold, fontSize: TY.sm, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {subjEdit ? "Done" : "Edit"}
                  </button>
                }
              />
              <div style={{ padding: "14px 18px" }}>
                {!subjEdit ? (
                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {(user.subjects || []).map((s, i) => (
                        <span key={i} style={{ padding: "7px 14px", borderRadius: R.pill, background: T.primaryTint, border: `1px solid ${subjectColor(s)}`, fontSize: TY.sm, fontWeight: FW.semibold, color: subjectColor(s) }}>
                          {s}
                        </span>
                      ))}
                      {(!user.subjects || user.subjects.length === 0) && (
                        <span style={{ fontSize: TY.sm, color: T.muted }}>No subjects added yet</span>
                      )}
                    </div>
                    {(!user.subjects || user.subjects.length === 0) ? (
                      <button onClick={startSubjEdit} style={{ marginTop: SP[3], padding: "11px 18px", borderRadius: R.pill, border: "none", background: T.primary, color: T.onPrimary, fontWeight: FW.bold, fontSize: TY.sm, cursor: "pointer", minHeight: 44 }}>
                        Choose subjects
                      </button>
                    ) : (
                      <p style={{ margin: "10px 0 0", fontSize: TY.xs, color: T.muted, lineHeight: 1.55 }}>These are the subjects in your UTME combination. Plan, drills and the AI tutor all work from this list.</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {ALL_SUBJECTS.map((s) => {
                        const on = subjDraft.includes(s);
                        const locked = s === ENGLISH;
                        const c = subjectColor(s);
                        return (
                          <button
                            key={s}
                            onClick={() => toggleSubject(s)}
                            disabled={locked}
                            aria-pressed={on}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "6px",
                              fontSize: TY.sm, fontWeight: FW.bold, padding: "8px 14px", minHeight: 44,
                              borderRadius: R.pill, cursor: locked ? "default" : "pointer",
                              background: on ? T.primaryTint : T.s2,
                              border: `1px solid ${on ? c : T.border}`,
                              color: on ? c : T.muted, fontFamily: "inherit",
                            }}
                          >
                            {locked ? <Lock size={13} /> : on ? <Check size={13} strokeWidth={2.5} /> : null}{s}
                          </button>
                        );
                      })}
                      {extraSubjects.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSubjDraft(subjDraft.filter((x) => x !== s))}
                          aria-label={`Remove ${s}`}
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: TY.sm, fontWeight: FW.semibold, padding: "8px 14px", minHeight: 44, borderRadius: R.pill, cursor: "pointer", background: T.primaryTint, border: `1px solid ${T.border}`, color: T.text, fontFamily: "inherit" }}
                        >
                          {s} <X size={13} />
                        </button>
                      ))}
                    </div>
                    <p style={{ margin: "10px 0 0", fontSize: TY.xs, color: T.muted, lineHeight: 1.55 }}>
                      English is compulsory. Pick up to {MAX_SUBJECTS} subjects in total — you have {subjDraft.length}.
                    </p>
                    {subjMsg && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 14px", background: T.dangerTint, border: `1px solid ${T.danger}`, borderRadius: R.lg, color: T.dangerText, fontSize: TY.sm, marginTop: "10px" }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
                        <span>{subjMsg}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "8px", marginTop: SP[3], flexWrap: "wrap" }}>
                      <button onClick={() => void saveSubjects()} disabled={subjBusy} style={{ flex: 1, minWidth: 140, padding: "11px 18px", borderRadius: R.pill, border: "none", background: T.primary, color: T.onPrimary, fontWeight: FW.bold, fontSize: TY.sm, cursor: "pointer", minHeight: 44, opacity: subjBusy ? 0.6 : 1 }}>
                        {subjBusy ? "Saving…" : "Save subjects"}
                      </button>
                      <button onClick={() => { setSubjEdit(false); setSubjMsg(""); }} style={{ padding: "11px 18px", borderRadius: R.pill, border: `1px solid ${T.border}`, background: "transparent", color: T.text, fontWeight: FW.bold, fontSize: TY.sm, cursor: "pointer", minHeight: 44 }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Change Password card (P8/P9/P10/L9) */}
            <div id="password" style={{ scrollMarginTop: "72px" }} />
            <Card style={{ marginTop: "16px" }}>
              <button onClick={() => { if (showPwForm) closePwForm(); else { setShowPwForm(true); setPwError(""); setPwSuccess(false); } }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: "12px",
                padding: "14px 18px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", minHeight: 44,
              }}>
                <div style={{ width: 38, height: 38, borderRadius: R.lg, background: T.s2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <KeyRound size={17} color={T.sub} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: TY.base, fontWeight: FW.semibold, color: T.text }}>Change Password</div>
                  <div style={{ fontSize: TY.xs, color: T.muted, marginTop: "2px" }}>Update your account password</div>
                </div>
                <ChevronRight size={16} color={T.muted} strokeWidth={2} style={{ transform: showPwForm ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
              </button>

              {showPwForm && (
                <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
                    {pwSuccess && (
                      <div style={{ padding: "10px 14px", background: T.successTint, border: `1px solid ${T.success}`, borderRadius: R.lg, display: "flex", alignItems: "center", gap: "8px" }}>
                        <Check size={15} color={T.successText} strokeWidth={2.5} />
                        <span style={{ fontSize: TY.sm, color: T.successText, fontWeight: FW.semibold }}>Password changed successfully. This message stays until you close the form.</span>
                      </div>
                    )}
                    {pwField("Current Password", oldPw, setOldPw, showOld, setShowOld, "Enter current password")}
                    <div>
                      {pwField("New Password", newPw, setNewPw, showNew, setShowNew, "At least 8 characters")}
                      <div style={{ fontSize: TY.xs, color: T.muted, marginTop: "5px" }}>At least 8 characters.</div>
                    </div>
                    {pwField("Confirm New Password", confirmPw, setConfirmPw, showConfirm, setShowConfirm, "Repeat new password")}
                    {pwError && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 14px", background: T.dangerTint, border: `1px solid ${T.danger}`, borderRadius: R.lg, color: T.dangerText, fontSize: TY.sm }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
                        <span>{pwError}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                      <button onClick={() => void changePassword()} disabled={pwBusy} style={{ flex: 1, minWidth: 140, padding: "13px", borderRadius: R.lg, border: "none", background: T.primary, color: T.onPrimary, fontWeight: FW.bold, fontSize: TY.base, cursor: "pointer", minHeight: 48, opacity: pwBusy ? 0.6 : 1 }}>
                        {pwBusy ? "Updating…" : "Update Password"}
                      </button>
                      <button onClick={closePwForm} style={{ padding: "13px 18px", borderRadius: R.lg, border: `1px solid ${T.border}`, background: "transparent", color: T.text, fontWeight: FW.bold, fontSize: TY.base, cursor: "pointer", minHeight: 48 }}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {!showPwForm && (
                <p style={{ margin: "0", padding: "0 18px 16px", fontSize: TY.sm, color: T.sub, lineHeight: 1.55 }}>Use at least 8 characters, and don&apos;t reuse your email password.</p>
              )}
            </Card>

            {/* Logout — the dead Settings card (P1/M11) is gone entirely. */}
            {logoutConfirm ? (
              <div style={{ marginTop: "16px", border: `1px solid ${T.warning}`, background: T.warningTint, borderRadius: R.lg, padding: "12px 14px", fontSize: TY.base, color: T.text, lineHeight: 1.5 }}>
                Log out of Companion on this device? Your plan and progress are saved to your account.
                <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                  <button onClick={() => void logout()} disabled={loggingOut} style={{ padding: "11px 18px", borderRadius: R.pill, border: "none", background: T.danger, color: T.onPrimary, fontWeight: FW.bold, fontSize: TY.sm, cursor: "pointer", minHeight: 44, opacity: loggingOut ? 0.6 : 1 }}>
                    {loggingOut ? "Logging out…" : "Log Out"}
                  </button>
                  <button onClick={() => setLogoutConfirm(false)} style={{ padding: "11px 18px", borderRadius: R.pill, border: `1px solid ${T.border}`, background: "transparent", color: T.text, fontWeight: FW.bold, fontSize: TY.sm, cursor: "pointer", minHeight: 44 }}>
                    Stay logged in
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setLogoutConfirm(true)} style={{
                width: "100%", padding: "15px 18px", borderRadius: R.xl, border: `1.5px solid ${T.danger}`,
                background: T.dangerTint, color: T.dangerText, marginTop: "16px",
                fontWeight: FW.bold, fontSize: TY.base, cursor: "pointer", minHeight: 52,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
                <LogOut size={16} strokeWidth={2} /> Log Out
              </button>
            )}
          </div>
        </div>
      </main>

    </div>
  );
}
