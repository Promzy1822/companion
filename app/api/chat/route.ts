import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: 'API key not configured.' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are Companion, a dedicated JAMB study assistant for Nigerian students. You have expert knowledge of JAMB past questions, the JAMB syllabus for all subjects, university cutoff marks for all Nigerian universities, admission requirements, Post-UTME processes, and JAMB portal guidance. Always respond in simple English a Nigerian SS3 student can understand. Be encouraging, friendly and concise.`
      },
      ...history.map((h: {role: string, text: string}) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ reply: `API error: ${error}` });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response from AI.';

    return NextResponse.json({ reply });

  } catch (error) {
    return NextResponse.json({ reply: `Error: ${error}` });
  }
}
