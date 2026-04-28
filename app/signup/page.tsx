"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INSTITUTIONS = ["University of Lagos", "University of Ibadan", "OAU Ile-Ife", "UNILORIN", "UNIBEN", "ABU Zaria", "University of Nigeria Nsukka", "LASU", "UNIPORT", "Other"];
const COURSES = ["Medicine & Surgery", "Law", "Engineering", "Computer Science", "Pharmacy", "Accounting", "Mass Communication", "Economics", "Agriculture", "Education", "Other"];
const SUBJECTS = ["English", "Mathematics", "Physics", "Chemistry", "Biology", "Government", "Economics", "Literature", "Geography", "CRS/IRS"];

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", institution: "", course: "",
    subjects: [] as string[], target: "250", deadline: "", selfRating: "3"
  });

  const update = (k: string, v: string | string[]) => setForm(p => ({ ...p, [k]: v }));

  const toggleSubject = (s: string) => {
    const cur = form.subjects;
    update("subjects", cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]);
  };

  const handleSubmit = () => {
    localStorage.setItem("companion_user", JSON.stringify(form));
    router.push("/");
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: "12px",
    border: "1.5px solid #f0f0f0", fontSize: "14px", outline: "none",
    backgroundColor: "#fafafa", boxSizing: "border-box" as const
  };

  const labelStyle = { fontSize: "13px", fontWeight: "600", color: "#555", marginBottom: "6px", display: "block" };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#fff", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg, #c2410c, #ea580c)", padding: "20px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href="/landing" style={{ color: "#fff", textDecoration: "none", fontSize: "20px" }}>←</Link>
        <div>
          <div style={{ color: "#fff", fontWeight: "700", fontSize: "16px" }}>Create Account</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>Step {step} of 3</div>
        </div>
      </div>

      <div style={{ padding: "8px 24px", display: "flex", gap: "8px" }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ flex: 1, height: "4px", borderRadius: "2px", backgroundColor: s <= step ? "#ea580c" : "#f0f0f0", transition: "all 0.3s" }} />
        ))}
      </div>

      <div style={{ padding: "24px" }}>
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 4px", color: "#1a1a1a" }}>Personal Info</h2>
            <p style={{ fontSize: "13px", color: "#999", margin: "0 0 8px" }}>Tell us about yourself</p>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input style={inputStyle} placeholder="e.g. Kelechi Promise" value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input style={inputStyle} type="email" placeholder="e.g. promise@gmail.com" value={form.email} onChange={e => update("email", e.target.value)} />
            </div>
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
            <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 4px", color: "#1a1a1a" }}>Your JAMB Subjects</h2>
            <p style={{ fontSize: "13px", color: "#999", margin: "0 0 8px" }}>Select your 4 JAMB subjects</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {SUBJECTS.map(s => (
                <button key={s} onClick={() => toggleSubject(s)} style={{
                  padding: "10px 16px", borderRadius: "20px", fontSize: "13px", cursor: "pointer",
                  border: form.subjects.includes(s) ? "2px solid #ea580c" : "1.5px solid #e0e0e0",
                  backgroundColor: form.subjects.includes(s) ? "#fff8f5" : "#fff",
                  color: form.subjects.includes(s) ? "#ea580c" : "#555",
                  fontWeight: form.subjects.includes(s) ? "700" : "400"
                }}>{s}</button>
              ))}
            </div>
            <p style={{ fontSize: "12px", color: "#ea580c" }}>{form.subjects.length}/4 selected</p>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 4px", color: "#1a1a1a" }}>Your Goals</h2>
            <p style={{ fontSize: "13px", color: "#999", margin: "0 0 8px" }}>Help us personalise your experience</p>
            <div>
              <label style={labelStyle}>Target JAMB Score: <span style={{ color: "#ea580c" }}>{form.target}</span></label>
              <input type="range" min="180" max="400" step="5" value={form.target}
                onChange={e => update("target", e.target.value)}
                style={{ width: "100%", accentColor: "#ea580c" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#999" }}>
                <span>180</span><span>400</span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>JAMB Exam Date</label>
              <input type="date" style={inputStyle} value={form.deadline} onChange={e => update("deadline", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>How prepared are you right now?</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {["😰 Not ready", "😐 Average", "😊 Good", "🔥 Very good"].map((r, i) => (
                  <button key={i} onClick={() => update("selfRating", String(i+1))} style={{
                    flex: 1, padding: "10px 4px", borderRadius: "12px", fontSize: "11px", cursor: "pointer",
                    border: form.selfRating === String(i+1) ? "2px solid #ea580c" : "1.5px solid #e0e0e0",
                    backgroundColor: form.selfRating === String(i+1) ? "#fff8f5" : "#fff",
                    color: form.selfRating === String(i+1) ? "#ea580c" : "#555"
                  }}>{r}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s-1)} style={{
              flex: 1, padding: "14px", borderRadius: "30px", border: "1.5px solid #ea580c",
              backgroundColor: "#fff", color: "#ea580c", fontWeight: "700", fontSize: "15px", cursor: "pointer"
            }}>← Back</button>
          )}
          <button onClick={() => step < 3 ? setStep(s => s+1) : handleSubmit()} style={{
            flex: 2, padding: "14px", borderRadius: "30px", border: "none",
            background: "linear-gradient(135deg, #c2410c, #ea580c)",
            color: "#fff", fontWeight: "700", fontSize: "15px", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(234,88,12,0.4)"
          }}>{step < 3 ? "Continue →" : "🚀 Start Studying!"}</button>
        </div>

        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#999" }}>
          Already have an account? <Link href="/" style={{ color: "#ea580c", textDecoration: "none", fontWeight: "600" }}>Go to app</Link>
        </p>
      </div>
    </div>
  );
}
