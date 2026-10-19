"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Field, Section } from "@/components/ui";
import { Badge, VerifiedMentorBadge, VouchedBadge } from "@/components/badges";
import { AvailabilityEditor, MODALITIES, PROGRAMS, SubjectPicker, validSlots } from "@/components/form-bits";
import { saveAvailability, saveSubjects } from "@/lib/data";
import { YEAR_LEVELS, errMsg } from "@/lib/utils";
import type { Profile, Slot } from "@/lib/types";

export function ProfileForm({ profile, verified, subjects: s0, slots: a0 }: { profile: Profile; verified: boolean; subjects: number[]; slots: Slot[] }) {
  const router = useRouter();
  const isMentor = profile.role === "mentor";
  const [f, setF] = useState({
    year_level: profile.year_level ?? "",
    program: profile.program ?? "",
    preferred_schedule: profile.preferred_schedule ?? "",
    modality: profile.modality ?? MODALITIES[2],
    about: profile.about ?? "",
    interests: profile.interests ?? "",
    mentoring_format: profile.mentoring_format ?? "both",
    intro: profile.intro ?? "",
    academic_experience: profile.academic_experience ?? "",
    skills_achievements: profile.skills_achievements ?? "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const [subjects, setSubjects] = useState(s0);
  const [slots, setSlots] = useState(a0);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!subjects.length) return toast.error("Choose at least one subject.");
    if (!validSlots(slots)) return toast.error("Add at least one valid availability slot.");
    setBusy(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          year_level: f.year_level || null,
          program: f.program.trim() || null,
          preferred_schedule: f.preferred_schedule.trim() || null,
          modality: f.modality,
          about: f.about.trim() || null,
          interests: f.interests.trim() || null,
          ...(isMentor
            ? { mentoring_format: f.mentoring_format, intro: f.intro.trim() || null, academic_experience: f.academic_experience.trim() || null, skills_achievements: f.skills_achievements.trim() || null }
            : {}),
        })
        .eq("id", profile.id);
      if (error) throw error;
      await saveSubjects(supabase, profile.id, subjects);
      await saveAvailability(supabase, profile.id, slots);
      toast.success("Profile saved");
      router.refresh();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-3xl">
      <Card className="space-y-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-brand-700">{isMentor ? "Mentor Profile Details" : "Mentee Profile Details"}</h2>
          <div className="flex flex-wrap gap-2">
            {isMentor && verified ? <VerifiedMentorBadge /> : null}
            {isMentor ? <VouchedBadge by={profile.vouched_by} /> : null}
            {!isMentor ? <Badge color={verified ? "teal" : "amber"}>{verified ? "Verified mentee" : "Pending verification"}</Badge> : null}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name (Locked)"><input className="field" value={profile.full_name} disabled /></Field>
          <Field label="Adamson Email (Locked)"><input className="field" value={profile.email} disabled /></Field>
          <Field label="Academic Program" htmlFor="p">
            <input id="p" list="programs" className="field" value={f.program} onChange={set("program")} />
            <datalist id="programs">{PROGRAMS.map((p) => <option key={p} value={p} />)}</datalist>
          </Field>
          <Field label="Year Level" htmlFor="y">
            <select id="y" className="field" value={f.year_level} onChange={set("year_level")}>
              <option value="">Choose…</option>
              {YEAR_LEVELS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </Field>
        </div>

        <Section title={isMentor ? "Verified Supported Courses" : "Subjects I Need Help With"}>
          <SubjectPicker value={subjects} onChange={setSubjects} />
        </Section>

        <Section title="Weekly Availability Block">
          <Field label="Availability"><AvailabilityEditor value={slots} onChange={setSlots} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preferred Study Schedule" htmlFor="ps"><input id="ps" className="field" value={f.preferred_schedule} onChange={set("preferred_schedule")} /></Field>
            <Field label={isMentor ? "Preferred Mentoring Modality" : "Preferred Modality"} htmlFor="mo">
              <select id="mo" className="field" value={f.modality} onChange={set("modality")}>{MODALITIES.map((m) => <option key={m}>{m}</option>)}</select>
            </Field>
            {isMentor ? (
              <Field label="Mentoring Format" htmlFor="mf">
                <select id="mf" className="field" value={f.mentoring_format} onChange={set("mentoring_format")}>
                  <option value="both">One-on-one or group</option>
                  <option value="one_on_one">One-on-one only</option>
                  <option value="group">Group only</option>
                </select>
              </Field>
            ) : (
              <Field label="Academic Interests / Goals" htmlFor="ai"><input id="ai" className="field" value={f.interests} onChange={set("interests")} /></Field>
            )}
          </div>
          {isMentor && <Field label="Introduction for Mentor Profiles" htmlFor="in"><textarea id="in" rows={3} className="field" value={f.intro} onChange={set("intro")} /></Field>}
          <Field label="About Me (Bio)" htmlFor="ab"><textarea id="ab" rows={3} className="field" value={f.about} onChange={set("about")} /></Field>
          {isMentor && (
            <>
              <Field label="Academic Experience" htmlFor="ae"><textarea id="ae" rows={3} className="field" value={f.academic_experience} onChange={set("academic_experience")} /></Field>
              <Field label="Experience & Skills" htmlFor="sa"><textarea id="sa" rows={2} className="field" value={f.skills_achievements} onChange={set("skills_achievements")} /></Field>
              <Field label="Academic Interests" htmlFor="ai2"><input id="ai2" className="field" value={f.interests} onChange={set("interests")} /></Field>
            </>
          )}
        </Section>
        <div className="flex justify-center pt-2">
          <Button type="submit" size="lg" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
        </div>
      </Card>
    </form>
  );
}
