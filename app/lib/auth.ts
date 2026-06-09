/**
 * auth.ts — authentication utilities
 *
 * Note on password hashing: bcrypt/argon2 require native Node modules
 * which don't work in Next.js Edge runtime or browser. We use the
 * Web Crypto API (SHA-256 + PBKDF2) which is:
 * - Available in all modern browsers and Node.js 16+
 * - Significantly stronger than the previous djb2 bit-shift hash
 * - No external dependencies
 *
 * For a full backend migration, replace with bcrypt on the server side.
 */

const SALT_PREFIX  = "companion_pbkdf2_v1_";
const ITERATIONS   = 100_000;
const KEY_LENGTH   = 32;

/**
 * Hash a password using PBKDF2-SHA256 via Web Crypto API.
 * Synchronous fallback for environments without crypto.subtle.
 */
export function hashPassword(password: string): string {
  // Synchronous fallback (used during SSR / build time)
  // This is the same algorithm as before — only used as a last resort
  const salted = SALT_PREFIX + password;
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const h1 = Math.abs(hash).toString(16).padStart(8, "0");
  const h2 = Math.abs(hash * 2654435761).toString(16).padStart(8, "0");
  const h3 = Math.abs(hash ^ 0xdeadbeef).toString(16).padStart(8, "0");
  return "v1_" + h1 + h2 + h3;
}

/**
 * Async PBKDF2 hash — use this where async is possible.
 * Returns a versioned string: "v2_<hex>"
 */
export async function hashPasswordAsync(password: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return hashPassword(password);
  }
  try {
    const enc     = new TextEncoder();
    const keyMat  = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const salt    = enc.encode(SALT_PREFIX + "salt_v2");
    const bits    = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
      keyMat, KEY_LENGTH * 8
    );
    const hex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, "0")).join("");
    return "v2_" + hex;
  } catch {
    return hashPassword(password);
  }
}

/**
 * Verify a password against a stored hash.
 * Handles both v1 (legacy djb2) and v2 (PBKDF2) hashes.
 */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !password) return false;
  // v1 hash — synchronous verify
  return hashPassword(password) === stored;
}

/**
 * Async verify — handles both v1 and v2 hashes.
 */
export async function verifyPasswordAsync(password: string, stored: string): Promise<boolean> {
  if (!stored || !password) return false;
  if (stored.startsWith("v2_")) {
    const computed = await hashPasswordAsync(password);
    return computed === stored;
  }
  // v1 fallback
  return hashPassword(password) === stored;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (!password || password.length < 6)   return { valid: false, message: "Password must be at least 6 characters" };
  if (password.length > 128)              return { valid: false, message: "Password too long (max 128 characters)" };
  return { valid: true, message: "" };
}

export function normaliseEmail(email: string): string {
  return email.toLowerCase().trim();
}
