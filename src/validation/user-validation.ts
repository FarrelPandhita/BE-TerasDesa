import { z } from "zod"

// Regular Auth

export const registerUserValidation = z.object({
  username: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  email: z.email().max(120),
  phone_number: z.string().min(5).max(20),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one symbol"),
})

export const loginUserValidation = z.object({
  email: z.email(),
  password: z.string().min(1),
})

// Google OAuth

export const googleOAuthValidation = z.object({
  idToken: z.string().min(1, "Google ID Token is required"),
})

export type RegisterUserRequest = z.infer<typeof registerUserValidation>
export type LoginUserRequest = z.infer<typeof loginUserValidation>
export type GoogleOAuthRequest = z.infer<typeof googleOAuthValidation>