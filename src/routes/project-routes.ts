import express from "express"
import { authMiddleware } from "../middleware/auth-middleware"
import { roleGuard } from "../middleware/role-middleware"
import {
  getAllProjects,
  getProject,
  addProject,
  addProjectUpdate,
} from "../controllers/project-controller"
  
const router = express.Router()

// Public 
router.get("/projects", getAllProjects)
router.get("/projects/:id", getProject)


// Admin only
router.post("/projects", authMiddleware, roleGuard("admin"), addProject)
router.post("/projects/:id/updates", authMiddleware, roleGuard("admin"), addProjectUpdate)

export default router
