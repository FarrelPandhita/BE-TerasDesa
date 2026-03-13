import express from "express"
import { authMiddleware } from "../middleware/auth-middleware"
import {
  register,
  login,
  oauthGoogle,
  currentUser
} from "../controllers/user-controller"

const router = express.Router()

router.post("/users", register)
router.post("/users/login", login)
router.post("/users/oauth/google", oauthGoogle)
router.get("/users/current", authMiddleware, currentUser)

export default router