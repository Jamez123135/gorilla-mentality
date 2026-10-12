import Link from "next/link";
import { ExternalLink, Dumbbell, Utensils, Moon, Repeat2 } from "lucide-react";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { resources, resourceReviewDate } from "@/app/data/resources";

export const metadata = {
  title: "Free Resources | Gorilla Mentality",
  description:
    "Free training, nutrition, recovery and habit resources from public-health sources.",
};
const groups = [
  { category: "Training", icon: Dumbbell },
  { category: "Nutrition", icon: Utensils },
  { category: "Recovery", icon: Moon },
  { category: "Consistency", icon: Repeat2 },
] as const;
export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <SiteHeader showHomeLink />
      <header className="mx-auto max-w-5xl px-5 py-8 md:py-12">
        <p className="text-xs font-bold uppercase text-yellow-500">
          Gorilla Mentality
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Free Resources</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-zinc-400">
          Build strength, fuel your training, recover well, and keep showing up.
          These public-health resources are free to access.
        </p>
        <p className="mt-3 text-xs text-zinc-500">
          Sources reviewed {resourceReviewDate}. No membership payment required.
        </p>
      </header>
      {groups.map(({ category, icon: Icon }, index) => (
        <section
          key={category}
          className={`border-t border-zinc-800 ${index % 2 ? "bg-zinc-900/30" : ""}`}
        >
          <div className="mx-auto max-w-5xl px-5 py-7">
            <h2 className="mb-2 flex items-center gap-3 text-xl font-semibold">
              <Icon className="h-5 w-5 text-yellow-500" />
              {category}
            </h2>
            <ul className="divide-y divide-zinc-800">
              {resources
                .filter((resource) => resource.category === category)
                .map((resource) => (
                  <li key={resource.id} className="py-5">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-start justify-between gap-5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-green-400">
                          {resource.publisher}
                        </p>
                        <h3 className="mt-1 break-words font-semibold group-hover:text-yellow-500">
                          {resource.title}
                        </h3>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
                          {resource.description}
                        </p>
                      </div>
                      <ExternalLink
                        aria-label="Opens original source in a new tab"
                        className="mt-1 h-5 w-5 shrink-0 text-zinc-500 group-hover:text-yellow-500"
                      />
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        </section>
      ))}
      <section className="border-t border-zinc-800">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-400">
            Educational guidance, not medical care or guaranteed results.
            Equipment, food and professional care may still cost money. For
            injuries, medical conditions, pregnancy, breastfeeding,
            eating-disorder concerns or under-18 nutrition planning, seek an
            appropriately qualified professional.
          </p>
          <div className="mt-5 flex flex-wrap gap-6">
            <Link
              href="/starter-pack"
              className="text-sm font-semibold text-yellow-500 underline"
            >
              Build a free starter plan
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-white underline"
            >
              Member dashboard
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
