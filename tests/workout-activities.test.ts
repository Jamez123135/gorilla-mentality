import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(), profile: { upsert: vi.fn() },
  workoutActivity: { upsert: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() },
  transaction: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/app/lib/prisma", () => ({ prisma: { ...mocks, $transaction: mocks.transaction } }));
import { saveActivity, getActivities, deleteActivity } from "@/app/lib/actions/activities";
import { activityInput, recordedSets } from "@/app/lib/activity-input";
import { GET } from "@/app/api/workout-activities/route";
const id = "41f33906-99c1-4a48-82aa-2e9db6443b20";
const strength = { id, date: "2026-10-14", kind: "strength", name: "Unplanned curl", unit: "kg", sets: [{ weight: 10, reps: 12 }] };
const cardio = { id, date: "2026-10-14", kind: "cardio", name: "Running", minutes: 30, distance: 5, distanceUnit: "km" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ userId: "owner" });
  mocks.transaction.mockImplementation((callback) => callback(mocks));
  mocks.workoutActivity.findMany.mockResolvedValue([]);
  mocks.workoutActivity.upsert.mockImplementation(({ create }) => create);
});
describe("additional member workouts and cardio", () => {
  it("allows an exercise outside a plan and normalizes kilograms without creating a planned session", async () => {
    const saved = await saveActivity({ ...strength, userId: "victim" });
    expect(saved.userId).toBe("owner");
    const sets = recordedSets.parse(saved.sets);
    expect(sets[0].weightLb).toBeCloseTo(22.046226218);
    expect(sets[0].reps).toBe(12);
    expect(mocks.profile.upsert).toHaveBeenCalledWith({ where: { id: "owner" }, create: { id: "owner" }, update: {} });
  });
  it("records bodyweight reps and cardio duration/distance without inventing calorie burn", async () => {
    expect(recordedSets.parse((await saveActivity({ ...strength, sets: [{ weight: null, reps: 20 }] })).sets)[0].weightLb).toBeNull();
    const saved = await saveActivity(cardio);
    expect(saved).toMatchObject({ kind: "cardio", minutes: 30, distance: 5, distanceUnit: "km" });
    expect(saved).not.toHaveProperty("calories");
    expect((await saveActivity({ ...cardio, distance: null })).distanceUnit).toBeNull();
  });
  it("reuses the draft ID for retries with compound ownership", async () => {
    await saveActivity(strength); await saveActivity(strength);
    for (const [call] of mocks.workoutActivity.upsert.mock.calls) {
      expect(call.where).toEqual({ id_userId: { id, userId: "owner" } });
      expect(call.update).not.toHaveProperty("userId");
      expect(call.create.id).toBe(id);
    }
  });
  it("bounds sets, reps, duration, distance and names before writes", async () => {
    for (const input of [
      { ...strength, sets: [] }, { ...strength, sets: [{ weight: -1, reps: 12 }] },
      { ...strength, sets: [{ weight: 10, reps: 0 }] }, { ...strength, sets: [{ weight: 10, reps: 1.5 }] },
      { ...cardio, minutes: 0 }, { ...cardio, minutes: 1441 }, { ...cardio, distance: -5 },
      { ...cardio, name: " " }, { ...cardio, date: "2026-02-30" },
    ]) {
      expect(activityInput.safeParse(input).success).toBe(false);
      await expect(saveActivity(input)).rejects.toThrow();
    }
    expect(mocks.workoutActivity.upsert).not.toHaveBeenCalled();
  });
  it("protects listing, deletion and private GET responses", async () => {
    const response = await GET();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.workoutActivity.findMany.mock.calls[0][0].where).toEqual({ userId: "owner" });
    mocks.workoutActivity.deleteMany.mockResolvedValue({ count: 0 });
    await expect(deleteActivity(id)).rejects.toThrow("Activity not found");
    expect(mocks.workoutActivity.deleteMany).toHaveBeenCalledWith({ where: { id, userId: "owner" } });
    mocks.auth.mockResolvedValue({ userId: null });
    await expect(saveActivity(strength)).rejects.toThrow("Unauthorized");
    await expect(getActivities()).rejects.toThrow("Unauthorized");
    await expect(deleteActivity(id)).rejects.toThrow("Unauthorized");
    expect((await GET()).status).toBe(401);
  });
});
