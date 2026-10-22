import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { requireVerified } from "@/lib/auth";
import { slotsFor, subjectsFor } from "@/lib/queries";
import { Button, Card, Empty, Field, PageHeader } from "@/components/ui";
import { VerifiedMentorBadge, VouchedBadge } from "@/components/badges";
import { daysText, timeText } from "@/components/avail";
import { DAYS, FORMAT_LABEL, SUBJECTS, YEAR_LEVELS, subjectName } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Find a mentor" };

type SP = { subject?: string; year?: string; format?: string; day?: string; any?: string };

export default async function FindPage({ searchParams }: { searchParams: SP }) {
  const { supabase, profile } = await requireVerified("mentee");
  const { data: mySubs } = await supabase.from("user_subjects").select("subject_id").eq("user_id", profile.id);
  const subject = searchParams.subject ?? String(mySubs?.[0]?.subject_id ?? "");
  const matchMine = searchParams.any !== "1";

  const { data, error } = await supabase.rpc("search_mentors", {
    p_subject: subject ? Number(subject) : null,
    p_year: searchParams.year || null,
    p_format: searchParams.format || null,
    p_day: searchParams.day ? Number(searchParams.day) : null,
    p_match_mine: matchMine,
  });
  const mentors = (data ?? []) as Profile[];
  const ids = mentors.map((m) => m.id);
  const [slots, subs] = await Promise.all([slotsFor(supabase, ids), subjectsFor(supabase, ids)]);

  return (
    <>
      <PageHeader title="Find a mentor" description="Verified mentors for your subject. By default you only see mentors whose free hours overlap yours." />
      <Card className="p-5">
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
          <Field label="Subject" htmlFor="s">
            <select id="s" name="subject" defaultValue={subject} className="field">
              <option value="">All subjects</option>
              {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Year level" htmlFor="y">
            <select id="y" name="year" defaultValue={searchParams.year ?? ""} className="field">
              <option value="">All year levels</option>
              {YEAR_LEVELS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </Field>
          <Field label="Format" htmlFor="f">
            <select id="f" name="format" defaultValue={searchParams.format ?? ""} className="field">
              <option value="">Any format</option>
              <option value="one_on_one">One-on-one</option>
              <option value="group">Group</option>
            </select>
          </Field>
          <Field label="Available on" htmlFor="d">
            <select id="d" name="day" defaultValue={searchParams.day ?? ""} className="field">
              <option value="">Any day</option>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </Field>
          <Button type="submit" className="h-[38px]">Search</Button>
          <label className="flex items-center gap-2 text-xs text-ink sm:col-span-2 lg:col-span-5">
            <input type="checkbox" name="any" value="1" defaultChecked={!matchMine} className="size-4 accent-brand-600" />
            Include mentors whose schedule doesn't overlap mine
          </label>
        </form>
      </Card>

      <p className="eyebrow mb-3 mt-6" aria-live="polite">{mentors.length} verified {mentors.length === 1 ? "mentor" : "mentors"} found</p>
      {error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      {mentors.length ? (
        <div className="space-y-3">
          {mentors.map((m) => (
            <Card key={m.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-brand-800">{m.full_name}</h2>
                  <VerifiedMentorBadge />
                  <VouchedBadge by={m.vouched_by} />
                </div>
                <p className="text-xs text-muted">{[m.year_level, m.program, FORMAT_LABEL[m.mentoring_format ?? "both"]].filter(Boolean).join(", ")}</p>
                <p className="eyebrow mt-3">Subjects</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(subs[m.id] ?? []).map((id) => <span key={id} className="chip">{subjectName(id)}</span>)}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink">
                  <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-muted" aria-hidden /><span className="sr-only">Free on </span>{daysText(slots[m.id])}</span>
                  <span className="flex items-center gap-1.5"><Clock className="size-3.5 text-muted" aria-hidden />{timeText(slots[m.id])}</span>
                  {m.preferred_schedule ? <span className="text-muted">Prefers {m.preferred_schedule}</span> : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 md:flex-col [&>*]:flex-1 md:[&>*]:flex-none">
                <Button asChild variant="primary"><Link href={`/mentors/${m.id}/request${subject ? `?subject=${subject}` : ""}`}>Request partnership</Link></Button>
                <Button asChild variant="secondary"><Link href={`/mentors/${m.id}`}>View profile</Link></Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty title="No mentors match these filters">
          Try another subject or day{matchMine ? ", or include mentors whose schedule doesn't overlap yours" : ""}. You can also widen your availability in your profile.
        </Empty>
      )}
    </>
  );
}
