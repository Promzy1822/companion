"use client";
import { useState, useEffect } from "react";
import { palette, TY, LH, FW, SP, R, LAYOUT } from "../lib/design";
import { ChevronRight, X } from "lucide-react";
import { useIsoLayoutEffect } from "../lib/theme";
import {
  WINDOW_LABEL,
  WINDOW_START,
  WINDOW_END,
  daysUntil,
  normalizeExamChoice,
  saveExamChoice,
  type EffectiveExam,
} from "../lib/exam-date";

// Countdown — the slim exam card on Home. Days left + exam date only;
// never a month calendar (the week/month view belongs on Plan).
// The exam is the JAMB 2027 proposed window, 15–25 March 2027 (NOT
// confirmed by JAMB): the card counts down to 15 March, labelled
// "estimated". Tapping the card opens the date sheet: keep the window,
// or pick an exact date from the exam slip. The darkMode prop is kept
// only so older callers still type-check; palette() takes no argument
// (dark-only).

// LH tokens are bare numbers in design.ts; React would read a numeric
// lineHeight as a unitless multiplier, so normalise to px here.
const px = (v: number | string): string => (typeof v === "number" ? `${v}px` : v);

const ORANGE = "#F97316";
const ORANGE_TEXT = "#1F1156";

const pad2 = (n: number): string => String(n).padStart(2, "0");
const localISO = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fmtLong = (iso: string): string =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// Whole days from a to b, parsing "YYYY-MM-DD" as UTC. 0 on NaN.
const daysBetween = (a: string, b: string): number => {
  const ms = Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z");
  if (Number.isNaN(ms)) return 0;
  return Math.round(ms / 86400000);
};
const fmtShort = (iso: string): string =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-NG", { day: "numeric", month: "short" });

interface Props {
  darkMode?: boolean;
}

type SheetMode = "window" | "exact";

export default function CountdownBanner({ darkMode: _darkMode }: Props) {
  const T = palette();
  const [view, setView] = useState<EffectiveExam | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("window");
  const [exactDate, setExactDate] = useState("");
  const [exactError, setExactError] = useState("");

  useIsoLayoutEffect(() => {
    // Adopt the window for pre-wizard accounts (one-time, idempotent),
    // then read the effective date the plan counts from.
    const eff = normalizeExamChoice();
    setView(eff);
    setDays(daysUntil(eff.deadline));
  }, []);

  // Escape closes the sheet.
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  if (view === null || days === null) return null;

  const urgent = days <= 30;
  const estimated = view.estimated;

  const openSheet = () => {
    setSheetMode(view.mode);
    setExactDate(view.mode === "exact" ? view.deadline : "");
    setExactError("");
    setSheetOpen(true);
  };

  const todayISO = localISO(new Date());
  const tomorrowISO = localISO(new Date(Date.now() + 86400000));

  // Where the 15 March window start sits on the runway from today to
  // 25 March (0-100). Exact mode: the exam dot sits at the right end.
  const windowStartPct = estimated
    ? Math.min(
        100,
        Math.max(
          0,
          (daysBetween(todayISO, WINDOW_START) /
            Math.max(1, daysBetween(todayISO, WINDOW_END))) *
            100
        )
      )
    : 100;

  const validateExact = (d: string): string | null => {
    if (!d) return "Pick a date";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return "Pick a valid date";
    if (Number.isNaN(new Date(d + "T00:00:00").getTime())) return "Pick a valid date";
    if (d <= todayISO) return "Pick a future date";
    return null;
  };

  const save = () => {
    if (sheetMode === "exact") {
      const err = validateExact(exactDate);
      if (err) {
        setExactError(err);
        return;
      }
      const eff = saveExamChoice({ mode: "exact", date: exactDate });
      setView(eff);
      setDays(daysUntil(eff.deadline));
    } else {
      const eff = saveExamChoice({ mode: "window" });
      setView(eff);
      setDays(daysUntil(eff.deadline));
    }
    setSheetOpen(false);
  };

  const ghostBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingTop: SP[2],
    paddingBottom: SP[2],
    paddingLeft: SP[5],
    paddingRight: SP[5],
    borderRadius: R.lg,
    border: "1px solid " + T.border,
    background: "transparent",
    color: T.text,
    fontSize: TY.base,
    fontWeight: FW.semibold,
    cursor: "pointer",
  };
  const orangeBtn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: R.lg,
    background: ORANGE,
    color: ORANGE_TEXT,
    fontSize: TY.base,
    fontWeight: FW.bold,
    border: "none",
    cursor: "pointer",
    flex: 1,
  };
  const optionBtn = (selected: boolean): React.CSSProperties => ({
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: SP[4],
    borderRadius: R.xl,
    border: "1px solid " + (selected ? T.primary : T.border),
    background: selected ? T.primaryTint : T.surface,
    cursor: "pointer",
  });
  const radio = (selected: boolean): React.CSSProperties => ({
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "2px solid " + (selected ? T.primary : T.sub),
    background: selected ? T.primary : "transparent",
    boxShadow: selected ? "inset 0 0 0 3px " + T.surface : "none",
    flexShrink: 0,
    marginTop: 2,
  });

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-label="Change exam date"
        style={{
          display: "block",
          width: "100%",
          padding: 0,
          margin: 0,
          border: "none",
          background: "none",
          textAlign: "left",
          cursor: "pointer",
          font: "inherit",
          color: "inherit",
        }}
      >
        <div
          style={{
            padding: SP[4],
            borderRadius: R.xl,
            background: T.surface,
            border: "1px solid " + T.border,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: FW.semibold,
                lineHeight: px(LH.xs),
                color: urgent ? T.dangerText : T.sub,
              }}
            >
              {estimated ? `JAMB 2027 · ${WINDOW_LABEL} (proposed)` : "JAMB 2027"}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: FW.bold,
                padding: "3px 8px",
                borderRadius: R.pill,
                flexShrink: 0,
                background: estimated ? T.warningTint : T.successTint,
                color: estimated ? T.warning : T.successText,
              }}
            >
              {estimated ? "Estimated" : "Exact date"}
            </div>
            <ChevronRight size={18} color={T.sub} />
          </div>
          <div
            style={{
              fontSize: TY.display,
              fontWeight: FW.bold,
              color: T.text,
              lineHeight: 1.1,
              marginTop: 8,
            }}
          >
            {days === 0 ? "Exam day — today" : `${days} day${days === 1 ? "" : "s"} left`}
          </div>
          <div
            style={{
              position: "relative",
              height: 6,
              borderRadius: R.pill,
              background: T.s2,
              marginTop: 12,
            }}
          >
            {estimated && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${windowStartPct}%`,
                  right: 0,
                  borderRadius: R.pill,
                  background: ORANGE,
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: ORANGE,
                border: "2px solid " + T.surface,
                transform: "translate(-1px,-50%)",
              }}
            />
            {!estimated && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: ORANGE,
                  border: "2px solid " + T.surface,
                  transform: "translate(1px,-50%)",
                }}
              />
            )}
          </div>
          <div
            style={{
              position: "relative",
              height: 16,
              marginTop: 6,
              fontSize: 11,
              color: T.muted,
            }}
          >
            <span style={{ position: "absolute", left: 0 }}>Today</span>
            {estimated ? (
              <>
                <span
                  style={{
                    position: "absolute",
                    left: `${windowStartPct}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {fmtShort(WINDOW_START)}
                </span>
                <span style={{ position: "absolute", right: 0 }}>{fmtShort(WINDOW_END)}</span>
              </>
            ) : (
              <span style={{ position: "absolute", right: 0 }}>{fmtLong(view.deadline)}</span>
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              color: T.sub,
              marginTop: 8,
              lineHeight: px(LH.xs),
            }}
          >
            {estimated
              ? `Countdown to 15 March — estimated`
              : `Exam date: ${fmtLong(view.deadline)}`}
          </div>
        </div>
      </button>

      {sheetOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: LAYOUT.z.modal,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: LAYOUT.z.scrim,
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Exam date"
            style={{
              position: "relative",
              zIndex: LAYOUT.z.modal,
              width: "100%",
              maxWidth: 420,
              background: T.surface,
              border: "1px solid " + T.border,
              borderBottom: "none",
              borderRadius: R.xxl + " " + R.xxl + " 0 0",
              padding: SP[5],
              paddingBottom: SP[6],
              boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: SP[3],
              }}
            >
              <div style={{ fontSize: TY.lg, fontWeight: FW.bold, color: T.text }}>
                Exam date
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: R.pill,
                  border: "1px solid " + T.border,
                  background: "transparent",
                  color: T.sub,
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div
              style={{
                fontSize: TY.sm,
                color: T.sub,
                marginTop: SP[2],
                lineHeight: px(LH.sm),
              }}
            >
              JAMB proposed {WINDOW_LABEL} for the 2027 UTME. Your plan counts
              down to {fmtLong(WINDOW_START)} so you&apos;re ready for the
              earliest day.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: SP[3], marginTop: SP[4] }}>
              <button type="button" onClick={() => setSheetMode("window")} style={optionBtn(sheetMode === "window")}>
                <div style={{ display: "flex", gap: SP[3] }}>
                  <div style={radio(sheetMode === "window")} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: TY.base, fontWeight: FW.bold, color: T.text }}>
                      Use the proposed window
                    </div>
                    <div style={{ fontSize: TY.xs, color: T.sub, marginTop: 2, lineHeight: px(LH.xs) }}>
                      JAMB 2027 · {WINDOW_LABEL} (proposed) — countdown to 15 March (estimated)
                    </div>
                  </div>
                </div>
              </button>

              <button type="button" onClick={() => setSheetMode("exact")} style={optionBtn(sheetMode === "exact")}>
                <div style={{ display: "flex", gap: SP[3] }}>
                  <div style={radio(sheetMode === "exact")} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: TY.base, fontWeight: FW.bold, color: T.text }}>
                      I know my exact date
                    </div>
                    <div style={{ fontSize: TY.xs, color: T.sub, marginTop: 2, lineHeight: px(LH.xs) }}>
                      Pick the date on your exam slip
                    </div>
                    {sheetMode === "exact" && (
                      <input
                        type="date"
                        min={tomorrowISO}
                        value={exactDate}
                        onChange={(e) => {
                          setExactDate(e.target.value);
                          setExactError("");
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: "100%",
                          minHeight: 44,
                          marginTop: SP[3],
                          padding: "0 12px",
                          borderRadius: R.lg,
                          border: "1px solid " + T.border,
                          background: T.s2,
                          color: T.text,
                          fontSize: TY.base,
                          fontFamily: "inherit",
                          colorScheme: "dark",
                        }}
                      />
                    )}
                    {sheetMode === "exact" && exactError && (
                      <div style={{ fontSize: TY.xs, color: T.dangerText, marginTop: 6 }}>
                        {exactError}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>

            <div
              style={{
                fontSize: TY.xs,
                color: T.muted,
                marginTop: SP[4],
                lineHeight: px(LH.xs),
              }}
            >
              When JAMB confirms the dates, or you print your slip, come back
              here to update it.
            </div>

            <div style={{ display: "flex", gap: SP[2], marginTop: SP[4] }}>
              <button type="button" onClick={() => setSheetOpen(false)} style={{ ...ghostBtn, flex: 1 }}>
                Cancel
              </button>
              <button type="button" onClick={save} style={orangeBtn}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
