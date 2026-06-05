'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function QuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subject = searchParams.get('subject') || 'english';
  const mode = searchParams.get('mode') || 'practice';
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') setDark(true);
  }, []);

  const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);

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

      <div style={{fontSize:'22px', fontWeight:800, marginBottom:'6px'}}>
        {subjectName} — <span style={{color:'#e07000'}}>{mode === 'learn' ? 'Lessons' : 'Practice'}</span>
      </div>
      <div style={{fontSize:'13px', color: dark ? '#888' : '#b09060', marginBottom:'32px'}}>
        {mode === 'learn' ? 'Watch video lessons for this subject' : 'Answer past JAMB questions'}
      </div>

      <div style={{
        background: dark ? '#1a1a1a' : '#ffffff',
        border: `1px solid ${dark ? '#2a2a2a' : '#ede8df'}`,
        borderRadius:'16px',
        padding:'32px 20px',
        textAlign:'center'
      }}>
        <div style={{fontSize:'48px', marginBottom:'16px'}}>
          {mode === 'learn' ? '🎬' : '✏️'}
        </div>
        <div style={{fontSize:'16px', fontWeight:700, marginBottom:'8px'}}>
          {mode === 'learn' ? 'Lessons coming soon' : 'Questions coming soon'}
        </div>
        <div style={{fontSize:'13px', color: dark ? '#888' : '#b09060'}}>
          {mode === 'learn'
            ? 'We are curating the best YouTube lessons for ' + subjectName
            : 'We are loading past JAMB questions for ' + subjectName}
        </div>
      </div>
    </div>
  );
}

export default function Questions() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuestionsContent />
    </Suspense>
  );
}
