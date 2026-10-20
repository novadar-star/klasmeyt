import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4 text-center">
      <div>
        <h1 className="display text-[44px] text-brand-800">Page not found</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted">This page doesn&apos;t exist, or your account can&apos;t open it.</p>
        <Button asChild className="mt-6"><Link href="/dashboard">Go to my dashboard</Link></Button>
      </div>
    </div>
  );
}
