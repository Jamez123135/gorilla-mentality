"use client";

import Link, { useLinkStatus } from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  Dumbbell,
  LayoutDashboard,
  Utensils,
  TrendingUp,
  User,
  LogOut,
  Home,
  MessageSquare,
  Users,
  LoaderCircle,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/dashboard/nutrition", label: "Nutrition", icon: Utensils },
  { href: "/dashboard/progress", label: "Progress", icon: TrendingUp },
  { href: "/dashboard/community", label: "Community", icon: Users },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/coaching", label: "1:1 Coaching", icon: MessageSquare },
];

function NavigationPending() {
  const { pending } = useLinkStatus();
  return pending ? <LoaderCircle aria-label="Opening page" className="ml-auto h-4 w-4 motion-safe:animate-spin" /> : null;
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const { signOut } = useClerk();
  return (
    <div data-member-shell className="min-h-screen bg-zinc-950 pb-[calc(5rem+env(safe-area-inset-bottom))] text-white md:flex md:pb-0">
      <a href="#member-content" className="member-skip-link fixed left-4 top-4 z-50 rounded-lg bg-yellow-500 px-4 py-3 font-semibold text-black">Skip to content</a>
      <aside className="border-b border-zinc-800 bg-zinc-900 md:sticky md:top-0 md:h-dvh md:w-56 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4 md:p-6">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
            <Image
              src="/brand.png"
              alt="Gorilla Mentality"
              width={36}
              height={44}
              className="shrink-0 rounded object-cover"
            />
            <div>
              <p className="text-sm font-bold leading-tight">
                Gorilla <span className="text-yellow-500">Mentality</span>
              </p>
              <p className="mt-1 text-[10px] uppercase text-zinc-400">
                Member Hub
              </p>
            </div>
          </Link>
          <Link
            href="/"
            title="Home"
            aria-label="Home"
            className="p-2 text-zinc-400 hover:text-white"
          >
            <Home className="h-5 w-5" />
          </Link>
        </div>
        <nav
          aria-label="Dashboard"
          className="hidden gap-1 px-3 pb-3 md:flex md:flex-col"
        >
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href || (href !== "/dashboard" && path.startsWith(`${href}/`)) ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg p-3 text-sm font-medium transition-colors ${path === href || (href !== "/dashboard" && path.startsWith(`${href}/`)) ? "bg-yellow-500 text-black" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
            >
              <Icon className="h-5 w-5" />
              {label}
              <NavigationPending />
            </Link>
          ))}
          <button
            onClick={() => signOut({ redirectUrl: "/login" })}
            className="flex shrink-0 items-center gap-2 rounded-lg p-3 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </nav>
        <details className="border-t border-zinc-800 px-4 md:hidden">
          <summary className="cursor-pointer py-3 text-sm font-medium text-zinc-300">More member tools</summary>
          <nav aria-label="More member tools" className="grid grid-cols-2 gap-1 pb-3">
            {links.slice(4).map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={`flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm ${path === href ? "bg-yellow-500 text-black" : "text-zinc-300"}`}><Icon className="h-4 w-4 shrink-0" />{label}<NavigationPending /></Link>)}
            <button onClick={() => signOut({ redirectUrl: "/login" })} className="flex min-h-11 items-center gap-2 px-2 text-sm text-zinc-300"><LogOut className="h-4 w-4" />Sign Out</button>
          </nav>
        </details>
      </aside>
      <div id="member-content" tabIndex={-1} className="min-w-0 flex-1 outline-none">{children}</div>
      <nav aria-label="Member shortcuts" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-zinc-800 bg-zinc-950 pb-[env(safe-area-inset-bottom)] md:hidden">
        {links.slice(0, 4).map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(`${href}/`));
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${active ? "text-yellow-500" : "text-zinc-400 hover:text-white"}`}><Icon className="h-5 w-5" />{label}<span className="absolute right-2 top-2"><NavigationPending /></span></Link>;
        })}
      </nav>
    </div>
  );
}
