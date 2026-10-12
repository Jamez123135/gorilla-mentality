import Image from "next/image";
import Link from "next/link";
import { navLinks } from "@/app/data/site";
import { UserRound } from "lucide-react";

export function SiteHeader({
  showHomeLink = false,
}: {
  showHomeLink?: boolean;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-inner transition-all group-hover:border-zinc-600 group-hover:shadow-[0_18px_60px_-30px_rgba(255,255,255,0.35)]">
            <Image
              src="/brand.png"
              alt="Gorilla Mentality logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="leading-tight">
            <p className="font-bold tracking-tight">Gorilla Mentality</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-400">
              Train with purpose
            </p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-3">
          {showHomeLink && (
            <Link
              href="/"
              className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-100 transition-all hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900"
            >
              Home
            </Link>
          )}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                link.variant === "primary"
                  ? "rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400"
                  : "hidden rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-100 transition-all hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900 md:inline-flex"
              }
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            aria-label="Member area"
            title="Member area"
            className="rounded-lg border border-zinc-800 p-2 text-zinc-300 hover:text-white"
          >
            <UserRound className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
