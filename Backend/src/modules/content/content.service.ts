import { prisma } from "../../lib/prisma.js";
import type { DramaListQuery } from "./content.schema.js";

/**
 * App 内容列表仅返回已发布内容。分页查询和总数放在同一事务中，降低两次查询
 * 读取到不同数据快照的概率；高流量时可改为游标分页并缓存热门列表。
 */
export async function listDramas(query: DramaListQuery) {
  const { page, pageSize, category, keyword } = query;
  const where = {
    status: "PUBLISHED" as const,
    ...(category ? { category } : {}),
    ...(keyword
      ? { OR: [{ title: { contains: keyword } }, { description: { contains: keyword } }] }
      : {}),
  };
  const [list, total] = await prisma.$transaction([
    prisma.drama.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ sort: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { episodes: true } } },
    }),
    prisma.drama.count({ where }),
  ]);
  return { list, page, pageSize, total, hasMore: page * pageSize < total };
}

/** 播放详情同样进行发布状态过滤，防止草稿视频地址被直接枚举获取。 */
export function getDrama(id: bigint) {
  return prisma.drama.findFirstOrThrow({
    where: { id, status: "PUBLISHED" },
    include: {
      episodes: { where: { status: "PUBLISHED" }, orderBy: { episodeNo: "asc" } },
    },
  });
}
