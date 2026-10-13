export const labelFields = ["calories", "protein", "carbs", "fat"] as const;
export type LabelField = (typeof labelFields)[number];
export type LabelBasis = "serving" | "100g" | "custom";
export type LabelCandidate = {
  value: number | null;
  printed: string;
  line: string;
};
export type LabelReadings = {
  candidates: Record<LabelField, LabelCandidate[]>;
  servingGrams: number | null;
  basis: LabelBasis | null;
  columns: number;
  warnings: string[];
};
const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const nutrientNames: Record<Exclude<LabelField, "calories">, RegExp> = {
  fat: /^(?:total\s+fat|fat\b|lipides\b|matieres\s+grasses|grasa(?:s)?\s+totales|grasas\b|grasa\b)/,
  carbs:
    /^(?:total\s+carbohydrate[s]?|total\s+carb(?:ohydrates?)?\.?|carbohydrate[s]?|glucides\b|hidratos\s+de\s+carbono|carbohidratos\b)/,
  protein: /^(?:protein[eas]?s?\b|proteines\b|proteinas\b)/,
};
function amounts(
  text: string,
  line: string,
  kind: "grams" | "energy",
): LabelCandidate[] {
  const pattern =
    kind === "grams"
      ? /(?:^|[\s:/;(])([<>~\u2264]?\s*\d+(?:[.,]\d+)?)\s*(?:g|grams?|grammes?)\b/gi
      : /(?:^|[\s:/;(])([<>~\u2264]?\s*\d+(?:[.,]\d+)?)\s*(kcal|kj|%|g|mg)?(?![a-z0-9.,])/gi;
  return [...text.matchAll(pattern)].flatMap((match) => {
    if (kind === "energy" && match[2] && match[2].toLowerCase() !== "kcal")
      return [];
    const raw = match[1].trim();
    const approximate = /^[<>~\u2264]/.test(raw);
    const parsed = Number(raw.replace(/[<>~\u2264\s]/g, "").replace(",", "."));
    if (
      !Number.isFinite(parsed) ||
      parsed < 0 ||
      parsed > (kind === "energy" ? 10000 : 1000)
    )
      return [];
    return [
      { value: approximate ? null : parsed, printed: match[0].trim(), line },
    ];
  });
}
export function parseNutritionLabel(text: string): LabelReadings {
  const lines = text
    .slice(0, 16000)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 160);
  const candidates: LabelReadings["candidates"] = {
    calories: [],
    protein: [],
    carbs: [],
    fat: [],
  };
  const warnings: string[] = [];
  const servingWeights = new Set<number>();
  let uncertainWeight = false;
  for (let index = 0; index < lines.length; index++) {
    const original = lines[index];
    const line = fold(original).replace(/^[-|:]+\s*/, "");
    if (
      /^(?:serving\s+size|per\s+(?:portion|serving)|portion\b|taille\s+de\s+portion|tamano\s+de\s+(?:la\s+)?porcion|porcion\b)/.test(
        line,
      )
    ) {
      const weights = amounts(line, original, "grams").filter(
        (item) => item.value !== null,
      );
      if (
        weights.length === 1 &&
        weights[0].value! > 0 &&
        weights[0].value! <= 2000
      )
        servingWeights.add(weights[0].value!);
      else if (weights.length > 1) uncertainWeight = true;
    }
    for (const field of labelFields) {
      let remainder: string | null = null;
      if (field === "calories") {
        const name = line.match(
          /^calori(?:es|as)\b(?!\s+(?:from|de\s+la\s+grasa))/,
        );
        if (name) remainder = line.slice(name[0].length);
        else if (
          /^(?:energy|energie|energia|valeur\s+energetique)\b/.test(line)
        ) {
          // Only explicitly printed kcal values, never kJ or calculated 4/4/9 energy.
          const kcal = [
            ...line.matchAll(/([<>~\u2264]?\s*\d+(?:[.,]\d+)?)\s*kcal\b/g),
          ];
          remainder = kcal.map((match) => match[0]).join(" ");
        }
      } else {
        const name = line.match(nutrientNames[field]);
        if (name)
          remainder = line
            .slice(name[0].length)
            .replace(
              /^\s*\/\s*(?:lipides|fat|glucides|carbohydrates?|proteines|proteins?)\b/,
              "",
            );
      }
      if (remainder === null) continue;
      let detected = amounts(
        remainder,
        original,
        field === "calories" ? "energy" : "grams",
      );
      if (
        !detected.length &&
        !/\d/.test(remainder) &&
        index + 1 < lines.length &&
        /^[<>~\u2264]?\s*\d/.test(lines[index + 1])
      ) {
        detected = amounts(
          fold(lines[index + 1]),
          original + " / " + lines[index + 1],
          field === "calories" ? "energy" : "grams",
        );
      }
      if (candidates[field].length && detected.length)
        warnings.push(
          `Repeated ${field} rows: verify the correct label values.`,
        );
      candidates[field].push(...detected);
    }
  }
  const normalized = fold(text);
  const per100 = /(?:per|pour|por|par|\/|for)\s*100\s*g\b/.test(normalized);
  const perServing =
    /per\s+(?:serving|portion)|par\s+portion|por\s+porcion|amount\s+per\s+serving|serving\s+size/.test(
      normalized,
    );
  const container = lines.some((original) => {
    const row = fold(original);
    return (
      !/servings?\s+per\s+(?:container|package)/.test(row) &&
      /per\s+(?:container|package)|as\s+prepared|as\s+sold|prepared\s+with|por\s+envase/.test(
        row,
      )
    );
  });
  const columns = Math.max(
    1,
    ...labelFields.map((field) => candidates[field].length),
  );
  if (columns > 1 || container || (per100 && perServing))
    warnings.push(
      "Multiple label columns or preparation bases: choose one column and confirm its reference weight.",
    );
  for (const field of labelFields) {
    if (!candidates[field].length)
      warnings.push(`No reliable ${field} reading. Enter it from the label.`);
    if (candidates[field].some((value) => value.value === null))
      warnings.push(
        `Approximate ${field} amount: enter a reviewed estimate instead of treating it as exact.`,
      );
  }
  if (servingWeights.size > 1 || uncertainWeight)
    warnings.push(
      "Several portion weights were detected. Confirm the reference weight.",
    );
  const servingGrams =
    servingWeights.size === 1 && !uncertainWeight
      ? [...servingWeights][0]
      : null;
  if (perServing && servingGrams === null)
    warnings.push(
      "Gram serving weight was not reliably read. Enter it from the label; volume is not gram weight.",
    );
  return {
    candidates,
    servingGrams,
    basis:
      columns === 1 && !container
        ? per100 && !perServing
          ? "100g"
          : perServing && !per100
            ? "serving"
            : null
        : null,
    columns: Math.min(columns, 4),
    warnings: [...new Set(warnings)],
  };
}
export function selectedLabelValues(
  result: LabelReadings,
  column: number,
  basis: LabelBasis,
) {
  return {
    servingGrams:
      basis === "100g" ? 100 : basis === "serving" ? result.servingGrams : null,
    ...(Object.fromEntries(
      labelFields.map((field) => [
        field,
        result.candidates[field][column]?.value ?? null,
      ]),
    ) as Record<LabelField, number | null>),
  };
}
