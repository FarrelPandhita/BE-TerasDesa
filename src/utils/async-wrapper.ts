import { Request, Response, NextFunction, RequestHandler } from "express"
import { AuthRequest } from "../middleware/auth-middleware"

// Allow both plain Request and AuthRequest (for authenticated controllers)
type AnyRequest = Request | AuthRequest

type AsyncHandler<T extends AnyRequest = Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<void>

// removes boilerplate try-catch and forwards errors to global error handler.
export function asyncWrapper<T extends AnyRequest>(
  fn: AsyncHandler<T>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as T, res, next).catch(next)
  }
}
