"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

interface Message { role: "user"|"assistant"; content: string; }

const QUICK_ACTIONS = [
  { icon:"🧮", label:"Solve Question", prompt:"Help me solve this JAMB question:" },
  { icon:"📖", label:"Explain Topic", prompt:"Explain this topic for JAMB:" },
  { icon:"📝", label:"Past Questions", prompt:"Give me 5 JAMB past questions on:" },
  { icon:"📅", label:"Study Plan", prompt:"Create a 4-week JAMB study plan for:" },
];

export default function AIChat() {
  const [input, setInput] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role:"assistant", content:"Hello! I'm **Companion AI** 🎓\n\nI'm your personal JAMB study assistant. I can help you:\n- 🧮 Solve past questions\n- 📖 Explain difficult topics\n- 📅 Create study plans\n- 📊 Analyze your weak areas\n\nWhat would you like to work on today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<File|null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const newMessages: Message[] = [...messages, { role:"user", content:text }];
    setMessages(newMessages);
    setInput("");
    setAttachment(null);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply = data.reply || data.error || "Sorry, I couldn't get a response. Please try again.";
      setMessages([...newMessages, { role:"assistant", content:reply }]);
    } catch {
      setMessages([...newMessages, { role:"assistant", content:"Network error. Please check your connection and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendMessage(input.trim() || (attachment ? `[Attached: ${attachment.name}]` : ""));

  const bg = darkMode ? "#0a0a0a" : "#f5f5f7";
  const cardBg = darkMode ? "#1c1c1e" : "#ffffff";
  const textColor = darkMode ? "#f2f2f7" : "#1c1c1e";
  const subText = darkMode ? "#98989d" : "#6e6e73";
  const borderC = darkMode ? "#2c2c2e" : "#e5e5ea";
  const inputBg = darkMode ? "#2c2c2e" : "#f2f2f7";

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100dvh", backgroundColor:bg, fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>

      {/* Header */}
      <div style={{background: darkMode ? "linear-gradient(135deg, #1c1c1e, #2c1810)" : "linear-gradient(135deg, #431407, #c2410c)", padding:"12px 16px", display:"flex", alignItems:"center", gap:"12px", boxShadow:"0 1px 0 rgba(0,0,0,0.1)"}}>
        <Link href="/" style={{textDecoration:"none", width:"34px", height:"34px", borderRadius:"10px", backgroundColor:"rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"16px", flexShrink:0}}>←</Link>
        <div style={{width:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg, #fb923c, #ea580c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0, boxShadow:"0 2px 8px rgba(234,88,12,0.5)"}}>🤖</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:"800", color:"#fff", fontSize:"15px", letterSpacing:"-0.2px"}}>Companion AI</div>
          <div style={{fontSize:"11px", color:"#22c55e", display:"flex", alignItems:"center", gap:"4px"}}>
            <span style={{width:"5px", height:"5px", borderRadius:"50%", backgroundColor:"#22c55e", display:"inline-block"}}></span>
            Online • JAMB expert
          </div>
        </div>
        <button onClick={() => { const d = !darkMode; setDarkMode(d); localStorage.setItem("darkMode", String(d)); }} style={{width:"34px", height:"34px", borderRadius:"10px", backgroundColor:"rgba(255,255,255,0.12)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px"}}>
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Messages */}
      <div style={{flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:"12px"}}>

        {messages.map((m, i) => (
          <div key={i} style={{display:"flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems:"flex-end", gap:"8px"}}>
            {m.role === "assistant" && (
              <div style={{width:"30px", height:"30px", borderRadius:"50%", background:"linear-gradient(135deg, #fb923c, #ea580c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", flexShrink:0, boxShadow:"0 2px 6px rgba(234,88,12,0.3)"}}>🤖</div>
            )}
            <div style={{
              maxWidth:"80%", padding:"12px 16px",
              borderRadius: m.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
              background: m.role === "user" ? "linear-gradient(135deg, #c2410c, #ea580c)" : cardBg,
              color: m.role === "user" ? "#fff" : textColor,
              fontSize:"14px", lineHeight:"1.6",
              boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.08)",
              border: m.role === "assistant" ? `1px solid ${borderC}` : "none",
            }}>
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
            {m.role === "user" && (
              <div style={{width:"30px", height:"30px", borderRadius:"50%", background:"linear-gradient(135deg, #fde68a, #f59e0b)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", flexShrink:0, fontWeight:"800", color:"#7c2d12"}}>
                {(JSON.parse(localStorage.getItem("companion_user") || '{"name":"U"}').name || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{display:"flex", alignItems:"flex-end", gap:"8px"}}>
            <div style={{width:"30px", height:"30px", borderRadius:"50%", background:"linear-gradient(135deg, #fb923c, #ea580c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", flexShrink:0}}>🤖</div>
            <div style={{padding:"14px 18px", borderRadius:"20px 20px 20px 4px", backgroundColor:cardBg, border:`1px solid ${borderC}`, display:"flex", gap:"5px", alignItems:"center", boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.08)"}}>
              {[0,1,2].map(i => (
                <div key={i} style={{width:"8px", height:"8px", borderRadius:"50%", backgroundColor:"#ea580c", animation:"typingBounce 1.2s infinite ease-in-out", animationDelay:`${i*0.15}s`}} />
              ))}
            </div>
          </div>
        )}

        {/* Quick actions - shown when first message only */}
        {messages.length === 1 && (
          <div style={{marginTop:"8px"}}>
            <div style={{fontSize:"12px", color:subText, textAlign:"center", marginBottom:"10px", fontWeight:"600"}}>Quick Actions</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px"}}>
              {QUICK_ACTIONS.map((a, i) => (
                <button key={i} onClick={() => setInput(a.prompt)} style={{padding:"12px", borderRadius:"14px", border:`1px solid ${borderC}`, backgroundColor:cardBg, cursor:"pointer", textAlign:"left", transition:"all 0.15s"}}>
                  <div style={{fontSize:"18px", marginBottom:"4px"}}>{a.icon}</div>
                  <div style={{fontSize:"12px", color:textColor, fontWeight:"700"}}>{a.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachment preview */}
      {attachment && (
        <div style={{margin:"0 16px 8px", padding:"10px 14px", backgroundColor: darkMode ? "#1c1c1e" : "#fff8f5", border:"1px solid #ea580c", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <span style={{fontSize:"13px", color:"#ea580c", fontWeight:"600"}}>📎 {attachment.name}</span>
          <button onClick={() => setAttachment(null)} style={{background:"none", border:"none", color:subText, cursor:"pointer", fontSize:"18px", lineHeight:1}}>✕</button>
        </div>
      )}

      {/* Input area */}
      <div style={{padding:"12px 16px 20px", backgroundColor: darkMode ? "#1c1c1e" : "#fff", borderTop:`1px solid ${borderC}`, boxShadow: darkMode ? "0 -1px 0 rgba(255,255,255,0.05)" : "0 -4px 16px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex", alignItems:"flex-end", gap:"10px", backgroundColor:inputBg, borderRadius:"24px", padding:"8px 8px 8px 8px", border:`1.5px solid ${inputFocused ? "#ea580c" : "transparent"}`, transition:"border-color 0.2s"}}>
          <label style={{cursor:"pointer", width:"36px", height:"36px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", color:subText, flexShrink:0}}>
            📎<input type="file" style={{display:"none"}} accept="image/*,.pdf,.doc,.docx" onChange={e => setAttachment(e.target.files?.[0]||null)} />
          </label>
          <input
            style={{flex:1, background:"none", border:"none", outline:"none", fontSize:"15px", color:textColor, padding:"4px 0", maxHeight:"120px"}}
            placeholder="Ask anything about JAMB..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <button onClick={handleSend} disabled={loading || (!input.trim() && !attachment)} style={{width:"38px", height:"38px", borderRadius:"50%", border:"none", background: loading || (!input.trim() && !attachment) ? (darkMode ? "#3a3a3c" : "#d1d1d6") : "linear-gradient(135deg, #c2410c, #ea580c)", color:"#fff", cursor: loading || (!input.trim() && !attachment) ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s", boxShadow: (!loading && input.trim()) ? "0 2px 8px rgba(234,88,12,0.4)" : "none"}}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes typingBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
      `}</style>
    </div>
  );
}
