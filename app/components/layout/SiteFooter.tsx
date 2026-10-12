import Image from "next/image";
import Link from "next/link";
import { SocialLinks } from "./SocialLinks";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="relative h-7 w-7 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                <Image
                  src="/brand.png"
                  alt="Gorilla Mentality"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-zinc-100">Gorilla Mentality</span>
            </div>

            <p className="max-w-xs text-xs text-zinc-500">
              Simple, effective training plans for real people. No fluff, just
              results.
            </p>

            <SocialLinks />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-semibold text-zinc-100">Product</span>
            <Link href="/starter-pack" className="text-zinc-400 hover:text-white">
              Starter Pack
            </Link>
            <Link href="/coaching" className="text-zinc-400 hover:text-white">
              Coaching
            </Link>
            <Link href="/feedback" className="text-zinc-400 hover:text-white">
              Feedback
            </Link>
            <Link href="/dashboard" className="text-zinc-400 hover:text-white">
              Member Area
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
