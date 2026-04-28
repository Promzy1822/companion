"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export default function AIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm **Companion AI** 🎓\n\nI'm here to help you ace your JAMB exams. Ask me anything about your subjects, past questions, or exam tips!" }
  ]);
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || loading) return;
    const userMessage = input.trim() || `[Attached file: ${attachment?.name}]`;
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setAttachment(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
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

  const suggestions = [
    "How do I solve quadratic equations?",
    "Explain the causes of WWI for JAMB",
    "Give me 5 JAMB English tips",
    "What are the topics in JAMB Biology?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", backgroundColor: "#fff", fontFamily: "Arial, sans-serif" }}>
      
      {/* Fixed Header */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: "#fff",
        borderBottom: "1px solid #f0f0f0",
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)"
      }}>
        <Link href="/" style={{ textDecoration: "none", color: "#ea580c", fontSize: "20px", fontWeight: "bold" }}>←</Link>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          background: "linear-gradient(135deg, #ea580c, #f97316)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px"
        }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "700", color: "#ea580c", fontSize: "15px" }}>Companion AI</div>
          <div style={{ fontSize: "11px", color: "#22c55e", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block" }}></span>
            Online • Your JAMB study assistant
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "80px 16px 16px 16px",
        display: "flex", flexDirection: "column", gap: "12px"
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "8px" }}>
            {m.role === "assistant" && (
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #ea580c, #f97316)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px"
              }}>🤖</div>
            )}
            <div style={{
              maxWidth: "78%",
              padding: "10px 14px",
              borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              backgroundColor: m.role === "user" ? "#ea580c" : "#f8f8f8",
              color: m.role === "user" ? "#fff" : "#1a1a1a",
              fontSize: "14px", lineHeight: "1.5",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)"
            }}>
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
            {m.role === "user" && (
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                backgroundColor: "#ffeedd",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px"
              }}>👤</div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "linear-gradient(135deg, #ea580c, #f97316)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px"
            }}>🤖</div>
            <div style={{
              padding: "12px 16px", borderRadius: "18px 18px 18px 4px",
              backgroundColor: "#f8f8f8", display: "flex", gap: "4px", alignItems: "center"
            }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ea580c",
                  animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s`
                }}></div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions for first message */}
        {messages.length === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            <div style={{ fontSize: "12px", color: "#999", textAlign: "center" }}>Try asking:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setInput(s)} style={{
                  padding: "8px 12px", borderRadius: "20px",
                  border: "1px solid #ea580c", backgroundColor: "#fff8f5",
                  color: "#ea580c", fontSize: "12px", cursor: "pointer"
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachment preview */}
      {attachment && (
        <div style={{
          margin: "0 16px 8px", padding: "8px 12px",
          backgroundColor: "#fff8f5", border: "1px solid #ea580c",
          borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <span style={{ fontSize: "13px", color: "#ea580c" }}>📎 {attachment.name}</span>
          <button onClick={() => setAttachment(null)} style={{
            background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: "16px"
          }}>✕</button>
        </div>
      )}

      {/* Fixed Input Area */}
      <div style={{
        position: "sticky", bottom: 0,
        backgroundColor: "#fff",
        borderTop: "1px solid #f0f0f0",
        padding: "12px 16px",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)"
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          backgroundColor: "#f8f8f8", borderRadius: "24px",
          padding: "8px 8px 8px 16px",
          border: "1.5px solid #f0f0f0"
        }}>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            accept="image/*,.pdf,.doc,.docx"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
          />
          <button onClick={() => fileInputRef.current?.click()} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "20px", color: "#999", padding: "0", flexShrink: 0
          }}>📎</button>
          <input
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontSize: "14px", color: "#1a1a1a"
            }}
            placeholder="Ask anything about JAMB..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={loading || (!input.trim() && !attachment)}
            style={{
              width: "38px", height: "38px", borderRadius: "50%", border: "none",
              background: loading || (!input.trim() && !attachment) ? "#ddd" : "linear-gradient(135deg, #ea580c, #f97316)",
              color: "#fff", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.2s"
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
