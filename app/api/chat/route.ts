import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: 'API key not configured. Please check Vercel environment variables.' });
    }

    const systemPrompt = `You are Companion, a dedicated JAMB study assistant for Nigerian students. You have expert knowledge of:
- JAMB past questions and detailed explanations for all subjects
- The complete JAMB syllabus for every subject
- University cutoff marks for all Nigerian universities
- Admission requirements and Post-UTME processes
- JAMB portal guidance
- Study tips for Nigerian students

Always respond in simple English a Nigerian SS3 student can understand. Be encouraging and friendly.`;

    const contents = [
      ...history.map((h: {role: string, text: string}) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents
        })
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
