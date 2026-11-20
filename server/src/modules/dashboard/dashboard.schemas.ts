import { z } from "zod";

export const dashboardQuery = z.object({
  exercice: z.coerce.number().int().min(2000).max(2100).optional(),
});