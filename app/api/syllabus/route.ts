import { NextRequest, NextResponse } from "next/server";
import {
  JAMB_SYLLABUS,
  SYLLABUS_STATS,
  getSubjectSyllabus,
  searchSyllabus,
  getTopic,
  getPrerequisites,
  getCrossSubjectLinks,
} from "../../lib/syllabus";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action  = searchParams.get("action") ?? "overview";
  const subject = searchParams.get("subject") ?? "";
  const topicId = searchParams.get("topicId") ?? "";
  const query   = searchParams.get("q") ?? "";

  switch (action) {
    case "overview":
      return NextResponse.json({
        stats: SYLLABUS_STATS,
        subjects: Object.entries(JAMB_SYLLABUS).map(([key, s]) => ({
          key,
          display_name: s.display_name,
          code:         s.code,
          topic_count:  s.topics.length,
          subtopic_count: s.topics.reduce((n, t) => n + t.subtopics.length, 0),
        })),
      });

    case "subject":
      if (!subject) return NextResponse.json({ error: "subject required" }, { status: 400 });
      const sub = getSubjectSyllabus(subject);
      if (!sub) return NextResponse.json({ error: "Subject not found" }, { status: 404 });
      return NextResponse.json(sub);

    case "topic":
      if (!topicId) return NextResponse.json({ error: "topicId required" }, { status: 400 });
      const found = getTopic(topicId);
      if (!found) return NextResponse.json({ error: "Topic not found" }, { status: 404 });
      return NextResponse.json({
        ...found.topic,
        subject_display_name: found.subject.display_name,
        prerequisites:        getPrerequisites(topicId).map(p => ({ id: p.topic.id, topic: p.topic.topic, subject: p.subject.display_name })),
        cross_subject_links:  getCrossSubjectLinks(topicId).map(l => ({ id: l.topic.id, topic: l.topic.topic, subject: l.subject.display_name })),
      });

    case "search":
      if (!query) return NextResponse.json({ results: [] });
      const results = searchSyllabus(query).slice(0, 20);
      return NextResponse.json({
        query,
        count: results.length,
        results: results.map(r => ({
          topicId:   r.topic.id,
          topic:     r.topic.topic,
          subject:   r.subject.display_name,
          matchedIn: r.matchedIn,
        })),
      });

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
