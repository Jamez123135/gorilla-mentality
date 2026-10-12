import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  try {
    const photo = await prisma.progressPhoto.findFirst({ where: { id, userId } });
    if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    if (photo.url.startsWith("data:image/jpeg;base64,")) {
      return new Response(new Uint8Array(Buffer.from(photo.url.slice("data:image/jpeg;base64,".length), "base64")), {
        headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
      });
    }
    // Historical uploads may already have a Supabase public URL.
    const legacyUrl = new URL(photo.url);
    if (legacyUrl.protocol === "https:" && legacyUrl.hostname.endsWith(".supabase.co")) return NextResponse.redirect(legacyUrl);
    return NextResponse.json({ error: "Image unavailable" }, { status: 404 });
  } catch (error) {
    console.error("Photo load failed", error);
    return NextResponse.json({ error: "Unable to load this photo" }, { status: 500 });
  }
}
