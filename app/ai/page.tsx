"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { ArrowLeft, Send, Paperclip, Sun, Moon, Sparkles, X, RotateCcw } from "lucide-react";
import { C, D, palette } from "../lib/design";

interface Message { role: "user" | "assistant"; content: string; id: number; }

const QUICK_ACTIONS = [
  { label: "Solve a question",   prompt: "Help me solve this JAMB question: "  },
  { label: "Explain a topic",    prompt: "Explain this JAMB topic in detail: " },
  { label: "Generate questions", prompt: "Give me 5 JAMB past questions on: "  },
  { label: "Build study plan",   prompt: "Create a 2-week study plan for: "    },
];

export default function AIChat() {
  const [input,        setInput]        = useState("");
  const [darkMode,     setDarkMode]     = useState(false);
  const [messages,     setMessages]     = useState<Message[]>([
    { role: "assistant", id: 0, content: "Hello! I'm **Companion AI** 🎓\n\nI'm your personal JAMB study assistant. I can help you:\n- 🧮 Solve past questions with step-by-step explanations\n- 📖 Explain difficult topics clearly\n- 📅 Build personalised study plans\n- 📊 Identify your weak areas\n\nWhat would you like to work on today?" },
  ]);
  const [loading,      setLoading]      = useState(false);
  const [attachment,   setAttachment]   = useState<File | null>(null);
  const [focused,      setFocused]      = useState(false);
  const [mounted,      setMounted]      = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  let   msgIdRef       = useRef(1);

  useEffect(() => {
    setMounted(true);
    const dm = localStorage.getItem("darkMode") === "true";
    setDarkMode(dm);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
  };

  const sendMessage = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;

    const userMsg: Message = { role: "user", id: msgIdRef.current++, content: t };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setAttachment(null);
    setLoading(true);

    try {
      const res  = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: t }),
      });
      const data  = await res.json();
      const reply = data.reply || data.error || "Sorry, I couldn't get a response. Please try again.";
      setMessages([...newMsgs, { role: "assistant", id: msgIdRef.current++, content: reply }]);
    } catch {
      setMessages([...newMsgs, { role: "assistant", id: msgIdRef.current++, content: "Network error. Please check your connection and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendMessage(input || (attachment ? `[Attached: ${attachment.name}]` : ""));
  const clearChat  = () => { setMessages([messages[0]]); setInput(""); };

  if (!mounted) return null;

  const T = palette(darkMode);

  // ── Design tokens for the AI chat workspace ──────────────────
  const bg       = darkMode ? "#0D0D0F" : "#F8F9FB";
  const chatBg   = darkMode ? "#0D0D0F" : "#F8F9FB";
  const headerBg = darkMode
    ? "rgba(18,18,22,0.92)"
    : "rgba(255,255,255,0.92)";
  const aiBubBg   = darkMode ? "#1E1E24" : "#FFFFFF";
  const aiBubBord = darkMode ? "#2A2A35" : "#E8EAED";
  const userBubBg = C.primary;
  const inputAreaBg = darkMode ? "rgba(18,18,22,0.95)" : "rgba(255,255,255,0.95)";
  const inputBg     = darkMode ? "#1E1E24" : "#F1F3F5";
  const inputBord   = focused
    ? C.primary
    : (darkMode ? "#2A2A35" : "#E0E3E8");

  const userName = (() => {
    try { return JSON.parse(localStorage.getItem("companion_user") || "{}").name || ""; } catch { return ""; }
  })();

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100dvh",
      background: chatBg,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
      overflow: "hidden",
    }}>

      {/* ── Header — minimal, translucent ─────────────────────── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: headerBg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: "12px",
      }}>
        {/* Back */}
        <Link href="/" style={{
          width: 36, height: 36, borderRadius: "50%",
          border: `1px solid ${darkMode ? "#2A2A35" : "#E8EAED"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          textDecoration: "none", flexShrink: 0,
          background: darkMode ? "#1E1E24" : "#fff",
        }}>
          <ArrowLeft size={16} color={T.sub} strokeWidth={2} />
        </Link>

        {/* AI identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "12px",
            background: `linear-gradient(135deg, ${C.primary}, #42A5F5)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 2px 10px rgba(24,119,242,0.35)`,
          }}>
            <Sparkles size={17} color="#fff" strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: T.text, letterSpacing: "-0.2px" }}>
              Companion AI
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#31A24C" }} />
              <span style={{ fontSize: "11px", color: T.sub }}>JAMB expert · always available</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {messages.length > 1 && (
            <button onClick={clearChat} style={{
              width: 34, height: 34, borderRadius: "50%", border: "none",
              background: darkMode ? "#1E1E24" : "#F1F3F5",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}>
              <RotateCcw size={14} color={T.sub} strokeWidth={2} />
            </button>
          )}
          <button onClick={toggleDark} style={{
            width: 34, height: 34, borderRadius: "50%", border: "none",
            background: darkMode ? "#1E1E24" : "#F1F3F5",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            {darkMode
              ? <Sun  size={14} color={T.sub} strokeWidth={2} />
              : <Moon size={14} color={T.sub} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "80px 16px 20px",
        display: "flex", flexDirection: "column", gap: "6px",
      }}>

        {messages.map((m, i) => {
          const isUser = m.role === "user";
          const isLast = i === messages.length - 1;
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                gap: "8px",
                marginBottom: isLast ? "4px" : "2px",
                animation: "fadeUp 0.2s ease both",
              }}
            >
              {/* AI avatar */}
              {!isUser && (
                <div style={{
                  width: 28, height: 28, borderRadius: "9px", flexShrink: 0,
                  background: `linear-gradient(135deg, ${C.primary}, #42A5F5)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(24,119,242,0.25)",
                  marginBottom: "2px",
                }}>
                  <Sparkles size={13} color="#fff" strokeWidth={1.8} />
                </div>
              )}

              {/* Bubble */}
              <div style={{
                maxWidth: "80%",
                padding: isUser ? "11px 15px" : "13px 16px",
                borderRadius: isUser
                  ? "18px 18px 4px 18px"
                  : "4px 18px 18px 18px",
                background: isUser ? userBubBg : aiBubBg,
                border: isUser ? "none" : `1px solid ${aiBubBord}`,
                color: isUser ? "#fff" : T.text,
                fontSize: "14px", lineHeight: "1.65",
                boxShadow: isUser
                  ? `0 2px 12px rgba(24,119,242,0.3)`
                  : (darkMode ? "0 1px 4px rgba(0,0,0,0.4)" : "0 1px 8px rgba(0,0,0,0.07)"),
              }}>
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>

              {/* User avatar */}
              {isUser && userName && (
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg,#fde68a,#f59e0b)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", fontWeight: 800, color: "#7c2d12",
                  marginBottom: "2px",
                }}>
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", animation: "fadeUp 0.2s ease both" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "9px", flexShrink: 0,
              background: `linear-gradient(135deg, ${C.primary}, #42A5F5)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={13} color="#fff" strokeWidth={1.8} />
            </div>
            <div style={{
              padding: "13px 18px", borderRadius: "4px 18px 18px 18px",
              background: aiBubBg, border: `1px solid ${aiBubBord}`,
              display: "flex", gap: "5px", alignItems: "center",
              boxShadow: darkMode ? "0 1px 4px rgba(0,0,0,0.4)" : "0 1px 8px rgba(0,0,0,0.07)",
            }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: C.primary,
                  animation: `typingDot 1.2s ease-in-out ${i * 0.18}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Quick action chips — only on fresh conversation */}
        {messages.length === 1 && !loading && (
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "12px", color: T.muted, textAlign: "center", marginBottom: "12px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Try asking
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {QUICK_ACTIONS.map((a, i) => (
                <button key={i} onClick={() => { setInput(a.prompt); inputRef.current?.focus(); }} style={{
                  padding: "12px 14px", borderRadius: "12px",
                  border: `1px solid ${darkMode ? "#2A2A35" : "#E8EAED"}`,
                  background: darkMode ? "#1E1E24" : "#fff",
                  cursor: "pointer", textAlign: "left",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  boxShadow: darkMode ? "none" : "0 1px 4px rgba(0,0,0,0.05)",
                }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: T.text, lineHeight: 1.4 }}>{a.label}</div>
                  <div style={{ fontSize: "11px", color: T.muted, marginTop: "3px" }}>Tap to start</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Attachment preview ────────────────────────────────── */}
      {attachment && (
        <div style={{
          margin: "0 16px 8px",
          padding: "9px 14px",
          background: darkMode ? "#1E1E24" : C.primaryLight,
          border: `1px solid ${C.primary}44`,
          borderRadius: "10px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Paperclip size={13} color={C.primary} strokeWidth={2} />
            <span style={{ fontSize: "13px", color: C.primary, fontWeight: 600 }}>{attachment.name}</span>
          </div>
          <button onClick={() => setAttachment(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <X size={14} color={T.muted} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* ── Input area — glassy, premium ─────────────────────── */}
      <div style={{
        padding: "12px 16px 20px",
        background: inputAreaBg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: inputBg,
          borderRadius: "24px",
          padding: "8px 8px 8px 14px",
          border: `1.5px solid ${inputBord}`,
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: focused ? `0 0 0 3px rgba(24,119,242,0.12)` : "none",
        }}>
          {/* Attach */}
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Paperclip size={17} color={T.muted} strokeWidth={1.8} />
            <input
              type="file"
              style={{ display: "none" }}
              accept="image/*,.pdf,.doc,.docx"
              onChange={e => setAttachment(e.target.files?.[0] || null)}
            />
          </label>

          {/* Text input */}
          <input
            ref={inputRef}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontSize: "15px", color: T.text,
              padding: "4px 0",
              fontFamily: "inherit",
            }}
            placeholder="Ask anything about JAMB…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={loading || (!input.trim() && !attachment)}
            style={{
              width: 38, height: 38, borderRadius: "50%", border: "none",
              background: loading || (!input.trim() && !attachment)
                ? (darkMode ? "#2A2A35" : "#E8EAED")
                : C.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              cursor: loading || (!input.trim() && !attachment) ? "not-allowed" : "pointer",
              transition: "background 0.2s, box-shadow 0.2s",
              boxShadow: !loading && input.trim() ? `0 2px 10px rgba(24,119,242,0.4)` : "none",
            }}
          >
            <Send size={16} color="#fff" strokeWidth={2} style={{ transform: "translateX(1px)" }} />
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "8px" }}>
          <span style={{ fontSize: "10px", color: T.muted }}>
            AI can make mistakes. Always verify important facts.
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes typingDot {
          0%,60%,100% { opacity: 0.3; transform: scale(0.8); }
          30%          { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
