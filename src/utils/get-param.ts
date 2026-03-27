import { Request } from "express"
import { AppError } from "./app-error"

// safely extracts a string route param from Express request
export function getParam(req: Request, key: string): string {
  const value = req.params[key]
  if (!value || Array.isArray(value)) {
    throw new AppError(400, `Missing or invalid route parameter: ${key}`)
  }
  return value
}
