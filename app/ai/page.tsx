"use client";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import Link from "next/link";
import {
  AlertTriangle, ArrowLeft, Check, Copy, FileText,
  Image as ImageIcon, MessageSquarePlus, Paperclip,
  RefreshCw, Send, X,
} from "lucide-react";
import { FW, LAYOUT, R, SP, TY, palette } from "../lib/design";
import { stripEmoji } from "../components/AppIcon";
import { Flame } from "../components/Flame";
import { readFlameStage, type FlameStage } from "../lib/flame";
import { useIsoLayoutEffect } from "../lib/theme";
import { fetchWithTimeout, FETCH_TIMEOUTS, OfflineError, TimeoutError } from "../lib/fetch-timeout";

interface Message {
  role:    "user" | "assistant";
  content: string;
  id:      number;
  image?:  string;
  createdAt: number;
  /** True for a failed send: renders as an error card, never as a bubble (H6). */
  error?: boolean;
  errorMessage?: string;
}

interface Attachment {
  file: File;
  preview: string;
  base64: string;
  type: "image" | "text";
  size: number;
}

/** What is needed to send (or re-send) the last user turn. */
interface LastUserPayload {
  text: string;
  payloadMessage: string;
  imageBase64?: string;
  imageType?: string;
  attachment?: Attachment | null;
}

// ── Limits, aligned to what /api/chat actually enforces ──────────────────────
// API: imageBase64 string capped at 5,000,000 chars (route.ts MAX_IMAGE_BYTES).
// A data-URL base64 string runs ~4/3 the raw size, so 5,000,000 chars is
// ~3.75MB raw — and the API's own error copy says "under 3.5 MB". The client
// therefore caps raw images at 3.5MB (L14): a file that passes here always
// passes there. Text files ride inside `message`, which the API caps at
// 4,000 chars, so text is capped at 3,500 chars to leave room for the
// question and the file-name wrapper.
const STORAGE_KEY = "companion_ai_chat";
const MAX_STORED_MESSAGES = 50;
const MAX_IMAGE_MB = 3.5;
const MAX_TEXT_CHARS = 3500;
const MAX_MESSAGE_CHARS = 4000;

function shortSubject(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("literature")) return "Literature";
  if (n.includes("english"))    return "English";
  if (n.includes("math"))       return "Maths";
  if (n.includes("physics"))    return "Physics";
  if (n.includes("chemistry"))  return "Chemistry";
  if (n.includes("biology"))    return "Biology";
  if (n.includes("government")) return "Government";
  if (n.includes("economics"))  return "Economics";
  return name;
}

// A4: two lines, names the student's own subjects; the chips carry the rest.
function welcomeFor(subjects: string[]): Message {
  const names = subjects.map(shortSubject);
  const content = names.length
    ? `Hi — I'm your AI Tutor. Ask me anything about your ${names.length} JAMB subject${names.length === 1 ? "" : "s"} — ${names.join(", ")} — or send a photo of a question and I'll work through it.`
    : "Hi — I'm your AI Tutor. Ask me anything about your JAMB subjects — or send a photo of a question and I'll work through it.";
  return { role: "assistant", id: 0, content, createdAt: Date.now() };
}

// A2: chips send immediately; the study-tips chip names a real subject.
function suggestionChips(subjects: string[]): { label: string; prompt: string }[] {
  const shorts = subjects.map(shortSubject);
  const tipSubject = shorts.find((s) => s !== "English") || shorts[0] || "Physics";
  return [
    { label: "Explain Le Chatelier's principle", prompt: "Explain Le Chatelier's principle" },
    { label: "Compare acids and bases",           prompt: "Compare acids and bases" },
    { label: "Quiz me on quadratics",             prompt: "Quiz me on quadratics" },
    { label: `Study tips for ${tipSubject}`,      prompt: `Give me study tips for ${tipSubject} for JAMB` },
  ];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (dayKey(ts) === dayKey(now.getTime())) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dayKey(ts) === dayKey(yesterday.getTime())) return "Yesterday";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// A7: tables get a scroll wrapper (the .md-body table/th/td/img rules live in
// globals.css under the `profileaidrill: ai` marker).
const mdComponents: Components = {
  table: ({ node, ...props }) => (
    <div className="md-table-wrap">
      <table {...props} />
    </div>
  ),
};

// A6: the tutor's avatar is Flame (the student's real stage), not a sparkle tile.
function TutorAvatar({ stage, size }: { stage: FlameStage; size: number }) {
  const T = palette();
  const tile = size <= 17 ? 28 : 34;
  return (
    <span style={{ width: tile, height: tile, borderRadius: R.pill, flexShrink: 0, background: T.accentTint, border: `1px solid ${T.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Flame stage={stage} heat={60} size={size} />
    </span>
  );
}

const msgActStyle = (T: ReturnType<typeof palette>): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: SP[1],
  fontSize: TY.xs, fontWeight: FW.semibold, color: T.muted,
  padding: `${SP[1]}px ${SP[2]}px`, borderRadius: R.md, minHeight: 44,
  background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
});

/** One chat bubble. Memoised, so typing in the box never re-renders (or re-parses) the conversation. */
const MessageBubble = React.memo(function MessageBubble({
  m, stage, copiedId, onCopy, onRetry,
}: {
  m: Message;
  stage: FlameStage;
  copiedId: number | null;
  onCopy: (id: number, text: string) => void;
  onRetry: (id: number) => void;
}) {
  const T = palette();
  const isUser = m.role === "user";

  // H6: a failed send is an error card with Retry — never a chat bubble.
  if (m.error) {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: SP[2] }}>
        <TutorAvatar stage={stage} size={17} />
        <div style={{ maxWidth: "min(84%, 600px)", background: T.dangerTint, border: `1px solid ${T.dangerText}55`, borderRadius: R.xl, padding: `${SP[3]}px ${SP[4]}px` }}>
          <div style={{ display: "flex", alignItems: "center", gap: SP[2], fontSize: TY.base, fontWeight: FW.bold, color: T.dangerText }}>
            <AlertTriangle size={16} strokeWidth={2} />
            Couldn&apos;t get a response
          </div>
          <p style={{ margin: `${SP[2]}px 0 ${SP[3]}px`, fontSize: TY.sm, color: T.sub, lineHeight: 1.55 }}>
            {m.errorMessage || "The tutor didn't answer. Check your connection and try again — your question is kept."}
          </p>
          <button
            onClick={() => onRetry(m.id)}
            style={{ display: "inline-flex", alignItems: "center", gap: SP[2], minHeight: 44, padding: `${SP[2]}px ${SP[4]}px`, borderRadius: R.lg, border: `1px solid ${T.border}`, background: T.s2, color: T.text, fontSize: TY.sm, fontWeight: FW.bold, cursor: "pointer", fontFamily: "inherit" }}
          >
            <RefreshCw size={15} strokeWidth={2} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", gap: SP[2] }}>
          <div style={{ maxWidth: "min(84%, 480px)", minWidth: 0 }}>
            {m.image && (
              <img
                src={m.image}
                alt="Attached photo"
                style={{ maxWidth: "100%", maxHeight: 240, display: "block", objectFit: "contain", background: T.s3, borderRadius: m.content ? `${R.xxl} ${R.xxl} 0 0` : `${R.xxl} ${R.xxl} ${R.sm} ${R.xxl}` }}
              />
            )}
            {m.content ? (
              <div
                style={{
                  padding: `${SP[3]}px ${SP[4]}px`,
                  borderRadius: m.image ? `0 0 ${R.sm} ${R.xxl}` : `${R.xxl} ${R.xxl} ${R.sm} ${R.xxl}`,
                  background: T.primary,
                  color: T.onPrimary,
                  fontSize: TY.base, lineHeight: 1.65,
                  overflowWrap: "anywhere",
                }}
              >
                <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
              </div>
            ) : null}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: SP[1] }}>
          <span style={{ fontSize: TY.xs, color: T.muted }}>{fmtTime(m.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: SP[2] }}>
        <TutorAvatar stage={stage} size={17} />
        <div style={{ maxWidth: "min(84%, 600px)", minWidth: 0 }}>
          <div
            className="md-body"
            style={{
              padding: `${SP[3]}px ${SP[4]}px`,
              borderRadius: `${R.sm} ${R.xxl} ${R.xxl} ${R.xxl}`,
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.text,
              fontSize: TY.base, lineHeight: 1.65,
              overflowWrap: "anywhere",
            }}
          >
            <ReactMarkdown components={mdComponents}>{stripEmoji(m.content)}</ReactMarkdown>
          </div>
        </div>
      </div>
      {/* A5 + A11: timestamp, Copy, Retry on every assistant answer. */}
      <div style={{ display: "flex", alignItems: "center", gap: SP[1], marginTop: SP[1], marginLeft: 28 + SP[2] }}>
        <span style={{ fontSize: TY.xs, color: T.muted }}>{fmtTime(m.createdAt)}</span>
        <button onClick={() => onCopy(m.id, m.content)} aria-label="Copy answer" style={msgActStyle(T)}>
          {copiedId === m.id ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={2} />}
          {copiedId === m.id ? "Copied" : "Copy"}
        </button>
        <button onClick={() => onRetry(m.id)} aria-label="Retry this answer" style={msgActStyle(T)}>
          <RefreshCw size={13} strokeWidth={2} />
          Retry
        </button>
      </div>
    </div>
  );
});

export default function AIChat() {
  const T = palette();

  const [input,      setInput]      = useState("");
  const [messages,   setMessages]   = useState<Message[]>(() => [welcomeFor([])]);
  const [subjects,   setSubjects]   = useState<string[]>([]);
  const [hydrated,   setHydrated]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [fileError,  setFileError]  = useState("");
  const [newConfirm, setNewConfirm] = useState(false);
  const [copiedId,   setCopiedId]   = useState<number | null>(null);
  const [flameStage, setFlameStage] = useState<FlameStage>("flame");

  const listRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const msgId    = useRef(1);
  const autoSent = useRef(false);
  const copyTimer = useRef<number | null>(null);
  const lastUserRef = useRef<LastUserPayload | null>(null);
  // Slow-network escalation for the chat fetch (~8s) + user cancel.
  const [slowChat, setSlowChat] = useState(false);
  const chatAbortRef = useRef<AbortController | null>(null);
  const cancelChat = () => { chatAbortRef.current?.abort(); };

  // H9: restore the persisted conversation + the student's subjects once,
  // client-only (no localStorage read during SSR, so no hydration mismatch).
  // The welcome is rebuilt with the real subjects when there is no history.
  useEffect(() => {
    let storedSubjects: string[] = [];
    try {
      const u = JSON.parse(localStorage.getItem("companion_user") || "null");
      if (u && Array.isArray(u.subjects)) {
        storedSubjects = u.subjects.filter((s: unknown): s is string => typeof s === "string");
      }
    } catch { /* subjects are optional context */ }
    setSubjects(storedSubjects);
    let restored = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Message[];
        if (Array.isArray(parsed) && parsed.length) {
          const clean = parsed
            .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && !m.error)
            .slice(-MAX_STORED_MESSAGES)
            .map((m) => ({ ...m, createdAt: typeof m.createdAt === "number" ? m.createdAt : Date.now() }));
          if (clean.length) {
            restored = true;
            setMessages(clean);
            msgId.current = Math.max(...clean.map((m) => m.id || 0)) + 1;
          }
        }
      }
    } catch { /* a damaged saved chat starts fresh — it is not an error state */ }
    if (!restored) setMessages([welcomeFor(storedSubjects)]);
    try { setFlameStage(readFlameStage()); } catch { /* keep the default stage */ }
    setHydrated(true);
  }, []);

  // H9: persist the conversation (welcome + error cards excluded), last 50.
  useEffect(() => {
    if (!hydrated) return;
    try {
      const toStore = messages.filter((m) => m.id !== 0 && !m.error).slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch { /* private-mode storage failure must not break the chat */ }
  }, [messages, hydrated]);

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

  const appendError = (base: Message[], errorMessage: string) => {
    setMessages([...base, { role: "assistant", id: msgId.current++, content: "", createdAt: Date.now(), error: true, errorMessage }]);
  };

  // M8: the API does NOT stream (route.ts is one non-streaming Groq call
  // returning { reply }). So there is no token stream to render — instead the
  // staged loading copy below + Cancel via AbortController + fetchWithTimeout.
  const runChat = async (last: LastUserPayload, base: Message[]) => {
    // History excludes the welcome, error cards, and the current user turn
    // (it goes in `message`); the API caps history at 20 items.
    const history = base
      .filter((m) => m.id !== 0 && !m.error)
      .slice(0, -1)
      .slice(-20)
      .map((m) => ({
        role: m.role,
        content: m.content || (m.image ? "[Photo of a question]" : ""),
      }))
      .filter((m) => m.content.length > 0);
    const payload: Record<string, unknown> = { message: last.payloadMessage, history };
    // Send the student's registered subjects so the AI answers inside
    // their syllabus (the chat route builds a detailed prompt from them).
    try {
      const u = JSON.parse(localStorage.getItem("companion_user") || "null");
      if (u && Array.isArray(u.subjects) && u.subjects.length) payload.subjects = u.subjects;
    } catch { /* subjects are optional context */ }
    if (last.imageBase64) {
      payload.imageBase64 = last.imageBase64;
      payload.imageType = last.imageType || "image/jpeg";
    }
    setLoading(true);
    setSlowChat(false);
    const aborter = new AbortController();
    chatAbortRef.current = aborter;
    // After ~8s say the reply is still coming; Cancel is offered throughout.
    const slowTimer = window.setTimeout(() => setSlowChat(true), 8000);

    try {
      const res = await fetchWithTimeout("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
        signal:  aborter.signal,
      }, FETCH_TIMEOUTS.chat);
      // H6: a non-JSON response used to be misreported as a network error;
      // a server error used to be rendered as if it were an answer.
      let data: { reply?: unknown; error?: unknown } | null = null;
      try { data = await res.json(); } catch { data = null; }
      if (!res.ok || !data || typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error(typeof data?.error === "string" && data.error ? data.error : "AI service error. Please try again.");
      }
      setMessages([...base, { role: "assistant", id: msgId.current++, content: data.reply, createdAt: Date.now() }]);
    } catch (err) {
      // A user Cancel just stops waiting — no error card, and the
      // conversation stays put. The cancelled turn is put back in the
      // composer (text + attachment) so it can be sent again as-is.
      if (err instanceof Error && err.name === "AbortError") {
        if (last.text) setInput(last.text);
        if (last.attachment) setAttachment(last.attachment);
      } else if (err instanceof OfflineError) {
        appendError(base, "You're offline — your message was not sent. Check your connection and try again.");
      } else if (err instanceof TimeoutError) {
        appendError(base, "Still waiting for the AI — the request timed out. Please try again.");
      } else {
        appendError(base, err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      window.clearTimeout(slowTimer);
      setSlowChat(false);
      chatAbortRef.current = null;
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    const t = text.trim();
    const hasAttach = !!attachment;
    if (!t && !hasAttach) return;
    if (loading) return;
    if (t.length > MAX_MESSAGE_CHARS) {
      setFileError(`Message too long — keep it under ${MAX_MESSAGE_CHARS.toLocaleString()} characters.`);
      return;
    }

    let payloadMessage = t;
    if (attachment?.type === "text") {
      payloadMessage = `The user has shared a text file named "${attachment.file.name}".\n\nFile contents:\n${attachment.base64}\n\n${t ? `User's question: ${t}` : "Please summarise the key points relevant to JAMB."}`;
    }
    // A6: an image-only message has no caption text — the image is the message.
    const userMsg: Message = {
      role:    "user",
      id:      msgId.current++,
      content: t || (attachment?.type === "text" ? attachment.file.name : ""),
      image:   attachment?.type === "image" ? attachment.base64 : undefined,
      createdAt: Date.now(),
    };
    const last: LastUserPayload = {
      text: userMsg.content,
      payloadMessage,
      imageBase64: attachment?.type === "image" ? attachment.base64 : undefined,
      imageType: attachment?.type === "image" ? attachment.file.type : undefined,
      attachment,
    };
    lastUserRef.current = last;
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setAttachment(null);
    setFileError("");
    await runChat(last, newMsgs);
  };

  // A5: Retry resends the last user turn — no duplicate user bubble, no retyping.
  const retryMessage = async (assistantId: number) => {
    const last = lastUserRef.current;
    if (!last || loading) return;
    const base = messages.filter((m) => m.id !== assistantId);
    setMessages(base);
    await runChat(last, base);
  };

  const copyMessage = async (id: number, text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch { return; }
    setCopiedId(id);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    e.target.value = "";
    if (!file) return;
    setFileError("");
    const isImage = file.type.startsWith("image/");
    const isText  = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
    if (!isImage && !isText) {
      setFileError("Only images (JPG, PNG, WEBP, GIF) and text files (.txt) are supported.");
      return;
    }
    if (isImage && file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setFileError(`Image too large. Maximum is ${MAX_IMAGE_MB}MB — the AI service accepts images under 3.5MB.`);
      return;
    }
    const reader = new FileReader();
    if (isImage) {
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setAttachment({ file, preview: base64, base64, type: "image", size: file.size });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text.length > MAX_TEXT_CHARS) {
          setFileError("Text file too long — keep it under about 3,500 characters. The tutor can only read shorter notes.");
          return;
        }
        setAttachment({ file, preview: text.slice(0, 100) + "…", base64: text, type: "text", size: file.size });
      };
      reader.readAsText(file);
    }
  };

  // "Ask AI to explain this answer" (from Past Questions) opens /ai?q=...  Send it once, then tidy the URL.
  // Depends on `messages` so the auto-send runs after a restored conversation has landed.
  useEffect(() => {
    if (!hydrated || autoSent.current) return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (!q) return;
    autoSent.current = true;
    window.history.replaceState(window.history.state, "", window.location.pathname);
    void sendMessage(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, messages]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  // A1: New chat confirms first — but only when there is a conversation to lose.
  const hasUserMessages = messages.some((m) => m.role === "user");
  const requestNewChat = () => {
    if (loading) return;
    if (!hasUserMessages) {
      setMessages([welcomeFor(subjects)]);
      return;
    }
    setNewConfirm(true);
  };
  const confirmNewChat = () => {
    setNewConfirm(false);
    setMessages([welcomeFor(subjects)]);
    setInput("");
    setAttachment(null);
    setFileError("");
    lastUserRef.current = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* nothing to clear */ }
  };

  const canSend = !loading && (input.trim().length > 0 || !!attachment);
  const chips = suggestionChips(subjects);
  const showChips = !loading && !hasUserMessages;

  // A11: date separators between days.
  let lastDay = "";
  const listItems: React.ReactNode[] = [];
  messages.forEach((m) => {
    const day = dayKey(m.createdAt);
    if (day !== lastDay) {
      lastDay = day;
      listItems.push(
        <div key={`sep-${day}`} style={{ display: "flex", justifyContent: "center", margin: `${SP[2]}px 0` }}>
          <span style={{ fontSize: TY.xs, fontWeight: FW.semibold, color: T.muted, background: T.s2, border: `1px solid ${T.border}`, borderRadius: R.pill, padding: `${SP[1]}px ${SP[3]}px` }}>
            {dayLabel(m.createdAt)}
          </span>
        </div>,
      );
    }
    listItems.push(
      <MessageBubble key={m.id} m={m} stage={flameStage} copiedId={copiedId} onCopy={copyMessage} onRetry={retryMessage} />,
    );
  });

  return (
    <div className="chat-root" style={{ display: "flex", flexDirection: "column", background: T.bg, fontFamily: "var(--font)", overflow: "hidden" }}>

      {/* Header — capped to the same 820px column as the messages (AUDIT §3.17) */}
      <div style={{ flexShrink: 0, background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div className="chat-narrow" style={{ display: "flex", alignItems: "center", gap: SP[3], padding: `${SP[3]}px ${SP[4]}px` }}>
          <Link href="/" aria-label="Back" style={{ width: 44, height: 44, borderRadius: R.lg, background: T.s2, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}>
            <ArrowLeft size={17} color={T.text} strokeWidth={2} />
          </Link>
          <TutorAvatar stage={flameStage} size={20} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: FW.bold, fontSize: TY.base, color: T.text, letterSpacing: "-0.2px" }}>AI Tutor</div>
            <div style={{ fontSize: TY.xs, color: T.sub, fontWeight: FW.semibold }}>
              Answers from the official JAMB syllabus
            </div>
          </div>
          <button
            aria-label="New chat"
            onClick={requestNewChat}
            disabled={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: SP[2], minHeight: 44, padding: `${SP[2]}px ${SP[3]}px`, borderRadius: R.lg, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: TY.sm, fontWeight: FW.bold, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", flexShrink: 0 }}
          >
            <MessageSquarePlus size={16} color={T.sub} strokeWidth={2} />
            New
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", padding: `${SP[4]}px ${SP[4]}px ${SP[3]}px` }}>
        <div className="chat-narrow" style={{ display: "flex", flexDirection: "column", gap: SP[3] }}>
          {listItems}

          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: SP[2] }}>
              <TutorAvatar stage={flameStage} size={17} />
              <div style={{ padding: `${SP[3]}px ${SP[4]}px`, borderRadius: `${R.sm} ${R.xxl} ${R.xxl} ${R.xxl}`, background: T.surface, border: `1px solid ${T.border}`, display: "flex", gap: SP[2], alignItems: "center" }}>
                <span style={{ fontSize: TY.sm, color: T.sub, fontWeight: FW.semibold }}>Thinking…</span>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 7, height: 7, borderRadius: R.pill, background: T.muted, animation: `dot 1.2s ease-in-out ${i * 0.18}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* A2: chips live in the message list, only before the first user message. */}
          {showChips && (
            <div style={{ display: "flex", gap: SP[2], flexWrap: "wrap" }}>
              {chips.map((c) => (
                <button
                  key={c.label}
                  onClick={() => void sendMessage(c.prompt)}
                  style={{
                    flexShrink: 0, padding: `${SP[2]}px ${SP[3]}px`, minHeight: 44, display: "flex", alignItems: "center", borderRadius: R.pill,
                    border: `1px solid ${T.primary}55`, background: T.primaryTint, color: T.primaryText,
                    fontSize: TY.sm, fontWeight: FW.semibold, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* M8: staged loading copy + Cancel, visible for the whole wait — not only after 8s. */}
      {loading && (
        <div style={{ flexShrink: 0, background: T.surface, borderTop: `1px solid ${T.border}`, padding: `${SP[2]}px ${SP[4]}px`, display: "flex", alignItems: "center", gap: SP[3] }}>
          <span style={{ flex: 1, fontSize: TY.sm, color: T.sub, lineHeight: 1.45 }}>
            {slowChat ? "Still thinking — this can take a few seconds on a slow connection." : "Thinking — the tutor is working on your answer."}
          </span>
          <button onClick={cancelChat} style={{ padding: `${SP[2]}px ${SP[4]}px`, minHeight: 44, borderRadius: R.lg, border: `1px solid ${T.border}`, background: T.s2, color: T.text, fontSize: TY.sm, fontWeight: FW.bold, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
        </div>
      )}

      {/* Composer */}
      <div style={{ flexShrink: 0, background: T.surface, borderTop: `1px solid ${T.border}` }}>
        <div className="chat-narrow" style={{ padding: `${SP[2]}px ${SP[4]}px calc(${SP[3]}px + env(safe-area-inset-bottom, 0px))` }}>

          {/* A1: confirm inline, above the composer — same spot as the sample. */}
          {newConfirm && (
            <div style={{ marginBottom: SP[3], padding: SP[4], background: T.surface, border: `1px solid ${T.dangerText}55`, borderRadius: R.xl }}>
              <div style={{ fontSize: TY.base, fontWeight: FW.semibold, color: T.text, lineHeight: 1.5 }}>Start a new chat? Your current chat will be cleared.</div>
              <div style={{ display: "flex", gap: SP[2], marginTop: SP[3], flexWrap: "wrap" }}>
                <button
                  onClick={confirmNewChat}
                  style={{ flex: 1, minWidth: 140, minHeight: 44, borderRadius: R.pill, background: T.danger, color: T.onPrimary, fontWeight: FW.bold, fontSize: TY.base, border: "none", cursor: "pointer", fontFamily: "inherit", padding: `${SP[2]}px ${SP[4]}px` }}
                >
                  Start new chat
                </button>
                <button
                  onClick={() => setNewConfirm(false)}
                  style={{ flex: 1, minWidth: 140, minHeight: 44, borderRadius: R.pill, background: "transparent", color: T.text, fontWeight: FW.bold, fontSize: TY.base, border: `1px solid ${T.border}`, cursor: "pointer", fontFamily: "inherit", padding: `${SP[2]}px ${SP[4]}px` }}
                >
                  Keep this chat
                </button>
              </div>
            </div>
          )}

          {fileError && (
            <div style={{ marginBottom: SP[2], padding: `${SP[3]}px ${SP[4]}px`, background: T.dangerTint, border: `1px solid ${T.danger}55`, borderRadius: R.lg, display: "flex", alignItems: "center", justifyContent: "space-between", gap: SP[2] }}>
              <span style={{ fontSize: TY.sm, color: T.dangerText, fontWeight: FW.medium }}>{fileError}</span>
              <button onClick={() => setFileError("")} aria-label="Dismiss" style={{ background: "none", border: "none", cursor: "pointer", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <X size={14} color={T.dangerText} strokeWidth={2} />
              </button>
            </div>
          )}

          {/* A10: the preview is shown — file name + size + image thumbnail or text snippet. */}
          {attachment && (
            <div style={{ marginBottom: SP[2], padding: `${SP[3]}px ${SP[4]}px`, background: T.s2, border: `1px solid ${T.primary}55`, borderRadius: R.lg, display: "flex", alignItems: "flex-start", gap: SP[3] }}>
              {attachment.type === "image" ? (
                <img src={attachment.preview} alt="" style={{ width: 44, height: 44, borderRadius: R.md, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: R.md, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={20} color={T.primary} strokeWidth={1.8} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: TY.sm, fontWeight: FW.semibold, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {attachment.file.name}
                </div>
                <div style={{ fontSize: TY.xs, color: T.sub, marginTop: 1 }}>
                  {formatFileSize(attachment.size)}
                  {attachment.type === "image" ? " · Image — the tutor will read the question in it" : " · Text file — the tutor will analyse the content"}
                </div>
                {attachment.type === "text" && (
                  <div style={{ fontSize: TY.xs, color: T.muted, marginTop: SP[1], lineHeight: 1.5, overflowWrap: "anywhere" }}>
                    &ldquo;{attachment.preview}&rdquo;
                  </div>
                )}
              </div>
              <button onClick={() => setAttachment(null)} aria-label="Remove attachment" style={{ background: "none", border: "none", cursor: "pointer", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <X size={16} color={T.sub} strokeWidth={2} />
              </button>
            </div>
          )}

          <div className="chat-input" style={{ display: "flex", alignItems: "flex-end", gap: SP[2], background: T.s2, borderRadius: R.xxl, padding: `${SP[2]}px ${SP[2]}px ${SP[2]}px ${SP[3]}px`, border: `1.5px solid ${T.border}` }}>
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: 44, height: 44, marginBottom: 2 }} aria-label="Attach a file">
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
              style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", boxShadow: "none", resize: "none", fontSize: TY.base, lineHeight: 1.45, color: T.text, padding: "5px 0", fontFamily: "inherit", maxHeight: 160, overflowY: "auto", borderRadius: 0 }}
              placeholder={attachment ? "Add a message (optional)…" : "Ask anything about JAMB…"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              onClick={() => void sendMessage(input)}
              disabled={!canSend}
              aria-label="Send"
              style={{ width: 44, height: 44, borderRadius: R.pill, border: "none", background: canSend ? T.primary : T.s3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: canSend ? "pointer" : "not-allowed", transition: "background 0.2s", boxShadow: "none" }}
            >
              <Send size={16} color={T.onPrimary} strokeWidth={2} style={{ transform: "translateX(1px)" }} />
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: SP[2] }}>
            <span style={{ fontSize: TY.xs, color: T.muted }}>
              Images (JPG, PNG, WEBP, GIF) and .txt files · AI can make mistakes
              <span className="kbd-hint"> · Enter to send, Shift+Enter for a new line</span>
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dot    { 0%,60%,100%{opacity:.3;transform:scale(.8)} 30%{opacity:1;transform:scale(1.2)} }
        .chat-root   { height: 100vh; height: 100dvh; }
        .chat-narrow { width: 100%; max-width: ${LAYOUT.chatMax}px; margin-left: auto; margin-right: auto; }
        .chat-input:focus-within { border-color: var(--primary) !important; box-shadow: var(--focus-ring); }
        .kbd-hint { display: none; }
        @media (pointer: fine) { .kbd-hint { display: inline; } }

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
