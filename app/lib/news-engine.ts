/**
 * news-engine.ts  — v2 (stabilised)
 *
 * Changes from v1:
 *  - Image extraction from RSS enclosure / media:content / media:thumbnail / <img> in description
 *  - Deterministic fallback image pool (education-themed Unsplash, assigned by article hash)
 *  - isRelevantTitle() now applied to ALL sources including google_rss
 *  - Minimum relevance threshold: articles scoring < 15 are dropped
 *  - JAMB-specific Google News queries (no broad education queries)
 *  - `time` field added as alias for `timeAgo` (backward-compatible with UI)
 *  - Image URL validation (must start with http, no tracking pixels)
 */

export interface NewsArticle {
  id:        string;
  title:     string;
  url:       string;
  source:    string;
  pubDate:   number;    // Unix ms
  timeAgo:   string;
  time:      string;    // alias for timeAgo — used by existing UI
  category:  string;
  relevance: number;    // 0-100
  image:     string;    // always populated — real or fallback
  summary:   string;    // always populated
}

// ── Server-side in-memory cache ───────────────────────────────────────────────
interface CacheEntry {
  articles:  NewsArticle[];
  fetchedAt: number;
  source:    string;
}

let _cache: CacheEntry | null = null;

export const CACHE_TTL_MS    = 15 * 60 * 1000;   // 15 min — serve from cache
export const CACHE_STALE_MS  = 30 * 60 * 1000;   // 30 min — force refresh
const ARTICLE_MAX_AGE_MS     = 7 * 24 * 3600_000; // 7 days max article age
const FETCH_TIMEOUT_MS       = 7_000;             // 7s per source

// ── Fallback image pool ───────────────────────────────────────────────────────
// Education-themed, stable Unsplash URLs. Assigned deterministically by article hash.
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&q=75", // student studying
  "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=200&q=75", // writing notes
  "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=200&q=75", // exam hall
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&q=75", // school building
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&q=75", // library books
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&q=75", // graduation cap
  "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=200&q=75", // classroom
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&q=75", // open books
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200&q=75", // university
  "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=200&q=75", // lecture
];

function fallbackImage(articleId: string): string {
  // Deterministic index from the article id string
  let n = 0;
  for (let i = 0; i < articleId.length; i++) {
    n = (n * 31 + articleId.charCodeAt(i)) & 0xffff;
  }
  return FALLBACK_IMAGES[n % FALLBACK_IMAGES.length];
}

// ── Sources — JAMB-focused only ───────────────────────────────────────────────
interface Source { name: string; url: string; quality: number; type: "rss" | "google_rss"; }

const SOURCES: Source[] = [
  // Google News — JAMB-specific queries only
  {
    name: "Google News",
    url:  "https://news.google.com/rss/search?q=JAMB+2025+Nigeria&hl=en-NG&gl=NG&ceid=NG:en",
    quality: 5, type: "google_rss",
  },
  {
    name: "Google News",
    url:  "https://news.google.com/rss/search?q=JAMB+UTME+registration+result&hl=en-NG&gl=NG&ceid=NG:en",
    quality: 5, type: "google_rss",
  },
  {
    name: "Google News",
    url:  "https://news.google.com/rss/search?q=Nigeria+university+admission+cutoff+2025&hl=en-NG&gl=NG&ceid=NG:en",
    quality: 4, type: "google_rss",
  },
  {
    name: "Google News",
    url:  "https://news.google.com/rss/search?q=WAEC+NECO+result+Nigeria+2025&hl=en-NG&gl=NG&ceid=NG:en",
    quality: 4, type: "google_rss",
  },

  // Nigerian education RSS feeds
  { name: "Vanguard Education", url: "https://www.vanguardngr.com/category/education/feed/",             quality: 4, type: "rss" },
  { name: "Punch Nigeria",      url: "https://punchng.com/category/education/feed/",                    quality: 4, type: "rss" },
  { name: "The Guardian NG",    url: "https://guardian.ng/category/features/education/feed/",            quality: 4, type: "rss" },
  { name: "Daily Post NG",      url: "https://dailypost.ng/category/education/feed/",                    quality: 3, type: "rss" },
  { name: "The Cable NG",       url: "https://www.thecable.ng/category/lifestyle/education/feed",        quality: 3, type: "rss" },
];

// ── Keyword sets ──────────────────────────────────────────────────────────────

// ANY of these must be present — articles without them are dropped
const REQUIRED_KEYWORDS = [
  "jamb", "utme", "post-utme", "post utme", "postutme",
  "admission", "waec", "neco", "nabteb",
  "university", "polytechnic", "college of education", "federal university",
  "state university", "uniben", "unilag", "oau", "ui ibadan", "unilorin",
  "abu zaria", "unn nsukka", "lasu", "uniport", "futo", "funaab",
  "cut-off", "cutoff", "jamb result", "screening", "matriculation",
  "scholarship nigeria", "bursary", "nigerian student",
  "nuc nigeria", "education nigeria", "ministry of education nigeria",
];

// These boost the relevance score
const HIGH_RELEVANCE_KW = [
  "jamb", "utme", "post-utme", "post utme", "admission 2025",
  "jamb 2025", "utme 2025", "registration", "cut-off", "cutoff",
  "result 2025", "screening 2025",
];

const MEDIUM_RELEVANCE_KW = [
  "waec", "neco", "university", "polytechnic", "student", "education",
  "scholarship", "degree", "faculty", "academic", "examination",
];

// ── Utilities ─────────────────────────────────────────────────────────────────

function parseDate(raw: string): number {
  if (!raw) return 0;
  try { const d = new Date(raw); return isNaN(d.getTime()) ? 0 : d.getTime(); }
  catch { return 0; }
}

export function formatTimeAgo(ts: number): string {
  if (!ts) return "Recently";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1)   return "Just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function titleFingerprint(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim()
    .split(" ").slice(0, 7).join(" ");
}

function articleId(title: string, source: string): string {
  const s = (title + source).toLowerCase().slice(0, 80);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/\s+/g, " ").trim();
}

function xmlField(block: string, tag: string): string {
  const cdata = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i");
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(cdata) || block.match(plain);
  return m ? decodeEntities(m[1].trim()) : "";
}

/**
 * Extract image URL from an RSS item block.
 * Tries: enclosure → media:content/thumbnail → <img> in description
 * Returns empty string if nothing found.
 */
function extractImage(block: string): string {
  // 1. enclosure tag
  const enc1 = block.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image\//i);
  const enc2 = block.match(/<enclosure[^>]+type="image\/[^"]*"[^>]+url="([^"]+)"/i);
  if (enc1?.[1]) return enc1[1];
  if (enc2?.[1]) return enc2[1];

  // 2. media:content with medium=image
  const mc1 = block.match(/<media:content[^>]+url="([^"]+)"[^>]+medium="image"/i);
  const mc2 = block.match(/<media:content[^>]+medium="image"[^>]+url="([^"]+)"/i);
  if (mc1?.[1]) return mc1[1];
  if (mc2?.[1]) return mc2[1];

  // 3. media:thumbnail
  const thumb = block.match(/<media:thumbnail[^>]+url="([^"]+)"/i);
  if (thumb?.[1]) return thumb[1];

  // 4. media:content (any, not just image medium)
  const mc3 = block.match(/<media:content[^>]+url="([^"]+)"/i);
  if (mc3?.[1] && !mc3[1].includes(".mp4") && !mc3[1].includes(".mp3")) return mc3[1];

  // 5. <image> tag inside item
  const imgTag = block.match(/<image>\s*<url>([^<]+)<\/url>/i);
  if (imgTag?.[1]) return imgTag[1];

  // 6. First <img src="..."> inside description or content:encoded
  const descBlock = xmlField(block, "description") || xmlField(block, "content:encoded");
  const imgSrc = descBlock.match(/<img[^>]+src="([^"]+)"/i);
  if (imgSrc?.[1]) return imgSrc[1];

  return "";
}

/** Validate an image URL — must be http/https, not a tracking pixel, reasonable extension */
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  if (!url.startsWith("http")) return false;
  // Skip tiny tracking pixels
  if (/[?&](w|width|size)=[1-9]\b/.test(url)) {
    const wMatch = url.match(/[?&](?:w|width)=(\d+)/);
    if (wMatch && parseInt(wMatch[1]) < 50) return false;
  }
  // Skip known tracker/ad domains
  if (/doubleclick|googlesyndication|adnxs|pixel\./.test(url)) return false;
  return true;
}

/** Build a short summary from a title (UI uses this for the subtitle line) */
function buildSummary(title: string, source: string): string {
  // RSS descriptions are often HTML-heavy — just use the title as summary context
  return `From ${source} — tap to read the full story.`;
}

/** Is this title relevant to Nigerian students? Both a filter and a minimum bar. */
function isRelevantTitle(title: string): boolean {
  const t = title.toLowerCase();
  return REQUIRED_KEYWORDS.some(kw => t.includes(kw));
}

/** Score an article 0-100 (freshness + keyword weight) */
function scoreRelevance(title: string, pubDate: number): number {
  const t = title.toLowerCase();
  let score = 0;

  // Freshness (0–50 pts)
  const ageH = (Date.now() - pubDate) / 3_600_000;
  if (ageH < 1)   score += 50;
  else if (ageH < 6)  score += 42;
  else if (ageH < 24) score += 32;
  else if (ageH < 48) score += 22;
  else if (ageH < 72) score += 14;
  else if (ageH < 120) score += 8;
  else                 score += 2;

  // High-relevance keywords (0–30 pts, up to 6 matches × 5)
  let hi = 0;
  for (const kw of HIGH_RELEVANCE_KW) {
    if (t.includes(kw)) { hi += 5; if (hi >= 30) break; }
  }
  score += hi;

  // Medium keywords (0–20 pts)
  let med = 0;
  for (const kw of MEDIUM_RELEVANCE_KW) {
    if (t.includes(kw)) { med += 4; if (med >= 20) break; }
  }
  score += med;

  return Math.min(100, score);
}

/** Assign category */
export function categorise(title: string): string {
  const t = title.toLowerCase();
  if (/\bjamb\b|\butme\b|cbt centre/.test(t))                return "JAMB";
  if (/exam|waec|neco|nabteb|result|test/.test(t))           return "Exams";
  if (/admission|cutoff|cut.off|screening|post.utme/.test(t)) return "Admissions";
  if (/scholarship|bursary|award|grant|fellowship/.test(t))  return "Scholarships";
  if (/universit|polytechni|college|nuc|faculty/.test(t))    return "Education";
  if (/tech|portal|digital|online|software|app/.test(t))     return "Tech";
  return "Education"; // default to Education, not General
}

// ── Fetch a single source ─────────────────────────────────────────────────────

async function fetchSource(src: Source): Promise<NewsArticle[]> {
  const t0 = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(src.url, {
      signal: controller.signal,
      cache:  "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CompanionNewsBot/2.0)",
        "Accept":     "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[news] ${src.name} HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();
    console.log(`[news] ${src.name} fetched in ${Date.now() - t0}ms`);

    const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
    const out: NewsArticle[] = [];

    for (const item of items) {
      // Title — for Google RSS, strip the " - Source Name" suffix
      let title = xmlField(item, "title");
      if (src.type === "google_rss") title = title.replace(/ - [^-]{2,40}$/, "").trim();
      if (!title || title.length < 12) continue;

      // Relevance filter — applied to ALL sources (was missing for google_rss in v1)
      if (!isRelevantTitle(title)) continue;

      const link    = (item.match(/<link>(.*?)<\/link>/i)?.[1] ?? xmlField(item, "link")) || "#";
      const pubDate = parseDate(xmlField(item, "pubDate"));
      if (!pubDate)                              continue; // no date = likely stale
      if (Date.now() - pubDate > ARTICLE_MAX_AGE_MS) continue; // too old

      const sourceName = xmlField(item, "source") || src.name;
      const id         = articleId(title, sourceName);
      const relevance  = scoreRelevance(title, pubDate);

      // Minimum relevance threshold — drop noise
      if (relevance < 15) continue;

      // Image: try real extraction first, fall back to deterministic pool
      const rawImage  = extractImage(item);
      const image     = isValidImageUrl(rawImage) ? rawImage : fallbackImage(id);
      const timeStr   = formatTimeAgo(pubDate);

      out.push({
        id,
        title,
        url:       link.startsWith("http") ? link : "#",
        source:    sourceName,
        pubDate,
        timeAgo:   timeStr,
        time:      timeStr,   // ← alias: UI uses item.time
        category:  categorise(title),
        relevance,
        image,
        summary:   buildSummary(title, sourceName),
      });
    }

    return out;
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(`[news] ${src.name} failed: ${err?.name === "AbortError" ? "timeout" : String(err?.message).slice(0, 80)}`);
    return [];
  }
}

// ── Dedup ─────────────────────────────────────────────────────────────────────

function deduplicate(articles: NewsArticle[]): NewsArticle[] {
  const ids = new Set<string>();
  const fps = new Set<string>();
  return articles.filter(a => {
    if (ids.has(a.id))                   return false;
    const fp = titleFingerprint(a.title);
    if (fps.has(fp))                     return false;
    ids.add(a.id);
    fps.add(fp);
    return true;
  });
}

// ── Fallback articles (rolling timestamps) ────────────────────────────────────

function makeFallback(): NewsArticle[] {
  const now = Date.now();
  const raw = [
    { title: "JAMB 2025 UTME Registration Portal Open — Apply Before Deadline",          t: now - 2   * 3600_000, src: "JAMB Official" },
    { title: "JAMB Releases Updated Syllabus and Subject Combinations for UTME 2025",    t: now - 5   * 3600_000, src: "JAMB Official" },
    { title: "JAMB 2025: How to Check Your UTME Result and Download Scorecard",          t: now - 28  * 3600_000, src: "JAMB Guide NG" },
    { title: "Post-UTME 2025: Universities Begin Screening — Requirements Released",      t: now - 52  * 3600_000, src: "Education News" },
    { title: "JAMB Cut-Off Marks for All Federal and State Universities 2025",            t: now - 52  * 3600_000, src: "Universities NG" },
    { title: "WAEC and NECO Results Acceptance Policy — What JAMB Now Requires",         t: now - 76  * 3600_000, src: "JAMB Official" },
    { title: "How to Score 300+ in JAMB UTME: Proven Study Strategies from Experts",     t: now - 76  * 3600_000, src: "Study Guide NG" },
    { title: "JAMB CBT Centres: Full List of Approved Computer-Based Test Centres 2025", t: now - 124 * 3600_000, src: "JAMB Official" },
  ];

  return raw.map(r => {
    const id       = articleId(r.title, r.src);
    const timeStr  = formatTimeAgo(r.t);
    return {
      id,
      title:     r.title,
      url:       "https://www.jamb.gov.ng",
      source:    r.src,
      pubDate:   r.t,
      timeAgo:   timeStr,
      time:      timeStr,
      category:  categorise(r.title),
      relevance: scoreRelevance(r.title, r.t),
      image:     fallbackImage(id),
      summary:   buildSummary(r.title, r.src),
    };
  });
}

// ── Main: stale-while-revalidate ─────────────────────────────────────────────

async function fetchAll(): Promise<{ articles: NewsArticle[]; source: string }> {
  console.log("[news] Parallel fetch starting");
  const t0 = Date.now();

  const settled = await Promise.allSettled(SOURCES.map(fetchSource));
  let all: NewsArticle[] = [];
  let ok = 0;

  settled.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.length > 0) {
      all.push(...r.value);
      ok++;
    } else if (r.status === "rejected") {
      console.warn(`[news] Source ${i} rejected:`, r.reason);
    }
  });

  console.log(`[news] ${ok}/${SOURCES.length} sources OK, ${all.length} raw articles (${Date.now()-t0}ms)`);

  const unique = deduplicate(all);
  unique.sort((a, b) => b.relevance - a.relevance);
  const top = unique.slice(0, 20);

  if (top.length >= 3) {
    console.log(`[news] ${top.length} articles ready. Top: "${top[0].title}"`);
    return { articles: top, source: "live" };
  }

  console.warn("[news] Not enough live articles, using fallback");
  return { articles: makeFallback(), source: "fallback" };
}

export async function getNews(): Promise<{
  articles:  NewsArticle[];
  source:    string;
  cacheAge?: number;
}> {
  // Fresh cache
  if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL_MS) {
    const cacheAge = Math.round((Date.now() - _cache.fetchedAt) / 60_000);
    console.log(`[news] Cache hit (${cacheAge}min old)`);
    // Recalculate timeAgo/time on every read so it stays accurate
    const articles = _cache.articles.map(a => {
      const t = formatTimeAgo(a.pubDate);
      return { ...a, timeAgo: t, time: t };
    });
    return { articles, source: _cache.source + "-cache", cacheAge };
  }

  // Stale cache (15-30min) — serve immediately, refresh in background
  if (_cache && Date.now() - _cache.fetchedAt < CACHE_STALE_MS) {
    const cacheAge = Math.round((Date.now() - _cache.fetchedAt) / 60_000);
    console.log(`[news] Stale cache (${cacheAge}min), background refresh`);

    fetchAll().then(r => {
      _cache = { articles: r.articles, fetchedAt: Date.now(), source: r.source };
    }).catch(e => console.warn("[news] BG refresh failed:", e));

    const articles = _cache.articles.map(a => {
      const t = formatTimeAgo(a.pubDate);
      return { ...a, timeAgo: t, time: t };
    });
    return { articles, source: _cache.source + "-stale", cacheAge };
  }

  // Empty or very stale — fetch synchronously
  console.log("[news] Cache empty/expired, fetching now");
  const r = await fetchAll();
  _cache  = { articles: r.articles, fetchedAt: Date.now(), source: r.source };
  const articles = _cache.articles.map(a => {
    const t = formatTimeAgo(a.pubDate);
    return { ...a, timeAgo: t, time: t };
  });
  return { articles, source: r.source };
}
