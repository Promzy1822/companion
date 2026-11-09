import {
  Home, BookOpen, Bot, Target, CalendarDays, ListChecks, User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  icon:  LucideIcon;
  label: string;
  href:  string;
  match: string[];
  center?: boolean;
}

/** The one navigation definition for the whole app: bottom tabs, laptop rail and the avatar menu all read this. */
export const NAV_ITEMS: NavItem[] = [
  { icon: Home,        label: "Home",     href: "/",                    match: ["/"] },
  { icon: BookOpen,    label: "Learn",    href: "/subjects?mode=learn", match: ["/subjects", "/learn", "/lessons"] },
  { icon: Bot,         label: "AI",       href: "/ai",                  match: ["/ai"], center: true },
  { icon: Target,      label: "Practice", href: "/practice", match: ["/practice", "/questions", "/mock"] },
  { icon: CalendarDays,label: "Plan",     href: "/studyplan",           match: ["/studyplan", "/syllabus"] },
];

/** Secondary destinations (rail + avatar menu only) until they are absorbed: Syllabus into Plan (step 3), Profile into the account sheet (step 5). */
export const NAV_SECONDARY: NavItem[] = [
  { icon: ListChecks, label: "Syllabus", href: "/syllabus", match: ["/syllabus"] },
  { icon: User,       label: "Profile",  href: "/profile",  match: ["/profile"] },
];

export function isNavActive(pathname: string, match: string[]): boolean {
  return match.some(m =>
    m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(m + "/")
  );
}
