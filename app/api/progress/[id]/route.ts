import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  try {
    const result = await prisma.progressPhoto.deleteMany({ where: { id, userId } });
    if (!result.count) return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Photo delete failed", error);
    return NextResponse.json({ error: "Unable to delete your photo" }, { status: 500 });
  }
}
