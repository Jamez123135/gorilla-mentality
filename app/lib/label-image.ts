import type { PercentCrop } from "react-image-crop";
import { imageSize } from "image-size";
const formats = ["image/jpeg", "image/png", "image/webp"];
const toBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Unable to prepare this image.")),
      "image/png",
    ),
  );
export async function loadLabelPhoto(file: File) {
  if (!formats.includes(file.type))
    throw new Error(
      "Choose a JPEG, PNG or WebP photo. HEIC, PDF and GIF files are not supported.",
    );
  if (!file.size || file.size > 20 * 1024 * 1024)
    throw new Error("Choose a non-empty photo smaller than 20 MB.");
  let metadata: ReturnType<typeof imageSize>;
  try {
    metadata = imageSize(new Uint8Array(await file.arrayBuffer()));
  } catch {
    throw new Error(
      "This photo could not be decoded. Choose another JPEG, PNG or WebP image.",
    );
  }
  if (!["jpg", "png", "webp"].includes(metadata.type ?? ""))
    throw new Error("The file contents are not a supported label photo.");
  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width * metadata.height > 40000000
  )
    throw new Error(
      "This image is too large to read safely on a phone. Choose a smaller photo.",
    );
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (
      !image.naturalWidth ||
      !image.naturalHeight ||
      image.naturalWidth * image.naturalHeight > 40000000
    )
      throw new Error(
        "This image is too large to read safely on a phone. Choose a smaller photo.",
      );
    const scale = Math.min(
      1,
      2400 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Photo preparation is unavailable in this browser.");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await toBlob(canvas);
  } catch (error) {
    if (error instanceof Error && error.message.includes("photo")) throw error;
    throw new Error(
      "This photo could not be decoded. Choose another JPEG, PNG or WebP image.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function cropLabelImage(
  image: HTMLImageElement,
  crop: PercentCrop,
  rotate = false,
) {
  if (
    !image.naturalWidth ||
    !image.naturalHeight ||
    crop.width < 5 ||
    crop.height < 5
  )
    throw new Error("Select a larger label area.");
  const x = (Math.max(0, Math.min(100, crop.x)) / 100) * image.naturalWidth;
  const y = (Math.max(0, Math.min(100, crop.y)) / 100) * image.naturalHeight;
  const width = Math.min(
    (crop.width / 100) * image.naturalWidth,
    image.naturalWidth - x,
  );
  const height = Math.min(
    (crop.height / 100) * image.naturalHeight,
    image.naturalHeight - y,
  );
  if (width < 60 || height < 60)
    throw new Error("Select a larger, clearer nutrition label.");
  const scale = Math.min(1, 1800 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round((rotate ? height : width) * scale);
  canvas.height = Math.round((rotate ? width : height) * scale);
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("Photo preparation is unavailable in this browser.");
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (rotate) {
    context.translate(canvas.width, 0);
    context.rotate(Math.PI / 2);
  }
  context.drawImage(
    image,
    x,
    y,
    width,
    height,
    0,
    0,
    width * scale,
    height * scale,
  );
  return toBlob(canvas);
}
