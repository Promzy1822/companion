// Simple in-memory rate limiter (resets on server restart)
// Good enough for Vercel serverless - each function has its own memory

const requests = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const existing = requests.get(identifier);

  if (!existing || now > existing.resetAt) {
    // New window
    requests.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: existing.resetAt - now,
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetIn: existing.resetAt - now,
  };
}

export function getClientId(req: Request): string {
  // Use forwarded IP or a fallback
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return ip;
}
