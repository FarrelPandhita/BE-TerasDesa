import express from "express"
import { authMiddleware } from "../middleware/auth-middleware"
import { roleGuard } from "../middleware/role-middleware"
import {
  getAllProjects,
  getProject,
  addProject,
  addProjectUpdate,
} from "../controllers/project-controller"
import { listComments, addComment } from "../controllers/comment-controller"

const router = express.Router()

// Public 
router.get("/projects", getAllProjects)
router.get("/projects/:id", getProject)
router.get("/projects/:id/comments", listComments)

// Citizen
router.post("/projects/:id/comments", authMiddleware, addComment)

// Admin only
router.post("/projects", authMiddleware, roleGuard("admin"), addProject)
router.post("/projects/:id/updates", authMiddleware, roleGuard("admin"), addProjectUpdate)

export default router
