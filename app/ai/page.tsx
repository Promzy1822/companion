'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const suggestions = [
  "What topics should I focus on for JAMB English?",
  "What is the cutoff mark for Medicine at UI?",
  "Explain the difference between mitosis and meiosis",
  "What are the requirements for Law at UNILAG?",
  "Give me tips to score 300+ in JAMB",
];

export default function AI() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') setDark(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: 'user', text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages
        })
      });

      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', text: data.reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', text: 'Something went wrong. Please try again.' }]);
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: dark ? '#0f0f0f' : '#faf7f2',
      color: dark ? '#f0f0f0' : '#1a1208',
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: `1px solid ${dark ? '#2a2a2a' : '#ede8df'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: dark ? '#0f0f0f' : '#faf7f2',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none',
          fontSize: '20px', cursor: 'pointer',
          color: dark ? '#f0f0f0' : '#1a1208'
        }}>←</button>
        <div>
          <div style={{fontSize: '16px', fontWeight: 800}}>
            🤖 Ask <span style={{color: '#e07000'}}>Companion AI</span>
          </div>
          <div style={{fontSize: '11px', color: dark ? '#888' : '#b09060'}}>
            Your JAMB study assistant
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex: 1, padding: '20px', overflowY: 'auto'}}>

        {messages.length === 0 && (
          <div>
            <div style={{
              textAlign: 'center',
              marginBottom: '28px'
            }}>
              <div style={{fontSize: '48px', marginBottom: '12px'}}>🤖</div>
              <div style={{fontSize: '18px', fontWeight: 800, marginBottom: '6px'}}>
                Hi! I am Companion AI
              </div>
              <div style={{fontSize: '13px', color: dark ? '#888' : '#b09060'}}>
                Ask me anything about JAMB, admissions, or your subjects
              </div>
            </div>

            <div style={{fontSize: '12px', color: dark ? '#888' : '#b09060', marginBottom: '12px', fontWeight: 600}}>
              SUGGESTED QUESTIONS
            </div>
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => sendMessage(s)} style={{
                background: dark ? '#1a1a1a' : '#ffffff',
                border: `1px solid ${dark ? '#2a2a2a' : '#ede8df'}`,
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                color: dark ? '#f0f0f0' : '#1a1208'
              }}>
                {s}
              </div>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '12px'
          }}>
            <div style={{
              maxWidth: '80%',
              background: msg.role === 'user'
                ? '#e07000'
                : dark ? '#1a1a1a' : '#ffffff',
              color: msg.role === 'user'
                ? '#ffffff'
                : dark ? '#f0f0f0' : '#1a1208',
              border: msg.role === 'user'
                ? 'none'
                : `1px solid ${dark ? '#2a2a2a' : '#ede8df'}`,
              borderRadius: msg.role === 'user'
                ? '18px 18px 4px 18px'
                : '18px 18px 18px 4px',
              padding: '12px 16px',
              fontSize: '14px',
              lineHeight: 1.5
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{display: 'flex', justifyContent: 'flex-start', marginBottom: '12px'}}>
            <div style={{
              background: dark ? '#1a1a1a' : '#ffffff',
              border: `1px solid ${dark ? '#2a2a2a' : '#ede8df'}`,
              borderRadius: '18px 18px 18px 4px',
              padding: '12px 16px',
              fontSize: '14px',
              color: dark ? '#888' : '#b09060'
            }}>
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 20px',
        borderTop: `1px solid ${dark ? '#2a2a2a' : '#ede8df'}`,
        background: dark ? '#0f0f0f' : '#faf7f2',
        display: 'flex',
        gap: '10px',
        position: 'sticky',
        bottom: 0
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask anything about JAMB..."
          style={{
            flex: 1,
            background: dark ? '#1a1a1a' : '#ffffff',
            border: `1px solid ${dark ? '#2a2a2a' : '#ede8df'}`,
            borderRadius: '24px',
            padding: '12px 16px',
            fontSize: '14px',
            color: dark ? '#f0f0f0' : '#1a1208',
            outline: 'none'
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading}
          style={{
            background: '#e07000',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            fontSize: '18px',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
