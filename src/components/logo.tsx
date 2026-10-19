import Image from "next/image";
import { cn } from "@/lib/utils";

/** Sidebar mark: orange K disc (Figma) */
export function KMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full bg-amber-500 text-sm font-extrabold text-brand-800", className)} aria-hidden>
      K
    </span>
  );
}

/** Coin emblem (placeholder crop until the real logo file is provided) */
export function Emblem({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Image src="/logo-coin.png" alt="" width={size} height={size} className={cn("shrink-0 rounded-full object-cover ring-2 ring-white/20", className)} />
  );
}

export function Logo({ light, mark = "emblem", className }: { light?: boolean; mark?: "emblem" | "k"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {mark === "k" ? <KMark /> : <Emblem size={36} />}
      <span className="leading-none">
        <span className={cn("block text-base font-extrabold tracking-tight", light ? "text-white" : "text-brand-700")}>KLASMEYT</span>
        <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-wider text-teal-500">Adamson University</span>
      </span>
    </span>
  );
}
