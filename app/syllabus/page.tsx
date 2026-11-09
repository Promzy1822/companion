import { redirect } from "next/navigation";

// The Syllabus now lives inside the Study Plan as its "Coverage" view (redesign step 3).
export default function SyllabusPage() {
  redirect("/studyplan?view=coverage");
}
