import Image from "next/image";
import { exerciseReference } from "@/app/lib/exercise-reference";

export default function ExerciseReference({ name }: { name: string }) {
  const reference = exerciseReference(name);
  if (!reference) return null;
  return <details className="my-4 rounded-lg border border-zinc-700">
    <summary className="flex cursor-pointer items-center gap-3 p-3 text-sm text-zinc-300">
      <Image src={reference.images[0]} alt={`${reference.name} movement reference`} width={72} height={54} className="h-14 w-20 shrink-0 rounded bg-white object-contain grayscale" />
      <span><span className="block font-medium text-white">See movement photos</span><span className="mt-1 block text-xs text-zinc-400">{reference.name}</span></span>
    </summary>
    <div className="border-t border-zinc-700 p-3">
      <div className="grid grid-cols-2 gap-3">{reference.images.map((src, index) => <figure key={src}>
        <Image src={src} alt={`${reference.name}, position ${index + 1}`} width={320} height={240} sizes="(max-width: 767px) 40vw, 260px" className="h-40 w-full rounded-lg bg-white object-contain grayscale" />
        <figcaption className="mt-2 text-xs text-zinc-400">Position {index + 1}</figcaption>
      </figure>)}</div>
      <p className="mt-3 text-xs text-zinc-400">Photo example: {reference.name}. Match the equipment and variation you use.</p>
      <a href={reference.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block min-h-8 text-xs text-yellow-500 underline">Photo source</a>
    </div>
  </details>;
}
