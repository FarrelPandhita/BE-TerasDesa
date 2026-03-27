import { Request, Response, NextFunction } from "express"
import { verifyToken } from "../utils/jwt"
import { AppError } from "../utils/app-error"
import { Role } from "@prisma/client"

export interface AuthenticatedUser {
  userId: string
  role: Role
}

// Explicit typed request for controllers that require authentication
export interface AuthRequest extends Request {
  user?: AuthenticatedUser
}

function isJwtPayload(decoded: unknown): decoded is AuthenticatedUser {
  return (
    typeof decoded === "object" &&
    decoded !== null &&
    "userId" in decoded &&
    "role" in decoded &&
    typeof (decoded as AuthenticatedUser).userId === "string" &&
    typeof (decoded as AuthenticatedUser).role === "string"
  )
}

// user authentication middleware
// Route signature stays as `Request` for Express compatibility.
// We cast internally after verifying the token — this is safe and type-narrowed.
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
    if (!isJwtPayload(decoded)) {
      return next(new AppError(401, "Invalid token payload"))
    }
    // Safe cast: We have confirmed `decoded` satisfies AuthenticatedUser via type guard above.
    // We attach it to req as AuthRequest so downstream protected controllers can access it.
    (req as AuthRequest).user = decoded
    next()
  } catch {
    next(new AppError(401, "Invalid or expired token"))
  }
}