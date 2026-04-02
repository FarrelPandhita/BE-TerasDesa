import express from "express"
import { authMiddleware } from "../middleware/auth-middleware"
import { upload } from "../middleware/upload-middleware"
import { register, login, currentUser, googleLogin, updatePhoto } from "../controllers/user-controller"

const router = express.Router()

router.post("/users", register)
router.post("/users/login", login)
router.post("/users/oauth/google", googleLogin)
router.get("/users/current", authMiddleware, currentUser)
router.patch("/users/profile-picture", authMiddleware, upload.single("image"), updatePhoto)

export default router