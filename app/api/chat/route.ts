import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, systemPrompt, history } = body;

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    // Build messages array with history
    const messages = [];
    
    // Add conversation history for context
    if (history && Array.isArray(history)) {
      for (const h of history.slice(-8)) { // last 8 messages for context
        if (h.role && h.content) {
          messages.push({ role: h.role, content: h.content });
        }
      }
    }
    
    // Add current message
    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            content: systemPrompt || `You are Companion AI, an expert JAMB study assistant for Nigerian students. Help with JAMB subjects, past questions, university admission processes, cut-off marks, aggregate calculations, and study strategies. Always give detailed, accurate answers specific to Nigerian education.`
          },
          ...messages
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
