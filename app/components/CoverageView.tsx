"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown, ChevronRight,
  Check, Search, X, BookOpen, Target, Link2,
  Bot, PenTool, ClipboardList,
  Languages, Sigma, Atom, FlaskConical, Dna, Landmark, TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { palette, R, TY, SP, LAYOUT } from "../lib/design";
import { JAMB_SYLLABUS, searchSyllabus } from "../lib/syllabus";
import { Progress } from "../lib/progress";
import { Rich } from "../components/AppIcon";
import { useIsoLayoutEffect } from "../lib/theme";

const ICONS: Record<string, LucideIcon> = {
  english: Languages, physics: Atom, mathematics: Sigma,
  chemistry: FlaskConical, biology: Dna, government: Landmark,
  economics: TrendingUp, literature: BookOpen,
};

/** Signup stores display names; this component routes on keys. One explicit map — no string surgery. */
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

/**
 * C1 — short subject labels from an explicit map keyed by subject key.
 * Never first-word truncation: "Literature in English" stays Literature
 * here, and the full display name is still shown in the progress card.
 */
const SHORT_LABELS: Record<string, string> = {
  english: "English",
  mathematics: "Maths",
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
  government: "Government",
  economics: "Economics",
  literature: "Literature",
};

type SearchResult = ReturnType<typeof searchSyllabus>[number];

/**
 * C5 — searchSyllabus returns only `matchedIn` ("topic" | "subtopic" |
 * "objective"), never the matched text itself, so the snippet is found
 * here: the first subtopic / objective containing the query. For a topic
 * match the first subtopic is shown as context ("Includes").
 */
function matchedSnippet(r: SearchResult, query: string): { kind: string; text: string } {
  const q = query.toLowerCase();
  if (r.matchedIn === "subtopic") {
    const hit = r.topic.subtopics.find((s) => s.toLowerCase().includes(q));
    return { kind: "Subtopic", text: hit ?? r.topic.subtopics[0] ?? "" };
  }
  if (r.matchedIn === "objective") {
    const hit = r.topic.objectives.find((o) => o.toLowerCase().includes(q));
    return { kind: "Objective", text: hit ?? r.topic.objectives[0] ?? "" };
  }
  return { kind: "Includes", text: r.topic.subtopics[0] ?? r.topic.section ?? "" };
}

/** Renders `text` with the first occurrence of `query` bolded in `color`. */
function HighlightText({ text, query, color }: { text: string; query: string; color: string }) {
  const idx = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ color, fontWeight: 700 }}>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function CoverageView() {

  const searchParams = useSearchParams();
  const [myKeys] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const u = JSON.parse(localStorage.getItem("companion_user") || "{}");
      const subs: string[] = u.subjects || [];
      return subs.map(s => DISPLAY_TO_KEY[s]).filter(Boolean);
    } catch { return []; }
  });
  // Visible subjects: the student's own selection, or all 8 when nothing stored.
  const visibleEntries = myKeys.length
    ? Object.entries(JAMB_SYLLABUS).filter(([key]) => myKeys.includes(key))
    : Object.entries(JAMB_SYLLABUS);
  const initSubject  = (() => {
    const s = searchParams.get("subject") || "mathematics";
    return (myKeys.length && !myKeys.includes(s)) ? myKeys[0] : s;
  })();

  const [activeSubject, setActiveSubject] = useState(initSubject);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [studied,       setStudied]       = useState<Set<string>>(new Set());
  const [view,          setView]          = useState<"topics"|"search">("topics");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchSyllabus>>([]);
  // C10 — General Objectives collapsed by default (reference, not action).
  const [showObjectives, setShowObjectives] = useState(false);
  // C8 — briefly highlight a topic jumped to from search / a related link.
  const [flashId, setFlashId] = useState<string | null>(null);
  const flashTimer = useRef<number | null>(null);

  useIsoLayoutEffect(() => {
    setStudied(Progress.getSyllabusProgress());
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      setSearchResults(searchSyllabus(searchQuery).filter(r => !myKeys.length || myKeys.includes(r.subjectKey)));
      setView("search");
    } else if (searchQuery.length === 1) {
      // M5 — a 1-character query shows the hint, not a silent dead zone.
      setSearchResults([]);
      setView("search");
    } else if (searchQuery.length === 0) {
      setView("topics");
      setSearchResults([]);
    }
  }, [searchQuery, myKeys]);

  const toggleStudied = (id: string) => {
    Progress.setTopicDone(id, !studied.has(id), false);
    setStudied(Progress.getSyllabusProgress());
  };

  /** Jump to a topic (from search, a suggestion, or a related-topic chip),
   *  expanding it and briefly highlighting it so the subject change is visible. */
  const jumpToTopic = (subjectKey: string, topicId: string) => {
    setSearchQuery("");
    setActiveSubject(subjectKey);
    setExpandedTopic(topicId);
    setView("topics");
    setFlashId(topicId);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashId(null), 1800);
  };

  const clearSearch = () => setSearchQuery("");

  const T        = palette();
  const syllabus = JAMB_SYLLABUS[activeSubject];
  const topics   = syllabus?.topics ?? [];
  const done     = topics.filter(t => studied.has(t.id)).length;
  const pct      = topics.length ? Math.round((done / topics.length) * 100) : 0;

  // Overall progress — over the student's visible subjects only
  const allTopicIds  = visibleEntries.flatMap(([, s]) => s.topics.map(t => t.id));
  const visibleTopicCount = visibleEntries.reduce((n, [, s]) => n + s.topics.length, 0);
  const visibleSubtopicCount = visibleEntries.reduce((n, [, s]) => n + s.topics.reduce((m, t) => m + t.subtopics.length, 0), 0);
  const totalDone    = allTopicIds.filter(id => studied.has(id)).length;
  const overallPct   = Math.round((totalDone / allTopicIds.length) * 100);

  // M5 — zero-result suggestions: the first topics of the subject in view.
  const suggestedTopics = topics.slice(0, 3);

  const subjectPct = (s: (typeof visibleEntries)[number][1]) =>
    s.topics.length ? Math.round((s.topics.filter(t => studied.has(t.id)).length / s.topics.length) * 100) : 0;

  return (
    <div style={{ fontFamily:"var(--font)" }}>

      {/* Header — full-width above the rail + content layout.
          The gradient is the canonical stage gradient, verbatim from the
          Plan page's HERO_GRADIENT (#2A1B6B -> #1F1156 -> #150D38) — NOT
          rebuilt from T.primaryDark / T.primarySoft / T.bg, which resolve
          to different purples (#4F46E5 / #1D1E45 / #0B0D14). Coverage
          renders inside the studyplan page, so the two headers must
          match exactly. (Coordinator fix; D10 targets invented hex, not
          the brand constant.) */}
      <div style={{ background: "linear-gradient(165deg,#2A1B6B 0%,#1F1156 55%,#150D38 100%)", padding:`${SP[4]}px ${SP[5]}px 0`, borderRadius:R.xl, overflow:"hidden", marginBottom:SP[3] }}>
        <div style={{ display:"flex", alignItems:"center", gap:SP[3], marginBottom:SP[3] }}>
          <div style={{ flex:1 }}>
            <div style={{ color:T.onPrimary, fontWeight:800, fontSize:TY.lg }}>Syllabus Coverage</div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:TY.xs }}>
              <Rich>{visibleTopicCount}</Rich> topics · <Rich>{visibleSubtopicCount}</Rich> subtopics · Official 2025 edition
            </div>
          </div>
          {/* C3 — overall % in indigo, labelled "overall coverage". */}
          <div style={{ textAlign:"right" }}>
            <div style={{ color:overallPct === 100 ? T.success : T.primary, fontWeight:900, fontSize:TY.xl, lineHeight:1 }}><Rich>{overallPct}</Rich>%</div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:TY.xs }}>overall coverage</div>
          </div>
        </div>

        {/* Search bar — C4: clear (x) button whenever the query is non-empty. */}
        <div style={{ position:"relative", marginBottom:SP[2] }}>
          <Search size={15} color="rgba(255,255,255,0.6)" style={{ position:"absolute", left:SP[3], top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search any topic, subtopic or concept…"
            aria-label="Search syllabus topics"
            style={{
              width:"100%", padding:`${SP[2] + 2}px ${SP[8]}px ${SP[2] + 2}px 36px`,
              borderRadius:R.lg, border:"1px solid rgba(255,255,255,0.16)", outline:"none",
              fontSize:TY.sm, background:"rgba(255,255,255,0.1)",
              color:T.onPrimary, boxSizing:"border-box",
            }}
          />
          {searchQuery.length > 0 && (
            <button
              onClick={clearSearch}
              aria-label="Clear search"
              style={{
                position:"absolute", right:SP[1], top:"50%", transform:"translateY(-50%)",
                width:SP[8], height:SP[8], borderRadius:R.pill, border:"none",
                background:"transparent", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}
            >
              <X size={15} color="rgba(255,255,255,0.7)" />
            </button>
          )}
        </div>

        {/* M5 — the search explains its scope: only the student's own subjects. */}
        <div style={{ fontSize:TY.xs, color:"rgba(255,255,255,0.7)", marginBottom:SP[2], lineHeight:1.5 }}>
          Searching your <Rich>{visibleEntries.length}</Rich> JAMB subjects ·{" "}
          <Link href="/profile" style={{ color:T.onPrimary, textDecoration:"underline" }}>Change subjects in Profile</Link>
        </div>
        {/* C4 — 1-character hint, shown instead of a silent dead zone. */}
        {searchQuery.length === 1 && (
          <div style={{ fontSize:TY.xs, color:"rgba(255,255,255,0.7)", marginBottom:SP[3] }}>
            Type 2 or more characters to search
          </div>
        )}

        {/* Subject tabs — phone + tablet only (.cov-tabs hides them on laptop,
            where the sticky rail takes over). C12: the active tab carries a
            primary top bar so it cannot blend into the page. */}
        {view === "topics" && (
          <div className="cov-tabs" style={{ display:"flex", gap:SP[2], overflowX:"auto", scrollbarWidth:"none" }}>
            {visibleEntries.map(([key, s]) => {
              const subPct = subjectPct(s);
              const isActive = activeSubject === key;
              return (
                <button key={key} onClick={()=>{ setActiveSubject(key); setExpandedTopic(null); }} style={{
                  flexShrink:0, padding:`${SP[2]}px ${SP[3]}px`, minHeight:44, display:"flex", alignItems:"center", gap:SP[2], borderRadius:`${R.lg} ${R.lg} 0 0`, border:"none",
                  cursor:"pointer", fontSize:TY.xs, fontWeight:700,
                  background: isActive ? T.bg : "rgba(255,255,255,0.12)",
                  color: isActive ? T.primary : "rgba(255,255,255,0.85)",
                  boxShadow: isActive ? `inset 0 3px 0 ${T.primary}` : "none",
                  transition:"all 0.2s", position:"relative",
                }}>
                  {(() => { const TabIcon = ICONS[key] || BookOpen; return <TabIcon size={13} strokeWidth={2} />; })()} <Rich>{SHORT_LABELS[key] ?? s.display_name}</Rich>
                  {/* C6 — subject % always shown, including 0%, so tabs never shift. */}
                  <span style={{ marginLeft:SP[1], fontSize:TY.xs, color:isActive ? T.primary : "rgba(255,255,255,0.7)" }}>
                    <Rich>{subPct}</Rich>%
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Laptop: sticky 248px subject rail + topic column (.cov-layout).
          Phone + tablet: single column, rail hidden by the class. */}
      <div className="cov-layout">
        {/* Subject rail — laptop only (.cov-rail hides it below laptop). */}
        <div className="cov-rail" style={{ top: LAYOUT.stickyTop }}>
          <div style={{ fontSize:11, color:T.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:SP[2] }}>
            Subjects
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:SP[1] }}>
            {visibleEntries.map(([key, s]) => {
              const subPct = subjectPct(s);
              const isActive = activeSubject === key;
              const RailIcon = ICONS[key] || BookOpen;
              return (
                <button
                  key={key}
                  onClick={()=>{ setSearchQuery(""); setActiveSubject(key); setExpandedTopic(null); setView("topics"); }}
                  aria-current={isActive ? true : undefined}
                  style={{
                    display:"flex", alignItems:"center", gap:SP[2], width:"100%",
                    padding:`${SP[2]}px ${SP[3]}px`, minHeight:44,
                    borderRadius:R.lg, border:"none", cursor:"pointer", textAlign:"left",
                    background: isActive ? T.primaryTint : "transparent",
                    color: isActive ? T.primary : T.sub,
                    boxShadow: isActive ? `inset 3px 0 0 ${T.primary}` : "none",
                    fontSize:TY.sm, fontWeight:700,
                  }}
                >
                  <RailIcon size={14} strokeWidth={2} />
                  <span style={{ flex:1 }}><Rich>{SHORT_LABELS[key] ?? s.display_name}</Rich></span>
                  {/* C6 — subject % always shown, including 0%. */}
                  <span style={{ fontSize:TY.xs, fontWeight:700, color:isActive ? T.primary : T.muted }}>
                    <Rich>{subPct}</Rich>%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main column */}
        <div style={{ minWidth:0, paddingTop:SP[3] }}>

          {/* Search results */}
          {view === "search" && (
            <div>
              {searchQuery.length === 1 ? (
                <div style={{ textAlign:"center", padding:"40px 20px", color:T.muted, fontSize:TY.sm, lineHeight:1.6 }}>
                  Type 2 or more characters to search.
                  <div style={{ marginTop:SP[3] }}>
                    <button onClick={clearSearch} style={{
                      padding:`${SP[2]}px ${SP[4]}px`, minHeight:44, borderRadius:R.lg,
                      background:T.s2, border:`1px solid ${T.border}`, color:T.text,
                      fontSize:TY.xs, fontWeight:700, cursor:"pointer",
                    }}>
                      Clear search
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize:TY.sm, color:T.sub, marginBottom:SP[3] }}>
                    <Rich>{searchResults.length}</Rich> result{searchResults.length !== 1 ? "s" : ""} for "<Rich>{searchQuery}</Rich>"
                  </div>
                  {searchResults.length === 0 ? (
                    /* M5 — zero results: suggestions + clear + a way back to browsing. */
                    <div style={{ background:T.surface, borderRadius:R.xl, padding:SP[4], border:`1px solid ${T.border}` }}>
                      <div style={{ fontSize:TY.base, fontWeight:700, color:T.text, marginBottom:SP[1] }}>
                        No topics found for "<Rich>{searchQuery}</Rich>"
                      </div>
                      <div style={{ fontSize:TY.xs, color:T.sub, lineHeight:1.6, marginBottom:SP[3] }}>
                        Check the spelling, or try a shorter keyword. Search covers your <Rich>{visibleEntries.length}</Rich> JAMB subjects only.
                      </div>
                      {suggestedTopics.length > 0 && syllabus && (
                        <div style={{ marginBottom:SP[4] }}>
                          <div style={{ fontSize:11, color:T.sub, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:SP[2] }}>
                            Suggested topics from <Rich>{syllabus.display_name}</Rich>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:SP[2] }}>
                            {suggestedTopics.map((t) => (
                              <button key={t.id} onClick={()=>jumpToTopic(activeSubject, t.id)} style={{
                                background:T.s2, borderRadius:R.lg, padding:`${SP[2]}px ${SP[3]}px`,
                                border:`1px solid ${T.border}`, textAlign:"left", cursor:"pointer",
                                display:"block", width:"100%", minHeight:44,
                                fontSize:TY.sm, fontWeight:700, color:T.text,
                              }}>
                                <Rich>{t.topic}</Rich>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ display:"flex", gap:SP[2], flexWrap:"wrap" }}>
                        <button onClick={clearSearch} style={{
                          padding:`${SP[2]}px ${SP[4]}px`, minHeight:44, borderRadius:R.lg,
                          background:T.s2, border:`1px solid ${T.border}`, color:T.text,
                          fontSize:TY.xs, fontWeight:700, cursor:"pointer",
                        }}>
                          Clear search
                        </button>
                        {syllabus && (
                          <button onClick={clearSearch} style={{
                            padding:`${SP[2]}px ${SP[4]}px`, minHeight:44, borderRadius:R.lg,
                            background:T.primaryTint, border:`1px solid ${T.primary}55`, color:T.primary,
                            fontSize:TY.xs, fontWeight:700, cursor:"pointer",
                          }}>
                            Browse all <Rich>{syllabus.display_name}</Rich> topics
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:SP[2] }}>
                      {searchResults.map((r, i) => {
                        const snippet = matchedSnippet(r, searchQuery);
                        return (
                          <button key={i} onClick={()=>jumpToTopic(r.subjectKey, r.topic.id)} style={{
                            background:T.surface, borderRadius:R.lg, padding:`${SP[3]}px ${SP[3]}px`,
                            border:`1px solid ${T.border}`, textAlign:"left", cursor:"pointer",
                            display:"block", width:"100%",
                          }}>
                            <div style={{ fontSize:11, color:T.primary, fontWeight:700, marginBottom:SP[1], textTransform:"uppercase", letterSpacing:"0.5px" }}>
                              <Rich>{r.subject.display_name}</Rich> · <Rich>{r.matchedIn}</Rich>
                            </div>
                            <div style={{ fontSize:TY.base, fontWeight:700, color:T.text }}><Rich>{r.topic.topic}</Rich></div>
                            {/* C5 — WHY it matched: the matched subtopic / objective text. */}
                            {snippet.text && (
                              <div style={{ fontSize:TY.xs, color:T.sub, marginTop:SP[1], lineHeight:1.5 }}>
                                <Rich>{snippet.kind}</Rich>: <HighlightText text={snippet.text} query={searchQuery} color={T.primaryText} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Topic browser */}
          {view === "topics" && syllabus && (
            <div>
              {/* Subject progress — full display name lives here (C1). */}
              <div style={{ background:T.surface, borderRadius:R.xl, padding:SP[4], marginBottom:SP[3], border:`1px solid ${T.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:SP[2] }}>
                  <span style={{ fontWeight:700, fontSize:TY.base, color:T.text }}><Rich>{syllabus.display_name}</Rich></span>
                  <span style={{ fontSize:TY.sm, color:pct===100?T.successText:T.primary, fontWeight:700 }}><Rich>{done}</Rich>/<Rich>{topics.length}</Rich> done</span>
                </div>
                <div style={{ height:8, borderRadius:R.sm, background:T.s2, overflow:"hidden", marginBottom:SP[2] }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:pct===100?T.success:T.primary, transition:"width 0.4s" }}/>
                </div>
                {/* C2 — the done-toggle hint is permanent, not only at 0%. */}
                <div style={{ fontSize:TY.xs, color:T.sub, lineHeight:1.6 }}>
                  Tap the circle on each topic when studied
                  {pct>0&&pct<100 && (
                    <span> · <Rich>{pct}</Rich>% — <Rich>{topics.length-done}</Rich> topics remaining</span>
                  )}
                  {pct===100 && <span> · All topics covered! Keep reviewing.</span>}
                </div>
                {/* C10 — General Objectives collapsed by default. */}
                {syllabus.general_objectives && (
                  <div style={{ marginTop:SP[3], paddingTop:SP[3], borderTop:`1px solid ${T.border}` }}>
                    <button
                      onClick={()=>setShowObjectives(v => !v)}
                      aria-expanded={showObjectives}
                      style={{
                        display:"flex", alignItems:"center", gap:SP[2], width:"100%", minHeight:44,
                        background:"none", border:"none", cursor:"pointer", padding:0, textAlign:"left",
                        fontSize:TY.xs, color:T.text, fontWeight:700,
                      }}
                    >
                      {showObjectives ? <ChevronDown size={15} color={T.sub}/> : <ChevronRight size={15} color={T.sub}/>}
                      General objectives (<Rich>{syllabus.general_objectives.length}</Rich>)
                    </button>
                    {showObjectives && (
                      <div style={{ marginTop:SP[2] }}>
                        {syllabus.general_objectives.map((obj, i) => (
                          <div key={i} style={{ display:"flex", gap:SP[2], fontSize:TY.xs, color:T.sub, marginBottom:SP[1], lineHeight:1.4 }}>
                            <span style={{ color:T.primary, flexShrink:0 }}>•</span>
                            <span><Rich>{obj}</Rich></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Topic list — single column, one topic per card, expand-in-place. */}
              <div style={{ display:"flex", flexDirection:"column", gap:SP[2] }}>
                {topics.map((topic, idx) => {
                  const isExpanded = expandedTopic === topic.id;
                  const isDone     = studied.has(topic.id);
                  const isFlashed  = flashId === topic.id;

                  return (
                    <div key={topic.id} style={{
                      background:T.surface, borderRadius:R.xl,
                      border:`1.5px solid ${isFlashed ? T.primary : isDone ? T.success : T.border}`,
                      boxShadow: isDone && !isFlashed ? `inset 3px 0 0 ${T.success}` : "none",
                      overflow:"hidden", transition:"border-color 0.2s",
                    }}>
                      {/* Topic header */}
                      <div style={{ display:"flex", alignItems:"center", gap:SP[2], padding:`${SP[3]}px ${SP[3]}px`, cursor:"pointer" }}
                        onClick={()=>setExpandedTopic(isExpanded ? null : topic.id)}>
                        <div style={{
                          width:28, height:28, borderRadius:R.md, flexShrink:0,
                          background: isDone?T.successTint:T.primaryTint,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:TY.xs, fontWeight:800, color:isDone?T.successText:T.primary,
                        }}>
                          {idx+1}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:TY.sm, color:T.text, lineHeight:1.3 }}><Rich>{topic.topic}</Rich></div>
                          {topic.section && <div style={{ fontSize:TY.xs, color:T.muted, marginTop:2 }}><Rich>{topic.section}</Rich></div>}
                          <div style={{ fontSize:TY.xs, color:T.sub, marginTop:2 }}>
                            <Rich>{topic.subtopics.length}</Rich> subtopics · <Rich>{topic.objectives.length}</Rich> objectives
                          </div>
                        </div>
                        {/* C2 — the done toggle reads as a control: a primary ring
                            with a visible check when undone, filled when done. */}
                        <button
                          onClick={e => { e.stopPropagation(); toggleStudied(topic.id); }}
                          aria-label={isDone ? `Mark ${topic.topic} as not studied` : `Mark ${topic.topic} as studied`}
                          aria-pressed={isDone}
                          style={{
                            width:40, height:40, borderRadius:R.pill,
                            border:`1.5px solid ${T.primary}`,
                            background: isDone?T.primary:"transparent",
                            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                            flexShrink:0,
                          }}
                        >
                          <Check size={16} color={isDone?T.onPrimary:T.primary} strokeWidth={isDone?2.5:2} style={{ opacity: isDone ? 1 : 0.55 }} />
                        </button>
                        {isExpanded ? <ChevronDown size={15} color={T.sub}/> : <ChevronRight size={15} color={T.sub}/>}
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div style={{ borderTop:`1px solid ${T.border}`, padding:`${SP[3]}px ${SP[3]}px ${SP[3]}px` }}>

                          {/* Subtopics */}
                          <div style={{ marginBottom:SP[3] }}>
                            <div style={{ fontSize:11, color:T.sub, fontWeight:700, marginBottom:SP[2], textTransform:"uppercase", letterSpacing:"0.5px", display:"flex", alignItems:"center", gap:SP[1] }}>
                              <BookOpen size={11} color={T.sub}/> Subtopics (<Rich>{topic.subtopics.length}</Rich>)
                            </div>
                            {topic.subtopics.map((sub, i) => (
                              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:SP[2], marginBottom:SP[1] }}>
                                <div style={{ width:4, height:4, borderRadius:R.pill, background:T.primary, marginTop:SP[1], flexShrink:0 }}/>
                                <span style={{ fontSize:TY.xs, color:T.text, lineHeight:1.5 }}><Rich>{sub}</Rich></span>
                              </div>
                            ))}
                          </div>

                          {/* Objectives — C7: neutral dots, never green checks.
                              Objectives are not individually tracked. */}
                          <div style={{ marginBottom:SP[3] }}>
                            <div style={{ fontSize:11, color:T.sub, fontWeight:700, marginBottom:SP[2], textTransform:"uppercase", letterSpacing:"0.5px", display:"flex", alignItems:"center", gap:SP[1] }}>
                              <Target size={11} color={T.sub}/> Learning Objectives
                            </div>
                            {topic.objectives.map((obj, i) => (
                              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:SP[2], marginBottom:SP[1] }}>
                                <div style={{ width:4, height:4, borderRadius:R.pill, background:T.primary, marginTop:SP[1], flexShrink:0 }}/>
                                <span style={{ fontSize:TY.xs, color:T.sub, lineHeight:1.5 }}><Rich>{obj}</Rich></span>
                              </div>
                            ))}
                          </div>

                          {/* Cross-subject links — C8: real tappable chips, not
                              11px padding-0 inline text. Links resolve within
                              visible subjects only, as before. */}
                          {topic.cross_subject_links && topic.cross_subject_links.length > 0 && (
                            <div style={{ padding:`${SP[2]}px ${SP[2]}px`, borderRadius:R.md, background:T.s2, marginBottom:SP[3] }}>
                              <div style={{ display:"flex", alignItems:"center", gap:SP[2], marginBottom:SP[2] }}>
                                <Link2 size={12} color={T.primary} style={{ flexShrink:0 }}/>
                                <span style={{ fontSize:11, color:T.primary, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>Related topics</span>
                              </div>
                              <div style={{ display:"flex", flexWrap:"wrap", gap:SP[2] }}>
                                {topic.cross_subject_links.map((lid) => {
                                  const found = visibleEntries.flatMap(([, s]) => s.topics).find(t => t.id === lid);
                                  if (!found) return null;
                                  const dest = visibleEntries.find(([, sv]) => sv.topics.some(t => t.id === lid));
                                  if (!dest) return null;
                                  return (
                                    <button key={lid} onClick={()=>jumpToTopic(dest[0], lid)} style={{
                                      background:T.surface, border:`1px solid ${T.border}`, color:T.primary,
                                      cursor:"pointer", fontSize:TY.xs, fontWeight:600,
                                      padding:`${SP[2]}px ${SP[3]}px`, minHeight:44, borderRadius:R.pill,
                                      display:"inline-flex", alignItems:"center",
                                    }}>
                                      <Rich>{found.topic}</Rich>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Action buttons — C9: ONE shared treatment for all
                              three (same size, same weight); labels say what
                              happens. Layout via .cov-actions: stacked
                              full-width on phone, natural widths on laptop. */}
                          <div className="cov-actions" style={{ display:"flex", gap:SP[2] }}>
                            <Link href={`/ai?q=Teach me ${encodeURIComponent(topic.topic)} for JAMB ${encodeURIComponent(syllabus.display_name)} step by step`}
                              style={{ padding:`${SP[2]}px ${SP[3]}px`, borderRadius:R.lg, background:T.s2, border:`1px solid ${T.border}`, textAlign:"center", textDecoration:"none", fontSize:TY.xs, fontWeight:700, color:T.text, display:"flex", alignItems:"center", justifyContent:"center", gap:SP[2], minHeight:44 }}>
                              <Bot size={13} strokeWidth={2} /> Study with AI
                            </Link>
                            <Link href={`/questions?subject=${activeSubject}&topic=${encodeURIComponent(topic.topic)}`}
                              style={{ padding:`${SP[2]}px ${SP[3]}px`, borderRadius:R.lg, background:T.s2, border:`1px solid ${T.border}`, textAlign:"center", textDecoration:"none", fontSize:TY.xs, fontWeight:700, color:T.text, display:"flex", alignItems:"center", justifyContent:"center", gap:SP[2], minHeight:44 }}>
                              <PenTool size={13} strokeWidth={2} /> Practice questions
                            </Link>
                            <Link href={`/mock?subject=${activeSubject}&topic=${encodeURIComponent(topic.topic)}`}
                              style={{ padding:`${SP[2]}px ${SP[3]}px`, borderRadius:R.lg, background:T.s2, border:`1px solid ${T.border}`, textAlign:"center", textDecoration:"none", fontSize:TY.xs, fontWeight:700, color:T.text, display:"flex", alignItems:"center", justifyContent:"center", gap:SP[2], minHeight:44 }}>
                              <ClipboardList size={13} strokeWidth={2} /> Topic mock
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* C11 — source note stays one line, exactly as landed. */}
              <div style={{ margin:`${SP[3]}px 0`, padding:`${SP[3]}px ${SP[3]}px`, borderRadius:R.lg, background:T.s2, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:TY.xs, color:T.sub, lineHeight:1.6 }}>
                  <strong style={{ color:T.text }}>Source:</strong> Official JAMB syllabus, 2025 edition.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
