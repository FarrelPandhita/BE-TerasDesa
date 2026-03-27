import { Request, Response } from "express"
import { AuthRequest } from "../middleware/auth-middleware"
import { asyncWrapper } from "../utils/async-wrapper"
import { registerUser, loginUser, getUser } from "../services/user-service"
import { loginWithGoogle } from "../services/google-auth-service"
import {
  registerUserValidation,
  loginUserValidation,
  googleOAuthValidation,
} from "../validation/user-validation"
import { AppError } from "../utils/app-error"

export const register = asyncWrapper(async (req: Request, res: Response) => {
  const validated = registerUserValidation.parse(req.body)
  const user = await registerUser(validated)
  res.status(201).json({ data: user })
})

export const login = asyncWrapper(async (req: Request, res: Response) => {
  const validated = loginUserValidation.parse(req.body)
  const token = await loginUser(validated)
  res.json({ data: { token } })
})

export const googleLogin = asyncWrapper(async (req: Request, res: Response) => {
  const validated = googleOAuthValidation.parse(req.body)
  const token = await loginWithGoogle(validated.idToken)
  res.json({ data: { token } })
})

export const currentUser = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError(401, "Unauthorized")
  const user = await getUser(req.user.userId)
  res.json({ data: user })
})