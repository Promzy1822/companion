"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ClipboardList, Zap, ChevronRight, Trophy, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { palette } from "../lib/design";
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
    icon: BookOpen, href: "/questions", title: "Past Questions",
    sub: `${TOTAL.toLocaleString()} real past questions · 8 subjects`,
  },
  {
    icon: ClipboardList, href: "/mock", title: "Mock Exam",
    sub: "The full JAMB paper: 180 questions in subject sections · 2 hours · scored out of 400",
  },
  {
    icon: Zap, href: "/drill", title: "Quick Drills",
    sub: "Short scored drills by topic — drill a topic right after you study it",
  },
];

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

  const calcAggregate = () => {
    setCalcErr(""); setResult(null);
    const j = parseFloat(jambS), p = parseFloat(postS);
    if (isNaN(j)||j<0||j>400) { setCalcErr("Enter valid JAMB score (0-400)"); return; }
    if (calcType==="aggregate") {
      if (isNaN(p)||p<0||p>100) { setCalcErr("Enter valid Post-UTME score (0-100)"); return; }
      const jP=j/8, pP=p/2, agg=jP+pP;
      const color=agg>=70?"#2FBF71":agg>=55?"#A5B4FC":agg>=45?"#F7B928":"#FF6B5E";
      setResult({agg:+agg.toFixed(2),jamb:+jP.toFixed(2),post:+pP.toFixed(2),note:calcNote("aggregate",agg,j),color});
    } else {
      const sc=(j/400)*100;
      const color=j>=300?"#2FBF71":j>=250?"#A5B4FC":j>=200?"#F7B928":"#FF6B5E";
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
      <div style={{ padding: `20px 20px calc(${BOTTOM_NAV_HEIGHT}px + 16px)` }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: T.text, margin: "0 0 4px", letterSpacing: "-0.5px" }}>Practice</h1>
        <p style={{ fontSize: "13px", color: T.sub, margin: "0 0 20px" }}>Real JAMB questions, timed mocks and quick drills.</p>

        <div className="practice-modes" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {CARDS.map(card => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href} style={{ display: "flex", alignItems: "center", gap: "14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", textDecoration: "none", minHeight: "44px" }}>
                <span style={{ width: 44, height: 44, borderRadius: "12px", background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={22} color={T.primary} strokeWidth={1.8} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "15px", fontWeight: 700, color: T.text }}>{card.title}</span>
                  <span style={{ display: "block", fontSize: "12px", color: T.sub, marginTop: "2px", lineHeight: 1.45 }}>{card.sub}</span>
                </span>
                <ChevronRight size={18} color={T.muted} style={{ flexShrink: 0 }} />
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
                  <button key={t} onClick={()=>{setCalcType(t);setResult(null);}} style={{
                    flex:1, padding:"9px", borderRadius:"10px", border:"none",
                    background: calcType===t ? T.primary : T.s2,
                    color: calcType===t ? "#fff" : T.sub,
                    fontWeight:700, fontSize:"13px", cursor:"pointer", minHeight:"44px",
                  }}>
                    {t==="aggregate" ? "Aggregate" : "JAMB Only"}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                <div>
                  <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>JAMB Score (0-400)</label>
                  <input style={inp} type="number" placeholder="e.g. 280" value={jambS} onChange={e=>setJambS(e.target.value)} />
                </div>
                {calcType==="aggregate" && (
                  <div>
                    <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>Post-UTME Score (0-100)</label>
                    <input style={inp} type="number" placeholder="e.g. 65" value={postS} onChange={e=>setPostS(e.target.value)} />
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
                </div>
              )}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
              <Trophy size={16} color={T.primary} strokeWidth={1.8} />
              <span style={{ fontWeight: 700, color: T.text, fontSize: "14px" }}>Recent mock results</span>
            </div>
            {history.slice(0, 3).map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: i < Math.min(2, history.length - 1) ? `1px solid ${T.border}` : "none" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: T.text }}>{h.score}/{h.total} correct</div>
                  <div style={{ fontSize: "11px", color: T.sub }}>{h.date}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: h.jambEquivalent >= 250 ? "#2FBF71" : h.jambEquivalent >= 200 ? "#F7B928" : "#FF6B5E", letterSpacing: "-1px" }}>{h.jambEquivalent}</div>
                  <div style={{ fontSize: "10px", color: T.sub }}>JAMB equiv.</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
