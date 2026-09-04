import { z } from "zod";

export const dramaListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().trim().max(50).optional(),
  keyword: z.string().trim().max(100).optional(),
});

export const dramaIdSchema = z.object({ id: z.coerce.bigint().positive() });
export type DramaListQuery = z.infer<typeof dramaListQuerySchema>;
