"use client";

import Link from "next/link";
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

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const { signOut } = useClerk();
  return (
    <div className="min-h-screen bg-zinc-950 text-white md:flex">
      <aside className="border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-900 md:w-56 md:shrink-0">
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
          className="flex overflow-x-auto gap-1 px-3 pb-3 md:flex-col md:overflow-visible"
        >
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg p-3 text-sm font-medium ${path === href || (href !== "/dashboard" && path.startsWith(`${href}/`)) ? "bg-yellow-500 text-black" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
            >
              <Icon className="h-5 w-5" />
              {label}
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
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
