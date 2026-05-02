import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { practiceHistory, userProfile } = await req.json();
    
    const prompt = `You are an AI study analyst for Nigerian JAMB students. Analyze this student's practice history and identify weaknesses.

Student: ${userProfile.name}
Target Score: ${userProfile.target}
Subjects: ${userProfile.subjects?.join(', ')}

Practice History (last 20 attempts):
${JSON.stringify(practiceHistory, null, 2)}

Return ONLY valid JSON:
{
  "weakSubjects": ["subject1", "subject2"],
  "strongSubjects": ["subject3"],
  "weakTopics": [{"subject": "Mathematics", "topic": "Logarithms", "accuracy": 40}],
  "recommendation": "Focus more on Mathematics logarithms and Physics waves this week",
  "studyHoursNeeded": 3,
  "predictedScore": 265,
  "improvementTips": ["tip1", "tip2", "tip3"]
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
      }),
    });
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    return NextResponse.json({ analysis });
  } catch {
    return NextResponse.json({ analysis: null });
  }
}
