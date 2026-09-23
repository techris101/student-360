"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Bot,
  Users,
  Newspaper,
  CheckSquare,
  Bell,
  Settings,
  User,
  LogOut,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface AppShellProps {
  children: React.ReactNode;
  rightRail?: React.ReactNode;
  pageTitle?: string;
  user?: {
    name: string;
    email: string;
    initials: string;
    role?: "user" | "admin";
  } | null;
}

const navItems = [
  { href: "/opportunities", label: "Opportunities", icon: Compass },
  { href: "/advisor", label: "Advisor", icon: Bot },
  { href: "/cohorts", label: "Cohorts", icon: Users },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/progress", label: "Progress", icon: CheckSquare },
];

export function AppShell({
  children,
  rightRail,
  pageTitle = "Student 360",
  user = {
    name: "Student",
    email: "student@university.ac.rw",
    initials: "ST",
    role: "user",
  },
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col md:flex-row">
      {/* Mobile Top Bar (<768px) */}
      <header className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-4">
        <Link href="/opportunities" className="text-base font-semibold tracking-tight">
          {pageTitle !== "Student 360" ? (
            <span>{pageTitle}</span>
          ) : (
            <>
              Student <span className="text-[var(--teal)]">360</span>
            </>
          )}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            className="p-1.5 rounded-[4px] text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={1.5} />
          </Link>
          <UserAvatarMenu user={user} />
        </div>
      </header>

      {/* Desktop / Tablet Sidebar (≥768px) */}
      <aside className="hidden md:flex flex-col justify-between border-r border-[var(--line)] bg-[var(--surface)] shrink-0 w-16 lg:w-[232px] h-screen sticky top-0 p-3 lg:p-4">
        <div className="space-y-6">
          {/* Logo */}
          <div className="px-2 py-1">
            <Link
              href="/opportunities"
              className="text-lg font-semibold tracking-tight inline-block"
            >
              <span className="hidden lg:inline">
                Student <span className="text-[var(--teal)]">360</span>
              </span>
              <span className="lg:hidden text-[var(--teal)] text-xl font-bold">
                360
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--surface-2)] text-[var(--ink)] font-semibold"
                      : "text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                  )}
                  title={item.label}
                >
                  <Icon size={20} strokeWidth={1.5} className="shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Avatar Menu at Bottom of Sidebar */}
        <div className="border-t border-[var(--line)] pt-3">
          <UserAvatarMenu user={user} isDesktop />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex justify-center w-full px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
          <div className="w-full max-w-[760px] min-w-0">
            {children}
          </div>

          {/* Right Rail (≥1024px) */}
          {rightRail && (
            <aside className="hidden xl:block w-[300px] shrink-0 ml-8 pl-8 border-l border-[var(--line)] space-y-6">
              {rightRail}
            </aside>
          )}
        </div>
      </div>

      {/* Mobile Bottom Tab Bar (<768px, 56px height, labels always visible) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 border-t border-[var(--line)] bg-[var(--surface)] grid grid-cols-5 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center h-full py-1 text-center transition-colors",
                isActive
                  ? "text-[var(--teal)] font-medium"
                  : "text-[var(--muted)] hover:text-[var(--ink-2)]"
              )}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span className="text-[11px] leading-tight mt-0.5 truncate w-full px-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function UserAvatarMenu({
  user,
  isDesktop = false,
}: {
  user: AppShellProps["user"];
  isDesktop?: boolean;
}) {
  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="text-sm font-medium text-[var(--teal)] hover:underline"
      >
        Sign in
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2.5 rounded-[6px] p-1.5 hover:bg-[var(--surface-2)] transition-colors text-left w-full outline-none focus:ring-2 focus:ring-[var(--teal)]",
            !isDesktop && "p-0"
          )}
          aria-label="User account menu"
        >
          {/* Avatar initial badge (no cartoon illustrations per DESIGN.md) */}
          <div className="h-8 w-8 rounded-full bg-[var(--surface-2)] border border-[var(--line-strong)] text-[var(--ink)] flex items-center justify-center text-xs font-semibold shrink-0">
            {user.initials}
          </div>
          {isDesktop && (
            <div className="hidden lg:block min-w-0 flex-1 leading-tight">
              <p className="text-sm font-medium text-[var(--ink)] truncate">
                {user.name}
              </p>
              <p className="text-xs text-[var(--ink-2)] truncate">{user.email}</p>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isDesktop ? "start" : "end"} className="w-52">
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2">
            <User size={16} strokeWidth={1.5} />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings size={16} strokeWidth={1.5} />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center gap-2 text-[var(--amber)]">
              <Shield size={16} strokeWidth={1.5} />
              <span>Admin moderation</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action="/auth/sign-out" method="POST" className="w-full">
            <button
              type="submit"
              className="flex items-center gap-2 w-full text-[var(--red)] text-left"
            >
              <LogOut size={16} strokeWidth={1.5} />
              <span>Sign out</span>
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
