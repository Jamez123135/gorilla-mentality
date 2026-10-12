import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";
import { profileInput } from "@/app/lib/validation";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile load failed", error);
    return NextResponse.json({ error: "Unable to load your profile" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = profileInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check your intake details" }, { status: 400 });
  try {
    const profile = await prisma.profile.upsert({
      where: { id: userId }, update: parsed.data, create: { id: userId, ...parsed.data },
    });
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile save failed", error);
    return NextResponse.json({ error: "Unable to save your profile" }, { status: 500 });
  }
}
