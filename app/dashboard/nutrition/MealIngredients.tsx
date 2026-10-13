import { z } from "zod";

const snapshot = z
  .array(
    z.object({
      grams: z.number().positive(),
      food: z.object({
        name: z.string(),
        preparation: z.string(),
        source: z.string(),
      }),
    }),
  )
  .max(30);

export default function MealIngredients({ value }: { value: unknown }) {
  const parsed = snapshot.safeParse(value);
  if (!parsed.success || !parsed.data.length) return null;
  return (
    <details className="mt-3 text-xs text-zinc-400">
      <summary className="cursor-pointer">Ingredient breakdown</summary>
      <ul className="mt-2 space-y-2">
        {parsed.data.map((entry, index) => (
          <li key={index} className="break-words">
            {Math.round(entry.grams * 100) / 100}g {entry.food.name}
            <span className="block text-zinc-500">
              {entry.food.preparation} / {entry.food.source}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
