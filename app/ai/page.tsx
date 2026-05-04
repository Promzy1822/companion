"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

interface Message { role:"user"|"assistant"; content:string; timestamp:string; }
interface ChatSession { id:string; title:string; messages:Message[]; date:string; }
interface User { name:string; target:string; institution:string; course:string; subjects:string[]; }

const QUICK_ACTIONS = [
  {icon:"📝",label:"Solve a JAMB question",prompt:"Solve this JAMB question step by step:"},
  {icon:"📖",label:"Explain a topic",prompt:"Explain this JAMB topic clearly with examples:"},
  {icon:"📋",label:"Past questions",prompt:"Give me 5 JAMB past questions on this topic with full answers:"},
  {icon:"🏛️",label:"Admission help",prompt:"Help me understand the admission process for:"},
  {icon:"🧮",label:"Calculate aggregate",prompt:"Help me calculate my JAMB aggregate score. My JAMB score is:"},
  {icon:"📅",label:"Study tips",prompt:"Give me study tips and strategy for JAMB:"},
];

function getSessionId() {
  return Date.now().toString(36)+Math.random().toString(36).slice(2);
}

function buildSystemPrompt(user:User|null):string {
  return `You are Companion AI, an elite JAMB and Nigerian university admission expert. You help Nigerian students prepare for JAMB UTME and navigate university admissions.

Your expertise:
- All JAMB subjects: Mathematics, English Language, Physics, Chemistry, Biology, Government, Economics, Literature in English, Geography, CRS/IRS
- JAMB past questions from 2000-2024 with step-by-step solutions
- JAMB CBT format, marking scheme, timing strategies
- Nigerian university cut-off marks (UNILAG, UI, OAU, UNIBEN, UNILORIN, UNN, ABU, LASU, UNIPORT, FUTO, FUNAAB, etc.)
- JAMB CAPS admission process, Post-UTME screening, Direct Entry
- Aggregate calculation: (JAMB score/8) + (Post-UTME score/2)
- WAEC/NECO O'Level requirements
- Change of institution/course procedures

Student profile:
${user?`Name: ${user.name}, Target: ${user.target}/400, Course: ${user.course}, Institution: ${user.institution}, Subjects: ${user.subjects?.join(", ")}`:"Guest student"}

Rules:
- Give detailed, accurate answers specific to JAMB and Nigerian education
- Show step-by-step working for mathematics and sciences
- Use Nigerian context and examples
- Be encouraging and motivating
- Format with clear headers and numbered steps
- Reference JAMB syllabus topics`;
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
  const [rows, setRows] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setDarkMode(localStorage.getItem("darkMode")==="true");
    const u = localStorage.getItem("companion_user");
    if (u) setUser(JSON.parse(u));
    const savedSessions = localStorage.getItem("chat_sessions");
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    const newId = getSessionId();
    setCurrentSessionId(newId);
    setMessages([{
      role:"assistant",
      content:`Hi${u?` ${JSON.parse(u).name.split(" ")[0]}`:""}! 👋 I'm **Companion AI**, your personal JAMB expert.\n\nAsk me anything — past questions, topic explanations, admission calculations, or study strategies.`,
      timestamp:new Date().toISOString()
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
  }, [messages, loading]);

  const saveSession = (msgs:Message[], sessionId:string) => {
    if (msgs.length<=1) return;
    const allSessions:ChatSession[] = JSON.parse(localStorage.getItem("chat_sessions")||"[]");
    const firstUser = msgs.find(m=>m.role==="user");
    const title = firstUser?firstUser.content.slice(0,50):"Chat session";
    const session:ChatSession = {id:sessionId,title,messages:msgs,date:new Date().toLocaleDateString("en-NG",{day:"numeric",month:"short"})};
    const existing = allSessions.findIndex(s=>s.id===sessionId);
    if (existing>=0) allSessions[existing]=session; else allSessions.unshift(session);
    const trimmed = allSessions.slice(0,20);
    localStorage.setItem("chat_sessions",JSON.stringify(trimmed));
    setSessions(trimmed);
  };

  const sendMessage = async (text:string) => {
    if (!text.trim()||loading) return;
    const now = new Date().toISOString();
    const newMsg:Message = {role:"user",content:text,timestamp:now};
    const newMessages = [...messages,newMsg];
    setMessages(newMessages);
    setInput("");
    setRows(1);
    setLoading(true);
    try {
      const history = newMessages.slice(-10).map(m=>({role:m.role,content:m.content}));
      const res = await fetch("/api/chat",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:text,systemPrompt:buildSystemPrompt(user),history:history.slice(0,-1)})
      });
      const data = await res.json();
      const reply = data.reply||"I couldn't respond. Please try again.";
      const replyMsg:Message = {role:"assistant",content:reply,timestamp:new Date().toISOString()};
      const final = [...newMessages,replyMsg];
      setMessages(final);
      saveSession(final,currentSessionId);
    } catch {
      setMessages([...newMessages,{role:"assistant",content:"Network error. Please check your connection.",timestamp:new Date().toISOString()}]);
    } finally {setLoading(false);}
  };

  const handleKeyDown = (e:React.KeyboardEvent) => {
    if (e.key==="Enter"&&!e.shiftKey) {e.preventDefault();sendMessage(input.trim());}
  };

  const handleInput = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const lineCount = e.target.value.split("\n").length;
    setRows(Math.min(5,Math.max(1,lineCount)));
  };

  const loadSession = (s:ChatSession) => {setMessages(s.messages);setCurrentSessionId(s.id);setShowHistory(false);};
  const deleteSession = (id:string,e:React.MouseEvent) => {
    e.stopPropagation();
    const updated=sessions.filter(s=>s.id!==id);
    setSessions(updated);
    localStorage.setItem("chat_sessions",JSON.stringify(updated));
  };
  const newChat = () => {
    const newId=getSessionId();
    setCurrentSessionId(newId);
    setMessages([{role:"assistant",content:`Hi! 👋 What would you like to work on?`,timestamp:new Date().toISOString()}]);
    setShowHistory(false);
  };

  if (!mounted) return null;

  const isDark = darkMode;
  const bg = isDark?"#0a0a0a":"#f7f7f8";
  const sidebarBg = isDark?"#111":"#fff";
  const chatBg = isDark?"#0a0a0a":"#f7f7f8";
  const userBubble = isDark?"#2f2f2f":"#fff";
  const aiBubble = isDark?"#1e1e1e":"#fff";
  const textColor = isDark?"#ececec":"#1a1a1a";
  const subText = isDark?"#8e8ea0":"#6e6e80";
  const borderC = isDark?"#2a2a2a":"#e5e5e5";
  const inputBg = isDark?"#1e1e1e":"#fff";
  const placeholderColor = isDark?"#6e6e80":"#8e8ea0";

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100dvh",backgroundColor:bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",position:"relative"}}>

      {/* Top bar — ChatGPT style */}
      <div style={{position:"sticky",top:0,zIndex:50,backgroundColor:isDark?"rgba(10,10,10,0.9)":"rgba(247,247,248,0.9)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${borderC}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:"12px"}}>
        <Link href="/" style={{textDecoration:"none",width:"32px",height:"32px",borderRadius:"8px",backgroundColor:isDark?"#2a2a2a":"#ebebeb",display:"flex",alignItems:"center",justifyContent:"center",color:textColor,fontSize:"15px",flexShrink:0}}>←</Link>

        <div style={{flex:1,display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"linear-gradient(135deg,#f97316,#c2410c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",fontWeight:"800",color:"#fff",flexShrink:0}}>C</div>
          <div>
            <div style={{fontWeight:"700",color:textColor,fontSize:"15px",lineHeight:"1.2"}}>Companion AI</div>
            <div style={{fontSize:"11px",color:"#22c55e",display:"flex",alignItems:"center",gap:"4px"}}>
              <span style={{width:"5px",height:"5px",borderRadius:"50%",backgroundColor:"#22c55e",display:"inline-block"}}></span>
              JAMB Expert
            </div>
          </div>
        </div>

        <button onClick={()=>setShowHistory(!showHistory)} style={{width:"32px",height:"32px",borderRadius:"8px",backgroundColor:isDark?"#2a2a2a":"#ebebeb",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",color:textColor}} title="History">🕐</button>
        <button onClick={newChat} style={{width:"32px",height:"32px",borderRadius:"8px",backgroundColor:isDark?"#2a2a2a":"#ebebeb",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",color:textColor}} title="New chat">✏️</button>
        <button onClick={()=>{const d=!isDark;setDarkMode(d);localStorage.setItem("darkMode",String(d));}} style={{width:"32px",height:"32px",borderRadius:"8px",backgroundColor:isDark?"#2a2a2a":"#ebebeb",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px"}}>{isDark?"☀️":"🌙"}</button>
      </div>

      {/* History drawer */}
      {showHistory && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:200,display:"flex",flexDirection:"column"}}>
          <div style={{flex:1,backgroundColor:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}} onClick={()=>setShowHistory(false)} />
          <div style={{backgroundColor:sidebarBg,borderRadius:"24px 24px 0 0",maxHeight:"72vh",display:"flex",flexDirection:"column",boxShadow:"0 -8px 40px rgba(0,0,0,0.3)"}}>
            <div style={{padding:"16px 20px",borderBottom:`1px solid ${borderC}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontWeight:"800",color:textColor,fontSize:"16px"}}>💬 Chat History</div>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={newChat} style={{padding:"8px 16px",borderRadius:"20px",border:"none",background:"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"700",fontSize:"13px",cursor:"pointer"}}>+ New</button>
                <button onClick={()=>setShowHistory(false)} style={{padding:"8px 14px",borderRadius:"20px",border:`1px solid ${borderC}`,backgroundColor:"transparent",color:subText,fontSize:"13px",cursor:"pointer"}}>Close</button>
              </div>
            </div>
            <div style={{overflowY:"auto",flex:1,padding:"12px"}}>
              {sessions.length===0?(
                <div style={{textAlign:"center",padding:"40px",color:subText}}>
                  <div style={{fontSize:"36px",marginBottom:"8px"}}>💬</div>
                  <div>No history yet. Start chatting!</div>
                </div>
              ):sessions.map(s=>(
                <div key={s.id} onClick={()=>loadSession(s)} style={{padding:"14px 16px",borderRadius:"14px",marginBottom:"8px",backgroundColor:s.id===currentSessionId?(isDark?"#2a1810":"#fff8f5"):isDark?"#1e1e1e":"#f5f5f5",border:s.id===currentSessionId?"1.5px solid #ea580c":`1px solid ${borderC}`,cursor:"pointer",display:"flex",alignItems:"center",gap:"12px"}}>
                  <div style={{width:"36px",height:"36px",borderRadius:"10px",background:"linear-gradient(135deg,#f97316,#c2410c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",fontWeight:"700",color:"#fff",flexShrink:0}}>C</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"13px",fontWeight:"600",color:textColor,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</div>
                    <div style={{fontSize:"11px",color:subText,marginTop:"2px"}}>{s.date} · {s.messages.length} messages</div>
                  </div>
                  <button onClick={(e)=>deleteSession(s.id,e)} style={{width:"26px",height:"26px",borderRadius:"50%",border:"none",backgroundColor:isDark?"#333":"#eee",color:"#ef4444",cursor:"pointer",fontSize:"13px",flexShrink:0}}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 0"}}>
        <div style={{maxWidth:"768px",margin:"0 auto",padding:"0 16px",display:"flex",flexDirection:"column",gap:"0"}}>

          {/* Quick actions when fresh */}
          {messages.length===1 && (
            <div style={{marginBottom:"24px"}}>
              <div style={{textAlign:"center",marginBottom:"20px"}}>
                <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"linear-gradient(135deg,#f97316,#c2410c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",fontWeight:"800",color:"#fff",margin:"0 auto 12px",boxShadow:"0 8px 24px rgba(234,88,12,0.3)"}}>C</div>
                <div style={{fontSize:"20px",fontWeight:"800",color:textColor}}>Companion AI</div>
                <div style={{fontSize:"14px",color:subText,marginTop:"4px"}}>Your JAMB & Admission Expert</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                {QUICK_ACTIONS.map((a,i)=>(
                  <button key={i} onClick={()=>{setInput(a.prompt);textareaRef.current?.focus();}} style={{padding:"14px",borderRadius:"14px",border:`1px solid ${borderC}`,backgroundColor:isDark?"#1e1e1e":"#fff",cursor:"pointer",textAlign:"left",boxShadow:isDark?"none":"0 1px 4px rgba(0,0,0,0.06)",transition:"all 0.15s"}}>
                    <div style={{fontSize:"20px",marginBottom:"6px"}}>{a.icon}</div>
                    <div style={{fontSize:"13px",color:textColor,fontWeight:"600",lineHeight:"1.3"}}>{a.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((m,i)=>(
            <div key={i} style={{marginBottom:"24px",display:"flex",gap:"12px",alignItems:"flex-start",flexDirection:m.role==="user"?"row-reverse":"row"}}>
              
              {/* Avatar */}
              <div style={{width:"32px",height:"32px",borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"800",fontSize:"13px",
                background:m.role==="assistant"?"linear-gradient(135deg,#f97316,#c2410c)":"linear-gradient(135deg,#fde68a,#f97316)",
                color:m.role==="assistant"?"#fff":"#7c2d12",
                boxShadow:m.role==="assistant"?"0 2px 8px rgba(234,88,12,0.3)":"none"
              }}>
                {m.role==="assistant"?"C":(user?.name?.charAt(0)||"U")}
              </div>

              {/* Bubble */}
              <div style={{maxWidth:"85%",minWidth:"40px"}}>
                <div style={{
                  padding:m.role==="user"?"10px 16px":"0",
                  borderRadius:m.role==="user"?"18px 18px 4px 18px":"0",
                  backgroundColor:m.role==="user"?(isDark?"#2f2f2f":"#fff"):"transparent",
                  color:textColor,fontSize:"15px",lineHeight:"1.7",
                  boxShadow:m.role==="user"?(isDark?"0 1px 4px rgba(0,0,0,0.4)":"0 1px 6px rgba(0,0,0,0.08)"):"none",
                  border:m.role==="user"?`1px solid ${borderC}`:"none",
                  fontWeight:m.role==="user"?"500":"400",
                }}>
                  {m.role==="user" ? (
                    <span>{m.content}</span>
                  ) : (
                    <div style={{color:textColor}}>
                      <ReactMarkdown
                        components={{
                          p:({children})=><p style={{margin:"0 0 12px",lineHeight:"1.7"}}>{children}</p>,
                          strong:({children})=><strong style={{fontWeight:"700",color:isDark?"#fff":"#000"}}>{children}</strong>,
                          h1:({children})=><h1 style={{fontSize:"18px",fontWeight:"800",margin:"16px 0 8px",color:textColor}}>{children}</h1>,
                          h2:({children})=><h2 style={{fontSize:"16px",fontWeight:"700",margin:"14px 0 6px",color:textColor}}>{children}</h2>,
                          h3:({children})=><h3 style={{fontSize:"15px",fontWeight:"700",margin:"12px 0 4px",color:textColor}}>{children}</h3>,
                          ul:({children})=><ul style={{paddingLeft:"20px",margin:"8px 0"}}>{children}</ul>,
                          ol:({children})=><ol style={{paddingLeft:"20px",margin:"8px 0"}}>{children}</ol>,
                          li:({children})=><li style={{margin:"4px 0",lineHeight:"1.6"}}>{children}</li>,
                          code:({children,className})=>{
                            const isBlock = className?.includes("language-");
                            return isBlock?(
                              <pre style={{backgroundColor:isDark?"#1a1a1a":"#f4f4f5",borderRadius:"10px",padding:"14px",overflow:"auto",fontSize:"13px",margin:"10px 0",border:`1px solid ${borderC}`}}>
                                <code style={{color:isDark?"#e5e7eb":"#1a1a1a",fontFamily:"monospace"}}>{children}</code>
                              </pre>
                            ):(
                              <code style={{backgroundColor:isDark?"#2a2a2a":"#f4f4f5",padding:"2px 6px",borderRadius:"4px",fontSize:"13px",fontFamily:"monospace",color:isDark?"#e5e7eb":"#1a1a1a"}}>{children}</code>
                            );
                          },
                          blockquote:({children})=><blockquote style={{borderLeft:`3px solid #ea580c`,paddingLeft:"14px",margin:"12px 0",color:subText,fontStyle:"italic"}}>{children}</blockquote>,
                        }}
                      >{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
                <div style={{fontSize:"11px",color:subText,marginTop:"5px",textAlign:m.role==="user"?"right":"left"}}>
                  {new Date(m.timestamp).toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"})}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{marginBottom:"24px",display:"flex",gap:"12px",alignItems:"flex-start"}}>
              <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"linear-gradient(135deg,#f97316,#c2410c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:"800",color:"#fff",flexShrink:0}}>C</div>
              <div style={{padding:"14px 18px",borderRadius:"0",display:"flex",gap:"5px",alignItems:"center"}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:"7px",height:"7px",borderRadius:"50%",backgroundColor:"#ea580c",animation:"typingBounce 1.4s infinite ease-in-out",animationDelay:`${i*0.2}s`}} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area — ChatGPT style */}
      <div style={{backgroundColor:bg,padding:"12px 16px 20px",position:"sticky",bottom:0}}>
        <div style={{maxWidth:"768px",margin:"0 auto"}}>
          <div style={{position:"relative",backgroundColor:inputBg,borderRadius:"16px",border:`1px solid ${borderC}`,boxShadow:isDark?"0 0 0 1px #2a2a2a":"0 0 0 1px #e5e5e5, 0 4px 16px rgba(0,0,0,0.08)",transition:"box-shadow 0.2s",overflow:"hidden"}}>
            <textarea
              ref={textareaRef}
              rows={rows}
              style={{width:"100%",background:"none",border:"none",outline:"none",fontSize:"15px",color:textColor,padding:"14px 52px 14px 16px",resize:"none",fontFamily:"inherit",lineHeight:"1.6",boxSizing:"border-box",display:"block"}}
              placeholder="Ask about JAMB, admissions, any subject..."
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={()=>sendMessage(input.trim())}
              disabled={loading||!input.trim()}
              style={{position:"absolute",right:"10px",bottom:"10px",width:"36px",height:"36px",borderRadius:"10px",border:"none",background:loading||!input.trim()?(isDark?"#2a2a2a":"#d1d1d6"):"linear-gradient(135deg,#c2410c,#ea580c)",color:loading||!input.trim()?(isDark?"#4a4a4a":"#9a9a9a"):"#fff",cursor:loading||!input.trim()?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",boxShadow:(!loading&&input.trim())?"0 2px 8px rgba(234,88,12,0.4)":"none"}}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
          <div style={{fontSize:"11px",color:isDark?"#4a4a4a":"#c0c0c0",textAlign:"center",marginTop:"8px"}}>
            Companion AI · Powered by Llama 4 Scout · JAMB & Nigerian Admissions Expert
          </div>
        </div>
      </div>

      <style>{`
        @keyframes typingBounce{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-5px);opacity:1}}
        ::-webkit-scrollbar{width:0px}
        textarea::placeholder{color:${placeholderColor}}
      `}</style>
    </div>
  );
}
