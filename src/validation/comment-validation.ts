import { z } from "zod"

export const createCommentValidation = z.object({
  comment: z.string().min(1).max(2000),
  is_anonymous: z.boolean().default(false),
})

export type CreateCommentRequest = z.infer<typeof createCommentValidation>
