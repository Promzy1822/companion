"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronRight, PlayCircle } from "lucide-react";
import { NAVBAR_HEIGHT } from "../../components/NavbarView";
import { BOTTOM_NAV_HEIGHT } from "../../components/BottomNavView";
import { palette, R } from "../../lib/design";
import { useDark } from "../../lib/theme";
import { getTopics, getSubjectSyllabus } from "../../lib/syllabus";
import { getLessonVideo } from "../../lib/lesson-videos";
import { Progress } from "../../lib/progress";

export default function LearnSubjectPage({ params }: { params: { subject: string } }) {
  const { subject } = params;
  const dark = useDark();
  const [completed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    const all = Progress.getCompletedTopics();
    Progress.getSyllabusProgress().forEach(id => all.add(id));
    return all;
  });

  const T = palette(dark);
  const subjectInfo = getSubjectSyllabus(subject);
  const topics = getTopics(subject);
  const doneCount = topics.filter(t => completed.has(t.id)).length;
  const pctDone = topics.length ? Math.round((doneCount / topics.length) * 100) : 0;

  if (!subjectInfo) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, paddingTop: `${NAVBAR_HEIGHT}px`, paddingBottom: `${BOTTOM_NAV_HEIGHT + 20}px`, fontFamily: "var(--font)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px", textAlign: "center" }}>
          <p style={{ color: T.text, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Subject not found</p>
          <p style={{ color: T.sub, fontSize: 13, marginBottom: 18 }}>We don't have lessons for "{subject}" yet.</p>
          <Link href="/subjects" style={{ display: "inline-block", padding: "11px 22px", borderRadius: 999, background: T.primary, color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            Browse all subjects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingTop: `${NAVBAR_HEIGHT}px`, paddingBottom: `${BOTTOM_NAV_HEIGHT + 20}px`, fontFamily: "var(--font)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px" }}>
        <Link href="/subjects" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: T.sub, fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 12, minHeight: "44px" }}>
          <ArrowLeft size={16} /> All subjects
        </Link>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 4, letterSpacing: "-0.5px" }}>
          {subjectInfo?.display_name || subject}
        </h1>
        <p style={{ fontSize: 13, color: T.sub, marginBottom: 16 }}>
          {topics.length} topics · summary and exercises for each
        </p>

        {topics.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 6 }}>
              <span>{doneCount} of {topics.length} topics completed</span>
              <span style={{ fontWeight: 700, color: T.primary }}>{pctDone}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: T.s2, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ height: "100%", width: `${pctDone}%`, background: T.primary, transition: "width 0.4s" }} />
            </div>
            <Link href={`/questions?subject=${subject}&mode=practice`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: T.primary, textDecoration: "none", minHeight: "44px" }}>
              Practice {subjectInfo?.display_name || subject} questions <ChevronRight size={14} strokeWidth={2.4} />
            </Link>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {topics.map(t => {
            const done = completed.has(t.id);
            const hasVideo = Boolean(getLessonVideo(t.id));
            return (
              <Link key={t.id} href={`/lessons/${t.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: T.surface, borderRadius: R.lg, padding: "14px 16px",
                  border: `1px solid ${done ? T.success + "55" : T.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t.topic}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                      {hasVideo ? "Video + summary + exercises" : "Summary + exercises"}
                    </div>
                  </div>
                  {done
                    ? <CheckCircle2 size={20} color={T.success} />
                    : (hasVideo ? <PlayCircle size={20} color={T.muted} /> : null)}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
