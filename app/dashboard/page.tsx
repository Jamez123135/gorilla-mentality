"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Dumbbell,
  Utensils,
  TrendingUp,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { getDashboard } from "@/app/lib/actions/dashboard";
import { localDate } from "@/app/lib/validation";
import MemberLoading from "@/app/components/ui/MemberLoading";

export default function Dashboard() {
  const { user } = useUser();
  const [data, setData] = useState<Awaited<
    ReturnType<typeof getDashboard>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    getDashboard(localDate(today), start.toISOString(), end.toISOString())
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active)
          setError(
            "Unable to load your dashboard. Please refresh to try again.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  if (loading)
    return <MemberLoading label="Loading dashboard..." />;
  const profile = data?.profile;
  const suggestions = [
    !profile?.trainingDays
      ? {
          title: "Set your routine",
          text: "Choose your goal, training days, and nutrition targets.",
          href: "/starter-pack",
        }
      : null,
    !data?.mealCount
      ? {
          title: "Log your first meal today",
          text: "Keep your food diary up to date.",
          href: "/dashboard/nutrition",
        }
      : null,
    !data?.workoutsThisWeek
      ? {
          title: "Start this week's training",
          text: "Record weights and reps as you train.",
          href: "/dashboard/workouts",
        }
      : null,
    !data?.latestWeight
      ? {
          title: "Record your starting weight",
          text: "Build your progress history over time.",
          href: "/dashboard/progress",
        }
      : null,
  ].filter((item) => item !== null);
  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase text-yellow-500">
          Free Membership
        </p>
        <h1 className="mt-2 break-words text-3xl font-bold">
          Welcome back, {profile?.fullName || user?.firstName || "Warrior"}
        </h1>
        <p className="mt-2 text-zinc-400">
          {profile?.goal
            ? `Goal: ${profile.goal.replace("-", " ")}`
            : "Your training, meals, and progress."}
        </p>
      </header>
      {error && (
        <p role="alert" className="mb-6 text-red-400">
          {error}
        </p>
      )}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 border-y border-zinc-800 py-6 lg:grid-cols-4">
            {[
              [
                "Workouts This Week",
                String(data.workoutsThisWeek),
                profile?.trainingDays
                  ? `${profile.trainingDays}-day routine`
                  : "Routine not set",
              ],
              [
                "Today's Calories",
                `${data.totals.calories} kcal`,
                profile?.targetCalories
                  ? `Target ${profile.targetCalories} kcal`
                  : "Target not set",
              ],
              [
                "Today's Protein",
                `${Math.round(data.totals.protein)}g`,
                profile?.targetProtein
                  ? `Target ${profile.targetProtein}g`
                  : "Target not set",
              ],
              [
                "Latest Weight",
                data.latestWeight ? `${data.latestWeight} lb` : "Not logged",
                "Body-weight history",
              ],
            ].map(([label, value, detail]) => (
              <div key={label}>
                <p className="text-sm text-zinc-400">{label}</p>
                <p className="mt-2 break-words text-2xl font-bold">{value}</p>
                <p className="mt-1 text-xs text-zinc-500">{detail}</p>
              </div>
            ))}
          </div>
          <nav aria-label="Quick actions" className="flex flex-wrap gap-3 py-6">
            {[
              {
                label: "Log Workout",
                href: "/dashboard/workouts",
                icon: Dumbbell,
              },
              {
                label: "Log Meal",
                href: "/dashboard/nutrition",
                icon: Utensils,
              },
              {
                label: "Track Progress",
                href: "/dashboard/progress",
                icon: TrendingUp,
              },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-3 text-sm font-semibold hover:border-yellow-500"
              >
                <Icon className="h-5 w-5 text-yellow-500" />
                {label}
              </Link>
            ))}
          </nav>
          <p className="mb-6 text-sm text-zinc-400">Additional activities this week: {data.activitiesThisWeek} / Cardio: {Math.round(data.cardioMinutesThisWeek * 10) / 10} min</p>
          {suggestions.length > 0 && (
            <section className="border-t border-zinc-800 py-6">
              <h2 className="mb-2 text-xl font-semibold">Next Steps</h2>
              <div className="divide-y divide-zinc-800">
                {suggestions.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{item.text}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-yellow-500" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      <section className="border-t border-zinc-800 py-6">
        <h2 className="text-xl font-semibold">One-on-one Coaching</h2>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          For personal coaching, reach out to Gorilla Mentality. Your plan and
          payment are arranged directly.
        </p>
        <Link
          href="/coaching"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-yellow-500"
        >
          <MessageSquare className="h-4 w-4" />
          Apply for coaching
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
