'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

function SubjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'learn';
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
        {mode === 'learn' ? '📚 Learn a' : '✏️ Practice a'} <span style={{color:'#e07000'}}>Subject</span>
      </div>
      <div style={{fontSize:'13px', color: dark ? '#888' : '#b09060', marginBottom:'24px'}}>
        {mode === 'learn' ? 'Pick a subject to watch lessons' : 'Pick a subject to answer past questions'}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
        {subjects.map((subject) => (
          <div key={subject.name}
            onClick={() => router.push(`/questions?subject=${subject.name.toLowerCase()}&mode=${mode}`)}
            style={{
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

export default function Subjects() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubjectsContent />
    </Suspense>
  );
}
