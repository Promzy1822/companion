"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import {
  ArrowLeft, Send, Paperclip, Sun, Moon,
  Sparkles, X, RotateCcw, Image, FileText,
} from "lucide-react";
import { palette } from "../lib/design";

interface Message {
  role:    "user" | "assistant";
  content: string;
  id:      number;
  image?:  string;
}

const QUICK_ACTIONS = [
  { label: "Solve a question",   prompt: "Help me solve this JAMB question: "  },
  { label: "Explain a topic",    prompt: "Explain this JAMB topic clearly: "   },
  { label: "Generate questions", prompt: "Give me 5 JAMB past questions on: "  },
  { label: "Study tips",         prompt: "Give me study tips for JAMB "        },
];

const WELCOME: Message = {
  role: "assistant", id: 0,
  content: "Hello! I'm **Companion AI** 🎓\n\nI can help you:\n- Solve past questions with step-by-step explanations\n- Explain difficult JAMB topics clearly\n- Analyse photos of questions or textbook pages\n- Build study plans and give exam tips\n\nYou can type a question or attach a photo of a question. What would you like to work on?",
};

export default function AIChat() {
  const [input,      setInput]      = useState("");
  const [dark,       setDark]       = useState(false);
  const [messages,   setMessages]   = useState<Message[]>([WELCOME]);
  const [loading,    setLoading]    = useState(false);
  const [attachment, setAttachment] = useState<{ file: File; preview: string; base64: string; type: "image" | "text" } | null>(null);
  const [focused,    setFocused]    = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const [fileError,  setFileError]  = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const msgId          = useRef(1);

  useEffect(() => {
    setMounted(true);
    setDark(localStorage.getItem("darkMode") === "true");
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const toggleDark = () => {
    const n = !dark;
    setDark(n);
    localStorage.setItem("darkMode", String(n));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) fileInputRef.current = e.target;
    e.target.value = "";
    if (!file) return;
    setFileError("");
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      setFileError(`File too large. Maximum is ${MAX_MB}MB.`);
      return;
    }
    const isImage = file.type.startsWith("image/");
    const isText  = file.type === "text/plain" || file.name.endsWith(".txt");
    if (!isImage && !isText) {
      setFileError("Only images (JPG, PNG, WEBP) and text files (.txt) are supported.");
      return;
    }
    const reader = new FileReader();
    if (isImage) {
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setAttachment({ file, preview: base64, base64, type: "image" });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setAttachment({ file, preview: text.slice(0, 100) + "…", base64: text, type: "text" });
      };
      reader.readAsText(file);
    }
  };

  const sendMessage = async (text: string) => {
    const t         = text.trim();
    const hasAttach = !!attachment;
    if (!t && !hasAttach) return;
    if (loading) return;

    const userMsg: Message = {
      role:    "user",
      id:      msgId.current++,
      content: t || (attachment?.type === "image" ? "📷 Image attached" : attachment?.file.name || ""),
      image:   attachment?.type === "image" ? attachment.base64 : undefined,
    };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");

    const history = newMsgs.slice(1, -1).map(m => ({
      role:    m.role,
      content: typeof m.content === "string" ? m.content : String(m.content),
    }));
    const payload: any = { message: t, history };
    if (attachment?.type === "image") {
      payload.imageBase64 = attachment.base64;
      payload.imageType   = attachment.file.type;
    } else if (attachment?.type === "text") {
      payload.message = `The user has shared a text file named "${attachment.file.name}".\n\nFile contents:\n${attachment.base64}\n\n${t ? `User's question: ${t}` : "Please summarise the key points relevant to JAMB."}`;
    }
    setAttachment(null);
    setLoading(true);

    try {
      const res   = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data  = await res.json();
      const reply = data.reply || data.error || "Sorry, I could not get a response. Please try again.";
      setMessages([...newMsgs, { role: "assistant", id: msgId.current++, content: reply }]);
    } catch {
      setMessages([...newMsgs, { role: "assistant", id: msgId.current++, content: "Network error. Please check your connection and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const T          = palette(dark);
  const bg         = dark ? "#0D0D0F" : "#F8F9FB";
  const headerBg   = dark ? "rgba(18,18,22,0.92)" : "rgba(255,255,255,0.92)";
  const aiBubBg    = dark ? "#1E1E24" : "#FFFFFF";
  const aiBubBord  = dark ? "#2A2A35" : "#E8EAED";
  const inputBg    = dark ? "#1E1E24" : "#F1F3F5";
  const inputBord  = focused ? "#1877F2" : (dark ? "#2A2A35" : "#E0E3E8");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: bg, fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: headerBg, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/" style={{ width: 34, height: 34, borderRadius: 10, background: dark ? "#1E1E24" : "#F0F2F5", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
          <ArrowLeft size={17} color={T.text} strokeWidth={2} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: T.text, letterSpacing: "-0.2px" }}>Companion AI</div>
          <div style={{ fontSize: 11, color: "#31A24C", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#31A24C" }} />
            Online · JAMB expert
          </div>
        </div>
        <button onClick={toggleDark} style={{ width: 34, height: 34, borderRadius: 10, background: dark ? "#1E1E24" : "#F0F2F5", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {dark ? <Sun size={16} color={T.text} /> : <Moon size={16} color={T.text} />}
        </button>
        <button onClick={() => { setMessages([WELCOME]); setInput(""); setAttachment(null); }} style={{ width: 34, height: 34, borderRadius: 10, background: dark ? "#1E1E24" : "#F0F2F5", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <RotateCcw size={15} color={T.sub} strokeWidth={2} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "80px 16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8, marginBottom: 2, animation: "fadeUp 0.2s ease both" }}>
              {!isUser && (
                <div style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, background: "linear-gradient(135deg,#1877F2,#42A5F5)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
                  <Sparkles size={13} color="#fff" strokeWidth={1.8} />
                </div>
              )}
              <div style={{ maxWidth: "80%" }}>
                {m.image && (
                  <img src={m.image} alt="Attached" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: "12px 12px 0 0", display: "block", objectFit: "contain", background: dark ? "#2A2A35" : "#f0f0f0" }} />
                )}
                <div style={{
                  padding: isUser ? "11px 15px" : "13px 16px",
                  borderRadius: isUser
                    ? m.image ? "0 0 4px 18px" : "18px 18px 4px 18px"
                    : "4px 18px 18px 18px",
                  background: isUser ? "#1877F2" : aiBubBg,
                  border: isUser ? "none" : `1px solid ${aiBubBord}`,
                  color: isUser ? "#fff" : T.text,
                  fontSize: 14, lineHeight: 1.65,
                  boxShadow: isUser ? "0 2px 12px rgba(24,119,242,0.3)" : (dark ? "0 1px 4px rgba(0,0,0,0.4)" : "0 1px 8px rgba(0,0,0,0.07)"),
                }}>
                  {isUser
                    ? <span>{m.content}</span>
                    : <ReactMarkdown>{m.content}</ReactMarkdown>}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, animation: "fadeUp 0.2s ease both" }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, background: "linear-gradient(135deg,#1877F2,#42A5F5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={13} color="#fff" strokeWidth={1.8} />
            </div>
            <div style={{ padding: "13px 18px", borderRadius: "4px 18px 18px 18px", background: aiBubBg, border: `1px solid ${aiBubBord}`, display: "flex", gap: 5, alignItems: "center" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#1877F2", animation: `dot 1.2s ease-in-out ${i * 0.18}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Persistent quick-action chips — always visible above input */}
      <div style={{ padding: "8px 16px 0", display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 }}>
        {QUICK_ACTIONS.map((a, i) => (
          <button key={i} onClick={() => { setInput(a.prompt); inputRef.current?.focus(); }} style={{
            flexShrink: 0, padding: "7px 13px", borderRadius: 20,
            border: `1px solid ${dark ? "#2A2A35" : "#E8EAED"}`,
            background: dark ? "#1E1E24" : "#fff",
            color: dark ? "#B0B3B8" : "#65676B",
            fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* File error */}
      {fileError && (
        <div style={{ margin: "8px 16px 0", padding: "10px 14px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#D0021B", fontWeight: 500 }}>{fileError}</span>
          <button onClick={() => setFileError("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <X size={14} color="#D0021B" strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Attachment preview */}
      {attachment && (
        <div style={{ margin: "8px 16px 0", padding: "10px 14px", background: dark ? "#1E2A4A" : "#EBF3FF", border: "1px solid #1877F244", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
          {attachment.type === "image" ? (
            <img src={attachment.preview} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 8, background: "#1877F222", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileText size={20} color="#1877F2" strokeWidth={1.8} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {attachment.file.name}
            </div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>
              {attachment.type === "image" ? "Image — AI will read and solve" : "Text file — AI will analyse content"}
            </div>
          </div>
          <button onClick={() => setAttachment(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
            <X size={16} color={T.sub} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Input area */}
      <div style={{ padding: "10px 16px 28px", background: dark ? "rgba(13,13,15,0.95)" : "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: inputBg, borderRadius: 24, padding: "8px 8px 8px 14px", border: `1.5px solid ${inputBord}`, transition: "border-color 0.2s, box-shadow 0.2s", boxShadow: focused ? "0 0 0 3px rgba(24,119,242,0.12)" : "none" }}>
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: "2px" }}>
            {attachment?.type === "image"
              ? <Image size={18} color="#1877F2" strokeWidth={1.8} />
              : <Paperclip size={17} color={T.muted} strokeWidth={1.8} />}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,text/plain,.txt"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </label>
          <input
            ref={inputRef}
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 15, color: T.text, padding: "4px 0", fontFamily: "inherit" }}
            placeholder={attachment ? "Add a message (optional)…" : "Ask anything about JAMB…"}
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || (!input.trim() && !attachment)}
            style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: loading || (!input.trim() && !attachment) ? (dark ? "#2A2A35" : "#E8EAED") : "#1877F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: loading || (!input.trim() && !attachment) ? "not-allowed" : "pointer", transition: "background 0.2s", boxShadow: !loading && (input.trim() || attachment) ? "0 2px 10px rgba(24,119,242,0.4)" : "none" }}
          >
            <Send size={16} color="#fff" strokeWidth={2} style={{ transform: "translateX(1px)" }} />
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span style={{ fontSize: 10, color: T.muted }}>Supports images (JPG, PNG) and text files · AI can make mistakes</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dot    { 0%,60%,100%{opacity:.3;transform:scale(.8)} 30%{opacity:1;transform:scale(1.2)} }
      `}</style>
    </div>
  );
}
