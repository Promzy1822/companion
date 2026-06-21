/**
 * app/loading.tsx
 *
 * This file exists to satisfy Next.js route segment conventions.
 * We return null here because:
 * 1. All pages are client components — this rarely fires anyway
 * 2. The cold-start splash in layout.tsx handles initial load
 * 3. Page transitions should be instant with no intermediate screen
 * 4. Each page's !mounted guard returns null for a clean handoff
 */
export default function Loading() {
  return null;
}
