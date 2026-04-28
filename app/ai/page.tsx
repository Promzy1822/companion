"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export default function AIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm your Companion AI. Ask me anything about your JAMB subjects or exam prep." }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.content }]);
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-800 flex items-center bg-white dark:bg-gray-900 sticky top-0 z-10">
        <Link href="/" className="mr-4 text-xl">←</Link>
        <div>
          <h1 className="font-bold text-orange-600">Ask Companion AI</h1>
          <p className="text-xs text-gray-500">Your JAMB study assistant</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl ${
              m.role === "user" 
                ? "bg-orange-600 text-white rounded-tr-none" 
                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm"
            }`}>
              <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none break-words">
                {m.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 items-center">
          <input
            className="flex-1 bg-transparent outline-none text-sm p-1"
            placeholder="Ask anything about JAMB..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button 
            onClick={handleSend}
            className="bg-orange-600 text-white p-2 rounded-full hover:scale-105 transition-transform"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
