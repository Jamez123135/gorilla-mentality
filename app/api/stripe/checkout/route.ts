import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    // We are removing Stripe logic as requested. 
    // This route is now deprecated in favor of the Coaching Application.
    return NextResponse.json({ 
      error: "Payments are now handled via Coaching Applications. Please apply at /pricing" 
    }, { status: 403 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
