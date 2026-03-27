import jwt from "jsonwebtoken"
import { Role } from "@prisma/client"
import { AppError } from "./app-error"

const SECRET = process.env.JWT_SECRET!

export interface TokenPayload {
  userId: string
  role: Role
}

function isTokenPayload(decoded: unknown): decoded is TokenPayload {
  return (
    typeof decoded === "object" &&
    decoded !== null &&
    "userId" in decoded &&
    "role" in decoded &&
    typeof (decoded as TokenPayload).userId === "string" &&
    typeof (decoded as TokenPayload).role === "string"
  )
}

export function generateToken(userId: string, role: Role): string {
  return jwt.sign({ userId, role }, SECRET, { expiresIn: "7d" })
}

// verifies JWT and returns typed payload or throws
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, SECRET)
  if (!isTokenPayload(decoded)) {
    throw new AppError(401, "Invalid token payload")
  }
  return decoded
}