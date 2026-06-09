'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, PlayCircle, ExternalLink } from 'lucide-react';
import BottomNav, { BOTTOM_NAV_HEIGHT } from '../components/BottomNav';
import { C, palette } from '../lib/design';

const LESSON_LINKS: Record<string, { title: string; url: string }[]> = {
  mathematics: [
    { title: 'JAMB Maths — Number & Numeration', url: 'https://www.youtube.com/results?search_query=JAMB+mathematics+number+numeration' },
    { title: 'Quadratic Equations Made Easy', url: 'https://www.youtube.com/results?search_query=JAMB+quadratic+equations' },
    { title: 'Trigonometry for JAMB', url: 'https://www.youtube.com/results?search_query=JAMB+trigonometry' },
    { title: 'Statistics & Probability', url: 'https://www.youtube.com/results?search_query=JAMB+statistics+probability' },
  ],
  english: [
    { title: 'Comprehension Tips', url: 'https://www.youtube.com/results?search_query=JAMB+english+comprehension' },
    { title: 'Oral English: Vowels & Consonants', url: 'https://www.youtube.com/results?search_query=JAMB+oral+english+phonology' },
    { title: 'Lexis & Structure Full Guide', url: 'https://www.youtube.com/results?search_query=JAMB+lexis+structure' },
  ],
  physics: [
    { title: 'Mechanics & Motion', url: 'https://www.youtube.com/results?search_query=JAMB+physics+mechanics' },
    { title: 'Waves & Optics', url: 'https://www.youtube.com/results?search_query=JAMB+physics+waves+optics' },
    { title: 'Electricity & Magnetism', url: 'https://www.youtube.com/results?search_query=JAMB+physics+electricity' },
  ],
  chemistry: [
    { title: 'Organic Chemistry', url: 'https://www.youtube.com/results?search_query=JAMB+organic+chemistry' },
    { title: 'Periodic Table & Atomic Structure', url: 'https://www.youtube.com/results?search_query=JAMB+chemistry+periodic+table' },
    { title: 'Chemical Equilibrium', url: 'https://www.youtube.com/results?search_query=JAMB+chemical+equilibrium' },
  ],
  biology: [
    { title: 'Cell Biology', url: 'https://www.youtube.com/results?search_query=JAMB+biology+cell' },
    { title: 'Genetics & Evolution', url: 'https://www.youtube.com/results?search_query=JAMB+genetics+evolution' },
    { title: 'Ecology & Nutrition', url: 'https://www.youtube.com/results?search_query=JAMB+ecology+nutrition' },
  ],
  government: [
    { title: 'Nigerian Constitution', url: 'https://www.youtube.com/results?search_query=JAMB+government+nigerian+constitution' },
    { title: 'Political Parties & Elections', url: 'https://www.youtube.com/results?search_query=JAMB+government+political+parties' },
  ],
  economics: [
    { title: 'Demand, Supply & Market', url: 'https://www.youtube.com/results?search_query=JAMB+economics+demand+supply' },
    { title: 'National Income & GDP', url: 'https://www.youtube.com/results?search_query=JAMB+economics+national+income' },
  ],
};

const ICONS: Record<string, string> = {
  mathematics: '📐', english: '📚', physics: '⚛️',
  chemistry: '🧪', biology: '🌿', government: '🏛️',
  economics: '📊', geography: '🌍', commerce: '💼',
};

function QuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subject = (searchParams.get('subject') || 'english').toLowerCase();
  const mode = searchParams.get('mode') || 'practice';
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // FIX: was reading 'theme'==='dark', now correctly reads 'darkMode'==='true'
    setDark(localStorage.getItem('darkMode') === 'true');
  }, []);

  const T = palette(dark);
  const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
  const icon = ICONS[subject] || '📖';
  const lessons = LESSON_LINKS[subject] || [];

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      color: T.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
      paddingBottom: BOTTOM_NAV_HEIGHT + 16,
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        padding: '0 16px', height: 56,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.text,
        }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>{icon} {subjectName}</span>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['learn', 'practice'].map(m => (
            <button key={m} onClick={() => router.replace(`/questions?subject=${subject}&mode=${m}`)} style={{
              flex: 1, padding: '10px', borderRadius: 12, border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: mode === m ? C.primary : T.surface,
              color: mode === m ? '#fff' : T.sub,
            }}>
              {m === 'learn' ? '🎬 Lessons' : '✏️ Practice'}
            </button>
          ))}
        </div>

        {mode === 'learn' && (
          <div>
            <p style={{ fontSize: 13, color: T.sub, marginBottom: 16 }}>
              Curated YouTube lessons for {subjectName}. Tap any to open.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lessons.length > 0 ? lessons.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 14,
                  background: T.surface, border: `1px solid ${T.border}`,
                  textDecoration: 'none', color: T.text,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: '#FF000015', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PlayCircle size={20} color="#FF0000" />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{l.title}</span>
                  <ExternalLink size={14} color={T.muted} />
                </a>
              )) : (
                <div style={{
                  padding: '32px 20px', borderRadius: 16, textAlign: 'center',
                  background: T.surface, border: `1px solid ${T.border}`,
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Lessons coming soon</div>
                  <div style={{ fontSize: 13, color: T.sub }}>We're curating the best lessons for {subjectName}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === 'practice' && (
          <div style={{
            padding: '32px 20px', borderRadius: 16, textAlign: 'center',
            background: T.surface, border: `1px solid ${T.border}`,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✏️</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Practice questions coming soon</div>
            <div style={{ fontSize: 13, color: T.sub, marginBottom: 20 }}>
              We're loading past JAMB questions for {subjectName}
            </div>
            <a href="/solver" style={{
              display: 'inline-block', padding: '12px 24px',
              borderRadius: 50, background: C.primary, color: '#fff',
              fontWeight: 700, fontSize: 14, textDecoration: 'none',
            }}>
              Try the Solver instead →
            </a>
          </div>
        )}
      </div>

      <BottomNav darkMode={dark} />
    </div>
  );
}

export default function Questions() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <QuestionsContent />
    </Suspense>
  );
}
