import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4 text-center">
      <div>
        <p className="eyebrow">Page not found</p>
        <h1 className="mt-2 text-2xl font-bold text-brand-700">This page doesn&apos;t exist or you don&apos;t have access to it.</h1>
        <Button asChild className="mt-6"><Link href="/dashboard">Back to portal</Link></Button>
      </div>
    </div>
  );
}
