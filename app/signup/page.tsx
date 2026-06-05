"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INSTITUTIONS = ["University of Lagos","University of Ibadan","OAU Ile-Ife","UNILORIN","UNIBEN","ABU Zaria","University of Nigeria Nsukka","LASU","UNIPORT","FUTO","UNILAG","FUNAAB","Other"];
const COURSES = ["Medicine & Surgery","Law","Engineering","Computer Science","Pharmacy","Accounting","Mass Communication","Economics","Agriculture","Education","Architecture","Nursing","Other"];
const SUBJECTS = ["English Language","Mathematics","Physics","Chemistry","Biology","Government","Economics","Literature in English","Geography","CRS","IRS","Commerce","Agricultural Science","Further Mathematics"];

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", institution: "", course: "",
    subjects: [] as string[], target: "250", deadline: "", selfRating: "2"
  });

  const update = (k: string, v: string | string[]) => setForm(p => ({ ...p, [k]: v }));

  const toggleSubject = (s: string) => {
    const cur = form.subjects;
    if (cur.includes(s)) {
      update("subjects", cur.filter(x => x !== s));
    } else {
      if (cur.length >= 4) {
        setError("You can only select 4 subjects");
        setTimeout(() => setError(""), 2000);
        return;
      }
      update("subjects", [...cur, s]);
    }
  };

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!form.name.trim()) { setError("Enter your name"); return; }
      if (!form.email.trim() || !form.email.includes("@")) { setError("Enter a valid email"); return; }
      if (!form.institution) { setError("Select your institution"); return; }
      if (!form.course) { setError("Select your course"); return; }
    }
    if (step === 2) {
      if (form.subjects.length < 4) { setError("Select exactly 4 subjects"); return; }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = () => {
    if (!form.deadline) { setError("Select your exam date"); return; }
    localStorage.setItem("companion_user", JSON.stringify(form));
    router.push("/");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: "12px",
    border: "1.5px solid #e8e8e8", fontSize: "14px", outline: "none",
    backgroundColor: "#fafafa", boxSizing: "border-box", color: "#1a1a1a"
  };
  const labelStyle: React.CSSProperties = { fontSize: "13px", fontWeight: "600", color: "#555", marginBottom: "6px", display: "block" };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#fff", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg, #7c2d12, #c2410c, #ea580c)", padding: "20px 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <Link href="/landing" style={{ color: "#fff", textDecoration: "none", fontSize: "22px" }}>←</Link>
          <div>
            <div style={{ color: "#fff", fontWeight: "700", fontSize: "16px" }}>Create Account</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>Step {step} of 3</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ flex: 1, height: "4px", borderRadius: "2px", backgroundColor: s <= step ? "#fff" : "rgba(255,255,255,0.3)", transition: "all 0.3s" }} />
          ))}
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 4px", color: "#1a1a1a" }}>Personal Info</h2>
              <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>Let's personalise your experience</p>
            </div>
            <div><label style={labelStyle}>Full Name</label><input style={inputStyle} placeholder="e.g. Kelechi Promise" value={form.name} onChange={e => update("name", e.target.value)} /></div>
            <div><label style={labelStyle}>Email Address</label><input style={inputStyle} type="email" placeholder="e.g. promise@gmail.com" value={form.email} onChange={e => update("email", e.target.value)} /></div>
            <div>
              <label style={labelStyle}>Target Institution</label>
              <select style={inputStyle} value={form.institution} onChange={e => update("institution", e.target.value)}>
                <option value="">Select institution...</option>
                {INSTITUTIONS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Desired Course</label>
              <select style={inputStyle} value={form.course} onChange={e => update("course", e.target.value)}>
                <option value="">Select course...</option>
                {COURSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 4px", color: "#1a1a1a" }}>Your JAMB Subjects</h2>
              <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>Select exactly 4 subjects (English is compulsory)</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {SUBJECTS.map(s => {
                const isEnglish = s === "English Language";
                const selected = form.subjects.includes(s);
                return (
                  <button key={s} onClick={() => !isEnglish && toggleSubject(s)} style={{
                    padding: "10px 14px", borderRadius: "20px", fontSize: "13px",
                    cursor: isEnglish ? "default" : "pointer",
                    border: (selected || isEnglish) ? "2px solid #ea580c" : "1.5px solid #e0e0e0",
                    backgroundColor: (selected || isEnglish) ? "#fff8f5" : "#fff",
                    color: (selected || isEnglish) ? "#ea580c" : "#555",
                    fontWeight: (selected || isEnglish) ? "700" : "400",
                    opacity: isEnglish ? 0.7 : 1
                  }}>
                    {s}{isEnglish ? " ✓" : ""}
                  </button>
                );
              })}
            </div>
            <div style={{ padding: "10px 14px", borderRadius: "12px", backgroundColor: "#fff8f5", border: "1px solid #fed7aa" }}>
              <span style={{ fontSize: "13px", color: "#ea580c", fontWeight: "600" }}>
                {form.subjects.length}/4 selected {form.subjects.length === 4 ? "✓ Complete!" : `(need ${4 - form.subjects.length} more)`}
              </span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 4px", color: "#1a1a1a" }}>Your Goals</h2>
              <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>Help us create your study plan</p>
            </div>
            <div>
              <label style={labelStyle}>Target JAMB Score: <span style={{ color: "#ea580c", fontSize: "16px", fontWeight: "800" }}>{form.target}</span></label>
              <input type="range" min="180" max="400" step="5" value={form.target} onChange={e => update("target", e.target.value)} style={{ width: "100%", accentColor: "#ea580c" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#999" }}><span>180 (Min)</span><span>300 (Good)</span><span>400 (Max)</span></div>
            </div>
            <div><label style={labelStyle}>JAMB Exam Date</label><input type="date" style={inputStyle} value={form.deadline} onChange={e => update("deadline", e.target.value)} /></div>
            <div>
              <label style={labelStyle}>How prepared are you right now?</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[["1","😰 Not ready at all"],["2","😐 Just started"],["3","😊 Making progress"],["4","🔥 Almost ready"]].map(([v, label]) => (
                  <button key={v} onClick={() => update("selfRating", v)} style={{
                    padding: "12px 8px", borderRadius: "12px", fontSize: "12px", cursor: "pointer",
                    border: form.selfRating === v ? "2px solid #ea580c" : "1.5px solid #e0e0e0",
                    backgroundColor: form.selfRating === v ? "#fff8f5" : "#fff",
                    color: form.selfRating === v ? "#ea580c" : "#555",
                    fontWeight: form.selfRating === v ? "700" : "400", textAlign: "center"
                  }}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: "12px", padding: "10px 14px", backgroundColor: "#fff0f0", border: "1px solid #ffcccc", borderRadius: "10px", color: "#cc0000", fontSize: "13px" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s-1)} style={{ flex: 1, padding: "14px", borderRadius: "30px", border: "1.5px solid #ea580c", backgroundColor: "#fff", color: "#ea580c", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}>← Back</button>
          )}
          <button onClick={step < 3 ? nextStep : handleSubmit} style={{
            flex: 2, padding: "14px", borderRadius: "30px", border: "none",
            background: "linear-gradient(135deg, #c2410c, #ea580c)",
            color: "#fff", fontWeight: "700", fontSize: "15px", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(234,88,12,0.35)"
          }}>{step < 3 ? "Continue →" : "🚀 Start Studying!"}</button>
        </div>
        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#999" }}>
          Already have an account? <Link href="/" style={{ color: "#ea580c", textDecoration: "none", fontWeight: "600" }}>Go to app</Link>
        </p>
      </div>
    </div>
  );
}
