"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import AIIcon from "../components/AIIcon";

interface Message { role:"user"|"assistant"; content:string; timestamp:string; }
interface ChatSession { id:string; title:string; messages:Message[]; date:string; }
interface User { name:string; target:string; institution:string; course:string; subjects:string[]; }

const QUICK_ACTIONS = [
  {icon:"📝",label:"Solve Question",prompt:"Solve this JAMB question step by step and explain why each option is correct or wrong:"},
  {icon:"📖",label:"Explain Topic",prompt:"Explain this JAMB topic clearly with examples a Nigerian student can understand:"},
  {icon:"📋",label:"Past Questions",prompt:"Give me 5 JAMB past questions on this topic with answers and explanations:"},
  {icon:"📅",label:"Study Plan",prompt:"Create a focused study schedule for this topic to prepare for JAMB:"},
  {icon:"🏛️",label:"Admission Help",prompt:"Help me understand the admission process and requirements for:"},
  {icon:"🧮",label:"Calculate",prompt:"Help me calculate my JAMB aggregate and admission chances for:"},
];

function getSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function buildSystemPrompt(user: User | null): string {
  return `You are Companion AI, an elite JAMB and Nigerian university admission expert assistant. You are deeply knowledgeable about:

JAMB UTME:
- All 10 JAMB subjects and their syllabi (Mathematics, English Language, Physics, Chemistry, Biology, Government, Economics, Literature, Geography, CRS/IRS)
- JAMB past questions from 2000-2024 with detailed explanations
- JAMB marking scheme, CBT format, and exam strategies
- WAEC and NECO results requirements for university admission
- O'Level subject combinations and grading

Nigerian University Admissions:
- JAMB CAPS system and admission process step by step
- Cut-off marks for all major Nigerian universities (UNILAG, UI, OAU, UNIBEN, UNILORIN, UNN, ABU, LASU, UNIPORT, FUTO, FUNAAB and others)
- Post-UTME screening processes for each university
- Aggregate score calculation: (JAMB/8) + (Post-UTME/2)
- Change of institution and course procedures
- Direct Entry (DE) requirements and process
- Admission merit list, supplementary list and acceptance procedures

Academic Excellence:
- Study strategies tailored for JAMB success
- Subject-specific teaching for all JAMB subjects
- Mnemonic devices and memory techniques for Nigerian students
- Time management during JAMB CBT exam
- Common mistakes and how to avoid them

Student Profile:
${user ? `- Name: ${user.name}
- Target Score: ${user.target}/400
- Course: ${user.course}
- Institution: ${user.institution}
- Subjects: ${user.subjects?.join(", ")}` : "- Student not logged in"}

Instructions:
- Always give detailed, accurate answers specific to JAMB and Nigerian education
- When solving past questions, show working step by step
- Reference the JAMB syllabus when explaining topics
- Use Nigerian context and examples (Naira, Nigerian cities, Nigerian history)
- Be encouraging and motivating — many students face pressure
- Format answers clearly with headers, bullet points and numbered steps
- For calculations, show every step clearly
- When asked about specific universities, give accurate current information`;
}

export default function AIChat() {
  const [input, setInput] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<File|null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [user, setUser] = useState<User|null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setDarkMode(localStorage.getItem("darkMode") === "true");
    const u = localStorage.getItem("companion_user");
    if (u) setUser(JSON.parse(u));
    
    // Load sessions
    const savedSessions = localStorage.getItem("chat_sessions");
    const allSessions: ChatSession[] = savedSessions ? JSON.parse(savedSessions) : [];
    setSessions(allSessions);
    
    // Start new session
    const newId = getSessionId();
    setCurrentSessionId(newId);
    const welcome: Message = {
      role:"assistant",
      content:`Hello! 👋 I'm **Companion AI**, your personal JAMB and university admission expert.\n\nI can help you with:\n- 📝 **Solve JAMB past questions** with step-by-step explanations\n- 📖 **Explain any JAMB topic** from the official syllabus\n- 🏛️ **Navigate university admissions** — CAPS, Post-UTME, cut-offs\n- 🧮 **Calculate your aggregate** and admission chances\n- 📅 **Plan your study** for maximum JAMB score\n\nWhat would you like to work on today?`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcome]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
  }, [messages, loading]);

  const saveSession = (msgs: Message[], sessionId: string) => {
    if (msgs.length <= 1) return; // Don't save sessions with only welcome message
    const savedSessions = localStorage.getItem("chat_sessions");
    const allSessions: ChatSession[] = savedSessions ? JSON.parse(savedSessions) : [];
    const firstUserMsg = msgs.find(m => m.role === "user");
    const title = firstUserMsg ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? "..." : "") : "Chat session";
    const existing = allSessions.findIndex(s => s.id === sessionId);
    const session: ChatSession = {
      id: sessionId,
      title,
      messages: msgs,
      date: new Date().toLocaleDateString("en-NG", {day:"numeric", month:"short", year:"numeric"})
    };
    if (existing >= 0) allSessions[existing] = session;
    else allSessions.unshift(session);
    const trimmed = allSessions.slice(0, 20); // Keep last 20 sessions
    localStorage.setItem("chat_sessions", JSON.stringify(trimmed));
    setSessions(trimmed);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const now = new Date().toISOString();
    const newMsg: Message = {role:"user", content:text, timestamp:now};
    const newMessages = [...messages, newMsg];
    setMessages(newMessages);
    setInput("");
    setAttachment(null);
    setLoading(true);

    try {
      // Build conversation history for context
      const history = newMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          message: text,
          systemPrompt: buildSystemPrompt(user),
          history: history.slice(0, -1) // exclude the message we just added
        })
      });
      const data = await res.json();
      const reply = data.reply || "I couldn't get a response. Please try again.";
      const replyMsg: Message = {role:"assistant", content:reply, timestamp:new Date().toISOString()};
      const finalMessages = [...newMessages, replyMsg];
      setMessages(finalMessages);
      saveSession(finalMessages, currentSessionId);
    } catch {
      const errMsg: Message = {role:"assistant", content:"Network error. Please check your connection.", timestamp:new Date().toISOString()};
      setMessages([...newMessages, errMsg]);
    } finally { setLoading(false); }
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setShowHistory(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem("chat_sessions", JSON.stringify(updated));
  };

  const newChat = () => {
    const newId = getSessionId();
    setCurrentSessionId(newId);
    const welcome: Message = {
      role:"assistant",
      content:`Hello! 👋 I'm **Companion AI**. What JAMB topic or admission question can I help you with?`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcome]);
    setShowHistory(false);
  };

  if (!mounted) return null;

  const bg = darkMode ? "#0a0a0a" : "#f0f0f5";
  const cardBg = darkMode ? "#1c1c1e" : "#ffffff";
  const textColor = darkMode ? "#f2f2f7" : "#1c1c1e";
  const subText = darkMode ? "#98989d" : "#6e6e73";
  const borderC = darkMode ? "#2c2c2e" : "#e5e5ea";
  const inputBg = darkMode ? "#2c2c2e" : "#f2f2f7";

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100dvh", backgroundColor:bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>

      {/* Header */}
      <div style={{background:darkMode?"linear-gradient(135deg,#1c1c1e,#2c1810)":"linear-gradient(135deg,#3b0d02,#c2410c)", padding:"12px 16px", display:"flex", alignItems:"center", gap:"12px", boxShadow:"0 2px 12px rgba(0,0,0,0.15)"}}>
        <Link href="/" style={{textDecoration:"none", width:"34px", height:"34px", borderRadius:"10px", backgroundColor:"rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"16px", flexShrink:0}}>←</Link>
        
        <AIIcon size={40} />
        
        <div style={{flex:1}}>
          <div style={{fontWeight:"800", color:"#fff", fontSize:"15px", letterSpacing:"-0.2px"}}>Companion AI</div>
          <div style={{fontSize:"11px", color:"#22c55e", display:"flex", alignItems:"center", gap:"4px"}}>
            <span style={{width:"5px", height:"5px", borderRadius:"50%", backgroundColor:"#22c55e", display:"inline-block", animation:"pulse 2s infinite"}}></span>
            JAMB & Admission Expert
          </div>
        </div>

        <button onClick={()=>setShowHistory(!showHistory)} style={{width:"34px", height:"34px", borderRadius:"10px", backgroundColor:"rgba(255,255,255,0.12)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px"}}>
          🕐
        </button>
        <button onClick={newChat} style={{width:"34px", height:"34px", borderRadius:"10px", backgroundColor:"rgba(255,255,255,0.12)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px"}}>
          ✏️
        </button>
        <button onClick={()=>{const d=!darkMode;setDarkMode(d);localStorage.setItem("darkMode",String(d));}} style={{width:"34px", height:"34px", borderRadius:"10px", backgroundColor:"rgba(255,255,255,0.12)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px"}}>
          {darkMode?"☀️":"🌙"}
        </button>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div style={{position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:100, display:"flex", flexDirection:"column"}}>
          <div style={{flex:1, backgroundColor:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)"}} onClick={()=>setShowHistory(false)} />
          <div style={{backgroundColor:cardBg, borderRadius:"24px 24px 0 0", maxHeight:"70vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 -8px 32px rgba(0,0,0,0.2)"}}>
            <div style={{padding:"16px 20px", borderBottom:`1px solid ${borderC}`, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div style={{fontWeight:"800", color:textColor, fontSize:"16px"}}>Chat History</div>
              <div style={{display:"flex", gap:"8px"}}>
                <button onClick={newChat} style={{padding:"8px 16px", borderRadius:"20px", border:"none", background:"linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"700", fontSize:"13px", cursor:"pointer"}}>+ New Chat</button>
                <button onClick={()=>setShowHistory(false)} style={{padding:"8px 14px", borderRadius:"20px", border:`1px solid ${borderC}`, backgroundColor:"transparent", color:subText, fontWeight:"700", fontSize:"13px", cursor:"pointer"}}>Done</button>
              </div>
            </div>
            <div style={{overflowY:"auto", flex:1, padding:"12px"}}>
              {sessions.length === 0 ? (
                <div style={{textAlign:"center", padding:"32px", color:subText}}>
                  <div style={{fontSize:"32px", marginBottom:"8px"}}>💬</div>
                  <div style={{fontSize:"14px"}}>No chat history yet</div>
                </div>
              ) : sessions.map(session => (
                <div key={session.id} onClick={()=>loadSession(session)} style={{padding:"14px 16px", borderRadius:"14px", marginBottom:"8px", backgroundColor:session.id===currentSessionId?(darkMode?"#2a1810":"#fff8f5"):darkMode?"#2c2c2e":"#f8f8f8", border:session.id===currentSessionId?"1.5px solid #ea580c":`1px solid ${borderC}`, cursor:"pointer", display:"flex", alignItems:"center", gap:"12px"}}>
                  <div style={{width:"36px", height:"36px", borderRadius:"10px", background:"linear-gradient(135deg,#f97316,#c2410c)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                    <AIIcon size={24} />
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:"13px", fontWeight:"700", color:textColor, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{session.title}</div>
                    <div style={{fontSize:"11px", color:subText, marginTop:"2px"}}>{session.date} · {session.messages.length} messages</div>
                  </div>
                  <button onClick={(e)=>deleteSession(session.id,e)} style={{width:"28px", height:"28px", borderRadius:"50%", border:"none", backgroundColor:darkMode?"#3a3a3c":"#f0f0f0", color:"#ef4444", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", flexShrink:0}}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:"14px"}}>
        {messages.map((m, i) => (
          <div key={i} style={{display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", alignItems:"flex-end", gap:"10px"}}>
            {m.role==="assistant" && <AIIcon size={32} style={{flexShrink:0}} />}
            <div style={{
              maxWidth:"82%", padding:"12px 16px",
              borderRadius:m.role==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px",
              background:m.role==="user"?"linear-gradient(135deg,#c2410c,#ea580c)":cardBg,
              color:m.role==="user"?"#fff":textColor,
              fontSize:"14px", lineHeight:"1.65",
              boxShadow:m.role==="user"?"0 4px 16px rgba(194,65,12,0.35)":darkMode?"0 2px 8px rgba(0,0,0,0.4)":"0 2px 12px rgba(0,0,0,0.07)",
              border:m.role==="assistant"?`1px solid ${borderC}`:"none",
            }}>
              <ReactMarkdown>{m.content}</ReactMarkdown>
              <div style={{fontSize:"10px", opacity:0.5, marginTop:"6px", textAlign:"right"}}>
                {new Date(m.timestamp).toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"})}
              </div>
            </div>
            {m.role==="user" && (
              <div style={{width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#fde68a,#f97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:"800", color:"#7c2d12", flexShrink:0}}>
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{display:"flex", alignItems:"flex-end", gap:"10px"}}>
            <AIIcon size={32} style={{flexShrink:0}} />
            <div style={{padding:"14px 18px", borderRadius:"20px 20px 20px 4px", backgroundColor:cardBg, border:`1px solid ${borderC}`, display:"flex", gap:"5px", alignItems:"center", boxShadow:darkMode?"0 2px 8px rgba(0,0,0,0.4)":"0 2px 12px rgba(0,0,0,0.07)"}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:"8px", height:"8px", borderRadius:"50%", backgroundColor:"#ea580c", animation:"typingBounce 1.2s infinite ease-in-out", animationDelay:`${i*0.15}s`}} />
              ))}
            </div>
          </div>
        )}

        {/* Quick actions - first message only */}
        {messages.length === 1 && (
          <div style={{marginTop:"8px"}}>
            <div style={{fontSize:"12px", color:subText, marginBottom:"10px", fontWeight:"600", textAlign:"center"}}>Quick Actions</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px"}}>
              {QUICK_ACTIONS.map((a,i)=>(
                <button key={i} onClick={()=>setInput(a.prompt)} style={{padding:"12px 14px", borderRadius:"14px", border:`1px solid ${borderC}`, backgroundColor:cardBg, cursor:"pointer", textAlign:"left", transition:"all 0.15s", boxShadow:darkMode?"0 1px 4px rgba(0,0,0,0.3)":"0 1px 4px rgba(0,0,0,0.06)"}}>
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
        <div style={{margin:"0 16px 8px", padding:"10px 14px", backgroundColor:darkMode?"#1c1c1e":"#fff8f5", border:"1px solid #ea580c", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <span style={{fontSize:"13px", color:"#ea580c", fontWeight:"600"}}>📎 {attachment.name}</span>
          <button onClick={()=>setAttachment(null)} style={{background:"none", border:"none", color:subText, cursor:"pointer", fontSize:"18px"}}>✕</button>
        </div>
      )}

      {/* Input */}
      <div style={{padding:"12px 16px 20px", backgroundColor:cardBg, borderTop:`1px solid ${borderC}`, boxShadow:darkMode?"0 -2px 12px rgba(0,0,0,0.3)":"0 -4px 20px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex", alignItems:"flex-end", gap:"10px", backgroundColor:inputBg, borderRadius:"24px", padding:"8px 8px 8px 8px", border:`1.5px solid ${inputFocused?"#ea580c":borderC}`, transition:"border-color 0.2s"}}>
          <label style={{cursor:"pointer", width:"36px", height:"36px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", color:subText, flexShrink:0}}>
            📎<input type="file" style={{display:"none"}} accept="image/*,.pdf" onChange={e=>setAttachment(e.target.files?.[0]||null)} />
          </label>
          <input
            style={{flex:1, background:"none", border:"none", outline:"none", fontSize:"15px", color:textColor, padding:"4px 0"}}
            placeholder="Ask about JAMB, admission, any subject..."
            value={input}
            onChange={e=>setInput(e.target.value)}
            onFocus={()=>setInputFocused(true)}
            onBlur={()=>setInputFocused(false)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),sendMessage(input.trim()))}
          />
          <button onClick={()=>sendMessage(input.trim())} disabled={loading||!input.trim()} style={{width:"40px", height:"40px", borderRadius:"50%", border:"none", background:loading||!input.trim()?(darkMode?"#3a3a3c":"#d1d1d6"):"linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", cursor:loading||!input.trim()?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s", boxShadow:(!loading&&input.trim())?"0 4px 12px rgba(234,88,12,0.4)":"none"}}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
        <div style={{fontSize:"11px", color:subText, textAlign:"center", marginTop:"8px"}}>
          Powered by Llama 4 Scout · JAMB & Nigerian Admissions Expert
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes typingBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
      `}</style>
    </div>
  );
}
