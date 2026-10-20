import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SUBJECTS = [
  { id: 1, name: "Calculus 1" },
  { id: 2, name: "Calculus 2" },
  { id: 3, name: "Physics" },
] as const;

export const subjectName = (id: number | null | undefined) =>
  SUBJECTS.find((s) => s.id === id)?.name ?? "—";

export const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const FORMAT_LABEL: Record<string, string> = {
  one_on_one: "One-on-one",
  group: "Group",
  both: "One-on-one or group",
  individual: "One-on-one",
};

export const TZ = "Asia/Manila";

/** "14:30:00" -> "2:30 PM" */
export function fmtTime(t: string | null | undefined) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function fmtDateTime(iso: string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...opts,
  }).format(new Date(iso));
}

export function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-PH", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export function fmtClock(iso: string) {
  return new Intl.DateTimeFormat("en-PH", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));
}

export function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDate(iso);
}

/** A local Manila date + "HH:MM" -> ISO string */
export function manilaToISO(date: string, time: string) {
  return new Date(`${date}T${time}:00+08:00`).toISOString();
}

/**
 * Effective status shown to people:
 *  - a scheduled session whose end time passed shows as completed
 *  - a pending session whose start time passed was never confirmed: "expired" (nothing left to respond to)
 */
export function sessionStatus(s: { status: string; starts_at: string; duration_min: number }) {
  const start = new Date(s.starts_at).getTime();
  if (s.status === "scheduled" && start + s.duration_min * 60000 < Date.now()) return "completed";
  if (s.status === "pending" && start <= Date.now()) return "expired";
  return s.status;
}

export function errMsg(e: unknown) {
  if (!e) return "Something went wrong";
  if (typeof e === "string") return e;
  const m = (e as { message?: string }).message;
  return m ?? "Something went wrong";
}
