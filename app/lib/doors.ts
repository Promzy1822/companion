// app/lib/doors.ts — ONE shared source for the four front-door doors.
//
// Landing (brand panel) and AuthForm (pitch panel) render the same doors
// in the same words (DESIGN-AUDIT A8/L5). The icon treatment is all-orange
// in both places: the icon colour lives with the renderers (D.accent /
// T.accent), never per-door, so the four doors can never drift into four
// unrelated colours again. Copy is honest (L8): no "every topic", no
// "anything, anytime", no "watch it solved".
import { BookOpen, Bot, CalendarDays, ClipboardList } from "lucide-react";

export interface Door {
  icon: typeof BookOpen;
  title: string;
  desc: string;
}

export const DOORS: Door[] = [
  { icon: BookOpen, title: "Learn", desc: "Lessons that follow the official JAMB syllabus, written in clear, simple English." },
  { icon: ClipboardList, title: "Practice", desc: "4,060 real past questions, timed mock exams, and instant feedback on every answer." },
  { icon: CalendarDays, title: "Plan", desc: "A day-by-day study plan matched to your exam date, with your syllabus coverage tracked topic by topic." },
  { icon: Bot, title: "AI Tutor", desc: "Ask questions and get step-by-step help — send a photo of a question too." },
];
