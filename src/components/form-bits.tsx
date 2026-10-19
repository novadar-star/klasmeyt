"use client";

import { Check, CheckCircle2, Plus, Trash2, Upload } from "lucide-react";
import { DAYS, SUBJECTS, cn } from "@/lib/utils";
import type { Slot } from "@/lib/types";

const SUBJECT_NOTE: Record<number, string> = {
  1: "Limits, derivatives, and their applications",
  2: "Integration techniques, series, and applications",
  3: "Mechanics, waves, and electricity fundamentals",
};

/** Checkbox cards (Figma "Subjects I need help with") */
export function SubjectPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="space-y-2.5" role="group">
      {SUBJECTS.map((s) => {
        const on = value.includes(s.id);
        return (
          <button
            type="button"
            key={s.id}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== s.id) : [...value, s.id])}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ring-1 ring-inset transition-colors",
              on ? "bg-teal-50/60 ring-teal-500" : "bg-white ring-line hover:ring-teal-300"
            )}
          >
            <span className={cn("grid size-5 shrink-0 place-items-center rounded", on ? "bg-teal-600 text-white" : "ring-1 ring-inset ring-slate-300")}>
              {on ? <Check className="size-3.5" strokeWidth={3} /> : null}
            </span>
            <span>
              <span className="block text-sm font-semibold text-brand-700">{s.name}</span>
              <span className="block text-[11px] text-muted">{SUBJECT_NOTE[s.id]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function AvailabilityEditor({ value, onChange }: { value: Slot[]; onChange: (v: Slot[]) => void }) {
  const set = (i: number, patch: Partial<Slot>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div className="space-y-2">
      {value.map((s, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <select className="field w-full sm:w-40" value={s.day} onChange={(e) => set(i, { day: Number(e.target.value) })} aria-label="Day">
            {DAYS.map((d, n) => <option key={d} value={n}>{d}</option>)}
          </select>
          <input type="time" className="field w-[8.5rem] flex-1 sm:flex-none" value={s.start_time.slice(0, 5)} onChange={(e) => set(i, { start_time: e.target.value })} aria-label="From" step={900} />
          <span className="text-xs text-muted">to</span>
          <input type="time" className="field w-[8.5rem] flex-1 sm:flex-none" value={s.end_time.slice(0, 5)} onChange={(e) => set(i, { end_time: e.target.value })} aria-label="To" step={900} />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded-md p-2 text-muted hover:bg-red-50 hover:text-red-600" aria-label="Remove time slot">
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { day: 1, start_time: "13:00", end_time: "15:00" }])}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-teal-700 hover:bg-teal-50"
      >
        <Plus className="size-4" /> Add time slot
      </button>
    </div>
  );
}

export function validSlots(slots: Slot[]) {
  return slots.length > 0 && slots.every((s) => s.start_time && s.end_time && s.end_time > s.start_time);
}

/** Upload row (Figma "Mandatory Credentials Upload") */
export function FilePick({ label, file, onChange, required, hint }: { label: string; file: File | null; onChange: (f: File | null) => void; required?: boolean; hint?: string }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink">{label} {required ? <span className="text-red-600">*</span> : null}</p>
      <label className={cn("flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-3.5", file ? "border-teal-400 bg-teal-50/40" : "border-slate-300 bg-paper hover:border-teal-400")}>
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white text-brand-600 ring-1 ring-line">
          <Upload className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          {file ? (
            <>
              <span className="block truncate text-sm font-semibold text-ink">{file.name}</span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-teal-700"><CheckCircle2 className="size-3" /> File ready ({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
            </>
          ) : (
            <>
              <span className="block text-sm font-medium text-ink">Choose a file to upload</span>
              <span className="block text-[11px] text-muted">{hint ?? "Supported formats: PDF, PNG, JPG (max 10MB)"}</span>
            </>
          )}
        </span>
        <span className={cn("rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", file ? "bg-brand-700 text-white" : "bg-white text-brand-700 ring-1 ring-line")}>
          {file ? "Replace" : "Browse"}
        </span>
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
