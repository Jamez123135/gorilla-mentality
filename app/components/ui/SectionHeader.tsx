export function SectionHeader({
  kicker,
  title,
  desc,
}: {
  kicker?: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-8">
      {kicker && (
        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-white/70" />
          {kicker}
        </p>
      )}
      <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
        {title}
      </h2>
      {desc && <p className="mt-2 max-w-2xl text-sm text-zinc-400">{desc}</p>}
    </div>
  );
}
