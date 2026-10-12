import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import sharp from "sharp";
import { prisma } from "@/app/lib/prisma";
import { MAX_PHOTO_BYTES, photoUrl } from "@/app/lib/progress-photos";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const photos = await prisma.progressPhoto.findMany({
      where: { userId }, orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, label: true },
    });
    return NextResponse.json(photos.map(photo => ({ ...photo, url: photoUrl(photo.id) })));
  } catch (error) {
    console.error("Progress load failed", error);
    return NextResponse.json({ error: "Unable to load your photos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (Number(request.headers.get("content-length")) > MAX_PHOTO_BYTES + 65536) {
    return NextResponse.json({ error: "Photo is too large" }, { status: 413 });
  }
  let file: FormDataEntryValue | null;
  try { file = (await request.formData()).get("photo"); }
  catch { return NextResponse.json({ error: "Invalid upload" }, { status: 400 }); }
  if (!(file instanceof File) || !file.size || file.size > MAX_PHOTO_BYTES || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Choose a JPEG, PNG, or WebP photo under 2 MB" }, { status: 400 });
  }
  let data: Buffer;
  try {
    data = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40000000 })
      .rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  } catch {
    return NextResponse.json({ error: "This image could not be read. Please choose another photo." }, { status: 400 });
  }
  if (data.length > MAX_PHOTO_BYTES) return NextResponse.json({ error: "Photo is too large" }, { status: 413 });
  try {
    // Store the compressed image in the existing schema; only owner-checked routes expose it.
    await prisma.profile.upsert({ where: { id: userId }, update: {}, create: { id: userId } });
    const photo = await prisma.progressPhoto.create({ data: { userId, url: `data:image/jpeg;base64,${data.toString("base64")}`, label: "Progress Update" } });
    return NextResponse.json({ id: photo.id, createdAt: photo.createdAt, label: photo.label, url: photoUrl(photo.id) }, { status: 201 });
  } catch (error) {
    console.error("Progress upload failed", error);
    return NextResponse.json({ error: "Unable to save your photo. Please try again." }, { status: 500 });
  }
}
