"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
      { href: "/admin", label: "Applications Queue", icon: FileText },
      { href: "/admin/mentors", label: "Verified Mentors", icon: BadgeCheck },
      { href: "/admin/mentees", label: "Mentee Verification", icon: ShieldCheck },
      { href: "/admin/partnerships", label: "Partnerships", icon: Handshake },
      { href: "/admin/groups", label: "Mentoring Groups", icon: UsersRound },
      { href: "/admin/sessions", label: "Mentoring Sessions", icon: Video },
      { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
    ];
  if (role === "mentor")
    return [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/mentees", label: "My Mentees", icon: Users },
      { href: "/requests", label: "Partnership Requests", icon: FileText },
      { href: "/chat", label: "Messages", icon: MessagesSquare },
      { href: "/subjects", label: "My Subjects", icon: BookOpen },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/sessions", label: "Upcoming Sessions", icon: Clock },
      { href: "/profile", label: "Profile", icon: UserRound },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ];
  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/find", label: "Find a Mentor", icon: Search },
    { href: "/partners", label: "My Partner", icon: Users },
    { href: "/requests", label: "Partnership Requests", icon: FileText },
    { href: "/chat", label: "Messages", icon: MessagesSquare },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/sessions", label: "Upcoming Sessions", icon: Clock },
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
  const [unread, setUnread] = useState(initialUnread);
  const items = nav(role);

  useEffect(() => setUnread(initialUnread), [initialUnread]);
  useEffect(() => setOpen(false), [pathname]);

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
          <Logo mark="k" />
          <Button variant="outline" size="sm" onClick={logout}>Log out</Button>
        </header>
        <div className="h-1 bg-teal-600/80" />
        <main className="mx-auto w-full max-w-3xl px-4 py-10">{children}</main>
      </div>
    );
  }

  const roleLabel =
    role === "admin" ? "Admin portal" : role === "mentor" ? (verified ? "Verified mentor" : "Mentor applicant") : verified ? "Verified mentee" : "Mentee · pending verification";

  const isActive = (href: string) =>
    href === "/admin" || href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const sidebar = (
    <div className="flex h-full flex-col bg-brand-700 text-white">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href={role === "admin" ? "/admin" : "/dashboard"}>
          <Logo light mark="k" />
        </Link>
        <button className="rounded-md p-1 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>
      <div className="mx-4 rounded-lg bg-white/[0.06] p-3 ring-1 ring-inset ring-white/10">
        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-400">{roleLabel}</p>
        <p className="mt-0.5 truncate text-sm font-bold">{name}</p>
        {subline ? <p className="truncate text-[11px] text-brand-200">{subline}</p> : null}
      </div>
      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-4" aria-label="Main">
        {items.map((it) => {
          const active = isActive(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                active ? "bg-teal-600 text-white" : "text-white/85 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{it.label}</span>
              {it.href === "/notifications" && unread > 0 ? (
                <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-bold tabular-nums text-brand-900">{unread > 99 ? "99+" : unread}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="p-4">
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-red-300 hover:bg-white/10">
          <LogOut className="size-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:pl-60">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">{sidebar}</aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-brand-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-xl">{sidebar}</aside>
        </div>
      ) : null}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 bg-brand-700 px-4 text-white lg:hidden">
        <button className="rounded-md p-1.5 hover:bg-white/10" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <Logo light mark="k" />
        <Link href="/notifications" className="relative ml-auto rounded-md p-1.5 hover:bg-white/10" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 ? <span className="absolute right-1 top-1 size-2 rounded-full bg-amber-400" /> : null}
        </Link>
      </header>
      <main className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
