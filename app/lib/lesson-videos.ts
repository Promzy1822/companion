// Curated JAMB lesson videos — MVP approach: hand-picked real videos,
// no YouTube API key required. Add more entries here any time; topics
// without an entry simply show a "video coming soon" state instead.

export const LESSON_VIDEOS: Record<string, string> = {
  mat_6: "hPclO5AWhaA",  // Quadratic Equations
  phy_3: "DAOqotI578o",  // Motion & Types
  eng_1: "qdQqQqJcBKU",  // Comprehension Passage
  bio_1: "rxth_5AFVw0",  // Cell Structure & Living Organisms
  gov_1: "MfwSMbkVUww",  // Government as an Institution of the State
  gov_3: "R1wkASbO1RI",  // Forms of Government
};

export function getLessonVideo(topicId: string): string | null {
  return LESSON_VIDEOS[topicId] ?? null;
}
