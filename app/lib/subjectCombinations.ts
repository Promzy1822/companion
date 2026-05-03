// JAMB Subject Combinations based on official JAMB brochure
// English Language is ALWAYS compulsory and auto-included

export interface SubjectCombo {
  fixed: string[];        // compulsory subjects (no choice)
  flexible: string[];     // student picks from these
  flexibleCount: number;  // how many to pick from flexible list
  note: string;
}

export const SUBJECT_COMBINATIONS: Record<string, SubjectCombo> = {
  "Medicine & Surgery": {
    fixed: ["Biology", "Chemistry", "Physics"],
    flexible: [],
    flexibleCount: 0,
    note: "English + Biology + Chemistry + Physics (all fixed by JAMB brochure)"
  },
  "Pharmacy": {
    fixed: ["Biology", "Chemistry", "Physics"],
    flexible: [],
    flexibleCount: 0,
    note: "English + Biology + Chemistry + Physics (all fixed by JAMB brochure)"
  },
  "Nursing": {
    fixed: ["Biology", "Chemistry", "Physics"],
    flexible: [],
    flexibleCount: 0,
    note: "English + Biology + Chemistry + Physics (all fixed by JAMB brochure)"
  },
  "Engineering": {
    fixed: ["Mathematics", "Physics"],
    flexible: ["Chemistry", "Biology", "Agricultural Science", "Further Mathematics", "Economics"],
    flexibleCount: 1,
    note: "English + Mathematics + Physics + one science subject"
  },
  "Computer Science": {
    fixed: ["Mathematics"],
    flexible: ["Physics", "Chemistry", "Biology", "Further Mathematics", "Economics", "Commerce"],
    flexibleCount: 2,
    note: "English + Mathematics + any two science/commercial subjects"
  },
  "Law": {
    fixed: [],
    flexible: ["Mathematics", "Economics", "Government", "Literature in English", "History", "Commerce", "CRS", "IRS", "Geography", "Biology", "Chemistry", "Physics"],
    flexibleCount: 3,
    note: "English + any three subjects (Arts or Social Science preferred)"
  },
  "Accounting": {
    fixed: ["Mathematics"],
    flexible: ["Economics", "Commerce", "Government", "Biology", "Chemistry", "Physics", "Geography", "Literature in English", "CRS"],
    flexibleCount: 2,
    note: "English + Mathematics + any two other subjects"
  },
  "Economics": {
    fixed: ["Mathematics"],
    flexible: ["Economics", "Commerce", "Government", "Geography", "Biology", "Chemistry", "Physics", "Literature in English", "CRS"],
    flexibleCount: 2,
    note: "English + Mathematics + any two subjects"
  },
  "Mass Communication": {
    fixed: [],
    flexible: ["Mathematics", "Economics", "Government", "Literature in English", "Geography", "Biology", "Chemistry", "Physics", "Commerce", "CRS", "IRS"],
    flexibleCount: 3,
    note: "English + any three subjects"
  },
  "Education": {
    fixed: [],
    flexible: ["Mathematics", "Economics", "Government", "Literature in English", "Geography", "Biology", "Chemistry", "Physics", "Commerce", "CRS", "IRS", "Agricultural Science"],
    flexibleCount: 3,
    note: "English + any three subjects relevant to your teaching subject"
  },
  "Agriculture": {
    fixed: ["Biology"],
    flexible: ["Chemistry", "Physics", "Mathematics", "Agricultural Science", "Geography", "Economics"],
    flexibleCount: 2,
    note: "English + Biology + any two science subjects"
  },
  "Architecture": {
    fixed: ["Mathematics", "Physics"],
    flexible: ["Chemistry", "Biology", "Further Mathematics", "Geography", "Economics"],
    flexibleCount: 1,
    note: "English + Mathematics + Physics + one other subject"
  },
  "Other": {
    fixed: [],
    flexible: ["Mathematics", "Physics", "Chemistry", "Biology", "Government", "Economics", "Literature in English", "Geography", "CRS", "IRS", "Commerce", "Agricultural Science", "Further Mathematics"],
    flexibleCount: 3,
    note: "English + any three subjects"
  },
};

export function getSubjectCombo(course: string): SubjectCombo {
  return SUBJECT_COMBINATIONS[course] || SUBJECT_COMBINATIONS["Other"];
}

export function getFullSubjects(course: string, flexible: string[]): string[] {
  return ["English Language", ...SUBJECT_COMBINATIONS[course]?.fixed || [], ...flexible];
}
