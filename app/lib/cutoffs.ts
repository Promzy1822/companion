// Historical JAMB cutoff marks database
// Source: JAMB official releases + university announcements
// Updated for 2024/2025 session

export interface CutoffData {
  minJamb: number;
  recommendedJamb: number;
  postUtmeWeight: boolean;
  notes: string;
  competition: "Very High" | "High" | "Moderate" | "Low";
}

export interface UniversityCutoffs {
  [course: string]: CutoffData;
}

export interface CutoffDatabase {
  [university: string]: UniversityCutoffs;
}

const DEFAULT: CutoffData = {
  minJamb: 200, recommendedJamb: 240, postUtmeWeight: true,
  notes: "General minimum. Check university website for latest.", competition: "Moderate"
};

export const CUTOFF_DB: CutoffDatabase = {
  "University of Lagos": {
    "Medicine & Surgery": { minJamb:280, recommendedJamb:320, postUtmeWeight:true, notes:"Extremely competitive. Strong Post-UTME required.", competition:"Very High" },
    "Law": { minJamb:260, recommendedJamb:300, postUtmeWeight:true, notes:"Very competitive. High Post-UTME score needed.", competition:"Very High" },
    "Engineering": { minJamb:240, recommendedJamb:280, postUtmeWeight:true, notes:"Competitive. Physics and Maths must be strong.", competition:"High" },
    "Computer Science": { minJamb:240, recommendedJamb:275, postUtmeWeight:true, notes:"Competitive. Growing demand.", competition:"High" },
    "Pharmacy": { minJamb:250, recommendedJamb:285, postUtmeWeight:true, notes:"Very competitive science course.", competition:"Very High" },
    "Accounting": { minJamb:220, recommendedJamb:260, postUtmeWeight:true, notes:"Moderate competition.", competition:"High" },
    "Economics": { minJamb:220, recommendedJamb:255, postUtmeWeight:true, notes:"Moderate to high competition.", competition:"High" },
    "Mass Communication": { minJamb:210, recommendedJamb:250, postUtmeWeight:true, notes:"Popular course. Moderate competition.", competition:"High" },
    "Education": { minJamb:180, recommendedJamb:220, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Architecture": { minJamb:240, recommendedJamb:270, postUtmeWeight:true, notes:"Portfolio may be required.", competition:"High" },
    "Nursing": { minJamb:240, recommendedJamb:275, postUtmeWeight:true, notes:"Very competitive health science.", competition:"Very High" },
    "Agriculture": { minJamb:180, recommendedJamb:220, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
  },
  "University of Ibadan": {
    "Medicine & Surgery": { minJamb:280, recommendedJamb:320, postUtmeWeight:true, notes:"Nigeria's premier university. Extremely competitive.", competition:"Very High" },
    "Law": { minJamb:260, recommendedJamb:295, postUtmeWeight:true, notes:"Very competitive at UI.", competition:"Very High" },
    "Engineering": { minJamb:230, recommendedJamb:270, postUtmeWeight:true, notes:"Strong engineering faculty.", competition:"High" },
    "Computer Science": { minJamb:230, recommendedJamb:265, postUtmeWeight:true, notes:"Growing tech course.", competition:"High" },
    "Pharmacy": { minJamb:250, recommendedJamb:280, postUtmeWeight:true, notes:"Highly competitive.", competition:"Very High" },
    "Accounting": { minJamb:210, recommendedJamb:250, postUtmeWeight:true, notes:"Moderate competition.", competition:"Moderate" },
    "Economics": { minJamb:210, recommendedJamb:248, postUtmeWeight:true, notes:"Strong economics faculty.", competition:"High" },
    "Mass Communication": { minJamb:200, recommendedJamb:240, postUtmeWeight:true, notes:"Moderate competition.", competition:"Moderate" },
    "Education": { minJamb:180, recommendedJamb:215, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Agriculture": { minJamb:180, recommendedJamb:215, postUtmeWeight:true, notes:"Strong agric faculty at UI.", competition:"Low" },
    "Nursing": { minJamb:230, recommendedJamb:265, postUtmeWeight:true, notes:"Competitive health course.", competition:"Very High" },
    "Architecture": { minJamb:220, recommendedJamb:258, postUtmeWeight:true, notes:"Good architecture program.", competition:"High" },
  },
  "OAU Ile-Ife": {
    "Medicine & Surgery": { minJamb:275, recommendedJamb:315, postUtmeWeight:true, notes:"Top medical school in Nigeria.", competition:"Very High" },
    "Law": { minJamb:255, recommendedJamb:290, postUtmeWeight:true, notes:"Very competitive.", competition:"Very High" },
    "Engineering": { minJamb:230, recommendedJamb:268, postUtmeWeight:true, notes:"Strong engineering at OAU.", competition:"High" },
    "Computer Science": { minJamb:225, recommendedJamb:262, postUtmeWeight:true, notes:"Good CS department.", competition:"High" },
    "Pharmacy": { minJamb:245, recommendedJamb:278, postUtmeWeight:true, notes:"Very competitive.", competition:"Very High" },
    "Accounting": { minJamb:210, recommendedJamb:248, postUtmeWeight:true, notes:"Moderate competition.", competition:"Moderate" },
    "Economics": { minJamb:210, recommendedJamb:245, postUtmeWeight:true, notes:"Moderate competition.", competition:"Moderate" },
    "Mass Communication": { minJamb:200, recommendedJamb:235, postUtmeWeight:true, notes:"Moderate competition.", competition:"Moderate" },
    "Education": { minJamb:180, recommendedJamb:215, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Architecture": { minJamb:220, recommendedJamb:255, postUtmeWeight:true, notes:"Architecture is competitive.", competition:"High" },
    "Nursing": { minJamb:230, recommendedJamb:262, postUtmeWeight:true, notes:"Competitive.", competition:"Very High" },
    "Agriculture": { minJamb:180, recommendedJamb:212, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
  },
  "UNIBEN": {
    "Medicine & Surgery": { minJamb:260, recommendedJamb:300, postUtmeWeight:true, notes:"Very competitive at UNIBEN.", competition:"Very High" },
    "Law": { minJamb:240, recommendedJamb:278, postUtmeWeight:true, notes:"Competitive law faculty.", competition:"High" },
    "Engineering": { minJamb:220, recommendedJamb:258, postUtmeWeight:true, notes:"Good engineering faculty.", competition:"High" },
    "Computer Science": { minJamb:220, recommendedJamb:255, postUtmeWeight:true, notes:"Recommended target for safe admission.", competition:"High" },
    "Pharmacy": { minJamb:235, recommendedJamb:268, postUtmeWeight:true, notes:"Competitive health course.", competition:"Very High" },
    "Accounting": { minJamb:200, recommendedJamb:238, postUtmeWeight:true, notes:"Moderate competition.", competition:"Moderate" },
    "Economics": { minJamb:200, recommendedJamb:235, postUtmeWeight:true, notes:"Moderate competition.", competition:"Moderate" },
    "Mass Communication": { minJamb:195, recommendedJamb:228, postUtmeWeight:true, notes:"Moderate competition.", competition:"Moderate" },
    "Education": { minJamb:180, recommendedJamb:210, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Architecture": { minJamb:210, recommendedJamb:245, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
    "Nursing": { minJamb:225, recommendedJamb:258, postUtmeWeight:true, notes:"Competitive health course.", competition:"Very High" },
    "Agriculture": { minJamb:180, recommendedJamb:210, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
  },
  "UNILORIN": {
    "Medicine & Surgery": { minJamb:265, recommendedJamb:305, postUtmeWeight:true, notes:"Competitive medical school.", competition:"Very High" },
    "Law": { minJamb:245, recommendedJamb:280, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
    "Engineering": { minJamb:220, recommendedJamb:258, postUtmeWeight:true, notes:"Good engineering faculty.", competition:"High" },
    "Computer Science": { minJamb:218, recommendedJamb:252, postUtmeWeight:true, notes:"Good CS department.", competition:"High" },
    "Pharmacy": { minJamb:238, recommendedJamb:270, postUtmeWeight:true, notes:"Competitive.", competition:"Very High" },
    "Accounting": { minJamb:200, recommendedJamb:235, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Economics": { minJamb:200, recommendedJamb:232, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Mass Communication": { minJamb:195, recommendedJamb:225, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Education": { minJamb:180, recommendedJamb:210, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Agriculture": { minJamb:180, recommendedJamb:208, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Nursing": { minJamb:225, recommendedJamb:255, postUtmeWeight:true, notes:"Competitive.", competition:"Very High" },
    "Architecture": { minJamb:210, recommendedJamb:242, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
  },
  "ABU Zaria": {
    "Medicine & Surgery": { minJamb:255, recommendedJamb:292, postUtmeWeight:true, notes:"Competitive.", competition:"Very High" },
    "Law": { minJamb:235, recommendedJamb:268, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
    "Engineering": { minJamb:215, recommendedJamb:250, postUtmeWeight:true, notes:"Good engineering.", competition:"High" },
    "Computer Science": { minJamb:212, recommendedJamb:245, postUtmeWeight:true, notes:"Growing department.", competition:"Moderate" },
    "Pharmacy": { minJamb:230, recommendedJamb:262, postUtmeWeight:true, notes:"Competitive.", competition:"Very High" },
    "Accounting": { minJamb:195, recommendedJamb:228, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Economics": { minJamb:195, recommendedJamb:225, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Agriculture": { minJamb:180, recommendedJamb:205, postUtmeWeight:true, notes:"Good agric faculty.", competition:"Low" },
    "Education": { minJamb:180, recommendedJamb:205, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Mass Communication": { minJamb:190, recommendedJamb:220, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Nursing": { minJamb:218, recommendedJamb:248, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
    "Architecture": { minJamb:205, recommendedJamb:238, postUtmeWeight:true, notes:"Moderate.", competition:"High" },
  },
  "University of Nigeria Nsukka": {
    "Medicine & Surgery": { minJamb:260, recommendedJamb:298, postUtmeWeight:true, notes:"Competitive.", competition:"Very High" },
    "Law": { minJamb:240, recommendedJamb:272, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
    "Engineering": { minJamb:215, recommendedJamb:252, postUtmeWeight:true, notes:"Good engineering.", competition:"High" },
    "Computer Science": { minJamb:215, recommendedJamb:248, postUtmeWeight:true, notes:"Growing CS department.", competition:"High" },
    "Pharmacy": { minJamb:232, recommendedJamb:264, postUtmeWeight:true, notes:"Competitive.", competition:"Very High" },
    "Accounting": { minJamb:195, recommendedJamb:228, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Economics": { minJamb:195, recommendedJamb:226, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Mass Communication": { minJamb:190, recommendedJamb:222, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Education": { minJamb:180, recommendedJamb:208, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Agriculture": { minJamb:180, recommendedJamb:205, postUtmeWeight:true, notes:"Strong agric faculty.", competition:"Low" },
    "Nursing": { minJamb:220, recommendedJamb:252, postUtmeWeight:true, notes:"Competitive.", competition:"Very High" },
    "Architecture": { minJamb:208, recommendedJamb:240, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
  },
  "LASU": {
    "Medicine & Surgery": { minJamb:250, recommendedJamb:285, postUtmeWeight:true, notes:"Competitive at LASU.", competition:"Very High" },
    "Law": { minJamb:230, recommendedJamb:262, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
    "Engineering": { minJamb:210, recommendedJamb:245, postUtmeWeight:true, notes:"Good engineering faculty.", competition:"High" },
    "Computer Science": { minJamb:208, recommendedJamb:240, postUtmeWeight:true, notes:"Moderate competition.", competition:"Moderate" },
    "Accounting": { minJamb:192, recommendedJamb:222, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Economics": { minJamb:190, recommendedJamb:220, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Mass Communication": { minJamb:188, recommendedJamb:215, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Education": { minJamb:180, recommendedJamb:205, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Pharmacy": { minJamb:225, recommendedJamb:255, postUtmeWeight:true, notes:"Competitive.", competition:"Very High" },
    "Nursing": { minJamb:215, recommendedJamb:245, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
    "Agriculture": { minJamb:180, recommendedJamb:205, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Architecture": { minJamb:200, recommendedJamb:232, postUtmeWeight:true, notes:"Moderate.", competition:"High" },
  },
  "UNIPORT": {
    "Medicine & Surgery": { minJamb:255, recommendedJamb:290, postUtmeWeight:true, notes:"Competitive.", competition:"Very High" },
    "Law": { minJamb:232, recommendedJamb:265, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
    "Engineering": { minJamb:212, recommendedJamb:248, postUtmeWeight:true, notes:"Good engineering.", competition:"High" },
    "Computer Science": { minJamb:210, recommendedJamb:242, postUtmeWeight:true, notes:"Moderate competition.", competition:"Moderate" },
    "Pharmacy": { minJamb:228, recommendedJamb:258, postUtmeWeight:true, notes:"Competitive.", competition:"Very High" },
    "Accounting": { minJamb:192, recommendedJamb:222, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Economics": { minJamb:190, recommendedJamb:220, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Mass Communication": { minJamb:188, recommendedJamb:215, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Education": { minJamb:180, recommendedJamb:205, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Agriculture": { minJamb:180, recommendedJamb:205, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Nursing": { minJamb:215, recommendedJamb:245, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
    "Architecture": { minJamb:200, recommendedJamb:232, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
  },
  "FUTO": {
    "Engineering": { minJamb:210, recommendedJamb:245, postUtmeWeight:true, notes:"Strong engineering faculty at FUTO.", competition:"High" },
    "Computer Science": { minJamb:205, recommendedJamb:238, postUtmeWeight:true, notes:"Good CS department.", competition:"Moderate" },
    "Architecture": { minJamb:195, recommendedJamb:228, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Agriculture": { minJamb:180, recommendedJamb:205, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Education": { minJamb:180, recommendedJamb:205, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Accounting": { minJamb:188, recommendedJamb:218, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Economics": { minJamb:185, recommendedJamb:215, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Mass Communication": { minJamb:183, recommendedJamb:212, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Medicine & Surgery": { minJamb:245, recommendedJamb:278, postUtmeWeight:true, notes:"Competitive.", competition:"Very High" },
    "Pharmacy": { minJamb:220, recommendedJamb:250, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
    "Nursing": { minJamb:210, recommendedJamb:240, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
    "Law": { minJamb:225, recommendedJamb:255, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
  },
  "FUNAAB": {
    "Agriculture": { minJamb:180, recommendedJamb:205, postUtmeWeight:true, notes:"FUNAAB's strongest faculty.", competition:"Low" },
    "Engineering": { minJamb:200, recommendedJamb:232, postUtmeWeight:true, notes:"Good engineering.", competition:"Moderate" },
    "Computer Science": { minJamb:198, recommendedJamb:228, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Education": { minJamb:180, recommendedJamb:205, postUtmeWeight:true, notes:"Lower competition.", competition:"Low" },
    "Accounting": { minJamb:185, recommendedJamb:215, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Economics": { minJamb:183, recommendedJamb:212, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Nursing": { minJamb:205, recommendedJamb:235, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
    "Mass Communication": { minJamb:180, recommendedJamb:210, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
    "Medicine & Surgery": { minJamb:240, recommendedJamb:272, postUtmeWeight:true, notes:"Competitive.", competition:"Very High" },
    "Pharmacy": { minJamb:215, recommendedJamb:245, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
    "Law": { minJamb:218, recommendedJamb:248, postUtmeWeight:true, notes:"Competitive.", competition:"High" },
    "Architecture": { minJamb:192, recommendedJamb:222, postUtmeWeight:true, notes:"Moderate.", competition:"Moderate" },
  },
};

export function getCutoff(university: string, course: string): CutoffData {
  const uniData = CUTOFF_DB[university];
  if (!uniData) return DEFAULT;
  return uniData[course] || DEFAULT;
}

export function getAdmissionProbability(targetScore: number, cutoff: CutoffData): { percent: number; label: string; color: string } {
  const diff = targetScore - cutoff.recommendedJamb;
  if (targetScore < cutoff.minJamb) return { percent: 5, label: "Very Unlikely", color: "#dc2626" };
  if (diff >= 30) return { percent: 95, label: "Excellent Chance", color: "#16a34a" };
  if (diff >= 15) return { percent: 80, label: "Very Good Chance", color: "#16a34a" };
  if (diff >= 0) return { percent: 65, label: "Good Chance", color: "#2563eb" };
  if (diff >= -15) return { percent: 40, label: "Possible", color: "#d97706" };
  if (diff >= -30) return { percent: 20, label: "Risky", color: "#ea580c" };
  return { percent: 8, label: "Very Unlikely", color: "#dc2626" };
}

export function getSmartRecommendation(university: string, course: string): string {
  const cutoff = getCutoff(university, course);
  const comp = cutoff.competition;
  const safe = cutoff.recommendedJamb;
  const min = cutoff.minJamb;

  const compText = comp === "Very High" ? "extremely competitive" : comp === "High" ? "highly competitive" : comp === "Moderate" ? "moderately competitive" : "less competitive";

  return `${university} ${course} is ${compText}. The minimum JAMB score is ${min}, but we recommend targeting ${safe} for a strong chance of admission. ${cutoff.notes}`;
}
