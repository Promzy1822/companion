"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, PlayCircle } from "lucide-react";
import Navbar, { NAVBAR_HEIGHT } from "../../components/Navbar";
import BottomNav, { BOTTOM_NAV_HEIGHT } from "../../components/BottomNav";
import { C, palette, R, S } from "../../lib/design";
import { getTopics, getSubjectSyllabus } from "../../lib/syllabus";
import { getLessonVideo } from "../../lib/lesson-videos";
import { Progress } from "../../lib/progress";

export default function LearnSubjectPage({ params }: { params: { subject: string } }) {
  const { subject } = params;
  const [dark, setDark]           = useState(false);
  const [ready, setReady]         = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDark(localStorage.getItem("darkMode") === "true");
    setCompleted(Progress.getCompletedTopics());
    setReady(true);
  }, []);

  if (!ready) return null;
  const T = palette(dark);
  const subjectInfo = getSubjectSyllabus(subject);
  const topics = getTopics(subject);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingTop: `${NAVBAR_HEIGHT}px`, paddingBottom: `${BOTTOM_NAV_HEIGHT + 20}px`, fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>
      <Navbar darkMode={dark} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>
        <Link href="/subjects?mode=learn" style={{ display: "flex", alignItems: "center", gap: 6, color: T.sub, fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 12 }}>
          <ArrowLeft size={16} /> All subjects
        </Link>

        <h1 style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 4 }}>
          {subjectInfo?.display_name || subject}
        </h1>
        <p style={{ fontSize: 13, color: T.sub, marginBottom: 16 }}>
          {topics.length} topics · video, summary and exercises for each
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {topics.map(t => {
            const done = completed.has(t.id);
            const hasVideo = !!getLessonVideo(t.id);
            return (
              <Link key={t.id} href={`/lessons/${t.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: T.surface, borderRadius: R.lg, padding: "14px 16px",
                  border: `1px solid ${done ? C.success + "55" : T.border}`,
                  boxShadow: S.sm, display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t.topic}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                      {hasVideo ? "Video + summary + exercises" : "Summary + exercises"}
                    </div>
                  </div>
                  {done
                    ? <CheckCircle2 size={20} color={C.success} />
                    : (hasVideo ? <PlayCircle size={20} color={T.muted} /> : null)}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <BottomNav darkMode={dark} />
    </div>
  );
}
