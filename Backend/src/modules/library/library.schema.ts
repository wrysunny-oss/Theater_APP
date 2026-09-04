import { z } from "zod";

export const dramaIdSchema = z.object({ dramaId: z.coerce.bigint().positive() });
export const watchProgressSchema = z.object({
  episodeId: z.coerce.bigint().positive(),
  positionSeconds: z.number().int().min(0),
});
