'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const SUBJECTS = [
  { id:'english', name:'English Language', emoji:'📝', color:'#3b82f6' },
  { id:'mathematics', name:'Mathematics', emoji:'🔢', color:'#8b5cf6' },
  { id:'physics', name:'Physics', emoji:'⚡', color:'#f59e0b' },
  { id:'chemistry', name:'Chemistry', emoji:'🧪', color:'#10b981' },
  { id:'biology', name:'Biology', emoji:'🧬', color:'#ec4899' },
  { id:'government', name:'Government', emoji:'🏛️', color:'#6366f1' },
  { id:'economics', name:'Economics', emoji:'📈', color:'#14b8a6' },
  { id:'literature', name:'Literature', emoji:'📚', color:'#f97316' },
  { id:'geography', name:'Geography', emoji:'🌍', color:'#84cc16' },
  { id:'crs', name:'CRS / IRS', emoji:'✝️', color:'#a78bfa' },
];

function SubjectsContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'learn';
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setDarkMode(localStorage.getItem('darkMode') === 'true');
  }, []);

  const bg = darkMode ? '#0a0a0a' : '#f5f5f7';
  const cardBg = darkMode ? '#1c1c1e' : '#ffffff';
  const textColor = darkMode ? '#f2f2f7' : '#1c1c1e';
  const subText = darkMode ? '#98989d' : '#6e6e73';
  const borderC = darkMode ? '#2c2c2e' : '#e5e5ea';

  return (
    <div style={{ minHeight:'100vh', backgroundColor:bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#431407,#7c2d12,#c2410c,#ea580c)', padding:'20px 20px 28px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'120px', height:'120px', borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
        
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
          <Link href="/" style={{ width:'34px', height:'34px', borderRadius:'10px', backgroundColor:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'16px', textDecoration:'none', flexShrink:0 }}>←</Link>
          <div>
            <div style={{ color:'#fff', fontWeight:'800', fontSize:'18px' }}>
              {mode === 'learn' ? '📚 Learn' : '✏️ Practice'}
            </div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px' }}>
              {mode === 'learn' ? 'Choose a subject to study' : 'Choose a subject to practice'}
            </div>
          </div>
        </div>

        {/* Mode toggle — two separate clean buttons */}
        <div style={{ display:'flex', gap:'10px' }}>
          <button
            onClick={() => router.push('/subjects?mode=learn')}
            style={{
              flex:1, padding:'11px 0', borderRadius:'12px', border:'none',
              cursor:'pointer', fontWeight:'700', fontSize:'14px',
              backgroundColor: mode === 'learn' ? '#fff' : 'rgba(255,255,255,0.15)',
              color: mode === 'learn' ? '#ea580c' : 'rgba(255,255,255,0.8)',
              transition:'all 0.2s',
              boxShadow: mode === 'learn' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            📚 Learn
          </button>
          <button
            onClick={() => router.push('/subjects?mode=practice')}
            style={{
              flex:1, padding:'11px 0', borderRadius:'12px', border:'none',
              cursor:'pointer', fontWeight:'700', fontSize:'14px',
              backgroundColor: mode === 'practice' ? '#fff' : 'rgba(255,255,255,0.15)',
              color: mode === 'practice' ? '#ea580c' : 'rgba(255,255,255,0.8)',
              transition:'all 0.2s',
              boxShadow: mode === 'practice' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            ✏️ Practice
          </button>
        </div>
      </div>

      {/* Subjects Grid */}
      <div style={{ padding:'20px 16px' }}>
        <div style={{ fontSize:'13px', color:subText, fontWeight:'600', marginBottom:'14px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
          Select Subject
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          {SUBJECTS.map(subject => (
            <Link key={subject.id} href={`/questions?subject=${subject.id}&mode=${mode}`} style={{ textDecoration:'none' }}>
              <div style={{
                backgroundColor:cardBg, borderRadius:'18px', padding:'20px 16px',
                boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.08)',
                border:`1px solid ${borderC}`, cursor:'pointer', transition:'transform 0.15s',
              }}>
                <div style={{ width:'48px', height:'48px', borderRadius:'14px', backgroundColor:`${subject.color}18`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px', fontSize:'24px' }}>
                  {subject.emoji}
                </div>
                <div style={{ fontWeight:'700', color:textColor, fontSize:'14px', marginBottom:'4px' }}>{subject.name}</div>
                <div style={{ fontSize:'12px', color:subject.color, fontWeight:'600' }}>
                  {mode === 'learn' ? 'Watch lessons →' : 'Practice now →'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Subjects() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', backgroundColor:'#f5f5f7', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Arial', color:'#666' }}>Loading...</div>}>
      <SubjectsContent />
    </Suspense>
  );
}
