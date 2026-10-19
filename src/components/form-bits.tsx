"use client";

import { Check, CheckCircle2, Plus, Trash2, Upload } from "lucide-react";
import { DAYS, SUBJECTS, cn } from "@/lib/utils";
import type { Slot } from "@/lib/types";

const SUBJECT_NOTE: Record<number, string> = {
  1: "Limits, derivatives, and their applications",
  2: "Integration techniques, series, and applications",
  3: "Mechanics, waves, and electricity fundamentals",
};

/** Checkbox cards. Real checkboxes underneath so keyboard + screen readers work; the check mark pops in from 0.9. */
export function SubjectPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Subjects</legend>
      {SUBJECTS.map((s) => {
        const on = value.includes(s.id);
        return (
          <label
            key={s.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-control px-4 py-3 ring-1 ring-inset transition-[background-color,box-shadow] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500",
              on ? "bg-brand-50 ring-brand-300" : "bg-white ring-line hover:ring-brand-200"
            )}
          >
            <input type="checkbox" className="sr-only" checked={on} onChange={() => onChange(on ? value.filter((x) => x !== s.id) : [...value, s.id])} />
            <span className={cn("grid size-5 shrink-0 place-items-center rounded-[5px] transition-colors duration-150", on ? "bg-brand-600 text-white" : "bg-white ring-1 ring-inset ring-slate-300")} aria-hidden>
              <Check className={cn("size-3.5 transition-[transform,opacity] duration-150 ease-out", on ? "scale-100 opacity-100" : "scale-90 opacity-0")} strokeWidth={3} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-brand-800">{s.name}</span>
              <span className="block text-xs text-muted">{SUBJECT_NOTE[s.id]}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

export function AvailabilityEditor({ value, onChange }: { value: Slot[]; onChange: (v: Slot[]) => void }) {
  const set = (i: number, patch: Partial<Slot>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div className="space-y-2">
      {value.map((s, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <select className="field w-full sm:w-40" value={s.day} onChange={(e) => set(i, { day: Number(e.target.value) })} aria-label={`Slot ${i + 1} day`}>
            {DAYS.map((d, n) => <option key={d} value={n}>{d}</option>)}
          </select>
          <input type="time" className="field w-[8.5rem] flex-1 sm:flex-none" value={s.start_time.slice(0, 5)} onChange={(e) => set(i, { start_time: e.target.value })} aria-label={`Slot ${i + 1} start time`} step={900} />
          <span className="text-xs text-muted">to</span>
          <input type="time" className="field w-[8.5rem] flex-1 sm:flex-none" value={s.end_time.slice(0, 5)} onChange={(e) => set(i, { end_time: e.target.value })} aria-label={`Slot ${i + 1} end time`} step={900} />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded-control p-2 text-muted transition-colors duration-150 hover:bg-red-50 hover:text-red-600" aria-label={`Remove slot ${i + 1}`}>
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { day: 1, start_time: "13:00", end_time: "15:00" }])}
        className="inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-sm font-medium text-brand-700 transition-[background-color,transform] duration-150 ease-out hover:bg-brand-50 active:scale-[0.97]"
      >
        <Plus className="size-4" aria-hidden /> Add time slot
      </button>
    </div>
  );
}

export function validSlots(slots: Slot[]) {
  return slots.length > 0 && slots.every((s) => s.start_time && s.end_time && s.end_time > s.start_time);
}

export function FilePick({ label, file, onChange, required, hint }: { label: string; file: File | null; onChange: (f: File | null) => void; required?: boolean; hint?: string }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink">{label} {required ? <span className="text-red-600" aria-label="required">*</span> : null}</p>
      <label className={cn("flex cursor-pointer items-center gap-3 rounded-control border border-dashed px-4 py-3.5 transition-[border-color,background-color] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500", file ? "border-brand-300 bg-brand-50/50" : "border-slate-300 bg-paper hover:border-brand-300")}>
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-white text-brand-600 ring-1 ring-line" aria-hidden>
          {file ? <CheckCircle2 className="size-4" /> : <Upload className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          {file ? (
            <>
              <span className="block truncate text-sm font-semibold text-ink">{file.name}</span>
              <span className="num block text-xs text-brand-700">Ready to upload, {(file.size / 1024 / 1024).toFixed(1)}&nbsp;MB</span>
            </>
          ) : (
            <>
              <span className="block text-sm font-medium text-ink">Choose a file</span>
              <span className="block text-xs text-muted">{hint ?? "PDF, PNG, or JPG, up to 10 MB"}</span>
            </>
          )}
        </span>
        <span className="rounded-control bg-white px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-line">{file ? "Replace" : "Browse"}</span>
        <input
          type="file"
          className="sr-only"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (f && f.size > 10 * 1024 * 1024) {
              alert("That file is over 10 MB. Choose a smaller file.");
              return;
            }
            onChange(f);
          }}
        />
      </label>
    </div>
  );
}

export const MODALITIES = ["Online (Teams)", "Face-to-face (Campus Library)", "Hybrid (Online or Campus Library)"];
export const PROGRAMS = [
  "BS Civil Engineering", "BS Chemical Engineering", "BS Computer Engineering", "BS Electrical Engineering", "BS Electronics Engineering",
  "BS Mechanical Engineering", "BS Industrial Engineering", "BS Computer Science", "BS Information Technology", "BS Architecture",
  "BS Mathematics", "BS Physics", "BS Chemistry", "BS Pharmacy", "BS Accountancy",
];
