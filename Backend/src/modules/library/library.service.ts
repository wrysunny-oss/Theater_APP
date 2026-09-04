import { prisma } from "../../lib/prisma.js";

export function listFavorites(userId: bigint) {
  return prisma.favorite.findMany({
    where: { userId },
    include: { drama: true },
    orderBy: { createdAt: "desc" },
  });
}

/** upsert 让重复收藏请求保持幂等，移动端断网重试不会产生重复记录。 */
export function addFavorite(userId: bigint, dramaId: bigint) {
  return prisma.favorite.upsert({
    where: { userId_dramaId: { userId, dramaId } },
    create: { userId, dramaId },
    update: {},
  });
}

/** deleteMany 在记录已经不存在时也会成功，取消收藏同样具备幂等性。 */
export function removeFavorite(userId: bigint, dramaId: bigint) {
  return prisma.favorite.deleteMany({ where: { userId, dramaId } });
}

export function listHistory(userId: bigint) {
  return prisma.watchHistory.findMany({
    where: { userId },
    include: { drama: true, episode: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

/** 每个用户每部剧只保留最新进度，数据库复合唯一键保证并发请求不会生成两条历史。 */
export function saveProgress(userId: bigint, dramaId: bigint, episodeId: bigint, positionSeconds: number) {
  return prisma.watchHistory.upsert({
    where: { userId_dramaId: { userId, dramaId } },
    create: { userId, dramaId, episodeId, positionSeconds },
    update: { episodeId, positionSeconds },
  });
}
