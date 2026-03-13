import jwt from "jsonwebtoken"

// const SECRET = "SUPER_SECRET_KEY"
// deklarasi type assertion non null biar g error karna kita pakek env
const SECRET = process.env.JWT_SECRET!;

export function generateToken(userId: string) {
  return jwt.sign({ userId }, SECRET, { expiresIn: "1d" })
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET)
}