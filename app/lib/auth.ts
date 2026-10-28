/**
 * auth.ts: input validation helpers only.
 * Password hashing and sessions are handled entirely by Supabase Auth.
 */

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
