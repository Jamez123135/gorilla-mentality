"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";

const idInput = z.string().uuid();
const postInput = z.object({
  authorName: z.string().trim().min(1).max(40),
  body: z.string().trim().min(1).max(2000),
  category: z.enum(["workout", "nutrition", "milestone", "question"]),
});
const commentInput = postInput
  .pick({ authorName: true })
  .extend({ postId: idInput, body: z.string().trim().min(1).max(500) });
async function member() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
function moderator(userId: string) {
  return (process.env.COMMUNITY_MODERATOR_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(userId);
}

export async function getCommunityFeed(before?: string) {
  const userId = await member();
  const anchor = before
    ? await prisma.communityPost.findUnique({
        where: { id: idInput.parse(before) },
      })
    : null;
  const posts = await prisma.communityPost.findMany({
    where: anchor
      ? {
          OR: [
            { createdAt: { lt: anchor.createdAt } },
            { createdAt: anchor.createdAt, id: { lt: anchor.id } },
          ],
        }
      : {},
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 21,
    include: {
      _count: { select: { comments: true, likes: true } },
      likes: { where: { userId }, select: { userId: true } },
    },
  });
  return {
    moderator: moderator(userId),
    posts: posts.slice(0, 20).map((post) => ({
      id: post.id,
      createdAt: post.createdAt.toISOString(),
      authorName: post.authorName,
      body: post.body,
      category: post.category,
      mine: post.userId === userId,
      removable: post.userId === userId || moderator(userId),
      liked: post.likes.length > 0,
      likes: post._count.likes,
      comments: post._count.comments,
    })),
    next: posts.length > 20 ? posts[19].id : null,
  };
}

export async function publishCommunityPost(input: unknown) {
  const userId = await member();
  const data = postInput.parse(input);
  return prisma.$transaction(async (tx) => {
    // Serialize each member's publishing checks with a profile row lock.
    await tx.profile.upsert({
      where: { id: userId },
      create: { id: userId },
      update: { updatedAt: new Date() },
    });
    const count = await tx.communityPost.count({
      where: { userId, createdAt: { gte: new Date(Date.now() - 60000) } },
    });
    if (count >= 3)
      throw new Error("Please wait a minute before posting again.");
    await tx.communityPost.create({ data: { ...data, userId } });
    return { saved: true };
  });
}

export async function editCommunityPost(id: string, input: unknown) {
  const userId = await member();
  const { body, category, authorName } = postInput.parse(input);
  const result = await prisma.communityPost.updateMany({
    where: { id: idInput.parse(id), userId },
    data: { body, category, authorName },
  });
  if (!result.count) throw new Error("Post not found");
}

export async function deleteCommunityPost(id: string) {
  const userId = await member();
  const result = await prisma.communityPost.deleteMany({
    where: { id: idInput.parse(id), ...(moderator(userId) ? {} : { userId }) },
  });
  if (!result.count) throw new Error("Post not found");
}

export async function setCommunityLike(id: string, liked: boolean) {
  const userId = await member();
  const postId = idInput.parse(id);
  z.boolean().parse(liked);
  if (liked) {
    await prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    });
    await prisma.communityLike.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId },
      update: {},
    });
  } else await prisma.communityLike.deleteMany({ where: { userId, postId } });
}

export async function getCommunityComments(id: string, before?: string) {
  const userId = await member();
  const postId = idInput.parse(id);
  const anchor = before
    ? await prisma.communityComment.findFirst({
        where: { id: idInput.parse(before), postId },
      })
    : null;
  const rows = await prisma.communityComment.findMany({
    where: {
      postId,
      ...(anchor
        ? {
            OR: [
              { createdAt: { lt: anchor.createdAt } },
              { createdAt: anchor.createdAt, id: { lt: anchor.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 21,
  });
  return {
    comments: rows.slice(0, 20).map((row) => ({
      id: row.id,
      authorName: row.authorName,
      body: row.body,
      removable: row.userId === userId || moderator(userId),
    })),
    next: rows.length > 20 ? rows[19].id : null,
  };
}

export async function publishCommunityComment(input: unknown) {
  const userId = await member();
  const data = commentInput.parse(input);
  await prisma.$transaction(async (tx) => {
    await tx.profile.upsert({
      where: { id: userId },
      create: { id: userId },
      update: { updatedAt: new Date() },
    });
    if (
      (await tx.communityComment.count({
        where: { userId, createdAt: { gte: new Date(Date.now() - 60000) } },
      })) >= 10
    )
      throw new Error("Please wait a minute before commenting again.");
    await tx.communityComment.create({ data: { ...data, userId } });
  });
}

export async function deleteCommunityComment(id: string) {
  const userId = await member();
  const result = await prisma.communityComment.deleteMany({
    where: { id: idInput.parse(id), ...(moderator(userId) ? {} : { userId }) },
  });
  if (!result.count) throw new Error("Comment not found");
}

export async function reportCommunityPost(id: string, reason: string) {
  const userId = await member();
  const postId = idInput.parse(id);
  const text = z.string().trim().min(3).max(300).parse(reason);
  await prisma.profile.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  });
  await prisma.communityReport.upsert({
    where: { userId_postId: { userId, postId } },
    create: { userId, postId, reason: text },
    update: { reason: text },
  });
}

export async function getCommunityReports() {
  const userId = await member();
  if (!moderator(userId)) throw new Error("Unauthorized");
  return prisma.communityReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      reason: true,
      post: { select: { id: true, authorName: true, body: true } },
    },
  });
}

export async function dismissCommunityReport(id: string) {
  const userId = await member();
  if (!moderator(userId)) throw new Error("Unauthorized");
  await prisma.communityReport.deleteMany({ where: { id: idInput.parse(id) } });
}
