import { Role } from "@prisma/client"

// Correct canonical augmentation for Express
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string
      role: Role
    }
  }
}

export {}
