import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  profile: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  communityPost: {
    create: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  communityComment: { create: vi.fn(), count: vi.fn(), deleteMany: vi.fn() },
  communityLike: { upsert: vi.fn(), deleteMany: vi.fn() },
  communityReport: { upsert: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() },
  mealEntry: { create: vi.fn() },
  transaction: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/app/lib/prisma", () => ({
  prisma: { ...mocks, $transaction: mocks.transaction },
}));
import {
  publishCommunityPost,
  editCommunityPost,
  deleteCommunityPost,
  publishCommunityComment,
  deleteCommunityComment,
  setCommunityLike,
  reportCommunityPost,
  getCommunityFeed,
  getCommunityReports,
  dismissCommunityReport,
} from "@/app/lib/actions/community";
import { saveRoutinePreferences } from "@/app/lib/actions/routine";
import { saveCalculatedMeal } from "@/app/lib/actions/meals";
const id = "8b8376ca-69c7-4e12-bd3e-36f0d0b4e756";
// Loading the source catalog is fixture setup, outside the action assertion's timeout.
beforeAll(async () => { await import("@/app/lib/owned-foods"); });
const post = {
  body: "Made progress today",
  authorName: "Member",
  category: "milestone",
  userId: "victim",
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("COMMUNITY_MODERATOR_IDS", "");
  mocks.auth.mockResolvedValue({ userId: "owner" });
  mocks.transaction.mockImplementation((callback) => callback(mocks));
  mocks.communityPost.count.mockResolvedValue(0);
  mocks.communityComment.count.mockResolvedValue(0);
  mocks.communityPost.updateMany.mockResolvedValue({ count: 1 });
  mocks.communityPost.deleteMany.mockResolvedValue({ count: 1 });
  mocks.communityComment.deleteMany.mockResolvedValue({ count: 1 });
});
describe("community ownership and moderation", () => {
  it("rejects unauthenticated access", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    await expect(getCommunityFeed()).rejects.toThrow("Unauthorized");
    await expect(publishCommunityPost(post)).rejects.toThrow("Unauthorized");
    expect(mocks.communityPost.create).not.toHaveBeenCalled();
  });
  it("uses the authenticated owner and validates post content", async () => {
    await publishCommunityPost(post);
    expect(mocks.communityPost.create).toHaveBeenCalledWith({
      data: {
        body: post.body,
        authorName: "Member",
        category: "milestone",
        userId: "owner",
      },
    });
    await expect(
      publishCommunityPost({ ...post, body: " " }),
    ).rejects.toThrow();
    await expect(
      publishCommunityPost({ ...post, body: "a".repeat(2001) }),
    ).rejects.toThrow();
  });
  it("checks per-member publishing limits inside a transaction", async () => {
    mocks.communityPost.count.mockResolvedValue(3);
    await expect(publishCommunityPost(post)).rejects.toThrow(/wait a minute/);
    expect(mocks.communityPost.create).not.toHaveBeenCalled();
  });
  it("scopes editing and deletion to the owner, not a submitted user ID", async () => {
    await editCommunityPost(id, post);
    await deleteCommunityPost(id);
    await deleteCommunityComment(id);
    expect(mocks.communityPost.updateMany.mock.calls[0][0].where).toEqual({
      id,
      userId: "owner",
    });
    expect(mocks.communityPost.deleteMany.mock.calls[0][0].where).toEqual({
      id,
      userId: "owner",
    });
    expect(mocks.communityComment.deleteMany.mock.calls[0][0].where).toEqual({
      id,
      userId: "owner",
    });
    mocks.communityPost.updateMany.mockResolvedValue({ count: 0 });
    await expect(editCommunityPost(id, post)).rejects.toThrow("Post not found");
  });
  it("does not leak owner IDs or private profile fields in the feed", async () => {
    mocks.communityPost.findMany.mockResolvedValue([
      {
        id,
        userId: "victim",
        createdAt: new Date(),
        body: "Hello",
        authorName: "Member",
        category: "question",
        likes: [],
        _count: { comments: 0, likes: 0 },
        email: "private@example.com",
      },
    ]);
    const feed = await getCommunityFeed();
    expect(feed.posts[0]).not.toHaveProperty("userId");
    expect(feed.posts[0]).not.toHaveProperty("email");
    expect(feed.posts[0].mine).toBe(false);
    expect(feed.posts[0].removable).toBe(false);
  });
  it("allows moderator removal only through the server-side allowlist", async () => {
    await expect(getCommunityReports()).rejects.toThrow("Unauthorized");
    await expect(dismissCommunityReport(id)).rejects.toThrow("Unauthorized");
    vi.stubEnv("COMMUNITY_MODERATOR_IDS", "other, owner");
    await deleteCommunityPost(id);
    expect(mocks.communityPost.deleteMany.mock.calls[0][0].where).toEqual({
      id,
    });
    await getCommunityReports();
    expect(mocks.communityReport.findMany).toHaveBeenCalled();
  });
  it("comments and reports use the signed-in ID and likes are idempotent", async () => {
    await publishCommunityComment({
      postId: id,
      authorName: "Member",
      body: "Nice work",
      userId: "victim",
    });
    expect(mocks.communityComment.create.mock.calls[0][0].data.userId).toBe(
      "owner",
    );
    await setCommunityLike(id, true);
    expect(mocks.communityLike.upsert.mock.calls[0][0].where).toEqual({
      userId_postId: { userId: "owner", postId: id },
    });
    await reportCommunityPost(id, "Spam content");
    expect(mocks.communityReport.upsert.mock.calls[0][0].create.userId).toBe(
      "owner",
    );
  });
});
describe("member preference and food integrity", () => {
  it("edits only the member's training settings and leaves nutrition targets unchanged", async () => {
    mocks.profile.findUnique.mockResolvedValue({ sex: "male" });
    await saveRoutinePreferences({
      userId: "victim",
      musclePriority: "back",
      trainingDays: 4,
      trainingExperience: "new",
      targetCalories: 10,
    });
    expect(mocks.profile.update).toHaveBeenCalledWith({
      where: { id: "owner" },
      data: {
        musclePriority: "back",
        trainingDays: 4,
        trainingExperience: "new",
      },
    });
  });
  it("calculates meal macros on the server and ignores submitted fake totals", async () => {
    await saveCalculatedMeal({
      date: "2026-10-12",
      name: "Chicken",
      mealType: "lunch",
      portions: [{ foodId: "chicken", grams: 100 }],
      calories: 1,
      protein: 999,
    });
    const data = mocks.mealEntry.create.mock.calls[0][0].data;
    expect(data.calories).toBe(165);
    expect(data.protein).toBe(31);
    expect(data.userId).toBe("owner");
  });
});
