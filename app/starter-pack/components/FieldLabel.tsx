import type { ReactNode } from "react";

export function FieldLabel({
  children,
  icon,
}: {
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-100">
      <span className="text-zinc-400">{icon}</span>
      {children}
    </div>
  );
}
