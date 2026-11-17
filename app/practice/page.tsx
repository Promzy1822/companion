"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Library, Timer, Target, ChevronRight, Trophy, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { palette, LAYOUT } from "../lib/design";
import { NAVBAR_HEIGHT } from "../components/NavbarView";
import { BOTTOM_NAV_HEIGHT } from "../components/BottomNavView";

const SUBJECTS = [
  { id: "english",     label: "English Language",      count: 773 },
  { id: "mathematics", label: "Mathematics",           count: 465 },
  { id: "physics",     label: "Physics",               count: 406 },
  { id: "chemistry",   label: "Chemistry",             count: 727 },
  { id: "biology",     label: "Biology",               count: 424 },
  { id: "government",  label: "Government",            count: 430 },
  { id: "economics",   label: "Economics",             count: 420 },
  { id: "literature",  label: "Literature in English", count: 415 },
];
const TOTAL = SUBJECTS.reduce((a, s) => a + s.count, 0);

const CARDS = [
  {
    icon: Library, href: "/questions", title: "Past Questions",
    sub: `${TOTAL.toLocaleString()} past questions across 8 subjects`,
    featured: false,
  },
  {
    icon: Timer, href: "/mock", title: "Mock Exam",
    sub: "180 questions · 2 hours · scored /400",
    featured: true,
  },
  {
    icon: Target, href: "/drill", title: "Quick Drills",
    sub: "5-minute drills by topic",
    featured: false,
  },
];

// "12 Nov 2026" (en-GB: day numeric, month short, year numeric);
// falls back to the raw string when the stored date does not parse.
const fmtDate = (raw: string): string => {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default function PracticeHub() {
  const T = palette();
  const [history, setHistory] = useState<{ score: number; total: number; jambEquivalent: number; date: string }[]>([]);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem("mock_history") || "[]")); } catch {}
  }, []);

  // Score Calculator — lifted from Home (app/page.tsx). Same formula and
  // inputs; H4 fixes: no gold tile, unit + breakdown always shown, the
  // undisclosed grade word replaced with an interpretation line.
  const [showCalc, setShowCalc] = useState(false);
  const [calcType, setCalcType] = useState<"jamb"|"aggregate">("aggregate");
  const [jambS,    setJambS]    = useState("");
  const [postS,    setPostS]    = useState("");
  const [result,   setResult]   = useState<{agg:number;jamb:number;post:number;note:string;color:string}|null>(null);
  const [calcErr,  setCalcErr]  = useState("");
  // M12: per-field errors, validated on change/blur (not only on Calculate).
  const [jambErr,  setJambErr]  = useState("");
  const [postErr,  setPostErr]  = useState("");

  // One-line interpretation of the score, with its thresholds stated next
  // to it (replaces the old Excellent/Good/Average/Below average grade,
  // whose 70/55/45 cutoffs were never disclosed).
  const calcNote = (type: "jamb" | "aggregate", agg: number, jamb: number): string => {
    if (type === "aggregate") {
      if (agg >= 70) return "Competitive for most federal universities (70+)";
      if (agg >= 55) return "Competitive for many state universities (55–69)";
      if (agg >= 45) return "Meets the minimum for most universities (45–54)";
      return "Below the minimum for most universities (under 45)";
    }
    if (jamb >= 300) return "Competitive for most federal universities (300+)";
    if (jamb >= 250) return "Competitive for many state universities (250–299)";
    if (jamb >= 200) return "Meets the minimum for most universities (200–249)";
    return "Below the minimum for most universities (under 200)";
  };

  // Per-field validation (M12) — same copy as the submit validation.
  const jambFieldErr = (v: string): string => {
    if (v.trim() === "") return "Enter valid JAMB score (0-400)";
    const n = parseFloat(v);
    if (isNaN(n) || n < 0 || n > 400) return "Enter valid JAMB score (0-400)";
    return "";
  };
  const postFieldErr = (v: string): string => {
    if (v.trim() === "") return "Enter valid Post-UTME score (0-100)";
    const n = parseFloat(v);
    if (isNaN(n) || n < 0 || n > 100) return "Enter valid Post-UTME score (0-100)";
    return "";
  };

  // L7: short grade label reusing the disclosed bands (see the "Bands:"
  // line above the inputs) — e.g. "72% — Competitive".
  const calcGrade = (type: "jamb" | "aggregate", agg: number, jamb: number): string => {
    if (type === "aggregate") {
      if (agg >= 70) return "Competitive";
      if (agg >= 55) return "Many state universities";
      if (agg >= 45) return "Minimum";
      return "Below minimum";
    }
    if (jamb >= 300) return "Competitive";
    if (jamb >= 250) return "Many state universities";
    if (jamb >= 200) return "Minimum";
    return "Below minimum";
  };

  const calcAggregate = () => {
    setCalcErr(""); setResult(null);
    setJambErr(jambFieldErr(jambS));
    setPostErr(calcType === "aggregate" ? postFieldErr(postS) : "");
    const j = parseFloat(jambS), p = parseFloat(postS);
    if (isNaN(j)||j<0||j>400) { setCalcErr("Enter valid JAMB score (0-400)"); return; }
    if (calcType==="aggregate") {
      if (isNaN(p)||p<0||p>100) { setCalcErr("Enter valid Post-UTME score (0-100)"); return; }
      const jP=j/8, pP=p/2, agg=jP+pP;
      const color=agg>=70?T.successText:agg>=55?T.primaryText:agg>=45?T.warning:T.dangerText;
      setResult({agg:+agg.toFixed(2),jamb:+jP.toFixed(2),post:+pP.toFixed(2),note:calcNote("aggregate",agg,j),color});
    } else {
      const sc=(j/400)*100;
      const color=j>=300?T.successText:j>=250?T.primaryText:j>=200?T.warning:T.dangerText;
      setResult({agg:+sc.toFixed(1),jamb:j,post:0,note:calcNote("jamb",sc,j),color});
    }
  };

  const inp: React.CSSProperties = {
    width:"100%", padding:"12px 14px", borderRadius:"10px",
    border:"1.5px solid "+T.border, fontSize:"14px", outline:"none",
    background:T.s2, color:T.text, boxSizing:"border-box", fontFamily:"inherit",
    transition:"border-color 0.15s",
  };

  return (
    <div style={{ minHeight: "100vh", paddingTop: NAVBAR_HEIGHT, background: T.bg, fontFamily: "var(--font)" }}>
      {/* §0.5(10): laptop side padding is 24px like Home (20px below laptop).
          Same class + media-query pattern as .mock-page-pad / .lesson-page-pad
          in globals.css, housed here because globals.css is out of scope. */}
      <style>{`@media (min-width: 1024px) { .practice-page-pad { padding-left: 24px !important; padding-right: 24px !important; } }`}</style>
      <div className="practice-page-pad" style={{ padding: `20px 20px calc(${BOTTOM_NAV_HEIGHT}px + 16px)` }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: T.text, margin: "0 0 20px", letterSpacing: "-0.5px" }}>Practice</h1>

        <div className="practice-modes" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {CARDS.map(card => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href} className="practice-mode-card" style={{ display: "flex", alignItems: "center", gap: "14px", background: T.surface, border: `1px solid ${T.border}`, ...(card.featured ? { borderLeft: `4px solid ${T.accent}` } : {}), borderRadius: "16px", padding: "16px", textDecoration: "none", minHeight: "44px" }}>
                <span style={{ width: 44, height: 44, borderRadius: "12px", background: card.featured ? T.accentTint : T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={22} color={card.featured ? T.accent : T.primary} strokeWidth={1.8} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: card.featured ? "16px" : "15px", fontWeight: 700, color: T.text }}>{card.title}</span>
                  <span style={{ display: "block", fontSize: "12px", color: T.sub, marginTop: "2px", lineHeight: 1.45 }}>{card.sub}</span>
                </span>
                <ChevronRight size={18} color={T.muted} className="practice-mode-chevron" style={{ flexShrink: 0 }} />
              </Link>
            );
          })}
        </div>

        {/* Score Calculator — moved from Home; same tool, same formula */}
        <div style={{
          background:T.surface, borderRadius:"16px",
          border:"1px solid "+T.border,
          marginBottom:"24px", overflow:"hidden",
        }}>
          <button onClick={()=>setShowCalc(v=>!v)} style={{
            width:"100%", padding:"16px 18px", border:"none", background:"transparent",
            display:"flex", alignItems:"center", gap:"12px", cursor:"pointer", minHeight:"44px",
          }}>
            <div style={{ width:44, height:44, borderRadius:"12px", background:T.primaryTint, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Calculator size={20} color={T.primary} strokeWidth={1.8} />
            </div>
            <div style={{ flex:1, textAlign:"left" }}>
              <div style={{ fontWeight:700, color:T.text, fontSize:"15px" }}>Score Calculator</div>
              <div style={{ fontSize:"12px", color:T.sub }}>See what your JAMB score is worth</div>
            </div>
            {showCalc ? <ChevronUp size={18} color={T.sub} /> : <ChevronDown size={18} color={T.sub} />}
          </button>

          {showCalc && (
            <div style={{ padding:"0 18px 20px", borderTop:"1px solid "+T.border }}>
              <div style={{ display:"flex", gap:"8px", margin:"16px 0 14px" }}>
                {(["aggregate","jamb"] as const).map(t=>(
                  <button key={t} onClick={()=>{setCalcType(t);setResult(null);setJambErr("");setPostErr("");}} style={{
                    flex:1, padding:"9px", borderRadius:"10px", border:"none",
                    background: calcType===t ? T.primary : T.s2,
                    color: calcType===t ? "#fff" : T.sub,
                    fontWeight:700, fontSize:"13px", cursor:"pointer", minHeight:"44px",
                  }}>
                    {t==="aggregate" ? "Aggregate" : "JAMB Only"}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: "12px", color: T.sub, marginBottom: "14px" }}>
                {calcType === "aggregate"
                  ? "Bands: 70+ competitive · 55–69 many state universities · 45–54 minimum · under 45 below minimum"
                  : "Bands: 300+ competitive · 250–299 many state universities · 200–249 minimum · under 200 below minimum"}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                <div>
                  <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>JAMB Score (0-400)</label>
                  <input style={{ ...inp, border: "1.5px solid " + (jambErr ? T.dangerText : T.border) }} type="number" placeholder="e.g. 280" value={jambS} onChange={e=>{setJambS(e.target.value);setJambErr(jambFieldErr(e.target.value));}} onBlur={e=>setJambErr(jambFieldErr(e.target.value))} />
                  {jambErr && <div style={{ fontSize:"12px", color:T.dangerText, marginTop:"5px" }}>{jambErr}</div>}
                </div>
                {calcType==="aggregate" && (
                  <div>
                    <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>Post-UTME Score (0-100)</label>
                    <input style={{ ...inp, border: "1.5px solid " + (postErr ? T.dangerText : T.border) }} type="number" placeholder="e.g. 65" value={postS} onChange={e=>{setPostS(e.target.value);setPostErr(postFieldErr(e.target.value));}} onBlur={e=>setPostErr(postFieldErr(e.target.value))} />
                    {postErr && <div style={{ fontSize:"12px", color:T.dangerText, marginTop:"5px" }}>{postErr}</div>}
                    <div style={{ fontSize:"11px", color:T.muted, marginTop:"5px" }}>Formula: (JAMB / 8) + (Post-UTME / 2)</div>
                  </div>
                )}
              </div>
              {calcErr && <div style={{ color:T.dangerText, fontSize:"13px", marginTop:"10px" }}>{calcErr}</div>}
              <button onClick={calcAggregate} style={{
                width:"100%", marginTop:"14px", padding:"13px", borderRadius:"10px", border:"none",
                background:T.primary, color:"#fff", fontWeight:700, fontSize:"14px", cursor:"pointer", minHeight:"44px",
              }}>
                Calculate
              </button>
              {result && (
                <div style={{
                  padding:"16px", borderRadius:"12px", marginTop:"12px",
                  background: T.s2,
                  border:"1.5px solid "+result.color+"33",
                }}>
                  <div style={{ textAlign:"center", marginBottom:"12px" }}>
                    <div style={{ fontSize:"40px", fontWeight:900, color:result.color, letterSpacing:"-1px" }}>{calcType==="aggregate" ? result.agg+" / 100" : result.agg+"%"}</div>
                    <div style={{ fontSize:"13px", color:result.color, fontWeight:700, marginTop:"3px" }}>{result.note}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                    {(calcType==="aggregate" ? [
                      {label:"JAMB contribution",      val:jambS+" / 8 = "+result.jamb},
                      {label:"Post-UTME contribution",  val:postS+" / 2 = "+result.post},
                      {label:"Total Aggregate",         val:result.agg+"/100"},
                    ] : [
                      {label:"JAMB score", val:jambS+" / 400"},
                      {label:"Percentage", val:result.agg+"%"},
                    ]).map((r,i,arr)=>(
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", padding:"7px 0", borderBottom:i<arr.length-1?"1px solid "+T.border:"none" }}>
                        <span style={{ color:T.sub }}>{r.label}</span>
                        <span style={{ color:T.text, fontWeight:700 }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop:"1px solid "+T.border, marginTop:"12px", paddingTop:"12px" }}>
                    <div style={{ fontSize:"13px", color:T.text, fontWeight:700 }}>
                      {result.agg}% — {calcGrade(calcType, result.agg, parseFloat(jambS))}
                    </div>
                    <Link href="/studyplan" style={{ display:"block", fontSize:"13px", color:T.primaryText, fontWeight:700, textDecoration:"none", marginTop:"6px" }}>
                      See what {calcType==="aggregate" ? result.agg+" / 100" : result.agg+"%"} means for your target — open your plan
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "16px", overflow: "hidden", maxWidth: LAYOUT.pageNarrow }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
            <Trophy size={16} color={T.primary} strokeWidth={1.8} />
            <span style={{ fontWeight: 700, color: T.text, fontSize: "14px" }}>Recent mock results</span>
          </div>
          <div style={{ padding: "10px 18px 0", fontSize: "12px", color: T.sub }}>250+ competitive</div>
          {history.length > 0 ? (
            <>
              {history.slice(0, 3).map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: i < Math.min(2, history.length - 1) ? `1px solid ${T.border}` : "none" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: T.text }}>{h.score}/{h.total} correct</div>
                    <div style={{ fontSize: "12px", color: T.sub }}>{fmtDate(h.date)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: h.jambEquivalent >= 250 ? T.successText : h.jambEquivalent >= 200 ? T.warning : T.dangerText, letterSpacing: "-1px" }}>{h.jambEquivalent}</div>
                    <div style={{ fontSize: "12px", color: T.sub }}>JAMB score</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.border}` }}>
                <Link href="/mock" style={{ fontSize: "13px", fontWeight: 700, color: T.primaryText, textDecoration: "none" }}>See all results</Link>
              </div>
            </>
          ) : (
            <div style={{ padding: "18px" }}>
              <div style={{ fontSize: "13px", color: T.sub }}>No mocks yet — take your first mock</div>
              <Link href="/mock" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "12px", padding: "12px 16px", borderRadius: "10px", background: T.accent, color: "#1F1156", fontWeight: 700, fontSize: "14px", textDecoration: "none", minHeight: "44px", boxSizing: "border-box" }}>Take your first mock</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
