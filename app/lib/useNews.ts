/**
 * useNews.ts — v2 (stable refresh)
 *
 * Core fix from v1:
 *   v1 had: useCallback([articles.length]) → useEffect([fetchNews])
 *   This caused a cycle: every fetch → articles change → new fetchNews ref →
 *   useEffect cleanup fires → interval reset → never fires at 10min.
 *
 *   v2 fix: fetchRef pattern — the actual fetch function is stored in a ref.
 *   The polling useEffect has [] deps and runs exactly once per mount.
 *   fetchRef.current is always the latest function, so the interval
 *   closure always calls the current version without re-running the effect.
 */

"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { NewsArticle } from "./news-engine";
export type { NewsArticle };

const LS_ARTICLES    = "companion_news_v2";
const LS_TS          = "companion_news_v2_ts";
const CLIENT_TTL_MS  = 10 * 60 * 1000;   // re-fetch if cache older than 10min
const POLL_MS        = 10 * 60 * 1000;   // background poll every 10min
const MAX_RETRIES    = 3;
const BACKOFF_BASE   = 4_000;            // 4s, 8s, 16s

export interface UseNewsReturn {
  articles:    NewsArticle[];
  filtered:    NewsArticle[];
  loading:     boolean;
  refreshing:  boolean;
  error:       string | null;
  lastUpdated: number | null;
  category:    string;
  setCategory: (c: string) => void;
  refresh:     () => void;
}

export function useNews(): UseNewsReturn {
  const [articles,    setArticles]    = useState<NewsArticle[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [category,    setCategory]    = useState("All");

  // Refs — mutable values that do NOT trigger re-renders or effect re-runs
  const retryRef   = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchRef   = useRef<((manual: boolean) => void) | null>(null);

  // ── Load localStorage immediately (instant first paint) ──────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_ARTICLES);
      const ts  = localStorage.getItem(LS_TS);
      if (raw && ts) {
        const parsed: NewsArticle[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setArticles(parsed);
          setLastUpdated(Number(ts));
          setLoading(false);
        }
      }
    } catch { /* SSR or private mode */ }
  }, []);

  // ── Core fetch function — defined with useCallback, stored in ref ─────────
  const doFetch = useCallback(async (isManual: boolean) => {
    if (isManual) {
      setRefreshing(true);
    }
    // Don't show full loading spinner if we already have articles
    setLoading(prev => prev && true); // only keep loading=true if already true

    try {
      const res = await fetch("/api/news", {
        cache:   "no-store",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const fresh: NewsArticle[] = Array.isArray(data.news) ? data.news : [];

      if (fresh.length > 0) {
        const now = Date.now();
        setArticles(fresh);
        setLastUpdated(now);
        setError(null);
        retryRef.current = 0;

        try {
          localStorage.setItem(LS_ARTICLES, JSON.stringify(fresh));
          localStorage.setItem(LS_TS, String(now));
        } catch { /* quota exceeded */ }

        console.log(`[useNews] ${fresh.length} articles loaded (source: ${data.meta?.source ?? "?"})`);
      }
    } catch (err: any) {
      const msg = String(err?.message ?? err).slice(0, 100);
      console.warn(`[useNews] Fetch error: ${msg}`);

      retryRef.current++;
      if (retryRef.current <= MAX_RETRIES) {
        const delay = BACKOFF_BASE * Math.pow(2, retryRef.current - 1);
        console.log(`[useNews] Retry ${retryRef.current}/${MAX_RETRIES} in ${delay}ms`);
        retryTimer.current = setTimeout(() => fetchRef.current?.(false), delay);
      } else {
        // Exhausted retries — show error only if no cached data exists
        setError("Could not refresh news. Check your connection.");
        retryRef.current = 0; // reset so next manual refresh can try again
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // ← EMPTY DEPS: this callback never changes reference

  // ── Keep fetchRef always pointing to the latest doFetch ───────────────────
  // This is the key fix: the interval closure calls fetchRef.current,
  // which is always the current function, without re-running the effect.
  fetchRef.current = doFetch;

  // ── Setup: initial fetch + polling (runs ONCE on mount) ───────────────────
  useEffect(() => {
    // Check if localStorage cache is still fresh enough to skip initial fetch
    const ts       = Number(localStorage.getItem(LS_TS) ?? "0");
    const cacheAge = Date.now() - ts;

    if (cacheAge > CLIENT_TTL_MS) {
      // Cache is stale or absent — fetch now
      fetchRef.current?.(false);
    } else {
      // Cache is fresh — skip fetch, just clear loading
      setLoading(false);
      console.log(`[useNews] Cache is ${Math.round(cacheAge / 60_000)}min old, skipping fetch`);
    }

    // Background polling — every 10min, only when tab is visible
    const pollTimer = setInterval(() => {
      if (!document.hidden) {
        console.log("[useNews] Poll tick — refreshing");
        fetchRef.current?.(false);
      } else {
        console.log("[useNews] Poll tick — tab hidden, skipping");
      }
    }, POLL_MS);

    // Visibility change handler: refresh when user returns to tab
    const onVisible = () => {
      if (!document.hidden) {
        const ts2     = Number(localStorage.getItem(LS_TS) ?? "0");
        const age     = Date.now() - ts2;
        if (age > CLIENT_TTL_MS) {
          console.log("[useNews] Tab visible, cache stale — refreshing");
          fetchRef.current?.(false);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(pollTimer);
      clearTimeout(retryTimer.current ?? undefined);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []); // ← EMPTY DEPS: runs exactly once. Never re-runs.

  // ── Manual refresh ────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    retryRef.current = 0; // reset retry counter on manual refresh
    fetchRef.current?.(true);
  }, []);

  // ── Derived filtered list (no extra fetch) ────────────────────────────────
  const filtered = category === "All"
    ? articles
    : articles.filter(a => a.category === category);

  return {
    articles,
    filtered,
    loading,
    refreshing,
    error,
    lastUpdated,
    category,
    setCategory,
    refresh,
  };
}
