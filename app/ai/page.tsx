"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import {
  ArrowLeft, Send, Paperclip, Sun, Moon,
  Sparkles, X, RotateCcw, Image, FileText,
} from "lucide-react";
import Layout from "../components/Layout";

interface Message {
  role:    "user" | "assistant";
  content: string;
  id:      number;
  image?:  string; // base64 for display only
}

const QUICK_ACTIONS = [
  { label: "Solve a question",    prompt: "Help me solve this JAMB question: "  },
  { label: "Explain a topic",     prompt: "Explain this JAMB topic clearly: "   },
  { label: "Generate questions",  prompt: "Give me 5 JAMB past questions on: "  },
  { label: "Study tips",          prompt: "Give me study tips for JAMB "        },
];

const WELCOME: Message = {
  role: "assistant", id: 0,
  content: "Hello! I'm **Companion AI** 🎓\n\nI can help you:\n- Solve past questions with step-by-step explanations\n- Explain difficult JAMB topics clearly\n- Analyse photos of questions or textbook pages\n- Build study plans and give exam tips\n\nYou can type a question or attach a photo of a question. What would you like to work on?",
};

export default function AIChat() {
  const [input,       setInput]       = useState("");
  const [dark,        setDark]        = useState(false);
  const [messages,    setMessages]    = useState<Message[]>([WELCOME]);
  const [loading,     setLoading]     = useState(false);
  const [attachment,  setAttachment]  = useState<{ file: File; preview: string; base64: string; type: "image" | "text" } | null>(null);
  const [focused,     setFocused]     = useState(false);
  const [mounted,     setMounted]     = useState(false);
  const [fileError,   setFileError]   = useState("");

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

  // ── File handling ─────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) fileInputRef.current = e.target;
    e.target.value = ""; // reset so same file can be reselected
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

  // ── Send ──────────────────────────────────────────────────────────────

  const sendMessage = async (text: string) => {
    const t         = text.trim();
    const hasAttach = !!attachment;
    if (!t && !hasAttach) return;
    if (loading) return;

    // Build user message for display
    const userMsg: Message = {
      role:    "user",
      id:      msgId.current++,
      content: t || (attachment?.type === "image" ? "📷 Image attached" : attachment?.file.name || ""),
      image:   attachment?.type === "image" ? attachment.base64 : undefined,
    };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");

    // Build API payload
    const history = newMsgs.slice(1, -1).map(m => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : String(m.content),
      }));
    const payload: any = { message: t, history };
    if (attachment?.type === "image") {
      payload.imageBase64 = attachment.base64;
      payload.imageType   = attachment.file.type;
    } else if (attachment?.type === "text") {
      // Prepend file content to message
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

  const T = dark ? {
    bg:      "#0D0D0F",
    surface: "#1E1E24",
    s2:      "#1E2A4A",
    s3:      "#2A2A35",
    border:  "#2A2A35",
    text:    "#E4E6EB",
    sub:     "#B0B3B8",
    muted:   "#8A8D91",
  } : {
    bg:      "#F8F9FB",
    surface: "#FFFFFF",
    s2:      "#F1F3F5",
    s3:      "#E8EAED",
    border:  "#E8EAED",
    text:    "#050505",
    sub:     "#65676B",
    muted:   "#8A8D91",
  };

  return (
    <Layout title="AI Chat" darkMode={dark} onToggleDark={toggleDark} contentWidth="standard">
      {/* Messages */}
      <div className="flex-1 w-full overflow-y-auto p-4 pt-10 pb-6"
           style={{ paddingTop: "80px", paddingBottom: "20px" }}>
        {messages.length > 1 && (
          <div className="mb-2">
            <button
              onClick={() => setMessages([WELCOME])}
              className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center hover:bg-surface3 transition-colors"
            >
              <RotateCcw size={14} color={T.sub} strokeWidth={2} />
            </button>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mb-1">
                    <Sparkles size={13} color="#fff" strokeWidth={1.8} />
                  </div>
                )}
                <div className="max-w-[80%]">
                  {m.image && (
                    <img
                      src={m.image}
                      alt="Attached"
                      className="max-w-full max-h-[200px] rounded-xl object-contain"
                      style={{ backgroundColor: isUser ? T.surface : '#f0f0f0' }}
                    />
                  )}
                  <div className={`px-4 py-2 rounded-lg
                           ${isUser
                             ? (m.image ? 'bg-primary text-white rounded-tr-xl rounded-bl-lg rounded-br-lg'
                                : 'bg-primary text-white rounded-tr-xl rounded-bl-lg rounded-br-lg')
                             : `bg-${isUser ? 'surface' : 'primary'}/10 text-${isUser ? 'white' : 'text'} border border-${isUser ? 'surface' : 'primary'}/20`}
                           `}>
                    {isUser ? (
                      <span>{m.content}</span>
                    ) : (
                      <ReactMarkdown className="whitespace-pre-wrap">{m.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            )}
          })}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-end space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Sparkles size={13} color="#fff" strokeWidth={1.8} />
              </div>
              <div className="flex space-x-2">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce"
                           style={{ animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick action chips */}
          {messages.length === 1 && !loading && (
            <div className="mt-4">
              <div className="text-xs text-muted text-uppercase tracking-wider mb-2">
                Try asking
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {QUICK_ACTIONS.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(a.prompt); inputRef.current?.focus(); }}
                    className={`px-3 py-2 rounded-lg
                             ${dark ? 'bg-surface2 text-muted hover:bg-surface3' : 'bg-white text-gray-600 hover:bg-gray-50'}
                             transition-colors text-left`}
                  >
                    <div className="font-semibold">{a.label}</div>
                    <div className="text-xs text-muted mt-1">Tap to start</div>
                  </button>
                ))}
              </div>
          </div>
          </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* File error */}
      {fileError && (
        <div className="mb-4 p-3 rounded bg-danger/10 border border-danger/20 text-danger">
          {fileError}
        </div>
      )}

      {/* Attachment preview */}
      {attachment && (
        <div className="mb-4 px-4 py-2 rounded-lg"
             style={{ backgroundColor: dark ? '#1E2A4A' : '#EBF3FF', border: `1px solid #1877F244` }}>
          <div className="flex items-center gap-3">
            {attachment.type === "image" ? (
              <img
                src={attachment.preview}
                alt=""
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/20">
                <FileText size={20} color="#1877F2" strokeWidth={1.8} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-{dark ? 'white' : 'text'}">{attachment.file.name}</div>
              <div className="text-xs text-muted mt-1">
                {attachment.type === "image"
                  ? "Image — AI will read and solve"
                  : "Text file — AI will analyse content"}
              </div>
            </div>
            <button
              onClick={() => setAttachment(null)}
              className="p-1 rounded hover:bg-surface2/50 transition-colors"
            >
              <X size={16} color={T.sub} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-4"
           style={{
             backgroundColor: dark ? "rgba(13,13,15,0.95)" : "rgba(255,255,255,0.95)",
             backdropFilter: "blur(16px)",
             WebkitBackdropFilter: "blur(16px)",
             borderTop: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)}"`
           }}>
        <div className="flex items-center gap-2"
             style={{
               backgroundColor: dark ? "#1E1E24" : "#F1F3F5",
               borderRadius: "24px",
               padding: "8px 8px 8px 14px",
               border: `1.5px solid ${focused ? "#1877F2" : (dark ? "#2A2A35" : "#E0E3E8")}`,
               transition: "border-color 0.2s, box-shadow 0.2s",
               boxShadow: focused ? "0 0 0 3px rgba(24,119,242,0.12)" : "none"
             }}>

          {/* File attach */}
          <label className="cursor-pointer flex items-center justify-center p-1">
            {attachment?.type === "image"
              ? <Image size={18} color="#1877F2" strokeWidth={1.8} />
              : <Paperclip size={17} color={T.muted} strokeWidth={1.8} />}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,text/plain,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* Text input */}
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-sm text-{dark ? 'white' : 'text'} p-0"
            placeholder={attachment ? "Add a message (optional)…" : "Ask anything about JAMB…"}
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          />

          {/* Send */}
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || (!input.trim() && !attachment)}
            className={`w-10 h-10 rounded-full
                     ${loading || (!input.trim() && !attachment)
                       ? (dark ? 'bg-surface2 text-muted' : 'bg-gray-300 text-gray-500')
                       : 'bg-primary text-white hover:bg-primary/90'}
                     transition-all flex items-center justify-center`}
          >
            <Send size={16} color="#fff" strokeWidth={2} style={{ transform: "translateX(1px)" }} />
          </button>
        </div>

        <div className="mt-2 text-center text-xs text-muted">
          Supports images (JPG, PNG) and text files · AI can make mistakes
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dot    { 0%,60%,100%{opacity:.3;transform:scale(.8)} 30%{opacity:1;transform:scale(1.2)} }
      `}</style>
    </Layout>
  );
}