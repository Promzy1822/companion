import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientId } from '../../lib/rateLimit';
import { validateChatMessage, validateSystemPrompt, validateHistory } from '../../lib/validate';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 20 requests per minute per IP
    const clientId = getClientId(req);
    const { allowed, remaining, resetIn } = rateLimit(clientId, 20, 60000);

    if (!allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${Math.ceil(resetIn / 1000)} seconds.` },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(resetIn),
          }
        }
      );
    }

    // Parse body safely
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { message, systemPrompt, history } = body;

    // Validate inputs
    const msgValidation = validateChatMessage(message);
    if (!msgValidation.valid) {
      return NextResponse.json({ error: msgValidation.error }, { status: 400 });
    }

    const promptValidation = validateSystemPrompt(systemPrompt);
    if (!promptValidation.valid) {
      return NextResponse.json({ error: promptValidation.error }, { status: 400 });
    }

    const historyValidation = validateHistory(history);
    if (!historyValidation.valid) {
      return NextResponse.json({ error: historyValidation.error }, { status: 400 });
    }

    // Check API key
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not configured');
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    // Build messages
    const messages: { role: string; content: string }[] = [];

    if (Array.isArray(history)) {
      for (const h of history.slice(-8)) {
        if (h?.role && h?.content) {
          messages.push({ role: h.role, content: String(h.content).slice(0, 4000) });
        }
      }
    }

    messages.push({ role: 'user', content: String(message).slice(0, 4000) });

    const defaultSystemPrompt = `You are Companion AI — an expert JAMB UTME and Nigerian university admissions assistant. Help Nigerian students prepare for JAMB with detailed explanations, past questions from 2000-2024, university cut-off marks, CAPS admission process, aggregate calculations, and study strategies. Always be accurate, detailed, and encouraging.`;

    // Call Groq with retry logic
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [
              { role: 'system', content: systemPrompt || defaultSystemPrompt },
              ...messages,
            ],
            max_tokens: 2048,
            temperature: 0.7,
          }),
          signal: AbortSignal.timeout(30000), // 30s timeout
        });

        if (response.status === 429) {
          // Groq rate limit — wait and retry
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          console.error('Groq API error:', response.status, errText);
          throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content;

        if (!reply) {
          throw new Error('Empty response from AI');
        }

        return NextResponse.json(
          { reply },
          { headers: { 'X-RateLimit-Remaining': String(remaining) } }
        );

      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    console.error('All Groq attempts failed:', lastError);
    return NextResponse.json(
      { error: 'AI service temporarily unavailable. Please try again.' },
      { status: 503 }
    );

  } catch (err) {
    console.error('Chat route unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
