import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY;

  const systemPrompt = `You are Companion, a dedicated JAMB study assistant for Nigerian students. You have expert knowledge of:
- JAMB past questions and detailed explanations for all subjects (English, Mathematics, Physics, Chemistry, Biology, Economics, Government, Literature, Geography, Commerce)
- The complete JAMB syllabus for every subject
- University cutoff marks for all Nigerian universities
- Admission requirements, Post-UTME, and Direct Entry processes
- JAMB portal guidance and registration processes
- Study tips and exam strategies for Nigerian students

Rules:
- Always respond in simple, clear English that a Nigerian SS3 student can understand
- Be encouraging, friendly and motivating
- When explaining answers, use Nigerian context and examples where possible
- If asked about cutoff marks, give accurate information but note that universities update these yearly
- Keep responses concise and focused
- Never make up information you are not sure about`;

  const contents = [
    ...history.map((h: {role: string, text: string}) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    })),
    {
      role: 'user',
      parts: [{ text: message }]
    }
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents
      })
    }
  );

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not answer that. Please try again.';

  return NextResponse.json({ reply });
}
