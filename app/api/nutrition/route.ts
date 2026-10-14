import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getNutritionDiary } from "@/app/lib/actions/meals";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const date = z.iso.date().safeParse(new URL(request.url).searchParams.get("date"));
  if (!date.success) return NextResponse.json({ error: "Choose a valid diary date." }, { status: 400, headers });
  try {
    return NextResponse.json(await getNutritionDiary(date.data), { headers });
  } catch {
    return NextResponse.json({ error: "Unable to load your food diary. Please try again." }, { status: 500, headers });
  }
}
