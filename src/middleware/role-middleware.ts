import { Request, Response, NextFunction } from "express"
import { Role } from "@prisma/client"
import { AppError } from "../utils/app-error"


// user role validation
export function roleGuard(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"))
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, "Forbidden: insufficient permissions"))
    }
    next()
  }
}
