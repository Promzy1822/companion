'use client';

import { useState, useEffect } from 'react';
export default function Home() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') setDark(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !dark;
    setDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };
  return (
    <div style={{
      minHeight: '100vh',
      background: dark ? '#0f0f0f' : '#faf7f2',
      color: dark ? '#f0f0f0' : '#1a1208',
      fontFamily: 'sans-serif',
      padding: '24px 20px',
      transition: 'all 0.3s ease'
    }}>

      {/* Top Bar */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'28px'}}>
        <div style={{fontSize:'24px', fontWeight:800}}>
          Com<span style={{color: dark ? '#ffa030' : '#e07000'}}>panion</span>
        </div>
        <button onClick={toggleTheme} style={{
          background: dark ? '#2a2a2a' : '#fff3e0',
          border: `1px solid ${dark ? '#333' : '#ffd080'}`,
          color: dark ? '#ffa030' : '#c05800',
          borderRadius:'20px',
          padding:'6px 14px',
          fontSize:'12px',
          cursor:'pointer'
        }}>
          {dark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
      {/* Greeting */}
      <div style={{marginBottom:'8px', fontSize:'13px', color: dark ? '#666' : '#b09060'}}>
        Good morning 👋
      </div>
      <div style={{fontSize:'26px', fontWeight:800, lineHeight:1.2, marginBottom:'28px'}}>
        Ready to <span style={{color: dark ? '#ffa030' : '#e07000'}}>crush</span><br/>your JAMB?
      </div>

      {/* Main Cards */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px'}}>
        
        <div style={{background: dark ? '#1a1a1a' : '#ffffff', border: `1px solid ${dark ? '#2a2a2a' : '#ede8df'}`, borderRadius:'14px', padding:'18px 14px', cursor:'pointer'}}>
          <div style={{fontSize:'24px', marginBottom:'8px'}}>📚</div>
          <div style={{fontSize:'14px', fontWeight:700, marginBottom:'3px'}}>Learn</div>
          <div style={{fontSize:'11px', color: dark ? '#555' : '#b09060'}}>Topic lessons</div>
        </div>

        <div style={{background: dark ? '#1a1a1a' : '#ffffff', border: `1px solid ${dark ? '#2a2a2a' : '#ede8df'}`, borderRadius:'14px', padding:'18px 14px', cursor:'pointer'}}>
          <div style={{fontSize:'24px', marginBottom:'8px'}}>✏️</div>
          <div style={{fontSize:'14px', fontWeight:700, marginBottom:'3px'}}>Practice</div>
          <div style={{fontSize:'11px', color: dark ? '#555' : '#b09060'}}>Past questions</div>
        </div>

      </div>
      {/* Ask AI Button */}
      <button style={{
        width:'100%',
        background: dark ? '#1a1208' : '#1a1208',
        color:'#ffa030',
        border:'none',
        borderRadius:'14px',
        padding:'16px',
        fontSize:'15px',
        fontWeight:700,
        cursor:'pointer',
        marginBottom:'20px'
      }}>
        🤖 Ask AI Anything
      </button>

      {/* Stats */}
      <div style={{display:'flex', gap:'16px', paddingTop:'16px', borderTop:`1px solid ${dark ? '#2a2a2a' : '#ede8df'}`}}>
        <div style={{flex:1, textAlign:'center'}}>
          <div style={{fontSize:'22px', fontWeight:700, color: dark ? '#ffa030' : '#e07000'}}>0</div>
          <div style={{fontSize:'10px', color: dark ? '#555' : '#b09060', letterSpacing:'1px'}}>QUESTIONS</div>
        </div>
        <div style={{flex:1, textAlign:'center'}}>
          <div style={{fontSize:'22px', fontWeight:700, color: dark ? '#ffa030' : '#e07000'}}>1</div>
          <div style={{fontSize:'10px', color: dark ? '#555' : '#b09060', letterSpacing:'1px'}}>DAY STREAK</div>
        </div>
        <div style={{flex:1, textAlign:'center'}}>
          <div style={{fontSize:'22px', fontWeight:700, color: dark ? '#ffa030' : '#e07000'}}>0%</div>
          <div style={{fontSize:'10px', color: dark ? '#555' : '#b09060', letterSpacing:'1px'}}>AVG SCORE</div>
        </div>
      </div>

    </div>
  );
}