"use client";
import { Trash2 } from "lucide-react";
import type { getActivities } from "@/app/lib/actions/activities";
import { recordedSets } from "@/app/lib/activity-input";

export default function ActivityHistory({ activities, onDelete, busy = false }: {
  activities: Awaited<ReturnType<typeof getActivities>>;
  onDelete?: (id: string) => void;
  busy?: boolean;
}) {
  return <><ul className="divide-y divide-zinc-800">
    {activities.map((activity) => {
      const sets = recordedSets.safeParse(activity.sets);
      return <li key={activity.id} className="flex items-start justify-between gap-3 py-4">
        <div className="min-w-0">
          <p className="text-xs capitalize text-zinc-400">{activity.kind} / {new Date(activity.logDate).toLocaleDateString(undefined, { timeZone: "UTC" })}</p>
          <h3 className="mt-1 break-words font-medium">{activity.name}</h3>
          {activity.kind === "cardio" ? <p className="mt-1 text-sm text-zinc-400">{activity.minutes} min{activity.distance !== null ? ` / ${activity.distance} ${activity.distanceUnit === "mi" ? "miles" : "km"}` : ""}</p>
            : sets.success && <p className="mt-1 text-sm text-zinc-400">{sets.data.map((set, index) => `Set ${index + 1}: ${set.reps} reps${set.weightLb === null ? " / bodyweight" : ` / ${Math.round(set.weightLb * 10) / 10} lb`}`).join("; ")}</p>}
          {activity.notes && <p className="mt-2 break-words text-sm text-zinc-400">{activity.notes}</p>}
        </div>
        {onDelete && <button type="button" disabled={busy} onClick={() => onDelete(activity.id)} aria-label={`Delete activity ${activity.name}`} className="flex h-11 w-11 shrink-0 items-center justify-center text-zinc-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>}
      </li>;
    })}
  </ul>{activities.length >= 100 && <p className="mt-3 text-xs text-zinc-400">Showing your 100 most recent additional activities.</p>}</>;
}
