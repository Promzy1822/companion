import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content;

    try {
      // PRIMARY: Gemini
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await geminiModel.generateContent(userMessage);
      
      // CRITICAL FIX: Explicitly check if candidates exist before calling .text()
      if (!result.response || !result.response.candidates || result.response.candidates.length === 0) {
        throw new Error("Gemini Quota Exceeded or No Candidates");
      }

      const text = result.response.text();
      return NextResponse.json({ content: text, provider: "gemini" });

    } catch (geminiError: any) {
      console.log("Switching to Groq backup due to Gemini error:", geminiError.message);

      // BACKUP: Groq (using llama-4-scout-17b-16e-instruct)
      const groqResponse = await groq.chat.completions.create({
        messages: [{ role: "user", content: userMessage }],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
      });

      const groqContent = groqResponse.choices[0]?.message?.content || "I'm having a bit of a moment. Please try again in a few seconds!";
      
      return NextResponse.json({ 
        content: groqContent,
        provider: "groq"
      });
    }

  } catch (error) {
    console.error("Critical System Error:", error);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 500 });
  }
}
