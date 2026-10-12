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
      className={`min-h-24 rounded-lg border p-4 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 ${
        active
          ? "border-yellow-500 bg-yellow-500/10 text-zinc-50"
          : "border-zinc-800 bg-zinc-950/70 text-zinc-100 hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900/70"
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="font-bold">{title}</span>
        {active && <Check className="h-4 w-4 text-yellow-500" aria-hidden="true" />}
      </span>
      {body && (
        <span
          className={`mt-2 block text-sm leading-relaxed ${
            active ? "text-zinc-200" : "text-zinc-400"
          }`}
        >
          {body}
        </span>
      )}
    </button>
  );
}
