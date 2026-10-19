"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Section } from "@/components/ui";
import { AvailabilityEditor, FilePick, MODALITIES, PROGRAMS, SubjectPicker, validSlots } from "@/components/form-bits";
import { saveAvailability, saveSubjects, uploadDoc } from "@/lib/data";
import { YEAR_LEVELS, cn, errMsg } from "@/lib/utils";
import type { Slot } from "@/lib/types";

type Role = "mentee" | "mentor";

export function SignupWizard({ role }: { role: Role }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState({
    full_name: "", email: "", password: "", confirm: "",
    year_level: "", program: "", preferred_schedule: "", about: "", interests: "", modality: MODALITIES[2],
    mentoring_format: "both", intro: "", academic_experience: "", skills_achievements: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const [subjects, setSubjects] = useState<number[]>([]);
  const [slots, setSlots] = useState<Slot[]>([{ day: 1, start_time: "14:00", end_time: "17:00" }]);
  const [coe, setCoe] = useState<File | null>(null);
  const [sid, setSid] = useState<File | null>(null);
  const [record, setRecord] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);

  function checkProfile(): string | null {
    if (!f.full_name.trim()) return "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return "Enter a valid email address.";
    if (f.password.length < 8) return "Use at least 8 characters for your password.";
    if (f.password !== f.confirm) return "The passwords don't match.";
    if (!f.program.trim()) return "Enter your academic program.";
    if (!f.year_level) return "Choose your year level.";
    if (!subjects.length) return role === "mentee" ? "Choose at least one subject you need help with." : "Choose at least one subject you can mentor.";
    if (!validSlots(slots)) return "Add at least one availability slot, with the end time after the start time.";
    if (role === "mentor" && !f.intro.trim()) return "Write a short introduction for your mentor profile.";
    return null;
  }
  function checkDocs(): string | null {
    if (role === "mentee" && (!coe || !sid)) return "Upload both your Certificate of Enrollment and Student ID.";
    if (role === "mentor" && (!sid || !record || !cv)) return "Upload your Student ID or COR, academic record, and CV.";
    if (role === "mentor" && !consent) return "Agree to the data privacy notice to submit your application.";
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (role === "mentor" && step === 0) {
      const v = checkProfile();
      setError(v);
      if (!v) {
        setStep(1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    const v = checkProfile() ?? checkDocs();
    if (v) return setError(v);
    setBusy(true);
    setError(null);
    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: f.email.trim().toLowerCase(),
        password: f.password,
        options: { data: { role, full_name: f.full_name.trim() } },
      });
      if (error) throw error;
      if (!data.session || !data.user) throw new Error("Your account was created, but email confirmation is turned on in Supabase. Turn it off, then log in.");
      const uid = data.user.id;
      const { error: pe } = await supabase
        .from("profiles")
        .update({
          year_level: f.year_level,
          program: f.program.trim(),
          preferred_schedule: f.preferred_schedule.trim() || null,
          about: f.about.trim() || null,
          interests: f.interests.trim() || null,
          modality: f.modality,
          ...(role === "mentor"
            ? {
                mentoring_format: f.mentoring_format,
                intro: f.intro.trim(),
                academic_experience: f.academic_experience.trim() || null,
                skills_achievements: f.skills_achievements.trim() || null,
                privacy_consent_at: new Date().toISOString(),
              }
            : {}),
        })
        .eq("id", uid);
      if (pe) throw pe;
      await saveSubjects(supabase, uid, subjects);
      await saveAvailability(supabase, uid, slots);
      if (role === "mentee") {
        await uploadDoc(supabase, uid, "coe", coe!);
        await uploadDoc(supabase, uid, "student_id", sid!);
      } else {
        await uploadDoc(supabase, uid, "student_id", sid!);
        await uploadDoc(supabase, uid, "academic_record", record!);
        await uploadDoc(supabase, uid, "cv", cv!);
      }
      router.push(role === "mentor" ? "/status" : "/dashboard");
      router.refresh();
    } catch (err) {
      const m = errMsg(err);
      setError(/already (been )?registered/i.test(m) ? "An account with this email already exists. Log in instead." : m);
      setBusy(false);
    }
  }

  const title = role === "mentee" ? "Register as a mentee" : step === 0 ? "Apply to be a mentor" : "Upload your documents";
  const sub = role === "mentee" ? "Tell us what you're studying so we can match you with the right mentor." : step === 0 ? "Tell mentees what you can help with. You'll upload proof on the next step." : "An administrator checks these before you appear in Find a Mentor.";

  return (
    <div>
      <div className="mb-8 text-center">
        {role === "mentor" ? (
          <ol className="mb-4 inline-flex items-center gap-2 text-xs font-medium">
            {["Profile", "Documents"].map((s, i) => (
              <li key={s} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1", i === step ? "bg-brand-600 text-white" : i < step ? "text-brand-700" : "text-muted")}>
                <span className={cn("grid size-4 place-items-center rounded-full text-xs", i === step ? "bg-white text-brand-700" : "bg-slate-200")}>{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-[-0.015em] text-brand-800">{title}</h1>
        <p className="mt-1 text-sm text-muted">{sub}</p>
      </div>

      <form onSubmit={submit} noValidate className="space-y-6 rounded-panel border border-line bg-white p-6 sm:p-8">
        {step === 0 && (
          <>
            <Section title={role === "mentee" ? "Your account and program" : "Your account and program"}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="name"><input id="name" name="name" className="field" placeholder="Juan Dela Cruz" value={f.full_name} onChange={set("full_name")} autoComplete="name" /></Field>
                <Field label="Adamson email" htmlFor="email"><input id="email" name="email" type="email" inputMode="email" spellCheck={false} className="field" placeholder="juan.delacruz@adamson.edu.ph" value={f.email} onChange={set("email")} autoComplete="email" /></Field>
                <Field label="Password" htmlFor="pw"><input id="pw" name="new-password" type="password" className="field" value={f.password} onChange={set("password")} autoComplete="new-password" /></Field>
                <Field label="Confirm password" htmlFor="pw2"><input id="pw2" name="confirm-password" type="password" className="field" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /></Field>
                <Field label="Academic program" htmlFor="prog" hint="Shown for reference only. It doesn't limit matching.">
                  <input id="prog" list="programs" className="field" placeholder="BS Civil Engineering…" value={f.program} onChange={set("program")} />
                  <datalist id="programs">{PROGRAMS.map((p) => <option key={p} value={p} />)}</datalist>
                </Field>
                <Field label={role === "mentor" ? "Year level" : "Year level"} htmlFor="yr">
                  <select id="yr" className="field" value={f.year_level} onChange={set("year_level")}>
                    <option value="">Choose…</option>
                    {YEAR_LEVELS.map((y) => <option key={y}>{y}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            <Section title={role === "mentee" ? "Subjects you need help with" : "Subjects you can mentor"}>
              <p className="rounded-control bg-paper px-3 py-2 text-xs text-muted">
                {role === "mentee" ? "Pick the subjects you're currently taking." : "Pick only subjects you've completed. You'll attach your grades on the next step."}
              </p>
              <SubjectPicker value={subjects} onChange={setSubjects} />
            </Section>

            <Section title={role === "mentee" ? "When you're free to study" : "Introduction and availability"}>
              {role === "mentor" && (
                <Field label="Introduction mentees will see" htmlFor="intro">
                  <textarea id="intro" rows={3} className="field" placeholder="Hello! I'm a 4th year student who topped Calculus 2…" value={f.intro} onChange={set("intro")} />
                </Field>
              )}
              <Field label={role === "mentor" ? "Weekly availability" : "Weekly availability"} hint="Weekly free times. Matching and session scheduling use these.">
                <AvailabilityEditor value={slots} onChange={setSlots} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Preferred schedule" htmlFor="pref"><input id="pref" className="field" placeholder="Mondays & Wednesdays, afternoons…" value={f.preferred_schedule} onChange={set("preferred_schedule")} /></Field>
                <Field label="Preferred modality" htmlFor="mod">
                  <select id="mod" className="field" value={f.modality} onChange={set("modality")}>{MODALITIES.map((m) => <option key={m}>{m}</option>)}</select>
                </Field>
                {role === "mentor" ? (
                  <Field label="Mentoring format" htmlFor="fmt">
                    <select id="fmt" className="field" value={f.mentoring_format} onChange={set("mentoring_format")}>
                      <option value="both">One-on-one or group</option>
                      <option value="one_on_one">One-on-one only</option>
                      <option value="group">Group only</option>
                    </select>
                  </Field>
                ) : null}
                <Field label="Academic interests or goals" htmlFor="int"><input id="int" className="field" placeholder="Passing the Calculus 2 finals…" value={f.interests} onChange={set("interests")} /></Field>
              </div>
              {role === "mentor" && (
                <>
                  <Field label="Academic experience" htmlFor="exp"><textarea id="exp" rows={3} className="field" placeholder="Grades, tutoring, org work…" value={f.academic_experience} onChange={set("academic_experience")} /></Field>
                  <Field label="Skills and achievements" htmlFor="sk"><textarea id="sk" rows={2} className="field" value={f.skills_achievements} onChange={set("skills_achievements")} /></Field>
                </>
              )}
              <Field label="About you" htmlFor="about">
                <textarea id="about" rows={3} className="field" placeholder={role === "mentee" ? "Hi, I'm Juan. I'm struggling with integration by parts and looking for a study buddy." : "A bit about you as a student."} value={f.about} onChange={set("about")} />
              </Field>
            </Section>
          </>
        )}

        {(role === "mentee" || step === 1) && (
          <Section title={role === "mentee" ? "Verification documents" : "Required documents"}>
            <p className="text-xs text-muted">Files are stored privately. Only you and Klasmeyt administrators can open them{role === "mentor" ? " (verified mentees can view your CV once you're approved)" : ""}.</p>
            {role === "mentee" ? (
              <>
                <FilePick label="1. Certificate of Enrollment (COE)" file={coe} onChange={setCoe} required />
                <FilePick label="2. Student ID" file={sid} onChange={setSid} required />
              </>
            ) : (
              <>
                <FilePick label="1. Student ID or Certificate of Registration (Proof of Enrollment)" file={sid} onChange={setSid} required />
                <FilePick label="2. Academic Record / Proof of Completed Subject (Grades)" file={record} onChange={setRecord} required hint="Grades portal screenshot or TOR. PDF, PNG, JPG (max 10MB)" />
                <FilePick label="3. Student CV / Resume" file={cv} onChange={setCv} required />
                <div className="rounded-control border border-line bg-paper p-4">
                  <p className="text-xs font-semibold text-brand-700">Data privacy notice & compliance</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    In compliance with Republic Act No. 10173 (Data Privacy Act of 2012), the credentials and documents you submit will only be
                    processed to verify your eligibility as a Klasmeyt peer mentor and to match you with mentees. They are accessible only to
                    you and Klasmeyt administrators, except your CV, which verified mentees may view. You may request access, correction, or
                    deletion of your data at any time.
                  </p>
                  <label className="mt-3 flex items-start gap-2 text-sm font-medium text-ink">
                    <input type="checkbox" className="mt-0.5 size-4 accent-brand-600" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                    I consent to the official processing of my academic documents for verification purposes.
                  </label>
                </div>
              </>
            )}
          </Section>
        )}

        {error ? <p className="rounded-control bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}

        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="flex gap-3">
            {role === "mentor" && step === 1 ? (
              <Button type="button" variant="secondary" size="lg" onClick={() => { setError(null); setStep(0); }} disabled={busy}>Back</Button>
            ) : null}
            <Button type="submit" size="lg" loading={busy}>
              {role === "mentee" ? "Create mentee account" : step === 0 ? "Continue to documents" : "Submit mentor application"}
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted">
            {role === "mentee"
              ? "An administrator verifies your COE and Student ID before you can request mentors."
              : step === 0
              ? "Step 1 of 2. You'll upload your academic proof on the next step."
              : "Step 2 of 2. Applications generally take 1–2 working days to review."}
          </p>
        </div>
      </form>
    </div>
  );
}
