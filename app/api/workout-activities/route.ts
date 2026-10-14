import { NextResponse } from "next/server";
import { getActivities } from "@/app/lib/actions/activities";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  try { return NextResponse.json(await getActivities(), { headers }); }
  catch { return NextResponse.json({ error: "Unable to load your activities. Please retry." }, { status: 500, headers }); }
}
