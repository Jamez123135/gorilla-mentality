import { goalLabels } from "@/app/lib/starter-pack/plan-generator";
import type { Goal, StarterPlan } from "@/app/types/starter-pack";

const pageWidth = 595;
const pageHeight = 842;
const marginX = 48;
const firstLineY = 790;
const lineHeight = 15;
const linesPerPage = 48;
const wrapAt = 88;

export function createStarterPlanPdf(plan: StarterPlan, goal: Goal, days: number) {
  const pages = paginateLines(buildPlanLines(plan, goal, days));
  const pdf = buildPdfDocument(pages);

  return new Blob([pdf], { type: "application/pdf" });
}

function buildPlanLines(plan: StarterPlan, goal: Goal, days: number) {
  const lines: string[] = [
    "GORILLA MENTALITY STARTER PLAN",
    plan.title,
    "",
    `Goal: ${goalLabels[goal]}`,
    `Training days: ${days}`,
    `Split: ${plan.splitLabel}`,
    `Calories: ${plan.nutrition.calories}`,
    `Protein: ${plan.nutrition.proteinMin}-${plan.nutrition.proteinMax}g`,
    "",
    "TRAINING TARGETS",
    `Cardio: ${plan.trainingAdjustment.cardio}`,
    `Movement: ${plan.trainingAdjustment.steps}`,
    `Effort: ${plan.trainingAdjustment.effort}`,
    `Progression: ${plan.setGuidance}`,
    "",
    "TRAINING ROUTINE",
  ];

  plan.selectedSessions.forEach((session, index) => {
    lines.push("");
    lines.push(`Day ${index + 1}: ${session.title}`);
    lines.push(session.intent);
    lines.push(`Warm-up: ${session.warmup}`);
    session.exercises.forEach((exercise) => {
      lines.push(`- ${exercise.name}: ${exercise.details}`);
    });
    lines.push(`Finish: ${session.finisher}`);
  });

  lines.push("");
  lines.push("MEAL GUIDE");
  lines.push(
    "High protein, whole foods, portion control, no fried foods or added oils, no processed foods, zero sugar, and no alcohol.",
  );

  plan.meals.forEach((meal) => {
    lines.push("");
    lines.push(`${meal.title}: ${meal.calories} calories / ${meal.protein}g protein`);
    meal.items.forEach((item) => lines.push(`- ${item}`));
  });

  lines.push("");
  lines.push(
    `Sample day total: ${plan.mealTotals.calories} calories and ${plan.mealTotals.protein}g protein.`,
  );
  lines.push(
    "Adjust serving sizes by adding or removing rice, potato, oats, fruit, or lean protein first.",
  );

  return lines.flatMap((line) => wrapLine(line));
}

function wrapLine(line: string) {
  if (!line) return [""];

  const words = line.split(" ");
  const wrapped: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= wrapAt) {
      current = next;
      return;
    }

    if (current) wrapped.push(current);
    current = word;
  });

  if (current) wrapped.push(current);
  return wrapped;
}

function paginateLines(lines: string[]) {
  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  return pages.length ? pages : [["Gorilla Mentality starter plan"]];
}

function buildPdfDocument(pages: string[][]) {
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((pageLines, index) => {
    const pageId = 4 + index * 2;
    const contentId = pageId + 1;
    pageObjectIds.push(pageId);

    const stream = buildPageStream(pageLines, index + 1, pages.length);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    objects.push(`<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  });

  objects[1] =
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;

  return assemblePdf(objects);
}

function buildPageStream(lines: string[], pageNumber: number, pageCount: number) {
  const escapedLines = lines.map(escapePdfText);
  const textLines = escapedLines
    .map((line) => `(${line}) Tj T*`)
    .join("\n");

  return [
    "BT",
    "/F1 11 Tf",
    `${lineHeight} TL`,
    `${marginX} ${firstLineY} Td`,
    textLines,
    "ET",
    "BT",
    "/F1 9 Tf",
    `${marginX} 32 Td`,
    `(Gorilla Mentality - Page ${pageNumber} of ${pageCount}) Tj`,
    "ET",
  ].join("\n");
}

function assemblePdf(objects: string[]) {
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function escapePdfText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
