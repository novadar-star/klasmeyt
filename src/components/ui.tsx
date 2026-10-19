import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-bold uppercase tracking-wide transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand-700 text-white hover:bg-brand-800",
        teal: "bg-teal-600 text-white hover:bg-teal-700",
        orange: "bg-amber-500 text-white hover:bg-amber-600",
        outline: "bg-white text-brand-700 ring-1 ring-inset ring-brand-700 hover:bg-brand-50",
        "outline-teal": "bg-white text-teal-700 ring-1 ring-inset ring-teal-600 hover:bg-teal-50",
        "outline-light": "bg-transparent text-white ring-1 ring-inset ring-white/80 hover:bg-white/10",
        danger: "bg-white text-red-700 ring-1 ring-inset ring-red-300 hover:bg-red-50",
        success: "bg-teal-600 text-white hover:bg-teal-700",
        ghost: "text-brand-700 hover:bg-brand-50",
        light: "bg-white text-brand-700 hover:bg-brand-50",
      },
      size: { sm: "h-8 px-3", md: "h-9 px-4", lg: "h-11 px-6 text-sm" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-line bg-white shadow-[0_1px_2px_rgba(15,27,61,0.04)]", className)} {...props} />;
}

export function CardTitle({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      <h2 className="text-base font-bold text-brand-700">{children}</h2>
      {action}
    </div>
  );
}

export function PortalPill({ children = "Falcon portal" }: { children?: React.ReactNode }) {
  return <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700">{children}</span>;
}

/** White title band across the top of the content area (Figma). */
export function PageHeader({ title, description, action, pill }: { title: string; description?: React.ReactNode; action?: React.ReactNode; pill?: string }) {
  return (
    <div className="-mx-4 -mt-6 mb-6 border-b border-line bg-white px-4 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-brand-700">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {action}
          <PortalPill>{pill}</PortalPill>
        </div>
      </div>
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function Empty({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-brand-200 bg-white px-6 py-12 text-center">
      <p className="font-semibold text-brand-700">{title}</p>
      {children ? <p className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6 first:border-0 first:pt-0">
      <h2 className="mb-4 text-base font-bold text-brand-700">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-brand-700">{value}</p>
    </Card>
  );
}

export function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="eyebrow">{k}</dt>
      <dd className="mt-1 break-words text-sm text-ink">{v || <span className="text-muted">—</span>}</dd>
    </div>
  );
}
