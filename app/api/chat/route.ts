import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// Initialize both AI clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content;

    try {
      // PRIMARY: Gemini 1.5 Flash
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await geminiModel.generateContent(userMessage);
      const response = await result.response;
      const text = response.text();

      return NextResponse.json({ 
        content: text,
        provider: "gemini" 
      });

    } catch (geminiError) {
      console.error("Gemini failed, switching to Groq:", geminiError);

      // BACKUP: Groq (Llama-4-Scout)
      const groqResponse = await groq.chat.completions.create({
        messages: [{ role: "user", content: userMessage }],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
      });

      return NextResponse.json({ 
        content: groqResponse.choices[0]?.message?.content || "No response available.",
        provider: "groq"
      });
    }

  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json({ error: "Both AI services are unavailable." }, { status: 500 });
  }
}
