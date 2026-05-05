"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

interface Message { role:"user"|"assistant"; content:string; timestamp:string; }
interface ChatSession { id:string; title:string; messages:Message[]; date:string; }
interface User { name:string; target:string; institution:string; course:string; subjects:string[]; }

const SUGGESTIONS = [
  "Solve a quadratic equation from JAMB 2023",
  "Explain photosynthesis for JAMB Biology",
  "What are the cut-off marks for UNILAG Medicine?",
  "Calculate my aggregate: JAMB 280, Post-UTME 65",
  "Give me 5 JAMB English past questions on comprehension",
  "What is the CAPS admission process step by step?",
];

function getSessionId() { return Date.now().toString(36)+Math.random().toString(36).slice(2); }

function buildSystemPrompt(user:User|null):string {
  return `You are Companion AI — a world-class JAMB UTME and Nigerian university admission expert assistant, built specifically for Nigerian students.

Your deep knowledge covers:

JAMB UTME SUBJECTS & SYLLABUS:
- Mathematics: Algebra, Trigonometry, Calculus, Statistics, Geometry, Number theory
- English Language: Comprehension, Summary, Lexis & Structure, Oral English
- Physics: Mechanics, Waves, Electricity, Magnetism, Modern Physics
- Chemistry: Organic, Inorganic, Physical Chemistry, Stoichiometry
- Biology: Cell biology, Genetics, Ecology, Plant & Animal biology
- Government: Nigerian constitution, Political systems, International organizations
- Economics: Micro & Macroeconomics, Nigerian economy, Trade
- Literature: Prose, Poetry, Drama — Nigerian and African texts
- Geography: Physical, Human, Regional geography of Nigeria and Africa
- CRS/IRS: Old/New Testament, Islamic studies

JAMB PAST QUESTIONS: You know questions from 2000–2024 across all subjects

NIGERIAN UNIVERSITY ADMISSIONS:
- Cut-off marks for all federal universities (UNILAG min 180, Medicine needs 280+; UI Medicine 280+; OAU Medicine 275+; UNIBEN Medicine 260+)
- JAMB CAPS: How to check admission status, accept/reject, print admission letter
- Post-UTME: Screening dates, score requirements, how scoring works per university
- Aggregate formula: (JAMB/8) + (Post-UTME score/2) = Aggregate out of 100
- DE (Direct Entry): A-level and ND requirements
- Change of course/institution procedure on JAMB portal
- O'Level: Minimum 5 credits including English and Mathematics

STUDENT:
${user?`${user.name} | Target: ${user.target}/400 | ${user.course} at ${user.institution} | Subjects: ${user.subjects?.join(", ")}`:"Guest"}

RESPONSE STYLE:
- Be detailed and accurate — Nigerian students depend on you
- Show all working steps for calculations and science questions  
- Use Nigerian context (mention cities, universities, Naira where relevant)
- Be warm and encouraging
- Use bullet points and numbered lists for clarity
- For past questions: show question, options, correct answer, full explanation`;
}

export default function AIChat() {
  const [input, setInput] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User|null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const dm = localStorage.getItem("darkMode")==="true";
    setDarkMode(dm);
    const u = localStorage.getItem("companion_user");
    if (u) setUser(JSON.parse(u));
    const saved = localStorage.getItem("chat_sessions");
    if (saved) setSessions(JSON.parse(saved));
    const id = getSessionId();
    setCurrentSessionId(id);
    setMessages([]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
  }, [messages, loading]);

  const saveSession = (msgs:Message[], id:string) => {
    if (msgs.length < 2) return;
    const all:ChatSession[] = JSON.parse(localStorage.getItem("chat_sessions")||"[]");
    const firstUser = msgs.find(m=>m.role==="user");
    const session:ChatSession = {
      id, messages:msgs,
      title: firstUser?firstUser.content.slice(0,55)+(firstUser.content.length>55?"...":""):"Chat",
      date: new Date().toLocaleDateString("en-NG",{day:"numeric",month:"short"})
    };
    const idx = all.findIndex(s=>s.id===id);
    if (idx>=0) all[idx]=session; else all.unshift(session);
    const trimmed = all.slice(0,25);
    localStorage.setItem("chat_sessions",JSON.stringify(trimmed));
    setSessions(trimmed);
  };

  const send = async (text:string) => {
    if (!text.trim()||loading) return;
    const userMsg:Message = {role:"user",content:text,timestamp:new Date().toISOString()};
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    if (textareaRef.current) { textareaRef.current.style.height="auto"; }
    setLoading(true);
    try {
      const history = newMsgs.slice(-12).map(m=>({role:m.role,content:m.content}));
      const res = await fetch("/api/chat",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:text,systemPrompt:buildSystemPrompt(user),history:history.slice(0,-1)})
      });
      const data = await res.json();
      const reply = data.reply||"Sorry, I couldn't get a response. Please try again.";
      const aiMsg:Message = {role:"assistant",content:reply,timestamp:new Date().toISOString()};
      const final = [...newMsgs,aiMsg];
      setMessages(final);
      saveSession(final,currentSessionId);
    } catch {
      setMessages([...newMsgs,{role:"assistant",content:"Network error. Please check your connection and try again.",timestamp:new Date().toISOString()}]);
    } finally { setLoading(false); }
  };

  const handleKey = (e:React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); send(input.trim()); }
  };

  const autoResize = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160)+"px";
  };

  const newChat = () => {
    setCurrentSessionId(getSessionId());
    setMessages([]);
    setShowHistory(false);
  };

  const loadSession = (s:ChatSession) => {
    setMessages(s.messages);
    setCurrentSessionId(s.id);
    setShowHistory(false);
  };

  const deleteSession = (id:string, e:React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s=>s.id!==id);
    setSessions(updated);
    localStorage.setItem("chat_sessions",JSON.stringify(updated));
  };

  if (!mounted) return null;

  const D = darkMode;
  const bg = D?"#212121":"#ffffff";
  const msgAreaBg = D?"#212121":"#ffffff";
  const userBg = D?"#2f2f2f":"#f4f4f4";
  const textPrimary = D?"#ececec":"#0d0d0d";
  const textSub = D?"#8e8ea0":"#6e6e80";
  const border = D?"#383838":"#e5e5e5";
  const inputBg = D?"#2f2f2f":"#f4f4f4";
  const headerBg = D?"#171717":"#ffffff";
  const historyBg = D?"#171717":"#ffffff";
  const histItemBg = D?"#2a2a2a":"#f7f7f8";
  const histItemActiveBg = D?"#3a1a10":"#fff3ef";

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100dvh",backgroundColor:bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif",overflowX:"hidden"}}>

      {/* HEADER — minimal, like Claude/ChatGPT */}
      <div style={{backgroundColor:headerBg,borderBottom:`1px solid ${border}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:"10px",position:"sticky",top:0,zIndex:50,backdropFilter:"blur(12px)"}}>
        <Link href="/" style={{width:"34px",height:"34px",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",color:textSub,fontSize:"18px",textDecoration:"none",backgroundColor:D?"#2a2a2a":"#f0f0f0",flexShrink:0}}>
          ←
        </Link>

        {/* Logo — graduation cap */}
        <div style={{width:"32px",height:"32px",borderRadius:"8px",background:"linear-gradient(135deg,#f97316,#c2410c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>
          🎓
        </div>

        <div style={{flex:1}}>
          <div style={{fontWeight:"700",color:textPrimary,fontSize:"15px",lineHeight:"1.2"}}>Companion AI</div>
          <div style={{fontSize:"11px",color:"#22c55e",display:"flex",alignItems:"center",gap:"3px"}}>
            <span style={{width:"5px",height:"5px",borderRadius:"50%",backgroundColor:"#22c55e",display:"inline-block"}}/>
            JAMB & Admissions Expert
          </div>
        </div>

        <button onClick={()=>setShowHistory(!showHistory)} title="History" style={{width:"34px",height:"34px",borderRadius:"8px",backgroundColor:D?"#2a2a2a":"#f0f0f0",border:"none",cursor:"pointer",color:textSub,fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>🕐</button>
        <button onClick={newChat} title="New chat" style={{width:"34px",height:"34px",borderRadius:"8px",backgroundColor:D?"#2a2a2a":"#f0f0f0",border:"none",cursor:"pointer",color:textSub,fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button>
        <button onClick={()=>{const d=!D;setDarkMode(d);localStorage.setItem("darkMode",String(d));}} style={{width:"34px",height:"34px",borderRadius:"8px",backgroundColor:D?"#2a2a2a":"#f0f0f0",border:"none",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>{D?"☀️":"🌙"}</button>
      </div>

      {/* HISTORY DRAWER */}
      {showHistory && (
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column"}}>
          <div style={{flex:1,background:"rgba(0,0,0,0.5)"}} onClick={()=>setShowHistory(false)}/>
          <div style={{backgroundColor:historyBg,borderRadius:"20px 20px 0 0",maxHeight:"70vh",display:"flex",flexDirection:"column",boxShadow:"0 -8px 40px rgba(0,0,0,0.25)"}}>
            <div style={{padding:"16px 20px",borderBottom:`1px solid ${border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontWeight:"800",color:textPrimary,fontSize:"16px"}}>Chat History</span>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={newChat} style={{padding:"8px 16px",borderRadius:"20px",border:"none",background:"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"700",fontSize:"13px",cursor:"pointer"}}>+ New</button>
                <button onClick={()=>setShowHistory(false)} style={{padding:"8px 14px",borderRadius:"20px",border:`1px solid ${border}`,backgroundColor:"transparent",color:textSub,fontSize:"13px",cursor:"pointer"}}>Close</button>
              </div>
            </div>
            <div style={{overflowY:"auto",padding:"12px",flex:1}}>
              {sessions.length===0?(
                <div style={{textAlign:"center",padding:"40px 20px",color:textSub}}>
                  <div style={{fontSize:"32px",marginBottom:"8px"}}>💬</div>
                  <div style={{fontSize:"14px"}}>No history yet</div>
                </div>
              ):sessions.map(s=>(
                <div key={s.id} onClick={()=>loadSession(s)} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",marginBottom:"6px",cursor:"pointer",backgroundColor:s.id===currentSessionId?histItemActiveBg:histItemBg,border:s.id===currentSessionId?`1.5px solid #ea580c`:`1px solid ${border}`}}>
                  <div style={{width:"34px",height:"34px",borderRadius:"8px",background:"linear-gradient(135deg,#f97316,#c2410c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>🎓</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"13px",fontWeight:"600",color:textPrimary,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.title}</div>
                    <div style={{fontSize:"11px",color:textSub,marginTop:"2px"}}>{s.date} · {s.messages.length} msgs</div>
                  </div>
                  <button onClick={e=>deleteSession(s.id,e)} style={{width:"26px",height:"26px",borderRadius:"50%",border:"none",background:D?"#444":"#e5e5e5",color:"#ef4444",cursor:"pointer",fontSize:"14px",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div style={{flex:1,overflowY:"auto",backgroundColor:msgAreaBg}}>
        {/* Empty state */}
        {messages.length===0 && (
          <div style={{maxWidth:"680px",margin:"0 auto",padding:"40px 20px"}}>
            <div style={{textAlign:"center",marginBottom:"32px"}}>
              <div style={{width:"64px",height:"64px",borderRadius:"50%",background:"linear-gradient(135deg,#f97316,#c2410c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",margin:"0 auto 14px",boxShadow:"0 8px 24px rgba(234,88,12,0.3)"}}>🎓</div>
              <h2 style={{fontSize:"22px",fontWeight:"700",color:textPrimary,margin:"0 0 6px"}}>How can I help you today?</h2>
              <p style={{fontSize:"14px",color:textSub,margin:0}}>Ask me anything about JAMB, past questions, or Nigerian university admissions</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
              {SUGGESTIONS.map((s,i)=>(
                <button key={i} onClick={()=>send(s)} style={{padding:"14px 16px",borderRadius:"14px",border:`1px solid ${border}`,backgroundColor:D?"#2a2a2a":"#f7f7f8",cursor:"pointer",textAlign:"left",fontSize:"13px",color:textPrimary,lineHeight:"1.4",fontWeight:"500",transition:"all 0.15s",boxShadow:D?"none":"0 1px 3px rgba(0,0,0,0.04)"}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        <div style={{maxWidth:"680px",margin:"0 auto",padding:"20px 16px"}}>
          {messages.map((m,i)=>(
            <div key={i} style={{marginBottom:"24px",display:"flex",gap:"14px",alignItems:"flex-start",flexDirection:m.role==="user"?"row-reverse":"row"}}>
              {/* Avatar */}
              <div style={{
                width:"32px",height:"32px",borderRadius:"50%",flexShrink:0,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:"14px",fontWeight:"800",
                background:m.role==="assistant"?"linear-gradient(135deg,#f97316,#c2410c)":"linear-gradient(135deg,#fde68a,#f97316)",
                color:m.role==="assistant"?"#fff":"#7c2d12",
                boxShadow:m.role==="assistant"?"0 2px 8px rgba(234,88,12,0.25)":"none"
              }}>
                {m.role==="assistant"?"🎓":(user?.name?.charAt(0)||"U")}
              </div>

              {/* Content */}
              <div style={{flex:1,minWidth:0}}>
                {m.role==="user" ? (
                  <div style={{
                    display:"inline-block",maxWidth:"90%",float:"right",
                    padding:"10px 16px",borderRadius:"18px 18px 4px 18px",
                    backgroundColor:userBg,color:textPrimary,
                    fontSize:"15px",lineHeight:"1.6",fontWeight:"400",
                    boxShadow:D?"0 1px 4px rgba(0,0,0,0.3)":"0 1px 4px rgba(0,0,0,0.07)"
                  }}>
                    {m.content}
                    <div style={{clear:"both"}}/>
                  </div>
                ):(
                  <div style={{color:textPrimary,fontSize:"15px",lineHeight:"1.75"}}>
                    <ReactMarkdown components={{
                      p:({children})=><p style={{margin:"0 0 14px",lineHeight:"1.75"}}>{children}</p>,
                      strong:({children})=><strong style={{fontWeight:"700",color:D?"#fff":"#000"}}>{children}</strong>,
                      em:({children})=><em style={{fontStyle:"italic",color:textSub}}>{children}</em>,
                      h1:({children})=><h1 style={{fontSize:"20px",fontWeight:"800",margin:"20px 0 10px",color:textPrimary,borderBottom:`1px solid ${border}`,paddingBottom:"8px"}}>{children}</h1>,
                      h2:({children})=><h2 style={{fontSize:"17px",fontWeight:"700",margin:"18px 0 8px",color:textPrimary}}>{children}</h2>,
                      h3:({children})=><h3 style={{fontSize:"15px",fontWeight:"700",margin:"14px 0 6px",color:textPrimary}}>{children}</h3>,
                      ul:({children})=><ul style={{paddingLeft:"22px",margin:"8px 0 14px"}}>{children}</ul>,
                      ol:({children})=><ol style={{paddingLeft:"22px",margin:"8px 0 14px"}}>{children}</ol>,
                      li:({children})=><li style={{margin:"5px 0",lineHeight:"1.65",color:textPrimary}}>{children}</li>,
                      code:({children,className})=>className?(
                        <pre style={{backgroundColor:D?"#1a1a1a":"#f4f4f5",borderRadius:"12px",padding:"16px",overflow:"auto",fontSize:"13px",margin:"12px 0",border:`1px solid ${border}`,lineHeight:"1.6"}}>
                          <code style={{color:D?"#e5e7eb":"#1a1a1a",fontFamily:"'Fira Code',Consolas,monospace"}}>{children}</code>
                        </pre>
                      ):(
                        <code style={{backgroundColor:D?"#2a2a2a":"#f0f0f0",padding:"2px 7px",borderRadius:"5px",fontSize:"13px",fontFamily:"'Fira Code',Consolas,monospace",color:D?"#fb923c":"#c2410c"}}>{children}</code>
                      ),
                      blockquote:({children})=>(
                        <blockquote style={{borderLeft:"3px solid #ea580c",paddingLeft:"16px",margin:"12px 0",color:textSub,fontStyle:"italic",backgroundColor:D?"#2a1810":"#fff8f5",borderRadius:"0 8px 8px 0",padding:"12px 16px"}}>{children}</blockquote>
                      ),
                      table:({children})=>(
                        <div style={{overflowX:"auto",margin:"12px 0"}}>
                          <table style={{borderCollapse:"collapse",width:"100%",fontSize:"13px"}}>{children}</table>
                        </div>
                      ),
                      th:({children})=><th style={{border:`1px solid ${border}`,padding:"8px 12px",backgroundColor:D?"#2a2a2a":"#f4f4f4",color:textPrimary,fontWeight:"700",textAlign:"left"}}>{children}</th>,
                      td:({children})=><td style={{border:`1px solid ${border}`,padding:"8px 12px",color:textPrimary}}>{children}</td>,
                    }}>{m.content}</ReactMarkdown>
                    <div style={{fontSize:"11px",color:textSub,marginTop:"6px"}}>
                      {new Date(m.timestamp).toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"})}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{marginBottom:"24px",display:"flex",gap:"14px",alignItems:"flex-start"}}>
              <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"linear-gradient(135deg,#f97316,#c2410c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",flexShrink:0}}>🎓</div>
              <div style={{display:"flex",gap:"5px",alignItems:"center",padding:"14px 0"}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:"7px",height:"7px",borderRadius:"50%",background:"#ea580c",animation:"dot 1.4s infinite ease-in-out",animationDelay:`${i*0.2}s`}}/>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>
      </div>

      {/* INPUT — ChatGPT style */}
      <div style={{backgroundColor:bg,padding:"12px 16px 24px",borderTop:`1px solid ${border}`}}>
        <div style={{maxWidth:"680px",margin:"0 auto"}}>
          <div style={{position:"relative",backgroundColor:inputBg,borderRadius:"16px",border:`1.5px solid ${border}`,boxShadow:D?"0 0 0 0":"0 4px 20px rgba(0,0,0,0.08)",display:"flex",alignItems:"flex-end",gap:"0",overflow:"hidden"}}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={autoResize}
              onKeyDown={handleKey}
              placeholder="Ask about JAMB, past questions, admissions..."
              rows={1}
              style={{
                flex:1,background:"transparent",border:"none",outline:"none",
                padding:"14px 16px",fontSize:"15px",color:textPrimary,
                resize:"none",fontFamily:"inherit",lineHeight:"1.6",
                maxHeight:"160px",boxSizing:"border-box",
              }}
            />
            <button
              onClick={()=>send(input.trim())}
              disabled={loading||!input.trim()}
              style={{
                margin:"8px",width:"36px",height:"36px",borderRadius:"10px",
                border:"none",flexShrink:0,cursor:loading||!input.trim()?"not-allowed":"pointer",
                background:loading||!input.trim()?(D?"#333":"#d1d1d6"):"linear-gradient(135deg,#c2410c,#ea580c)",
                color:loading||!input.trim()?(D?"#555":"#999"):"#fff",
                display:"flex",alignItems:"center",justifyContent:"center",
                transition:"all 0.2s",
                boxShadow:(!loading&&input.trim())?"0 2px 8px rgba(234,88,12,0.4)":"none"
              }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
          <div style={{textAlign:"center",marginTop:"8px",fontSize:"11px",color:D?"#444":"#c8c8c8"}}>
            Companion AI · Llama 4 Scout · JAMB & Nigerian Admissions Expert
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dot{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-5px);opacity:1}}
        ::-webkit-scrollbar{width:0}
        textarea::placeholder{color:${textSub}}
      `}</style>
    </div>
  );
}
