/**
 * kvAuth.ts — server-side account storage using Vercel KV (Redis)
 *
 * Key structure:
 *   account:{email}          → UserAccount object
 *   otp:{email}              → { code, expiresAt, attempts }
 *   reset:{token}            → { email, expiresAt }
 *   login_attempts:{email}   → { count, resetAt }
 */

import { kv } from "@vercel/kv";

export interface KVAccount {
  email:          string;
  name:           string;
  passwordHash:   string;
  institution:    string;
  course:         string;
  subjects:       string[];
  target:         string;
  deadline:       string;
  selfRating:     string;
  cutoffData:     unknown;
  recommendation: string | null;
  verified:       boolean;
  createdAt:      string;
  updatedAt?:     string;
}

interface OTPRecord {
  code:      string;
  expiresAt: number;
  attempts:  number;
  name:      string;
  // Store full pending account so we save it after verification
  pending:   Omit<KVAccount, "verified">;
}

interface ResetRecord {
  email:     string;
  expiresAt: number;
  used:      boolean;
}

interface LoginAttempts {
  count:   number;
  resetAt: number;
}

// ── Account CRUD ──────────────────────────────────────────────────────────────

export const KVAuth = {

  async getAccount(email: string): Promise<KVAccount | null> {
    try {
      return await kv.get<KVAccount>(`account:${email.toLowerCase().trim()}`);
    } catch { return null; }
  },

  async saveAccount(account: KVAccount): Promise<void> {
    const key = `account:${account.email.toLowerCase().trim()}`;
    await kv.set(key, { ...account, updatedAt: new Date().toISOString() });
  },

  async emailExists(email: string): Promise<boolean> {
    const acc = await KVAuth.getAccount(email);
    return acc !== null;
  },

  // ── OTP ────────────────────────────────────────────────────────────────────

  async saveOTP(email: string, code: string, pending: OTPRecord["pending"], name: string): Promise<void> {
    const record: OTPRecord = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts:  0,
      name,
      pending,
    };
    await kv.set(`otp:${email.toLowerCase()}`, record, { ex: 600 }); // TTL 600s
  },

  async verifyOTP(email: string, code: string): Promise<{ valid: boolean; reason: string; pending?: OTPRecord["pending"] }> {
    const e      = email.toLowerCase().trim();
    const record = await kv.get<OTPRecord>(`otp:${e}`);

    if (!record)                        return { valid: false, reason: "Code expired or not found. Please request a new one." };
    if (Date.now() > record.expiresAt)  return { valid: false, reason: "Code has expired. Please request a new one." };
    if (record.attempts >= 5)           return { valid: false, reason: "Too many incorrect attempts. Please request a new code." };

    if (record.code !== code.trim()) {
      // Increment attempts
      await kv.set(`otp:${e}`, { ...record, attempts: record.attempts + 1 }, { ex: 600 });
      const left = 5 - record.attempts - 1;
      return { valid: false, reason: `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} remaining.` };
    }

    // Valid — delete OTP record
    await kv.del(`otp:${e}`);
    return { valid: true, reason: "OK", pending: record.pending };
  },

  // ── Password Reset ─────────────────────────────────────────────────────────

  async saveResetToken(email: string, token: string): Promise<void> {
    const record: ResetRecord = {
      email:     email.toLowerCase().trim(),
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
      used:      false,
    };
    await kv.set(`reset:${token}`, record, { ex: 3600 }); // TTL 1 hour
  },

  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string; reason?: string }> {
    const record = await kv.get<ResetRecord>(`reset:${token}`);
    if (!record)               return { valid: false, reason: "Link expired or already used." };
    if (record.used)           return { valid: false, reason: "This link has already been used." };
    if (Date.now() > record.expiresAt) return { valid: false, reason: "Reset link has expired." };
    return { valid: true, email: record.email };
  },

  async consumeResetToken(token: string): Promise<void> {
    await kv.del(`reset:${token}`);
  },

  // ── Login Rate Limiting ────────────────────────────────────────────────────

  async checkLoginAttempts(email: string): Promise<{ allowed: boolean; waitSeconds?: number }> {
    const e      = email.toLowerCase().trim();
    const record = await kv.get<LoginAttempts>(`login_attempts:${e}`);
    const MAX    = 5;
    const WINDOW = 15 * 60 * 1000; // 15 minutes

    if (!record || Date.now() > record.resetAt) return { allowed: true };
    if (record.count >= MAX) {
      const wait = Math.ceil((record.resetAt - Date.now()) / 1000);
      return { allowed: false, waitSeconds: wait };
    }
    return { allowed: true };
  },

  async recordFailedLogin(email: string): Promise<void> {
    const e      = email.toLowerCase().trim();
    const WINDOW = 15 * 60 * 1000;
    const record = await kv.get<LoginAttempts>(`login_attempts:${e}`);

    if (!record || Date.now() > record.resetAt) {
      await kv.set(`login_attempts:${e}`, { count: 1, resetAt: Date.now() + WINDOW }, { ex: 900 });
    } else {
      await kv.set(`login_attempts:${e}`, { ...record, count: record.count + 1 }, { ex: 900 });
    }
  },

  async clearLoginAttempts(email: string): Promise<void> {
    await kv.del(`login_attempts:${email.toLowerCase().trim()}`);
  },
};
