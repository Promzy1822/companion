import { NextResponse } from 'next/server';

export const revalidate = 0;

interface NewsItem {
  title: string;
  url: string;
  source: string;
  time: string;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return 'Recent';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 2) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return `${Math.floor(d/7)}w ago`;
  } catch { return 'Recent'; }
}

function cleanText(s: string): string {
  return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
}

async function fetchRSS(url: string, sourceName: string): Promise<NewsItem[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
    signal: AbortSignal.timeout(6000),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  const results: NewsItem[] = [];
  for (const item of items.slice(0, 5)) {
    const title = cleanText(
      item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
      item.match(/<title>(.*?)<\/title>/)?.[1] || ''
    );
    const link = (
      item.match(/<link>(.*?)<\/link>/)?.[1] ||
      item.match(/<guid[^>]*>(https?[^<]*)<\/guid>/)?.[1] || '#'
    ).trim();
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    if (title && title.length > 10) {
      results.push({ title, url: link, source: sourceName, time: timeAgo(pubDate) });
    }
  }
  return results;
}

async function fetchGoogleNewsRSS(query: string): Promise<NewsItem[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-NG&gl=NG&ceid=NG:en`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  const results: NewsItem[] = [];
  for (const item of items.slice(0, 6)) {
    const title = cleanText(
      item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
      item.match(/<title>(.*?)<\/title>/)?.[1] || ''
    );
    const link = item.match(/<link>(.*?)<\/link>/)?.[1]?.trim() || '#';
    const source = cleanText(item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || 'Google News');
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    if (title && !title.includes('...') && title.length > 15) {
      results.push({ title, url: link, source, time: timeAgo(pubDate) });
    }
  }
  return results;
}

function getFallback(): NewsItem[] {
  return [
    {title:"JAMB 2025 UTME: Registration Portal Now Open — Apply Before Deadline",url:"https://www.jamb.gov.ng",source:"JAMB Official",time:"Today"},
    {title:"JAMB Releases New Syllabus Updates for 2025 UTME Examination",url:"https://www.jamb.gov.ng",source:"JAMB Official",time:"Today"},
    {title:"Post-UTME 2025: All Universities Begin Screening Exercise",url:"https://www.jamb.gov.ng",source:"Education News",time:"1d ago"},
    {title:"How to Score 300+ in JAMB: Proven Study Strategies",url:"https://www.jamb.gov.ng",source:"Study Guide",time:"2d ago"},
    {title:"JAMB Cut-Off Marks 2025: Full List for All Universities",url:"https://www.jamb.gov.ng",source:"Universities NG",time:"3d ago"},
    {title:"WAEC Results 2025: How to Check Online and Download Certificate",url:"https://www.waecdirect.org",source:"WAEC Nigeria",time:"3d ago"},
  ];
}

export async function GET() {
  try {
    const [google1, google2, google3, vanguard, punch] = await Promise.allSettled([
      fetchGoogleNewsRSS('JAMB UTME 2025 Nigeria'),
      fetchGoogleNewsRSS('JAMB registration result Nigeria'),
      fetchGoogleNewsRSS('Nigeria university admission 2025'),
      fetchRSS('https://www.vanguardngr.com/category/education/feed/', 'Vanguard'),
      fetchRSS('https://punchng.com/category/education/feed/', 'Punch'),
    ]);

    const all: NewsItem[] = [];
    for (const r of [google1, google2, google3, vanguard, punch]) {
      if (r.status === 'fulfilled') all.push(...r.value);
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = all.filter(item => {
      const key = item.title.toLowerCase().slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Filter relevant
    const relevant = unique.filter(item => {
      const t = item.title.toLowerCase();
      return /jamb|utme|admission|waec|neco|post.utme|university|polytechnic|education|result|cutoff|screening/.test(t);
    });

    const news = relevant.length >= 4 ? relevant.slice(0, 12) : getFallback();
    return NextResponse.json({ news, source: relevant.length >= 4 ? 'live' : 'fallback' }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch {
    return NextResponse.json({ news: getFallback(), source: 'fallback' });
  }
}