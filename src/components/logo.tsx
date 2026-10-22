import Image from "next/image";
import { cn } from "@/lib/utils";

/** Official Klasmeyt logo (public/logo.png, transparent circle). */
export function Emblem({ size = 32, className }: { size?: number; className?: string }) {
  return <Image src="/logo.png" alt="" width={size} height={size} className={cn("shrink-0", className)} />;
}

export function KMark({ className }: { className?: string }) {
  return <Emblem size={32} className={className} />;
}

export function Logo({ light, className }: { light?: boolean; mark?: "emblem" | "k"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} translate="no">
      <Emblem size={38} />
      <span className="leading-none">
        <span className={cn("block text-[17px] font-bold tracking-[-0.01em]", light ? "text-white" : "text-brand-800")}>Klasmeyt</span>
        <span className={cn("mt-0.5 block text-[11px] font-medium", light ? "text-brand-200" : "text-muted")}>Adamson University</span>
      </span>
    </span>
  );
}
