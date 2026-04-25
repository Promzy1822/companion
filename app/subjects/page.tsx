'use client';

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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#faf7f2',
      padding: '24px 20px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'28px'}}>
        <button onClick={() => router.back()} style={{
          background:'none', border:'none', fontSize:'20px', cursor:'pointer'
        }}>←</button>
        <div style={{fontSize:'20px', fontWeight:800}}>
          Com<span style={{color:'#e07000'}}>panion</span>
        </div>
      </div>

      <div style={{fontSize:'22px', fontWeight:800, marginBottom:'6px'}}>
        Pick a <span style={{color:'#e07000'}}>Subject</span>
      </div>
      <div style={{fontSize:'13px', color:'#b09060', marginBottom:'24px'}}>
        Choose what you want to study today
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
        {subjects.map((subject) => (
          <div key={subject.name} style={{
            background:'#ffffff',
            border:'1px solid #ede8df',
            borderRadius:'14px',
            padding:'20px 14px',
            cursor:'pointer',
            textAlign:'center'
          }}>
            <div style={{fontSize:'28px', marginBottom:'8px'}}>{subject.emoji}</div>
            <div style={{fontSize:'13px', fontWeight:700}}>{subject.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}