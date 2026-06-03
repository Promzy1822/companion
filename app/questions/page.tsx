'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from "../components/Layout";

function QuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subject = searchParams.get('subject') || 'english';
  const mode = searchParams.get('mode') || 'practice';
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    setDark(saved);
  }, []);

  const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);

  return (
    <Layout title={`${subjectName} — ${mode === 'learn' ? 'Lessons' : 'Practice'}`} darkMode={dark} onToggleDark={setDark} showNavbar showBottomNav contentWidth="standard">
      <div className="flex-1 w-full overflow-y-auto p-6 pt-10 pb-6"
           style={{ paddingTop: "80px", paddingBottom: "20px" }}>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center hover:bg-surface3 transition-colors"
          >
            <ArrowLeft size={20} color={dark ? '#E4E6EB' : '#050505'} strokeWidth={1.8} />
          </button>
          <div className="font-bold text-2xl text-tracking-tight">
            Com<span className="text-primary">panion</span>
          </div>
        </div>

        <div className="mb-4">
          <h1 className="text-3xl font-bold text-center mb-2">
            {subjectName} — <span className="text-primary">{mode === 'learn' ? 'Lessons' : 'Practice'}</span>
          </h1>
          <p className="text-center text-muted">
            {mode === 'learn' ? 'Watch video lessons for this subject' : 'Answer past JAMB questions'}
          </p>
        </div>

        <div className="text-center">
          <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            {mode === 'learn' ? '🎬' : '✏️'}
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {mode === 'learn' ? 'Lessons coming soon' : 'Questions coming soon'}
          </h2>
          <p className="text-muted">
            {mode === 'learn'
              ? 'We are curating the best YouTube lessons for ' + subjectName
              : 'We are loading past JAMB questions for ' + subjectName}
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default function Questions() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuestionsContent />
    </Suspense>
  );
}