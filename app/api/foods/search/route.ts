import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { findMemberFoods } from "@/app/lib/food-search";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const params = new URL(request.url).searchParams;
  const input = z.object({ q: z.string().trim().max(160), category: z.string().max(100) })
    .safeParse({ q: params.get("q") ?? "", category: params.get("category") ?? "" });
  if (!input.success) return NextResponse.json({ error: "Use a shorter food search." }, { status: 400, headers });
  try {
    return NextResponse.json(await findMemberFoods(userId, input.data.q, input.data.category), { headers });
  } catch {
    return NextResponse.json({ error: "Food search unavailable. Please try again." }, { status: 500, headers });
  }
}
