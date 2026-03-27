import { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"
import { AppError } from "../utils/app-error"
import { Prisma } from "@prisma/client"

// Global error handler middleware
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      errors: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    })
    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ errors: err.message })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ errors: "Data already exists (unique constraint)." })
      return
    }
    if (err.code === "P2025") {
      res.status(404).json({ errors: "Record not found." })
      return
    }
  }
  console.error("[Unhandled Error]", err)
  res.status(500).json({ errors: "Internal server error." })
}
