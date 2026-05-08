import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, systemPrompt, history } = await req.json();
    if (!message) return NextResponse.json({ error: 'No message' }, { status: 400 });

    const messages: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-8)) {
        if (h?.role && h?.content) messages.push({ role: h.role, content: h.content });
      }
    }
    messages.push({ role: 'user', content: message });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: systemPrompt || `You are Companion AI, an expert JAMB UTME and Nigerian university admissions assistant. Help Nigerian students prepare for JAMB with detailed explanations, past questions from 2000-2024, university cut-off marks, CAPS admission process, aggregate calculations, and study strategies. Always be accurate, detailed, and encouraging.`
          },
          ...messages
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      console.error('Groq error:', JSON.stringify(data));
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }
    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error('Chat route error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
