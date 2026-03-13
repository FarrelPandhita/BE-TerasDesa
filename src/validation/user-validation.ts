import { z } from "zod"

export const registerUserValidation = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6)
})

export const loginUserValidation = z.object({
  email: z.string().email(),
  password: z.string()
})