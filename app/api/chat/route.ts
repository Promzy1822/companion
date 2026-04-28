import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: 'API key not configured.' });
    }

    const systemPrompt = `You are Companion, a dedicated JAMB study assistant for Nigerian students. You have expert knowledge of JAMB past questions, the JAMB syllabus, university cutoff marks, admission requirements, and study tips. Always respond in simple English a Nigerian SS3 student can understand. Be encouraging and friendly.`;

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood! I am Companion, your JAMB study assistant. How can I help you today?' }] },
      ...history.map((h: {role: string, text: string}) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ reply: `API error: ${error}` });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';

    return NextResponse.json({ reply });

  } catch (error) {
    return NextResponse.json({ reply: `Error: ${error}` });
  }
}
