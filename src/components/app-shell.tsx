"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell, BookOpen, CalendarDays, Clock, FileText, Handshake, LayoutDashboard, LogOut, Menu, MessagesSquare,
  Search, ShieldCheck, UserRound, Users, UsersRound, Video, X, BadgeCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

function nav(role: Role): Item[] {
  if (role === "admin")
    return [
      { href: "/admin", label: "Applications queue", icon: FileText },
      { href: "/admin/mentors", label: "Verified mentors", icon: BadgeCheck },
      { href: "/admin/mentees", label: "Mentee verification", icon: ShieldCheck },
      { href: "/admin/partnerships", label: "Partnerships", icon: Handshake },
      { href: "/admin/groups", label: "Mentoring groups", icon: UsersRound },
      { href: "/admin/sessions", label: "Mentoring sessions", icon: Video },
      { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
    ];
  if (role === "mentor")
    return [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/mentees", label: "My mentees", icon: Users },
      { href: "/requests", label: "Partnership requests", icon: FileText },
      { href: "/chat", label: "Messages", icon: MessagesSquare },
      { href: "/subjects", label: "My subjects", icon: BookOpen },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/sessions", label: "Sessions", icon: Clock },
      { href: "/profile", label: "Profile", icon: UserRound },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ];
  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/find", label: "Find a mentor", icon: Search },
    { href: "/partners", label: "My partner", icon: Users },
    { href: "/requests", label: "Partnership requests", icon: FileText },
    { href: "/chat", label: "Messages", icon: MessagesSquare },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/sessions", label: "Sessions", icon: Clock },
    { href: "/profile", label: "Profile", icon: UserRound },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ];
}

type Props = {
  children: React.ReactNode;
  role: Role;
  verified: boolean;
  name: string;
  subline: string;
  userId: string;
  unread: number;
  bare?: boolean;
};

export function AppShell({ children, role, verified, name, subline, userId, unread: initialUnread, bare }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [unread, setUnread] = useState(initialUnread);
  const items = nav(role);

  useEffect(() => setUnread(initialUnread), [initialUnread]);
  useEffect(() => setOpen(false), [pathname]);
  // closed drawer is inert: not focusable, not read by screen readers
  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;
    if (open) el.removeAttribute("inert");
    else el.setAttribute("inert", "");
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`notif-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => {
        setUnread((u) => u + 1);
        router.refresh();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, router]);

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (bare) {
    return (
      <div className="min-h-dvh bg-paper">
        <header className="flex h-16 items-center justify-between border-b border-line bg-white px-4 sm:px-8">
          <Logo />
          <Button variant="secondary" size="sm" onClick={logout}>Log out</Button>
        </header>
        <main id="main" className="mx-auto w-full max-w-3xl px-4 py-10">{children}</main>
      </div>
    );
  }

  const roleLabel =
    role === "admin" ? "Administrator" : role === "mentor" ? (verified ? "Verified mentor" : "Mentor applicant") : verified ? "Verified mentee" : "Mentee, pending verification";

  const isActive = (href: string) =>
    href === "/admin" || href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  // Nav is used dozens of times a day: no animation on active state, only a quick color change on hover.
  const sidebar = (
    <div className="flex h-full flex-col bg-brand-900 text-white">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href={role === "admin" ? "/admin" : "/dashboard"} className="rounded-control">
          <Logo light />
        </Link>
        <button className="rounded-control p-1.5 text-brand-200 hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="mx-5 mb-4 mt-1 border-b border-white/10 pb-4">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="mt-0.5 truncate text-xs text-brand-200">{subline || roleLabel}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-pad-200">
          <span className={cn("size-1.5 rounded-full", verified || role === "admin" ? "bg-pad-300" : "bg-brand-300")} aria-hidden />
          {roleLabel}
        </p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Main">
        {items.map((it) => {
          const active = isActive(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors duration-100",
                active ? "bg-white font-semibold text-brand-800" : "text-brand-100 hover:bg-white/[0.07] hover:text-white"
              )}
            >
              <Icon className={cn("size-[18px] shrink-0", active ? "text-brand-600" : "text-brand-300")} />
              <span className="flex-1">{it.label}</span>
              {it.href === "/notifications" && unread > 0 ? (
                <span className="num rounded-full bg-pad-300 px-1.5 text-[11px] font-semibold text-pad-800" aria-label={`${unread} unread`}>{unread > 99 ? "99+" : unread}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm text-brand-200 transition-colors duration-100 hover:bg-white/[0.07] hover:text-white">
          <LogOut className="size-[18px]" aria-hidden /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {/* Mobile drawer: always mounted so it can animate out. iOS drawer curve in, faster exit. */}
      <div className={cn("fixed inset-0 z-40 lg:hidden", !open && "pointer-events-none")} ref={drawerRef}>
        <div
          className={cn("absolute inset-0 bg-brand-900/50 transition-opacity", open ? "opacity-100 duration-300" : "opacity-0 duration-200")}
          onClick={() => setOpen(false)}
        />
        <aside
          data-motion="transform"
          className={cn(
            "absolute inset-y-0 left-0 w-72 overscroll-contain shadow-2xl transition-transform",
            open ? "translate-x-0 duration-300 ease-drawer" : "-translate-x-full duration-200 ease-out"
          )}
        >
          {sidebar}
        </aside>
      </div>

      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/10 bg-brand-900 px-4 text-white lg:hidden">
        <button className="rounded-control p-1.5 hover:bg-white/10" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
          <Menu className="size-5" aria-hidden />
        </button>
        <Logo light />
        <Link href="/notifications" className="relative ml-auto rounded-control p-1.5 hover:bg-white/10" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
          <Bell className="size-5" aria-hidden />
          {unread > 0 ? <span className="absolute right-1 top-1 size-2 rounded-full bg-pad-300" aria-hidden /> : null}
        </Link>
      </header>
      <main id="main" className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
