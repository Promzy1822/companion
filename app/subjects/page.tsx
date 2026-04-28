'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const subjects = [
  { name: 'English', emoji: '📝' },
  { name: 'Mathematics', emoji: '🔢' },
  { name: 'Physics', emoji: '⚡' },
  { name: 'Chemistry', emoji: '🧪' },
  { name: 'Biology', emoji: '🧬' },
  { name: 'Economics', emoji: '📊' },
  { name: 'Government', emoji: '🏛️' },
  { name: 'Literature', emoji: '📚' },
  { name: 'Geography', emoji: '🌍' },
  { name: 'Commerce', emoji: '💼' },
];

export default function Subjects() {
  const router = useRouter();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') setDark(true);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: dark ? '#0f0f0f' : '#faf7f2',
      color: dark ? '#f0f0f0' : '#1a1208',
      padding: '24px 20px',
      fontFamily: 'sans-serif',
      transition: 'all 0.3s ease'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'28px'}}>
        <button onClick={() => router.back()} style={{
          background:'none', border:'none',
          fontSize:'20px', cursor:'pointer',
          color: dark ? '#f0f0f0' : '#1a1208'
        }}>←</button>
        <div style={{fontSize:'20px', fontWeight:800}}>
          Com<span style={{color:'#e07000'}}>panion</span>
        </div>
      </div>

      <div style={{fontSize:'22px', fontWeight:800, marginBottom:'6px', color: dark ? '#f0f0f0' : '#1a1208'}}>
        Pick a <span style={{color:'#e07000'}}>Subject</span>
      </div>
      <div style={{fontSize:'13px', color: dark ? '#888' : '#b09060', marginBottom:'24px'}}>
        Choose what you want to study today
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
        {subjects.map((subject) => (
          <div key={subject.name} style={{
            background: dark ? '#1a1a1a' : '#ffffff',
            border: `1px solid ${dark ? '#2a2a2a' : '#ede8df'}`,
            borderRadius:'14px',
            padding:'20px 14px',
            cursor:'pointer',
            textAlign:'center'
          }}>
            <div style={{fontSize:'28px', marginBottom:'8px'}}>{subject.emoji}</div>
            <div style={{fontSize:'13px', fontWeight:700, color: dark ? '#f0f0f0' : '#1a1208'}}>{subject.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
