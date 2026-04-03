import { Request, Response, NextFunction } from "express"
import { Role } from "@prisma/client"
import { AppError } from "../utils/app-error"
import { AuthRequest } from "./auth-middleware"

export function roleGuard(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest
    if (!authReq.user) {
      return next(new AppError(401, "Unauthorized"))
    }
    if (!allowedRoles.includes(authReq.user.role)) {
      return next(new AppError(403, "Forbidden: insufficient permissions"))
    }
    next()
  }
}
