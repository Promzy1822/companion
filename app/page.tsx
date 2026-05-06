'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('companion_user');
    if (u) setUser(JSON.parse(u));
    
    const dm = localStorage.getItem('darkMode') === 'true';
    setDarkMode(dm);
    if (dm) document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Companion</h1>
            <p className="text-orange-100 mt-1">Good afternoon, {user?.name || 'Student'} 👋</p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Target: 315 pts</div>
            <div className="text-xs opacity-75">OAU Ile-Ife</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Access */}
        <div>
          <h2 className="text-lg font-semibold mb-3 px-1">Quick Access</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Ask AI", icon: "🤖", desc: "24/7 tutor" },
              { label: "Learn", icon: "📚", desc: "Video lessons" },
              { label: "Practice", icon: "✍️", desc: "Past questions" },
              { label: "Mock Exam", icon: "⏰", desc: "Timed test" },
              { label: "Solver", icon: "🧠", desc: "AI explains" },
              { label: "Study Plan", icon: "📅", desc: "AI generated" },
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center shadow-sm border border-zinc-100 dark:border-zinc-800">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-medium text-sm">{item.label}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Study Plan */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-green-100 dark:border-green-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-green-600">📍</span>
              <h3 className="font-semibold">Today's Study Plan</h3>
            </div>
            <span className="text-green-600 text-sm font-medium">✓ Done!</span>
          </div>
          <div className="space-y-3">
            <div className="bg-orange-50 dark:bg-zinc-800 p-4 rounded-2xl">
              <div className="font-medium">Core Topic 1 • Chemistry</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">2 hours study session</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
