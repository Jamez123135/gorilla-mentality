import { Check } from "lucide-react";

export function OptionTile({
  active,
  title,
  body,
  onClick,
}: {
  active: boolean;
  title: string;
  body?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-24 rounded-2xl border p-4 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
        active
          ? "border-zinc-200 bg-zinc-100 text-zinc-950 shadow-[0_24px_80px_-55px_rgba(255,255,255,0.75)]"
          : "border-zinc-800 bg-zinc-950/70 text-zinc-100 hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900/70"
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="font-bold">{title}</span>
        {active && <Check className="h-4 w-4" aria-hidden="true" />}
      </span>
      {body && (
        <span
          className={`mt-2 block text-sm leading-relaxed ${
            active ? "text-zinc-700" : "text-zinc-400"
          }`}
        >
          {body}
        </span>
      )}
    </button>
  );
}
