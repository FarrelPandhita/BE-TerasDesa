import { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"
import { AppError } from "../utils/app-error"
import { Prisma } from "@prisma/client"
import multer from "multer"
import { logger } from "../utils/logger"

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
    if (err.code === "P2003") {
      res.status(400).json({ errors: "Related record not found (foreign key constraint)." })
      return
    }
    if (err.code === "P2022") {
      res.status(500).json({ errors: "Database schema out of sync. Run prisma db push on the server." })
      return
    }
    if (err.code === "P2025") {
      res.status(404).json({ errors: "Record not found." })
      return
    }
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      res.status(400).json({ errors: `Maximum file limit for field '${err.field}' exceeded` })
      return
    }
    res.status(400).json({ errors: `${err.message} (${err.code})` })
    return
  }
  // Log unexpected server errors to file; client-side errors are handled above.
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : undefined
  logger.error(message, { stack })
  res.status(500).json({ errors: "Internal server error." })
}
