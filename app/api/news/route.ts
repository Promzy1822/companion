import { NextResponse } from 'next/server';

export const revalidate = 1800;

interface NewsItem {
  title: string;
  url: string;
  source: string;
  time: string;
}

async function fetchFromGoogleNews(): Promise<NewsItem[]> {
  try {
    const queries = [
      'JAMB+UTME+2025',
      'JAMB+Nigeria+admission',
      'JAMB+registration+result',
    ];
    const results: NewsItem[] = [];

    for (const q of queries) {
      const url = `https://news.google.com/rss/search?q=${q}&hl=en-NG&gl=NG&ceid=NG:en`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 1800 },
      });
      if (!res.ok) continue;
      const xml = await res.text();

      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of items.slice(0, 4)) {
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                      item.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '#';
        const source = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || 'Google News';
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
        if (title && !results.find(r => r.title === title)) {
          results.push({ title: cleanTitle(title), url: link, source, time: timeAgo(pubDate) });
        }
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function fetchJAMBRSS(): Promise<NewsItem[]> {
  try {
    const feeds = [
      { url: 'https://www.vanguardngr.com/category/education/feed/', source: 'Vanguard Education' },
      { url: 'https://guardian.ng/category/features/education/feed/', source: 'Guardian Nigeria' },
      { url: 'https://punchng.com/category/education/feed/', source: 'Punch Nigeria' },
      { url: 'https://www.thecable.ng/category/lifestyle/education/feed', source: 'The Cable' },
    ];
    const results: NewsItem[] = [];

    for (const feed of feeds) {
      try {
        const res = await fetch(feed.url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000),
          next: { revalidate: 1800 },
        });
        if (!res.ok) continue;
        const xml = await res.text();
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

        for (const item of items.slice(0, 3)) {
          const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                        item.match(/<title>(.*?)<\/title>/)?.[1] || '';
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '#';
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';

          const isRelevant = /jamb|utme|post.utme|admission|waec|neco|university|polytechnic/i.test(title);
          if (title && isRelevant && !results.find(r => r.title === title)) {
            results.push({ title: cleanTitle(title), url: link, source: feed.source, time: timeAgo(pubDate) });
          }
        }
      } catch { continue; }
    }
    return results;
  } catch {
    return [];
  }
}

function cleanTitle(title: string): string {
  return title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return 'Recent';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return m < 2 ? 'Just now' : `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return `${Math.floor(d / 7)}w ago`;
  } catch { return 'Recent'; }
}

function getFallback(): NewsItem[] {
  return [
    { title: "JAMB 2025 UTME: Registration Portal Open — Apply Now", url: "https://www.jamb.gov.ng", source: "JAMB Official", time: "Today" },
    { title: "JAMB Releases Updated Syllabus for 2025 UTME", url: "https://www.jamb.gov.ng", source: "JAMB Official", time: "2d ago" },
    { title: "How to Check Your JAMB Result and Download Scorecard", url: "https://www.jamb.gov.ng", source: "JAMB Guide", time: "3d ago" },
    { title: "Post-UTME 2025: Universities Begin Screening Exercise", url: "#", source: "Education News", time: "1w ago" },
    { title: "JAMB Cut-Off Marks for Universities, Polytechnics 2025", url: "#", source: "Universities NG", time: "1w ago" },
    { title: "WAEC, NECO Results Acceptance: What JAMB Requires", url: "#", source: "Edu Guide", time: "2w ago" },
  ];
}

export async function GET() {
  try {
    const [googleNews, rssNews] = await Promise.allSettled([
      fetchFromGoogleNews(),
      fetchJAMBRSS(),
    ]);

    const google = googleNews.status === 'fulfilled' ? googleNews.value : [];
    const rss = rssNews.status === 'fulfilled' ? rssNews.value : [];

    let combined = [...google, ...rss];

    // Deduplicate by similar titles
    const seen = new Set<string>();
    combined = combined.filter(item => {
      const key = item.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const news = combined.length >= 3 ? combined.slice(0, 10) : getFallback();
    return NextResponse.json({ news, source: combined.length >= 3 ? 'live' : 'fallback' });
  } catch {
    return NextResponse.json({ news: getFallback(), source: 'fallback' });
  }
}
