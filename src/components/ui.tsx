import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Buttons: sentence case, 150ms ease-out press (scale 0.97; a dim instead under reduced motion), color on hover only.
 * Variants by intent: primary (one per view), secondary (outlined), quiet (text), danger.
 */
export const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-control text-sm font-semibold transition-[transform,background-color,color,box-shadow] duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:active:opacity-80 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand-600 text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)] hover:bg-brand-700",
        secondary: "bg-white text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-50 hover:ring-brand-300",
        quiet: "text-brand-700 hover:bg-brand-50",
        danger: "bg-white text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50",
        "danger-solid": "bg-red-600 text-white hover:bg-red-700",
        "on-dark": "bg-white text-brand-800 hover:bg-brand-50",
        "outline-on-dark": "text-white ring-1 ring-inset ring-white/40 hover:bg-white/10",
        // legacy aliases kept so older call sites keep working
        teal: "bg-brand-600 text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)] hover:bg-brand-700",
        orange: "bg-pad-300 text-pad-800 hover:bg-pad-200",
        outline: "bg-white text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-50 hover:ring-brand-300",
        "outline-teal": "bg-white text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-50 hover:ring-brand-300",
        "outline-light": "text-white ring-1 ring-inset ring-white/40 hover:bg-white/10",
        success: "bg-brand-600 text-white hover:bg-brand-700",
        ghost: "text-brand-700 hover:bg-brand-50",
        light: "bg-white text-brand-800 hover:bg-brand-50",
      },
      // touch screens get taller targets (40–48px); mouse keeps the compact sizes
      size: { sm: "h-8 px-3 text-[13px] [@media(pointer:coarse)]:h-10", md: "h-10 px-4 [@media(pointer:coarse)]:h-11", lg: "h-11 px-5 text-[15px] [@media(pointer:coarse)]:h-12" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a spinner; the label blurs out instead of jumping (Emil: blur masks the crossfade). */
  loading?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, loading, children, disabled, ...props }, ref) => {
  if (asChild) {
    return (
      <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </Slot>
    );
  }
  return (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      <span className={cn("inline-flex items-center gap-2 transition-[filter,opacity] duration-200 ease-out", loading && "opacity-0 blur-[2px]")}>{children}</span>
      <span className={cn("pointer-events-none absolute inset-0 grid place-items-center transition-[filter,opacity] duration-200 ease-out", loading ? "opacity-100 blur-0" : "opacity-0 blur-[2px]")} aria-hidden>
        <Loader2 className="animate-spin [animation-duration:600ms]" />
      </span>
    </button>
  );
});
Button.displayName = "Button";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-panel border border-line bg-white", className)} {...props} />;
}

export function CardTitle({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      <h2 className="text-[15px] font-semibold text-brand-800">{children}</h2>
      {action}
    </div>
  );
}

/** Page title band (Figma layout). No decorative pill — the sidebar already says where you are. */
export function PageHeader({ title, description, action }: { title: string; description?: React.ReactNode; action?: React.ReactNode; pill?: string }) {
  return (
    <div className="-mx-4 -mt-6 mb-6 border-b border-line bg-white px-4 pb-5 pt-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="display text-[34px] text-brand-800">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function Empty({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-panel border border-dashed border-brand-200 bg-white px-6 py-12 text-center">
      <p className="font-semibold text-brand-800">{title}</p>
      {children ? <p className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6 first:border-0 first:pt-0">
      <h2 className="mb-4 text-[15px] font-semibold text-brand-800">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="num mt-1 text-[28px] font-semibold leading-none tracking-[-0.02em] text-brand-800">{value}</p>
    </Card>
  );
}

export function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="eyebrow">{k}</dt>
      <dd className="mt-1 break-words text-sm text-ink">{v || <span className="text-muted">Not provided</span>}</dd>
    </div>
  );
}

