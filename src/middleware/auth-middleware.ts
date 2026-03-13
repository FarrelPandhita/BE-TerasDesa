import { Request, Response, NextFunction } from "express"
import { verifyToken } from "../utils/jwt"

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ errors: "Unauthorized" })
  }

  const token = authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ errors: "Unauthorized" })
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (e) {
    res.status(401).json({ errors: "Invalid token" })
  }
}