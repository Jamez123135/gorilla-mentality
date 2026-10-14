import { prisma } from "./prisma";
import { searchCatalog } from "./food-catalog";
import { labelFood } from "./owned-foods";

// Only official catalog results are cached. Private foods are resolved per request.
export async function findMemberFoods(userId: string, query: string, category: string) {
  const personal = category && category !== "Personal label foods"
    ? []
    : await prisma.customFood.findMany({
        where: {
          userId,
          ...(query ? { OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { brand: { contains: query, mode: "insensitive" as const } },
          ] } : {}),
        },
        take: 20,
        orderBy: { name: "asc" },
      });
  return [
    ...personal.map(labelFood),
    ...(category === "Personal label foods" ? [] : searchCatalog(query, category)),
  ].slice(0, 40);
}
