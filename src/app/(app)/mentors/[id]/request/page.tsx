import { notFound } from "next/navigation";
import { requireVerified } from "@/lib/auth";
import { subjectsFor } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { RequestForm } from "./request-form";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Partnership request" };

export default async function RequestPage({ params, searchParams }: { params: { id: string }; searchParams: { subject?: string } }) {
  const { supabase, profile } = await requireVerified("mentee");
  const { data: m } = await supabase.from("profiles").select("*").eq("id", params.id).eq("role", "mentor").maybeSingle<Profile>();
  if (!m) notFound();
  const subs = await subjectsFor(supabase, [m.id, profile.id]);
  const mentorSubs = subs[m.id] ?? [];
  const mine = subs[profile.id] ?? [];
  const pre = Number(searchParams.subject) || mine.find((s) => mentorSubs.includes(s)) || mentorSubs[0];
  return (
    <>
      <PageHeader title="Partnership Request" description="Send a study partnership request to a verified mentor" />
      <RequestForm mentor={{ id: m.id, name: m.full_name, program: m.program }} subjects={mentorSubs} initial={pre} />
    </>
  );
}
