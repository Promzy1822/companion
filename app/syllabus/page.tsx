"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, BookOpen, CheckCircle } from "lucide-react";
import BottomNav, { BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { palette, C } from "../lib/design";
import { JAMB_SYLLABUS, type SyllabusTopic } from "../lib/syllabus";

const SUBJECT_ICONS: Record<string, string> = {
  english:"📝", mathematics:"📐", physics:"⚛️",
  chemistry:"🧪", biology:"🌿", government:"🏛️",
  economics:"📊", geography:"🌍", crs:"✝️", irs:"☪️",
};

function SyllabusContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const initSubject  = searchParams.get("subject") || "mathematics";

  const [dark,          setDark]          = useState(false);
  const [activeSubject, setActiveSubject] = useState(initSubject);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [studied,       setStudied]       = useState<Set<string>>(new Set());

  useEffect(() => {
    setDark(localStorage.getItem("darkMode") === "true");
    try {
      const saved = JSON.parse(localStorage.getItem("companion_syllabus_progress") || "[]");
      setStudied(new Set(saved));
    } catch {}
  }, []);

  const toggleStudied = (id: string) => {
    setStudied(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("companion_syllabus_progress", JSON.stringify([...next]));
      return next;
    });
  };

  const T          = palette(dark);
  const syllabus   = JAMB_SYLLABUS[activeSubject];
  const topics     = syllabus?.topics ?? [];
  const doneCount  = topics.filter(t => studied.has(t.id)).length;
  const pct        = topics.length ? Math.round((doneCount / topics.length) * 100) : 0;

  return (
    <div style={{
      minHeight:"100vh", background:T.bg,
      fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
      paddingBottom: BOTTOM_NAV_HEIGHT + 16,
    }}>
      {/* Header */}
      <div style={{ background:C.primary, padding:"16px 20px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
          <button onClick={()=>router.back()} style={{ width:34, height:34, borderRadius:"10px", background:"rgba(255,255,255,0.15)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ArrowLeft size={17} color="#fff" strokeWidth={2} />
          </button>
          <div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:"17px" }}>JAMB Syllabus</div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:"12px" }}>Official 2025 edition</div>
          </div>
        </div>
        {/* Subject tabs */}
        <div style={{ display:"flex", gap:"6px", overflowX:"auto", scrollbarWidth:"none", paddingBottom:"2px" }}>
          {Object.entries(JAMB_SYLLABUS).map(([key, s]) => (
            <button key={key} onClick={()=>{ setActiveSubject(key); setExpandedTopic(null); }} style={{
              flexShrink:0, padding:"7px 14px", borderRadius:"50px", border:"none",
              cursor:"pointer", fontSize:"12px", fontWeight:700,
              background: activeSubject===key ? "#fff" : "rgba(255,255,255,0.15)",
              color: activeSubject===key ? C.primary : "rgba(255,255,255,0.85)",
              transition:"all 0.2s",
            }}>
              {SUBJECT_ICONS[key] || "📖"} {s.display_name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"16px 14px" }}>
        {/* Progress bar */}
        <div style={{ background:T.surface, borderRadius:"14px", padding:"16px", marginBottom:"14px", border:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
            <span style={{ fontWeight:700, fontSize:"14px", color:T.text }}>{syllabus?.display_name}</span>
            <span style={{ fontSize:"13px", color:pct===100?"#31A24C":C.primary, fontWeight:700 }}>{doneCount}/{topics.length} topics</span>
          </div>
          <div style={{ height:"7px", borderRadius:"4px", background:T.s2, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:pct===100?"#31A24C":C.primary, transition:"width 0.4s" }}/>
          </div>
          <div style={{ fontSize:"11px", color:T.sub, marginTop:"6px" }}>
            {pct === 0 && "Tap ✓ on each topic when you've studied it"}
            {pct > 0 && pct < 100 && `${pct}% complete — keep going!`}
            {pct === 100 && "✅ All topics covered! Review regularly."}
          </div>
        </div>

        {/* Topic list */}
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {topics.map((topic: SyllabusTopic, idx: number) => {
            const isExpanded = expandedTopic === topic.id;
            const isDone     = studied.has(topic.id);
            return (
              <div key={topic.id} style={{
                background:T.surface, borderRadius:"14px",
                border:`1.5px solid ${isDone?"#31A24C44":T.border}`,
                overflow:"hidden", transition:"border-color 0.2s",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"14px 16px", cursor:"pointer" }}
                  onClick={()=>setExpandedTopic(isExpanded ? null : topic.id)}>
                  <div style={{
                    width:28, height:28, borderRadius:"8px", flexShrink:0,
                    background: isDone ? "#31A24C15" : C.primaryLight,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"12px", fontWeight:800, color: isDone?"#31A24C":C.primary,
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:"14px", color:T.text }}>{topic.topic}</div>
                    <div style={{ fontSize:"11px", color:T.sub, marginTop:"2px" }}>
                      {topic.subtopics.length} subtopics
                    </div>
                  </div>
                  <button onClick={e=>{ e.stopPropagation(); toggleStudied(topic.id); }} style={{
                    width:32, height:32, borderRadius:"50%", border:"none",
                    background: isDone?"#31A24C":"transparent",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                    flexShrink:0,
                    boxShadow: isDone?"0 2px 8px rgba(49,162,76,0.3)":"none",
                    border: isDone?"none":`1.5px solid ${T.border}`,
                  }}>
                    <CheckCircle size={16} color={isDone?"#fff":T.muted} strokeWidth={isDone?2.5:1.5} />
                  </button>
                  {isExpanded
                    ? <ChevronDown size={16} color={T.sub} strokeWidth={2}/>
                    : <ChevronRight size={16} color={T.sub} strokeWidth={2}/>
                  }
                </div>

                {isExpanded && (
                  <div style={{ borderTop:`1px solid ${T.border}`, padding:"12px 16px 16px" }}>
                    <div style={{ fontSize:"11px", color:T.sub, fontWeight:700, marginBottom:"10px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
                      Subtopics (JAMB scope)
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                      {topic.subtopics.map((sub, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"8px" }}>
                          <div style={{ width:5, height:5, borderRadius:"50%", background:C.primary, marginTop:"6px", flexShrink:0 }}/>
                          <span style={{ fontSize:"13px", color:T.text, lineHeight:1.5 }}>{sub}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:"8px", marginTop:"14px" }}>
                      <Link href={`/ai?prompt=Teach me ${topic.topic} for JAMB ${syllabus?.display_name}`}
                        style={{ flex:1, padding:"10px", borderRadius:"10px", background:C.primaryLight, border:`1px solid ${C.primary}33`, textAlign:"center", textDecoration:"none", fontSize:"12px", fontWeight:700, color:C.primary }}>
                        🤖 Study with AI
                      </Link>
                      <Link href={`/questions?subject=${activeSubject}&topic=${encodeURIComponent(topic.topic)}`}
                        style={{ flex:1, padding:"10px", borderRadius:"10px", background:T.s2, border:`1px solid ${T.border}`, textAlign:"center", textDecoration:"none", fontSize:"12px", fontWeight:700, color:T.text }}>
                        ✏️ Practice
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Source note */}
        <div style={{ marginTop:"16px", padding:"12px 14px", borderRadius:"12px", background:T.s2, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:"11px", color:T.sub, lineHeight:1.6 }}>
            📋 <strong style={{ color:T.text }}>Official Source:</strong> JAMB UTME Syllabus 2025. All lessons, questions, and study plans in Companion are aligned to this syllabus. Topics marked ✓ are tracked only on this device.
          </div>
        </div>
      </div>

      <BottomNav darkMode={dark} />
    </div>
  );
}

export default function SyllabusPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"#F0F2F5" }}/>}>
      <SyllabusContent />
    </Suspense>
  );
}
