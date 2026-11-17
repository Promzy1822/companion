/**
 * fetch-timeout.ts — shared fetch wrapper (H5 slow network).
 *
 * Every user-facing fetch goes through fetchWithTimeout so a stalled
 * connection can never leave an indeterminate spinner hanging forever.
 *
 * Errors are typed so callers can show distinct copy:
 *   - TimeoutError: the request ran past its timeout (AbortController).
 *   - OfflineError: the device is offline (navigator.onLine is false and
 *     the fetch threw a TypeError, or offline before the fetch starts).
 *   - A caller-initiated cancel (the caller's own AbortSignal) rethrows
 *     the original AbortError unchanged — it is not a failure.
 *
 * Timeouts (agreed for this fix pack):
 *   default 15s | lesson generation 60s | chat 60s | qbank 15s | drill 30s
 *
 * Call signature — both orders work (the wrapper detects a numeric
 * second argument):
 *   fetchWithTimeout(url, init, timeoutMs)  — chat / drill call sites
 *   fetchWithTimeout(url, timeoutMs, init)  — lesson / qbank call sites
 *
 * Consumers: Chat (app/ai/page.tsx) and Drill (app/drill/[topicId]/page.tsx)
 * use this now. Lesson and QBank are another worker's job and should import
 * the same wrapper — do NOT reintroduce a bare fetch() on those pages.
 */
export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

export class OfflineError extends Error {
  constructor() {
    super("No internet connection");
    this.name = "OfflineError";
  }
}

export const FETCH_TIMEOUTS = {
  default: 15000,
  lesson: 60000,
  chat: 60000,
  qbank: 15000,
  drill: 30000,
} as const;

export type FetchTimeoutKey = keyof typeof FETCH_TIMEOUTS;

export async function fetchWithTimeout(
  url: string,
  optionsOrTimeout: RequestInit | number = {},
  timeoutMsOrInit: number | RequestInit = FETCH_TIMEOUTS.default,
): Promise<Response> {
  // Two call orders are used in this pack and both are supported:
  //   fetchWithTimeout(url, init, timeoutMs)   — chat / drill call sites
  //   fetchWithTimeout(url, timeoutMs, init)   — lesson / qbank call sites
  // The second argument decides: a number means (url, timeoutMs, init).
  const options: RequestInit =
    typeof optionsOrTimeout === "number"
      ? ((timeoutMsOrInit as RequestInit) ?? {})
      : optionsOrTimeout;
  const timeoutMs: number =
    typeof optionsOrTimeout === "number"
      ? optionsOrTimeout
      : typeof timeoutMsOrInit === "number"
        ? timeoutMsOrInit
        : FETCH_TIMEOUTS.default;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new OfflineError();
  }
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const externalSignal = options.signal;
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (timedOut) throw new TimeoutError(timeoutMs);
    // Caller-initiated cancel: rethrow as-is (AbortError), not a failure.
    if (controller.signal.aborted) throw err;
    if (err instanceof TypeError && typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new OfflineError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
