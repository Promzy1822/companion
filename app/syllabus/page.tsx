"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ChevronDown, ChevronRight,
  CheckCircle, Search, BookOpen, Target, Link2,
} from "lucide-react";
import BottomNav, { BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { palette, C } from "../lib/design";
import { JAMB_SYLLABUS, SYLLABUS_STATS, searchSyllabus } from "../lib/syllabus";

const ICONS: Record<string, string> = {
  english:"📝", physics:"⚛️", mathematics:"📐",
  chemistry:"🧪", biology:"🌿", government:"🏛️",
  economics:"📊", geography:"🌍", literature:"📖", crs:"✝️",
};

function SyllabusContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const initSubject  = searchParams.get("subject") || "mathematics";

  const [dark,          setDark]          = useState(false);
  const [activeSubject, setActiveSubject] = useState(initSubject);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [studied,       setStudied]       = useState<Set<string>>(new Set());
  const [view,          setView]          = useState<"topics"|"search">("topics");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchSyllabus>>([]);

  useEffect(() => {
    setDark(localStorage.getItem("darkMode") === "true");
    try {
      const saved = JSON.parse(localStorage.getItem("companion_syllabus_progress") || "[]");
      setStudied(new Set(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      setSearchResults(searchSyllabus(searchQuery));
      setView("search");
    } else if (searchQuery.length === 0) {
      setView("topics");
      setSearchResults([]);
    }
  }, [searchQuery]);

  const toggleStudied = (id: string) => {
    setStudied(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("companion_syllabus_progress", JSON.stringify([...next]));
      return next;
    });
  };

  const T        = palette(dark);
  const syllabus = JAMB_SYLLABUS[activeSubject];
  const topics   = syllabus?.topics ?? [];
  const done     = topics.filter(t => studied.has(t.id)).length;
  const pct      = topics.length ? Math.round((done / topics.length) * 100) : 0;

  // Overall progress
  const allTopicIds  = Object.values(JAMB_SYLLABUS).flatMap(s => s.topics.map(t => t.id));
  const totalDone    = allTopicIds.filter(id => studied.has(id)).length;
  const overallPct   = Math.round((totalDone / allTopicIds.length) * 100);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif", paddingBottom:BOTTOM_NAV_HEIGHT+16 }}>

      {/* Header */}
      <div style={{ background:C.primary, padding:"16px 20px 0" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <button onClick={()=>router.back()} style={{ width:34, height:34, borderRadius:10, background:"rgba(255,255,255,0.15)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ArrowLeft size={17} color="#fff" strokeWidth={2} />
          </button>
          <div style={{ flex:1 }}>
            <div style={{ color:"#fff", fontWeight:800, fontSize:17 }}>JAMB Syllabus</div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11 }}>
              {SYLLABUS_STATS.totalTopics} topics · {SYLLABUS_STATS.totalSubtopics} subtopics · Official 2025 edition
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:"#FFF8DB", fontWeight:900, fontSize:20, lineHeight:1 }}>{overallPct}%</div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:10 }}>overall</div>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ position:"relative", marginBottom:14 }}>
          <Search size={15} color="#8A8D91" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search any topic, subtopic or concept…"
            style={{
              width:"100%", padding:"10px 12px 10px 36px",
              borderRadius:10, border:"none", outline:"none",
              fontSize:13, background:"rgba(255,255,255,0.95)",
              color:"#050505", boxSizing:"border-box",
            }}
          />
        </div>

        {/* Subject tabs */}
        {view === "topics" && (
          <div style={{ display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none", paddingBottom:1 }}>
            {Object.entries(JAMB_SYLLABUS).map(([key, s]) => {
              const subDone = s.topics.filter(t => studied.has(t.id)).length;
              const subPct  = Math.round((subDone / s.topics.length) * 100);
              return (
                <button key={key} onClick={()=>{ setActiveSubject(key); setExpandedTopic(null); }} style={{
                  flexShrink:0, padding:"7px 14px", borderRadius:"10px 10px 0 0", border:"none",
                  cursor:"pointer", fontSize:12, fontWeight:700,
                  background: activeSubject===key ? T.bg : "rgba(255,255,255,0.12)",
                  color: activeSubject===key ? C.primary : "rgba(255,255,255,0.85)",
                  transition:"all 0.2s", position:"relative",
                }}>
                  {ICONS[key] || "📖"} {s.display_name.split(" ")[0]}
                  {subPct > 0 && (
                    <span style={{ marginLeft:4, fontSize:10, color:activeSubject===key?C.primary:"rgba(255,255,255,0.7)" }}>
                      {subPct}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding:"14px 14px 0" }}>

        {/* Search results */}
        {view === "search" && (
          <div>
            <div style={{ fontSize:13, color:T.sub, marginBottom:12 }}>
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
            </div>
            {searchResults.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:T.muted, fontSize:13 }}>
                No topics found. Try a different keyword.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {searchResults.map((r, i) => (
                  <button key={i} onClick={()=>{ setSearchQuery(""); setActiveSubject(r.subjectKey); setExpandedTopic(r.topic.id); setView("topics"); }} style={{
                    background:T.surface, borderRadius:12, padding:"12px 14px",
                    border:`1px solid ${T.border}`, textAlign:"left", cursor:"pointer",
                    display:"block", width:"100%",
                  }}>
                    <div style={{ fontSize:11, color:C.primary, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.5px" }}>
                      {r.subject.display_name} · {r.matchedIn}
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{r.topic.topic}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Topic browser */}
        {view === "topics" && syllabus && (
          <div>
            {/* Subject progress */}
            <div style={{ background:T.surface, borderRadius:14, padding:16, marginBottom:14, border:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontWeight:700, fontSize:14, color:T.text }}>{syllabus.display_name}</span>
                <span style={{ fontSize:13, color:pct===100?"#31A24C":C.primary, fontWeight:700 }}>{done}/{topics.length} done</span>
              </div>
              <div style={{ height:6, borderRadius:3, background:T.s2, overflow:"hidden", marginBottom:6 }}>
                <div style={{ height:"100%", width:`${pct}%`, background:pct===100?"#31A24C":C.primary, transition:"width 0.4s" }}/>
              </div>
              <div style={{ fontSize:11, color:T.sub }}>
                {pct===0 && "Tap ✓ on each topic when studied"}
                {pct>0&&pct<100 && `${pct}% — ${topics.length-done} topics remaining`}
                {pct===100 && "✅ All topics covered! Keep reviewing."}
              </div>
              {syllabus.general_objectives && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:11, color:T.sub, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>General Objectives</div>
                  {syllabus.general_objectives.map((obj, i) => (
                    <div key={i} style={{ display:"flex", gap:6, fontSize:12, color:T.sub, marginBottom:4, lineHeight:1.4 }}>
                      <span style={{ color:C.primary, flexShrink:0 }}>•</span>
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Topic list */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {topics.map((topic, idx) => {
                const isExpanded = expandedTopic === topic.id;
                const isDone     = studied.has(topic.id);

                return (
                  <div key={topic.id} style={{
                    background:T.surface, borderRadius:14,
                    border:`1.5px solid ${isDone?"#31A24C44":T.border}`,
                    overflow:"hidden", transition:"border-color 0.2s",
                  }}>
                    {/* Topic header */}
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 14px", cursor:"pointer" }}
                      onClick={()=>setExpandedTopic(isExpanded ? null : topic.id)}>
                      <div style={{
                        width:28, height:28, borderRadius:8, flexShrink:0,
                        background: isDone?"#31A24C15":C.primaryLight,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:12, fontWeight:800, color:isDone?"#31A24C":C.primary,
                      }}>
                        {idx+1}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:13, color:T.text, lineHeight:1.3 }}>{topic.topic}</div>
                        {topic.section && <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{topic.section}</div>}
                        <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>
                          {topic.subtopics.length} subtopics · {topic.objectives.length} objectives
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); toggleStudied(topic.id); }}
                        style={{
                          width:30, height:30, borderRadius:"50%", border:"none",
                          background: isDone?"#31A24C":"transparent",
                          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                          flexShrink:0, outline:`1.5px solid ${isDone?"transparent":T.border}`,
                          boxShadow: isDone?"0 2px 8px rgba(49,162,76,0.3)":"none",
                        }}
                      >
                        <CheckCircle size={15} color={isDone?"#fff":T.muted} strokeWidth={isDone?2.5:1.5} />
                      </button>
                      {isExpanded ? <ChevronDown size={15} color={T.sub}/> : <ChevronRight size={15} color={T.sub}/>}
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div style={{ borderTop:`1px solid ${T.border}`, padding:"12px 14px 14px" }}>

                        {/* Subtopics */}
                        <div style={{ marginBottom:14 }}>
                          <div style={{ fontSize:10, color:T.sub, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.5px", display:"flex", alignItems:"center", gap:4 }}>
                            <BookOpen size={10} color={T.sub}/> Subtopics ({topic.subtopics.length})
                          </div>
                          {topic.subtopics.map((sub, i) => (
                            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:7, marginBottom:5 }}>
                              <div style={{ width:4, height:4, borderRadius:"50%", background:C.primary, marginTop:6, flexShrink:0 }}/>
                              <span style={{ fontSize:12, color:T.text, lineHeight:1.5 }}>{sub}</span>
                            </div>
                          ))}
                        </div>

                        {/* Objectives */}
                        <div style={{ marginBottom:14 }}>
                          <div style={{ fontSize:10, color:T.sub, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.5px", display:"flex", alignItems:"center", gap:4 }}>
                            <Target size={10} color={T.sub}/> Learning Objectives
                          </div>
                          {topic.objectives.map((obj, i) => (
                            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:7, marginBottom:5 }}>
                              <span style={{ color:"#31A24C", fontSize:11, flexShrink:0, marginTop:1 }}>✓</span>
                              <span style={{ fontSize:12, color:T.sub, lineHeight:1.5 }}>{obj}</span>
                            </div>
                          ))}
                        </div>

                        {/* Cross-subject links */}
                        {topic.cross_subject_links && topic.cross_subject_links.length > 0 && (
                          <div style={{ padding:"8px 10px", borderRadius:8, background:T.s2, marginBottom:12, display:"flex", alignItems:"flex-start", gap:6 }}>
                            <Link2 size={12} color={C.primary} style={{ flexShrink:0, marginTop:2 }}/>
                            <div style={{ fontSize:11, color:T.sub, lineHeight:1.5 }}>
                              <strong style={{ color:C.primary }}>Related topics:</strong>{" "}
                              {topic.cross_subject_links.map((lid, i) => {
                                const found = Object.values(JAMB_SYLLABUS).flatMap(s => s.topics).find(t => t.id === lid);
                                return found ? (
                                  <span key={lid}>
                                    {i > 0 && ", "}
                                    <button onClick={()=>{ const s = Object.entries(JAMB_SYLLABUS).find(([,sv]) => sv.topics.some(t=>t.id===lid)); if(s){ setActiveSubject(s[0]); setExpandedTopic(lid); }}} style={{ background:"none", border:"none", color:C.primary, cursor:"pointer", fontSize:11, fontWeight:600, padding:0 }}>
                                      {found.topic}
                                    </button>
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display:"flex", gap:8 }}>
                          <Link href={`/ai?q=Teach me ${encodeURIComponent(topic.topic)} for JAMB ${encodeURIComponent(syllabus.display_name)} step by step`}
                            style={{ flex:1, padding:"10px 8px", borderRadius:10, background:C.primaryLight, border:`1px solid ${C.primary}33`, textAlign:"center", textDecoration:"none", fontSize:12, fontWeight:700, color:C.primary }}>
                            🤖 Study with AI
                          </Link>
                          <Link href={`/questions?subject=${activeSubject}&topic=${encodeURIComponent(topic.topic)}`}
                            style={{ flex:1, padding:"10px 8px", borderRadius:10, background:T.s2, border:`1px solid ${T.border}`, textAlign:"center", textDecoration:"none", fontSize:12, fontWeight:700, color:T.text }}>
                            ✏️ Practice
                          </Link>
                          <Link href={`/mock?subject=${activeSubject}&topic=${encodeURIComponent(topic.topic)}`}
                            style={{ flex:1, padding:"10px 8px", borderRadius:10, background:"#E6F4EA", border:"1px solid #31A24C33", textAlign:"center", textDecoration:"none", fontSize:12, fontWeight:700, color:"#31A24C" }}>
                            📝 Mock
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Source note */}
            <div style={{ margin:"14px 0", padding:"12px 14px", borderRadius:12, background:T.s2, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:11, color:T.sub, lineHeight:1.6 }}>
                📋 <strong style={{ color:T.text }}>Source:</strong> {SYLLABUS_STATS.source} · {SYLLABUS_STATS.totalSubjects} subjects · {SYLLABUS_STATS.totalTopics} topics · {SYLLABUS_STATS.totalSubtopics} subtopics · {SYLLABUS_STATS.totalObjectives} learning objectives. All Companion lessons, mock exams, and study plans are aligned to this syllabus.
              </div>
            </div>
          </div>
        )}
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
