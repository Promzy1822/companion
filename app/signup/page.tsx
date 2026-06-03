"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../components/Layout";

const INSTITUTIONS = ["University of Lagos","University of Ibadan","OAU Ile-Ife","UNILORIN","UNIBEN","ABU Zaria","University of Nigeria Nsukka","LASU","UNIPORT","FUTO","FUNAAB","Other"];
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
    width: "100%", padding: "10px 12px", borderRadius: "8px",
    border: "1.5px solid #e8e8e8", fontSize: "14px", outline: "none",
    backgroundColor: "#fafafa", boxSizing: "border-box", color: "#1a1a1a"
  };
  const labelStyle: React.CSSProperties = { fontSize: "13px", fontWeight: "600", color: "#555", marginBottom: "6px", display: "block" };

  return (
    <Layout title="Signup">
      <div className="px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/landing" className="text-xl font-bold text-primary/70 hover:text-primary transition-colors">
              ←
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-center">Create Account</h2>
              <p className="text-sm text-center text-muted">Step {step} of 3</p>
            </div>
          </div>

          <div className="flex gap-2">
            {[1,2,3].map(s => (
              <div key={s} className={`flex-1 h-0.5 bg-${s <= step ? 'primary' : 'border-border/20'}
                       rounded transition-colors ${s < step ? 'opacity-40' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Personal Info</h2>
                <p className="text-sm text-muted">Let's personalise your experience</p>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted mb-1">Full Name</label>
                <input
                  placeholder="e.g. Kelechi Promise"
                  value={form.name}
                  onChange={e => update("name", e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border/20 bg-gray-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. promise@gmail.com"
                  value={form.email}
                  onChange={e => update("email", e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border/20 bg-gray-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted mb-1">Target Institution</label>
                <select
                  value={form.institution}
                  onChange={e => update("institution", e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border/20 bg-gray-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select institution...</option>
                  {INSTITUTIONS.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted mb-1">Desired Course</label>
                <select
                  value={form.course}
                  onChange={e => update("course", e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border/20 bg-gray-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select course...</option>
                  {COURSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Your JAMB Subjects</h2>
                <p className="text-sm text-muted">Select exactly 4 subjects (English is compulsory)</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {SUBJECTS.map(s => {
                  const isEnglish = s === "English Language";
                  const selected = form.subjects.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => !isEnglish && toggleSubject(s)}
                      className={`px-3 py-2 rounded-md font-medium
                               ${selected || isEnglish ? 'bg-primary text-white' : 'border-border/20 hover:bg-surface2 text-gray-800'}
                               ${isEnglish ? 'opacity-70' : ''}
                               transition-colors`}
                    >
                      {s}{isEnglish ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 p-3 rounded bg-primary/5 text-center">
                <span className="font-medium text-primary">
                  {form.subjects.length}/4 selected {form.subjects.length === 4 ? "✓ Complete!" : `(need ${4 - form.subjects.length} more)`}
                </span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Your Goals</h2>
                <p className="text-sm text-muted">Help us create your study plan</p>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted mb-1">Target JAMB Score: <span className="font-semibold">{form.target}</span></label>
                <input
                  type="range"
                  min="180" max="400" step="5"
                  value={form.target}
                  onChange={e => update("target", e.target.value)}
                  className="w-full"
                />
                <div className="mt-2 flex justify-between text-sm text-muted">
                  <span>180 (Min)</span>
                  <span>300 (Good)</span>
                  <span>400 (Max)</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted mb-1">JAMB Exam Date</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => update("deadline", e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border/20 bg-gray-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted mb-1">How prepared are you right now?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["1","😰 Not ready at all"],
                    ["2","😐 Just started"],
                    ["3","😊 Making progress"],
                    ["4","🔥 Almost ready"]
                  ].map(([v, label]) => (
                    <button
                      key={v}
                      onClick={() => update("selfRating", v)}
                      className={`px-3 py-2 rounded-md font-medium
                               ${form.selfRating === v ? 'bg-primary text-white' : 'border-border/20 hover:bg-surface2 text-gray-800'}
                               transition-colors`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded bg-danger/10 border border-danger/20 text-danger">
              ⚠️ {error}
            </div>
          )}

          <div className="mt-6 flex justify-between">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s-1)}
                className="px-3 py-2 rounded border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              onClick={step < 3 ? nextStep : handleSubmit}
              className="px-4 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              {step < 3 ? "Continue →" : "🚀 Start Studying!"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account? <Link href="/" className="text-primary font-medium hover:text-primary/90 transition-colors">Go to app</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}