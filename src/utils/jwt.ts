import jwt from "jsonwebtoken"
import { Role } from "@prisma/client"

const SECRET = process.env.JWT_SECRET!

interface TokenPayload {
  userId: string
  role: Role
}

export function generateToken(userId: string, role: Role): string {
  return jwt.sign({ userId, role }, SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): unknown {
  return jwt.verify(token, SECRET)
}