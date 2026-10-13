import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "public/ocr/v7");
await mkdir(path.join(output, "core"), { recursive: true });
await mkdir(path.join(output, "lang"), { recursive: true });
const manifest = [];
async function copy(source, destination) {
  const file = await readFile(path.join(root, "node_modules", source));
  await copyFile(
    path.join(root, "node_modules", source),
    path.join(output, destination),
  );
  manifest.push({
    file: destination,
    bytes: file.length,
    sha256: createHash("sha256").update(file).digest("hex"),
  });
}
await copy("tesseract.js/dist/worker.min.js", "worker.min.js");
await copy("tesseract.js/LICENSE.md", "TESSERACT-LICENSE.txt");
await copy("tesseract.js-core/LICENSE", "CORE-LICENSE.txt");
for (const file of await readdir(
  path.join(root, "node_modules/tesseract.js-core"),
)) {
  if (file.endsWith(".wasm.js"))
    await copy(`tesseract.js-core/${file}`, `core/${file}`);
}
for (const language of ["eng", "fra", "spa"]) {
  await copy(
    `@tesseract.js-data/${language}/4.0.0_best_int/${language}.traineddata.gz`,
    `lang/${language}.traineddata.gz`,
  );
}
await writeFile(
  path.join(output, "manifest.json"),
  JSON.stringify(
    {
      engine: "tesseract.js@7.0.0",
      languages: ["eng", "fra", "spa"],
      files: manifest,
    },
    null,
    2,
  ),
);
console.log(
  `Prepared ${manifest.length} self-hosted OCR assets. No label photos are uploaded.`,
);
