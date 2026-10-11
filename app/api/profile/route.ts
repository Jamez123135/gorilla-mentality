import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id },
    });

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, sex, goal, currentWeight, targetWeight, trainingExperience, trainingDays, targetCalories, targetProtein, fullName } = body;

    const profile = await prisma.profile.upsert({
      where: { id },
      update: {
        sex,
        goal,
        currentWeight,
        targetWeight,
        trainingExperience,
        trainingDays,
        targetCalories,
        targetProtein,
        fullName,
      },
      create: {
        id,
        sex,
        goal,
        currentWeight,
        targetWeight,
        trainingExperience,
        trainingDays,
        targetCalories,
        targetProtein,
        fullName,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
