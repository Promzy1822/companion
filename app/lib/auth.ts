export function hashPassword(password: string): string {
  let hash = 0;
  const salted = "companion_salt_2025_" + password;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const h1 = Math.abs(hash).toString(16).padStart(8, '0');
  const h2 = Math.abs(hash * 2654435761).toString(16).padStart(8, '0');
  const h3 = Math.abs(hash ^ 0xdeadbeef).toString(16).padStart(8, '0');
  return h1 + h2 + h3;
}

export function verifyPassword(password: string, hashed: string): boolean {
  return hashPassword(password) === hashed;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 6) return { valid: false, message: "Password must be at least 6 characters" };
  if (password.length > 100) return { valid: false, message: "Password too long" };
  return { valid: true, message: "" };
}

export function sanitizeInput(input: string): string {
  return input.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').trim();
}

export function createSafeUser(formData: any) {
  return {
    name: sanitizeInput(formData.name || ''),
    email: sanitizeInput(formData.email || '').toLowerCase(),
    passwordHash: hashPassword(formData.password || ''),
    institution: sanitizeInput(formData.institution || ''),
    course: sanitizeInput(formData.course || ''),
    subjects: (formData.subjects || []).map((s: string) => sanitizeInput(s)),
    target: formData.target || '250',
    deadline: formData.deadline || '',
    selfRating: formData.selfRating || '2',
    cutoffData: formData.cutoffData || null,
    recommendation: formData.recommendation || null,
    createdAt: new Date().toISOString(),
  };
}
