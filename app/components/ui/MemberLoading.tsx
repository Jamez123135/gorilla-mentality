export default function MemberLoading({ label = "Loading your member tools..." }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="mx-auto max-w-5xl p-4 md:p-8">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-lg bg-zinc-800" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((key) => <div key={key} className="h-28 rounded-xl bg-zinc-900" />)}
        </div>
        <div className="h-44 rounded-xl bg-zinc-900" />
        <div className="h-44 rounded-xl bg-zinc-900" />
      </div>
    </div>
  );
}
