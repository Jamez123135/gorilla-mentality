import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  profile: { findUnique: vi.fn(), upsert: vi.fn() },
  exercise: { findMany: vi.fn(), upsert: vi.fn() },
  workoutLog: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  workoutSession: { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() },
  nutritionLog: { findUnique: vi.fn(), upsert: vi.fn() },
  progressPhoto: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  transaction: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/app/lib/prisma", () => ({
  prisma: { ...mocks, $transaction: mocks.transaction },
}));

import {
  GET as getProfile,
  POST as saveProfile,
} from "@/app/api/profile/route";
import {
  GET as getPhotos,
  POST as uploadPhoto,
} from "@/app/api/progress/route";
import { DELETE as deletePhoto } from "@/app/api/progress/[id]/route";
import { GET as getImage } from "@/app/api/progress/[id]/image/route";
import { getWorkout, saveWorkout } from "@/app/lib/actions/workouts";
import {
  getNutritionData,
  saveNutritionLog,
} from "@/app/lib/actions/nutrition";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ userId: "owner" });
  mocks.profile.findUnique.mockResolvedValue({
    id: "owner",
    sex: "female",
    trainingDays: 4,
  });
  mocks.workoutLog.findMany.mockResolvedValue([]);
  mocks.workoutSession.findMany.mockResolvedValue([]);
  mocks.transaction.mockImplementation((callback) => callback(mocks));
});

describe("authenticated profile access", () => {
  it("loads only the signed-in profile", async () => {
    await getProfile();
    expect(mocks.profile.findUnique).toHaveBeenCalledWith({
      where: { id: "owner" },
    });
  });
  it("ignores a submitted user ID when saving an intake", async () => {
    mocks.profile.upsert.mockResolvedValue({ id: "owner" });
    const body = {
      id: "victim",
      fullName: "Alex",
      sex: "female",
      goal: "recomp",
      currentWeight: 150,
      trainingExperience: "new",
      trainingDays: 4,
      targetCalories: 1800,
      targetProtein: 150,
    };
    const response = await saveProfile(
      new Request("http://localhost/api/profile", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.profile.upsert.mock.calls[0][0].where).toEqual({
      id: "owner",
    });
    expect(mocks.profile.upsert.mock.calls[0][0].create.id).toBe("owner");
  });
  it("rejects invalid JSON before touching the database", async () => {
    const response = await saveProfile(
      new Request("http://localhost/api/profile", {
        method: "POST",
        body: "{",
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.profile.upsert).not.toHaveBeenCalled();
  });
});

describe("workout and nutrition persistence", () => {
  it("returns only one selected day from the user's split with real exercise IDs", async () => {
    mocks.exercise.upsert.mockImplementation(({ create }) =>
      Promise.resolve({ id: create.name, name: create.name }),
    );
    const workout = await getWorkout(1);
    expect(workout?.days).toBe(4);
    expect(workout?.exercises.every((ex) => ex.id === ex.name)).toBe(true);
    expect(workout?.title).toMatch(/glute|lower/i);
  });
  it("advances the planned day after a finished session", async () => {
    mocks.workoutSession.findMany.mockResolvedValue([
      { dayNumber: 1, workoutDate: new Date("2026-10-10"), isCompleted: true },
    ]);
    mocks.exercise.upsert.mockImplementation(({ create }) =>
      Promise.resolve({ id: create.name, name: create.name }),
    );
    expect((await getWorkout())?.day).toBe(2);
  });
  it("resumes the active session before advancing", async () => {
    const date = new Date("2026-10-10");
    mocks.workoutSession.findMany.mockResolvedValue([
      { dayNumber: 1, workoutDate: date, isCompleted: false },
    ]);
    mocks.exercise.upsert.mockImplementation(({ create }) =>
      Promise.resolve({ id: create.name, name: create.name }),
    );
    const result = await getWorkout();
    expect(result?.resumed).toBe(true);
    expect(result?.workoutDate).toBe(date.toISOString());
  });
  it("replaces the same user's session on repeat saves", async () => {
    mocks.exercise.findMany.mockResolvedValue([{ id: "allowed" }]);
    const input = {
      workoutDate: new Date().toISOString(),
      sets: [
        {
          exerciseId: "allowed",
          weight: null,
          reps: 8,
          setNumber: 1,
          isCompleted: true,
        },
      ],
    };
    await saveWorkout(input);
    await saveWorkout(input);
    expect(mocks.workoutLog.deleteMany).toHaveBeenCalledTimes(2);
    expect(mocks.workoutLog.deleteMany).toHaveBeenLastCalledWith({
      where: { userId: "owner", workoutDate: new Date(input.workoutDate) },
    });
    expect(
      mocks.workoutLog.createMany.mock.calls[0][0].data[0].weight,
    ).toBeNull();
    expect(mocks.workoutLog.createMany.mock.calls[0][0].data[0].userId).toBe(
      "owner",
    );
  });
  it("rejects an exercise outside the user's plan", async () => {
    mocks.exercise.findMany.mockResolvedValue([]);
    await expect(
      saveWorkout({
        workoutDate: new Date().toISOString(),
        sets: [
          {
            exerciseId: "foreign",
            weight: 20,
            reps: 8,
            setNumber: 1,
            isCompleted: true,
          },
        ],
      }),
    ).rejects.toThrow();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("uses the selected local date for loading and upserting nutrition", async () => {
    await getNutritionData("2026-10-11");
    await saveNutritionLog(1900, 150, "2026-10-11");
    const key = {
      userId_logDate: {
        userId: "owner",
        logDate: new Date("2026-10-11T00:00:00.000Z"),
      },
    };
    expect(mocks.nutritionLog.findUnique).toHaveBeenCalledWith({ where: key });
    expect(mocks.nutritionLog.upsert.mock.calls[0][0].where).toEqual(key);
  });
});

describe("private progress photos", () => {
  const context = { params: Promise.resolve({ id: "photo-1" }) };
  it("lists photo metadata without exposing stored image payloads", async () => {
    mocks.progressPhoto.findMany.mockResolvedValue([
      { id: "photo-1", createdAt: new Date(), label: "Progress" },
    ]);
    const response = await getPhotos();
    const photos = await response.json();
    expect(photos[0].url).toBe("/api/progress/photo-1/image");
    expect(mocks.progressPhoto.findMany.mock.calls[0][0].where).toEqual({
      userId: "owner",
    });
  });
  it("validates the image before storing it and creates the owner's profile if needed", async () => {
    const bytes = await sharp({
      create: { width: 10, height: 10, channels: 3, background: "red" },
    })
      .png()
      .toBuffer();
    const body = new FormData();
    body.append(
      "photo",
      new Blob([new Uint8Array(bytes)], { type: "image/png" }),
      "photo.png",
    );
    mocks.progressPhoto.create.mockResolvedValue({
      id: "photo-1",
      createdAt: new Date(),
      label: "Progress Update",
    });
    const response = await uploadPhoto(
      new Request("http://localhost/api/progress", { method: "POST", body }),
    );
    expect(response.status).toBe(201);
    expect(mocks.progressPhoto.create.mock.calls[0][0].data.userId).toBe(
      "owner",
    );
    expect(mocks.progressPhoto.create.mock.calls[0][0].data.url).toMatch(
      /^data:image\/jpeg;base64,/,
    );
    expect((await response.json()).url).not.toContain("base64");
  });
  it("rejects files pretending to be images", async () => {
    const body = new FormData();
    body.append(
      "photo",
      new Blob(["not an image"], { type: "image/jpeg" }),
      "photo.jpg",
    );
    const response = await uploadPhoto(
      new Request("http://localhost/api/progress", { method: "POST", body }),
    );
    expect(response.status).toBe(400);
    expect(mocks.progressPhoto.create).not.toHaveBeenCalled();
  });
  it("cannot read or delete another user's photo", async () => {
    mocks.progressPhoto.findFirst.mockResolvedValue(null);
    mocks.progressPhoto.deleteMany.mockResolvedValue({ count: 0 });
    expect(
      (await getImage(new Request("http://localhost"), context)).status,
    ).toBe(404);
    expect(
      (await deletePhoto(new Request("http://localhost"), context)).status,
    ).toBe(404);
    expect(mocks.progressPhoto.findFirst).toHaveBeenCalledWith({
      where: { id: "photo-1", userId: "owner" },
    });
    expect(mocks.progressPhoto.deleteMany).toHaveBeenCalledWith({
      where: { id: "photo-1", userId: "owner" },
    });
  });
  it("serves authenticated JPEGs without public caching", async () => {
    mocks.progressPhoto.findFirst.mockResolvedValue({
      url: "data:image/jpeg;base64,aGVsbG8=",
    });
    const response = await getImage(new Request("http://localhost"), context);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-type")).toBe("image/jpeg");
  });
});

it("rejects signed-out reads and writes", async () => {
  mocks.auth.mockResolvedValue({ userId: null });
  expect((await getProfile()).status).toBe(401);
  expect((await getPhotos()).status).toBe(401);
  expect((await saveProfile(new Request("http://localhost"))).status).toBe(401);
  expect((await uploadPhoto(new Request("http://localhost"))).status).toBe(401);
  await expect(saveWorkout({})).rejects.toThrow("Unauthorized");
  await expect(saveNutritionLog(100, 10)).rejects.toThrow("Unauthorized");
  expect(mocks.profile.findUnique).not.toHaveBeenCalled();
});
