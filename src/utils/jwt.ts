import jwt from "jsonwebtoken"

const SECRET = "SUPER_SECRET_KEY"

export function generateToken(userId: string) {
  return jwt.sign({ userId }, SECRET, { expiresIn: "1d" })
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET)
}