import { Request, Response, NextFunction } from "express"
import { verifyToken, TokenPayload } from "../utils/jwt"
import { AppError } from "../utils/app-error"

export interface AuthRequest extends Request {
  user?: TokenPayload
}

// validates JWT and attaches user payload to request
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError(401, "Unauthorized"))
  }

  const token = authHeader.slice(7)
  if (!token) {
    return next(new AppError(401, "Unauthorized"))
  }

  try {
    const decoded = verifyToken(token)
    ;(req as AuthRequest).user = decoded
    next()
  } catch {
    next(new AppError(401, "Invalid or expired token"))
  }
}