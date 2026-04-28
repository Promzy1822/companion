"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export default function AIChat() {
  const [input, setInput] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm **Companion AI** 🎓\n\nI'm here to help you ace your JAMB exams. Ask me anything about your subjects, past questions, or exam tips!" }
  ]);
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setAttachment(null);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply = data.reply || data.error || "Sorry, I could not get a response. Please try again.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Network error. Please check your connection and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendMessage(input.trim() || (attachment ? `[Attached: ${attachment.name}]` : ""));

  const bg = darkMode ? "#0f0f0f" : "#ffffff";
  const cardBg = darkMode ? "#1a1a1a" : "#f8f8f8";
  const textColor = darkMode ? "#f0f0f0" : "#1a1a1a";
  const borderColor = darkMode ? "#2a2a2a" : "#f0f0f0";

  const suggestions = [
    "How do I solve quadratic equations?",
    "Explain the causes of WWI for JAMB",
    "Give me 5 JAMB English tips",
    "What topics are in JAMB Biology?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", backgroundColor: bg, fontFamily: "Arial, sans-serif", transition: "all 0.3s" }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: bg, borderBottom: `1px solid ${borderColor}`,
        padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)"
      }}>
        <Link href="/" style={{ textDecoration: "none", color: "#ea580c", fontSize: "20px", fontWeight: "bold" }}>←</Link>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          background: "linear-gradient(135deg, #c2410c, #ea580c, #f97316)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
          boxShadow: "0 2px 8px rgba(234,88,12,0.4)"
        }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "700", color: "#ea580c", fontSize: "15px" }}>Companion AI</div>
          <div style={{ fontSize: "11px", color: "#22c55e", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block" }}></span>
            Online • JAMB study assistant
          </div>
        </div>
        <button onClick={() => { const d = !darkMode; setDarkMode(d); localStorage.setItem("darkMode", String(d)); }}
          style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "80px 16px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "8px" }}>
            {m.role === "assistant" && (
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #c2410c, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>🤖</div>
            )}
            <div style={{
              maxWidth: "78%", padding: "10px 14px",
              borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: m.role === "user" ? "linear-gradient(135deg, #c2410c, #ea580c)" : cardBg,
              color: m.role === "user" ? "#fff" : textColor,
              fontSize: "14px", lineHeight: "1.6",
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)"
            }}>
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
            {m.role === "user" && (
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, backgroundColor: darkMode ? "#2a1a0a" : "#ffeedd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>👤</div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #c2410c, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>🤖</div>
            <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", backgroundColor: cardBg, display: "flex", gap: "4px", alignItems: "center" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ea580c", animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }}></div>
              ))}
            </div>
          </div>
        )}

        {messages.length === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            <div style={{ fontSize: "12px", color: "#999", textAlign: "center" }}>Try asking:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} style={{
                  padding: "8px 12px", borderRadius: "20px",
                  border: "1px solid #ea580c", backgroundColor: darkMode ? "#1a0f00" : "#fff8f5",
                  color: "#ea580c", fontSize: "12px", cursor: "pointer"
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {attachment && (
        <div style={{ margin: "0 16px 8px", padding: "8px 12px", backgroundColor: darkMode ? "#1a0f00" : "#fff8f5", border: "1px solid #ea580c", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", color: "#ea580c" }}>📎 {attachment.name}</span>
          <button onClick={() => setAttachment(null)} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: "16px" }}>✕</button>
        </div>
      )}

      <div style={{ position: "sticky", bottom: 0, backgroundColor: bg, borderTop: `1px solid ${borderColor}`, padding: "12px 16px", boxShadow: "0 -2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: cardBg, borderRadius: "24px", padding: "8px 8px 8px 4px", border: `1.5px solid ${borderColor}` }}>
          <label style={{ cursor: "pointer", padding: "0 8px", flexShrink: 0, fontSize: "20px", color: "#999" }}>
            📎
            <input type="file" style={{ display: "none" }} accept="image/*,.pdf,.doc,.docx" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
          </label>
          <input
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: "14px", color: textColor }}
            placeholder="Ask anything about JAMB..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <button onClick={handleSend} disabled={loading || (!input.trim() && !attachment)}
            style={{
              width: "38px", height: "38px", borderRadius: "50%", border: "none",
              background: loading || (!input.trim() && !attachment) ? "#ccc" : "linear-gradient(135deg, #c2410c, #ea580c)",
              color: "#fff", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </div>
      </div>
      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}
