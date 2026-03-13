import { z } from "zod"

export const registerUserValidation = z.object({
  name: z.string()
    .min(1, { message: "Name is required" }),

  email: z.string()
    .email({ message: "Email format is invalid" }),

  password: z.string()
    .min(6, { message: "Password must be at least 6 characters" })
    .regex(/[A-Za-z]/, { message: "Password must contain at least one letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one symbol" })

})


export const loginUserValidation = z.object({
  email: z.string()
    .min(1, { message: "Email is required" })
    .email({ message: "Email format is invalid" }),

  password: z.string()
    .min(1, { message: "Password is required" })
})