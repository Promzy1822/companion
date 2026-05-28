/**
 * useNews.ts
 * Client-side news hook implementing:
 *  - localStorage cache for offline / instant first paint
 *  - Smart polling: every 10min when tab is visible, paused when hidden
 *  - Exponential backoff on consecutive failures
 *  - Stale-while-revalidate: show cached data immediately, fetch fresh in background
 *  - Dedup: never add articles already in state
 *  - Category filter derived from state (no extra request)
 */

"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { NewsArticle } from "./news-engine";

const LS_KEY          = "companion_news_cache_v2";
const LS_TS_KEY       = "companion_news_cache_ts";
const CLIENT_TTL_MS   = 10 * 60 * 1000;   // 10min — re-fetch if cache older
const POLL_INTERVAL   = 10 * 60 * 1000;   // 10min polling when visible
const MAX_RETRIES     = 3;
const RETRY_BASE_MS   = 5_000;            // 5s, 10s, 20s backoff

export interface UseNewsResult {
  articles:       NewsArticle[];
  filtered:       NewsArticle[];
  loading:        boolean;
  refreshing:     boolean;
  error:          string | null;
  lastUpdated:    number | null;
  category:       string;
  setCategory:    (c: string) => void;
  refresh:        () => void;
  isStale:        boolean;
}

export function useNews(): UseNewsResult {
  const [articles,    setArticles]    = useState<NewsArticle[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [category,    setCategory]    = useState("All");

  const retryCountRef  = useRef(0);
  const pollTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef   = useRef(true);

  // ── Load from localStorage immediately (instant first paint) ─────────────
  useEffect(() => {
    isMountedRef.current = true;
    try {
      const cached = localStorage.getItem(LS_KEY);
      const ts     = localStorage.getItem(LS_TS_KEY);
      if (cached && ts) {
        const parsed: NewsArticle[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setArticles(parsed);
          setLastUpdated(Number(ts));
          setLoading(false);
          console.log(`[useNews] Loaded ${parsed.length} articles from localStorage`);
        }
      }
    } catch {
      // localStorage unavailable (SSR / private mode)
    }
    return () => { isMountedRef.current = false; };
  }, []);

  // ── Core fetch function ────────────────────────────────────────────────────
  const fetchNews = useCallback(async (isManualRefresh = false) => {
    if (!isMountedRef.current) return;

    const hasCache = articles.length > 0;
    if (isManualRefresh) {
      setRefreshing(true);
    } else if (!hasCache) {
      setLoading(true);
    }

    try {
      const t0  = Date.now();
      const res = await fetch("/api/news", { cache: "no-store" });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const fresh: NewsArticle[] = Array.isArray(data.news) ? data.news : [];

      if (!isMountedRef.current) return;

      if (fresh.length > 0) {
        const now = Date.now();
        setArticles(fresh);
        setLastUpdated(now);
        setError(null);
        retryCountRef.current = 0;

        // Persist to localStorage
        try {
          localStorage.setItem(LS_KEY,    JSON.stringify(fresh));
          localStorage.setItem(LS_TS_KEY, String(now));
        } catch {}

        console.log(`[useNews] Fetched ${fresh.length} articles in ${Date.now()-t0}ms (${data.meta?.source})`);
      } else if (!hasCache) {
        // Empty response and no cache — shouldn't normally happen
        setError("No news available right now");
      }
    } catch (err: any) {
      console.warn("[useNews] Fetch failed:", err?.message);
      if (!isMountedRef.current) return;

      // Increment retry counter
      retryCountRef.current++;
      const retries = retryCountRef.current;

      if (retries <= MAX_RETRIES) {
        // Exponential backoff
        const delay = RETRY_BASE_MS * Math.pow(2, retries - 1);
        console.log(`[useNews] Retry ${retries}/${MAX_RETRIES} in ${delay}ms`);
        setTimeout(() => fetchNews(false), delay);
      } else if (!hasCache) {
        // Exhausted retries with no cache
        setError("Could not load news. Check your connection.");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [articles.length]);

  // ── Initial fetch and smart polling ───────────────────────────────────────
  useEffect(() => {
    // Determine if cache is fresh enough to skip initial fetch
    const ts = Number(localStorage.getItem(LS_TS_KEY) || 0);
    const cacheAge = Date.now() - ts;

    if (cacheAge > CLIENT_TTL_MS || articles.length === 0) {
      fetchNews(false);
    } else {
      setLoading(false);
    }

    // Polling: only when tab is visible
    const startPolling = () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(() => {
        if (!document.hidden) {
          console.log("[useNews] Polling for fresh news");
          fetchNews(false);
        }
      }, POLL_INTERVAL);
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        // Tab became visible — check if stale
        const ts2 = Number(localStorage.getItem(LS_TS_KEY) || 0);
        if (Date.now() - ts2 > CLIENT_TTL_MS) {
          console.log("[useNews] Tab visible, cache stale — refreshing");
          fetchNews(false);
        }
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchNews]);

  // ── Derived: filtered articles ─────────────────────────────────────────────
  const filtered = category === "All"
    ? articles
    : articles.filter(a => a.category === category);

  const isStale = lastUpdated !== null
    ? Date.now() - lastUpdated > CLIENT_TTL_MS
    : false;

  return {
    articles,
    filtered,
    loading,
    refreshing,
    error,
    lastUpdated,
    category,
    setCategory,
    refresh: () => fetchNews(true),
    isStale,
  };
}
