// Input validation without external deps

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateChatMessage(message: unknown): ValidationResult {
  if (typeof message !== 'string') return { valid: false, error: 'Message must be a string' };
  if (message.trim().length === 0) return { valid: false, error: 'Message cannot be empty' };
  if (message.length > 4000) return { valid: false, error: 'Message too long (max 4000 chars)' };
  return { valid: true };
}

export function validateSystemPrompt(prompt: unknown): ValidationResult {
  if (prompt === undefined || prompt === null) return { valid: true }; // optional
  if (typeof prompt !== 'string') return { valid: false, error: 'System prompt must be a string' };
  if (prompt.length > 8000) return { valid: false, error: 'System prompt too long' };
  return { valid: true };
}

export function validateHistory(history: unknown): ValidationResult {
  if (!history) return { valid: true }; // optional
  if (!Array.isArray(history)) return { valid: false, error: 'History must be an array' };
  if (history.length > 20) return { valid: false, error: 'History too long (max 20 messages)' };
  for (const item of history) {
    if (!item || typeof item !== 'object') return { valid: false, error: 'Invalid history item' };
    if (!['user', 'assistant'].includes(item.role)) return { valid: false, error: 'Invalid message role' };
    if (typeof item.content !== 'string') return { valid: false, error: 'Invalid message content' };
    if (item.content.length > 4000) return { valid: false, error: 'History message too long' };
  }
  return { valid: true };
}

export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove JS protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 5000); // Hard limit
}
