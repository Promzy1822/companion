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
      const response = await result.response;
      
      // Check if response actually has text (to avoid returning raw error objects)
      const text = response.text();
      if (!text) throw new Error("Empty Gemini response");

      return NextResponse.json({ content: text, provider: "gemini" });

    } catch (geminiError: any) {
      console.log("Gemini limit reached or error. Switching to Groq...");

      [span_0](start_span)[span_1](start_span)// BACKUP: Groq (using llama-4-scout-17b-16e-instruct)[span_0](end_span)[span_1](end_span)
      const groqResponse = await groq.chat.completions.create({
        messages: [{ role: "user", content: userMessage }],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
      });

      return NextResponse.json({ 
        content: groqResponse.choices[0]?.message?.content || "Sorry, I'm having trouble connecting to my brain right now.",
        provider: "groq"
      });
    }

  } catch (error) {
    return NextResponse.json({ error: "Service Unavailable" }, { status: 500 });
  }
}
