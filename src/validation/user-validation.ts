import { z } from "zod"

export const registerUserValidation = z.object({
  username: z.string()
    .min(1, { message: "Username is required" })
    .max(80, { message: "Username cannot exceed 80 characters" }),

  name: z.string()
    .min(1, { message: "Name is required" })
    .max(120, { message: "Name cannot exceed 120 characters" }),

  phone_number: z.string()
    .min(5, { message: "Phone number is too short" })
    .max(20, { message: "Phone number cannot exceed 20 characters" }),

  email: z.email({ message: "Email format is invalid" }),

  password: z.string()
    .min(6, { message: "Password must be at least 6 characters" })
    .regex(/[A-Za-z]/, { message: "Password must contain at least one letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one symbol" })

})


export const loginUserValidation = z.object({
  email: z.email({ message: "Email format is invalid" })
    .min(1, { message: "Email is required" }),

  password: z.string()
    .min(1, { message: "Password is required" })
})