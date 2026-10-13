import sharp from "sharp";
import { mkdir } from "node:fs/promises";
await mkdir("e2e/fixtures", { recursive: true });
const rows = [
  ["Serving size 1 cup (55g)", 165],
  ["Calories 220", 230],
  ["Total Fat 7g   9%", 315],
  ["Saturated Fat 2g   10%", 370],
  ["Total Carbohydrate 35g   13%", 450],
  ["Dietary Fiber 4g", 505],
  ["Total Sugars 9g", 560],
  ["Protein 5g", 635],
];
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="760"><rect width="800" height="760" fill="white"/><rect x="24" y="24" width="752" height="712" fill="none" stroke="black" stroke-width="4"/><text x="48" y="95" font-family="Arial" font-weight="bold" font-size="60">Nutrition Facts</text><path d="M40 115H760 M40 265H760 M40 675H760" stroke="black" stroke-width="10"/>${rows.map(([text, y]) => `<text x="48" y="${y}" font-family="Arial" font-size="${y === 230 ? 52 : 34}" font-weight="${y === 230 ? "bold" : "normal"}">${text}</text>`).join("")}<text x="48" y="714" font-family="Arial" font-size="20">Synthetic OCR regression fixture, not a product label.</text></svg>`;
await sharp(Buffer.from(svg)).png().toFile("e2e/fixtures/nutrition-label.png");
await sharp({
  create: { width: 800, height: 760, channels: 3, background: "white" },
})
  .png()
  .toFile("e2e/fixtures/blank-label.png");
console.log("Created deterministic label-scanner test images.");
