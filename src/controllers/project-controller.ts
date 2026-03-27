import { Request, Response } from "express"
import { AuthRequest } from "../middleware/auth-middleware"
import { asyncWrapper } from "../utils/async-wrapper"
import { AppError } from "../utils/app-error"
import { getParam } from "../utils/get-param"
import {
  createProjectValidation,
  updateProjectProgressValidation,
  listProjectsQueryValidation,
} from "../validation/project-validation"
import {
  listProjects,
  getProjectById,
  createProject,
  updateProjectProgress,
} from "../services/project-service"

// GET /api/v1/projects
export const getAllProjects = asyncWrapper(async (req: Request, res: Response) => {
  const query = listProjectsQueryValidation.parse(req.query)
  const result = await listProjects(query)
  res.json({ data: result })
})

// GET /api/v1/projects/:id
export const getProject = asyncWrapper(async (req: Request, res: Response) => {
  const id = getParam(req, "id")
  const project = await getProjectById(id)
  res.json({ data: project })
})

// POST /api/v1/projects
export const addProject = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError(401, "Unauthorized")
  const validated = createProjectValidation.parse(req.body)
  const project = await createProject(validated, req.user.userId)
  res.status(201).json({ data: project })
})

// POST /api/v1/projects/:id/updates
export const addProjectUpdate = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError(401, "Unauthorized")
  const id = getParam(req, "id")
  const validated = updateProjectProgressValidation.parse(req.body)
  const result = await updateProjectProgress(id, validated)
  res.json({ data: result })
})
