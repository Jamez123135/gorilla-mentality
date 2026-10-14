import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), foods: vi.fn(), diary: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/app/lib/food-search", () => ({ findMemberFoods: mocks.foods }));
vi.mock("@/app/lib/actions/meals", () => ({ getNutritionDiary: mocks.diary }));
import { GET as search } from "@/app/api/foods/search/route";
import { GET as diary } from "@/app/api/nutrition/route";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ userId: "owner" });
  mocks.foods.mockResolvedValue([]);
  mocks.diary.mockResolvedValue({ profile: null, meals: [], legacyLog: null });
});

describe("cancellable member nutrition reads", () => {
  it("rejects signed-out requests before accessing any member records", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    expect((await search(new Request("http://localhost/api/foods/search?q=rice"))).status).toBe(401);
    expect((await diary(new Request("http://localhost/api/nutrition?date=2026-10-13"))).status).toBe(401);
    expect(mocks.foods).not.toHaveBeenCalled();
    expect(mocks.diary).not.toHaveBeenCalled();
  });
  it("validates search lengths and actual calendar dates before database reads", async () => {
    expect((await search(new Request(`http://localhost/api/foods/search?q=${"x".repeat(161)}`))).status).toBe(400);
    expect((await search(new Request(`http://localhost/api/foods/search?category=${"x".repeat(101)}`))).status).toBe(400);
    for (const value of ["", "2026-02-30", "yesterday"])
      expect((await diary(new Request(`http://localhost/api/nutrition?date=${value}`))).status).toBe(400);
    expect(mocks.foods).not.toHaveBeenCalled();
    expect(mocks.diary).not.toHaveBeenCalled();
  });
  it("uses the session owner, preserves categories, and prohibits shared or browser caching", async () => {
    const response = await search(new Request("http://localhost/api/foods/search?q=%20rice%20&category=Personal%20label%20foods&userId=victim"));
    expect(mocks.foods).toHaveBeenCalledWith("owner", "rice", "Personal label foods");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const day = await diary(new Request("http://localhost/api/nutrition?date=2026-10-13&userId=victim"));
    expect(mocks.diary).toHaveBeenCalledWith("2026-10-13");
    expect(day.headers.get("cache-control")).toBe("private, no-store");
  });
  it("returns retryable errors without exposing database failures", async () => {
    mocks.foods.mockRejectedValue(new Error("private database details"));
    mocks.diary.mockRejectedValue(new Error("private database details"));
    const response = await search(new Request("http://localhost/api/foods/search"));
    const day = await diary(new Request("http://localhost/api/nutrition?date=2026-10-13"));
    expect(response.status).toBe(500);
    expect(day.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("private database");
    expect(JSON.stringify(await day.json())).not.toContain("private database");
  });
});
