"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import {
  ArrowLeft, Send, Paperclip,
  Sparkles, X, RotateCcw, Image as ImageIcon, FileText,
} from "lucide-react";
import { palette } from "../lib/design";
import { stripEmoji } from "../components/AppIcon";
import { useDark, useIsoLayoutEffect } from "../lib/theme";

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
  content: "Hello! I'm **your AI Tutor**.\n\nI can help you:\n- Solve past questions with step-by-step explanations\n- Explain difficult JAMB topics clearly\n- Analyse photos of questions or textbook pages\n- Build study plans and give exam tips\n\nYou can type a question or attach a photo of a question. What would you like to work on?",
};


/** One chat bubble. Memoised, so typing in the box never re-renders (or re-parses) the conversation. */
const MessageBubble = React.memo(function MessageBubble({ m, dark }: { m: Message; dark: boolean }) {
  const T      = palette(dark);
  const isUser = m.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8, marginBottom: 2, animation: "fadeUp 0.2s ease backwards" }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, background: "linear-gradient(135deg,#6366F1,#818CF8)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
          <Sparkles size={13} color="#fff" strokeWidth={1.8} />
        </div>
      )}
      <div style={{ maxWidth: "min(82%, 720px)", minWidth: 0 }}>
        {m.image && (
          <img src={m.image} alt="Attached" style={{ maxWidth: "100%", maxHeight: 240, borderRadius: "12px 12px 0 0", display: "block", objectFit: "contain", background: T.s3 }} />
        )}
        <div
          className={isUser ? undefined : "md-body"}
          style={{
            padding: isUser ? "11px 15px" : "13px 16px",
            borderRadius: isUser
              ? m.image ? "0 0 4px 18px" : "18px 18px 4px 18px"
              : "4px 18px 18px 18px",
            background: isUser ? T.primary : T.surface,
            border: isUser ? "none" : `1px solid ${T.border}`,
            color: isUser ? "#fff" : T.text,
            fontSize: 14, lineHeight: 1.65,
            boxShadow: "none",
            overflowWrap: "anywhere",
          }}
        >
          {isUser
            ? <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
            : <ReactMarkdown>{stripEmoji(m.content)}</ReactMarkdown>}
        </div>
      </div>
    </div>
  );
});

export default function AIChat() {
  const dark = useDark();
  const T    = palette(dark);

  const [input,      setInput]      = useState("");
  const [messages,   setMessages]   = useState<Message[]>([WELCOME]);
  const [loading,    setLoading]    = useState(false);
  const [attachment, setAttachment] = useState<{ file: File; preview: string; base64: string; type: "image" | "text" } | null>(null);
  const [fileError,  setFileError]  = useState("");

  const listRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const msgId    = useRef(1);
  const autoSent = useRef(false);

  // Keep the newest message in view. Scrolls the list itself, never the whole page.
  useEffect(() => {
    const el = listRef.current;
    if (!el || (messages.length <= 1 && !loading)) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // The box grows with what you type (up to ~6 lines).
  useIsoLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

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
      content: t || (attachment?.type === "image" ? "Image attached" : attachment?.file.name || ""),
      image:   attachment?.type === "image" ? attachment.base64 : undefined,
    };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");

    const history = newMsgs.slice(1, -1).map(m => ({
      role:    m.role,
      content: typeof m.content === "string" ? m.content : String(m.content),
    }));
    const payload: Record<string, unknown> = { message: t, history };
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

  // "Ask AI to explain this answer" (from Past Questions) opens /ai?q=...  Send it once, then tidy the URL.
  useEffect(() => {
    if (autoSent.current) return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (!q) return;
    autoSent.current = true;
    window.history.replaceState(window.history.state, "", window.location.pathname);
    sendMessage(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const canSend = !loading && (input.trim().length > 0 || !!attachment);

  return (
    <div className="chat-root" style={{ display: "flex", flexDirection: "column", background: T.bg, fontFamily: "var(--font)", overflow: "hidden" }}>

      {/* Header (part of the column, not fixed, so it lines up on phones, tablets and laptops) */}
      <div style={{ flexShrink: 0, background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/" aria-label="Back" style={{ width: 44, height: 44, borderRadius: 12, background: T.s2, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
          <ArrowLeft size={17} color={T.text} strokeWidth={2} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: T.text, letterSpacing: "-0.2px" }}>AI Tutor</div>
          <div style={{ fontSize: 11, color: "#31A24C", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#31A24C" }} />
            Online · JAMB expert
          </div>
        </div>
        <button
          aria-label="New chat"
          onClick={() => { setMessages([WELCOME]); setInput(""); setAttachment(null); }}
          style={{ width: 44, height: 44, borderRadius: 12, background: T.s2, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <RotateCcw size={15} color={T.sub} strokeWidth={2} />
        </button>
      </div>

      {/* Messages */}
      <div ref={listRef} style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", padding: "16px 16px 12px" }}>
        <div className="chat-narrow" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {messages.map(m => <MessageBubble key={m.id} m={m} dark={dark} />)}

          {loading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, animation: "fadeUp 0.2s ease backwards" }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, background: "linear-gradient(135deg,#6366F1,#818CF8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={13} color="#fff" strokeWidth={1.8} />
              </div>
              <div style={{ padding: "13px 18px", borderRadius: "4px 18px 18px 18px", background: T.surface, border: `1px solid ${T.border}`, display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.primary, animation: `dot 1.2s ease-in-out ${i * 0.18}s infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div style={{ flexShrink: 0, background: T.surface, borderTop: `1px solid ${T.border}` }}>
        <div className="chat-narrow" style={{ padding: "8px 16px calc(12px + env(safe-area-inset-bottom, 0px))" }}>

          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 8 }}>
            {QUICK_ACTIONS.map((a, i) => (
              <button key={i} onClick={() => { setInput(a.prompt); inputRef.current?.focus(); }} style={{
                flexShrink: 0, padding: "10px 14px", minHeight: 44, display: "flex", alignItems: "center", borderRadius: 20,
                border: `1px solid ${T.border}`, background: T.s2, color: T.sub,
                fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              }}>
                {a.label}
              </button>
            ))}
          </div>

          {fileError && (
            <div style={{ marginBottom: 8, padding: "10px 14px", background: T.dangerTint, border: "1px solid " + T.danger + "44", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 13, color: T.danger, fontWeight: 500 }}>{fileError}</span>
              <button onClick={() => setFileError("")} aria-label="Dismiss" style={{ background: "none", border: "none", cursor: "pointer", padding: 10, margin: -6, display: "flex" }}>
                <X size={14} color={T.danger} strokeWidth={2} />
              </button>
            </div>
          )}

          {attachment && (
            <div style={{ marginBottom: 8, padding: "10px 14px", background: T.s2, border: `1px solid ${T.primary}44`, borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
              {attachment.type === "image" ? (
                <img src={attachment.preview} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 8, background: `${T.primary}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={20} color={T.primary} strokeWidth={1.8} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {attachment.file.name}
                </div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>
                  {attachment.type === "image" ? "Image: AI will read and solve" : "Text file: AI will analyse content"}
                </div>
              </div>
              <button onClick={() => setAttachment(null)} aria-label="Remove attachment" style={{ background: "none", border: "none", cursor: "pointer", padding: 12, margin: -6, display: "flex" }}>
                <X size={16} color={T.sub} strokeWidth={2} />
              </button>
            </div>
          )}

          <div className="chat-input" style={{ display: "flex", alignItems: "flex-end", gap: 8, background: T.s2, borderRadius: 24, padding: "8px 8px 8px 14px", border: `1.5px solid ${T.border}` }}>
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: 40, height: 40, marginBottom: 2 }} aria-label="Attach a file">
              {attachment?.type === "image"
                ? <ImageIcon size={18} color={T.primary} strokeWidth={1.8} />
                : <Paperclip size={17} color={T.muted} strokeWidth={1.8} />}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,text/plain,.txt"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </label>
            <textarea
              ref={inputRef}
              rows={1}
              enterKeyHint="send"
              style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", boxShadow: "none", resize: "none", fontSize: 15, lineHeight: 1.45, color: T.text, padding: "5px 0", fontFamily: "inherit", maxHeight: 160, overflowY: "auto", borderRadius: 0 }}
              placeholder={attachment ? "Add a message (optional)…" : "Ask anything about JAMB…"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!canSend}
              aria-label="Send"
              style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: canSend ? T.primary : T.s3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: canSend ? "pointer" : "not-allowed", transition: "background 0.2s", boxShadow: "none" }}
            >
              <Send size={16} color="#fff" strokeWidth={2} style={{ transform: "translateX(1px)" }} />
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <span style={{ fontSize: 10, color: T.muted }}>
              Supports images (JPG, PNG) and text files · AI can make mistakes
              <span className="kbd-hint"> · Enter to send, Shift+Enter for a new line</span>
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dot    { 0%,60%,100%{opacity:.3;transform:scale(.8)} 30%{opacity:1;transform:scale(1.2)} }
        .chat-root   { height: 100vh; height: 100dvh; }
        .chat-narrow { width: 100%; max-width: 820px; margin-left: auto; margin-right: auto; }
        .chat-input:focus-within { border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        .kbd-hint { display: none; }
        @media (min-width: 1024px) { .kbd-hint { display: inline; } }

        /* answer formatting (Tailwind resets lists and headings, so restore them here) */
        .md-body > :first-child { margin-top: 0; }
        .md-body > :last-child  { margin-bottom: 0; }
        .md-body p  { margin: 0 0 0.65em; }
        .md-body ul { list-style: disc;    margin: 0 0 0.65em; padding-left: 1.3em; }
        .md-body ol { list-style: decimal; margin: 0 0 0.65em; padding-left: 1.3em; }
        .md-body li { margin: 0.2em 0; }
        .md-body h1, .md-body h2, .md-body h3, .md-body h4 { font-weight: 800; line-height: 1.3; margin: 0.9em 0 0.4em; }
        .md-body h1 { font-size: 1.25em; } .md-body h2 { font-size: 1.15em; } .md-body h3, .md-body h4 { font-size: 1.05em; }
        .md-body pre { overflow-x: auto; padding: 10px 12px; border-radius: 10px; background: var(--surface-2); margin: 0 0 0.65em; }
        .md-body code { font-size: 0.92em; }
        .md-body blockquote { margin: 0 0 0.65em; padding-left: 12px; border-left: 3px solid var(--border); color: var(--text-sub); }
      `}</style>
    </div>
  );
}
