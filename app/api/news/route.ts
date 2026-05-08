import { NextResponse } from 'next/server';
export const revalidate = 0;

function timeAgo(d: string) {
  try {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 2) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const dy = Math.floor(h / 24);
    return dy < 7 ? `${dy}d ago` : `${Math.floor(dy / 7)}w ago`;
  } catch { return 'Recent'; }
}

function clean(s: string) {
  return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
}

async function fetchGoogle(q: string) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-NG&gl=NG&ceid=NG:en`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(7000), cache: 'no-store' });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
    return items.slice(0, 6).map(item => {
      const title = clean(item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || '');
      const link = (item.match(/<link>(.*?)<\/link>/)?.[1] || '#').trim();
      const source = clean(item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || 'Google News');
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      return title.length > 15 ? { title, url: link, source, time: timeAgo(pubDate) } : null;
    }).filter(Boolean);
  } catch { return []; }
}

async function fetchRSS(url: string, source: string) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000), cache: 'no-store' });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
    return items.slice(0, 4).map(item => {
      const title = clean(item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || '');
      const link = (item.match(/<link>(.*?)<\/link>/)?.[1] || '#').trim();
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      return title.length > 10 ? { title, url: link, source, time: timeAgo(pubDate) } : null;
    }).filter(Boolean);
  } catch { return []; }
}

const FALLBACK = [
  { title: "JAMB 2025 UTME Registration Portal Now Open", url: "https://www.jamb.gov.ng", source: "JAMB Official", time: "Today" },
  { title: "JAMB Releases Updated Syllabus for 2025 UTME Examination", url: "https://www.jamb.gov.ng", source: "JAMB Official", time: "2d ago" },
  { title: "Post-UTME 2025: All Universities Begin Screening Exercise", url: "#", source: "Education News", time: "3d ago" },
  { title: "How to Score 300+ in JAMB: Proven Study Strategies", url: "#", source: "Study Guide", time: "4d ago" },
  { title: "JAMB Cut-Off Marks for All Universities 2025 Released", url: "#", source: "Universities NG", time: "5d ago" },
  { title: "WAEC Results 2025: How to Check and Download Certificate", url: "https://www.waecdirect.org", source: "WAEC Nigeria", time: "1w ago" },
];

export async function GET() {
  try {
    const results = await Promise.allSettled([
      fetchGoogle('JAMB UTME 2025 Nigeria'),
      fetchGoogle('Nigeria university admission 2025'),
      fetchRSS('https://www.vanguardngr.com/category/education/feed/', 'Vanguard'),
      fetchRSS('https://punchng.com/category/education/feed/', 'Punch'),
    ]);

    const all: any[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') all.push(...(r.value as any[]));
    }

    const seen = new Set<string>();
    const unique = all.filter((item: any) => {
      const key = item.title.toLowerCase().slice(0, 45);
      if (seen.has(key)) return false;
      seen.add(key);
      return /jamb|utme|admission|waec|neco|university|education|result|cutoff|screening/.test(item.title.toLowerCase());
    });

    return NextResponse.json(
      { news: unique.length >= 4 ? unique.slice(0, 12) : FALLBACK },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch {
    return NextResponse.json({ news: FALLBACK });
  }
}
