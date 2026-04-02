import { Request, Response } from "express"
import { AuthRequest } from "../middleware/auth-middleware"
import { asyncWrapper } from "../utils/async-wrapper"
import { registerUser, loginUser, getUser, updateProfilePicture } from "../services/user-service"
import { loginWithGoogle } from "../services/google-auth-service"
import {
  registerUserValidation,
  loginUserValidation,
  googleOAuthValidation,
} from "../validation/user-validation"
import { AppError } from "../utils/app-error"

// POST /api/v1/users
export const register = asyncWrapper(async (req: Request, res: Response) => {
  const validated = registerUserValidation.parse(req.body)
  const user = await registerUser(validated)
  res.status(201).json({ data: user })
})

// POST /api/v1/users/login
export const login = asyncWrapper(async (req: Request, res: Response) => {
  const validated = loginUserValidation.parse(req.body)
  const token = await loginUser(validated)
  res.json({ data: { token } })
})

// POST /api/v1/users/google-login
export const googleLogin = asyncWrapper(async (req: Request, res: Response) => {
  const validated = googleOAuthValidation.parse(req.body)
  const token = await loginWithGoogle(validated.idToken)
  res.json({ data: { token } })
})

// GET /api/v1/users/current
export const currentUser = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError(401, "Unauthorized")
  const user = await getUser(req.user.userId)
  res.json({ data: user })
})

// PATCH /api/v1/users/profile-picture
export const updatePhoto = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError(401, "Unauthorized")
  if (!req.file) throw new AppError(400, "No image file provided")

  const result = await updateProfilePicture(req.user.userId, req.file)
  res.json({ data: result })
})