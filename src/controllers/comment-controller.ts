import { Request, Response } from "express"
import { AuthRequest } from "../middleware/auth-middleware"
import { asyncWrapper } from "../utils/async-wrapper"
import { AppError } from "../utils/app-error"
import { getParam } from "../utils/get-param"
import { createCommentValidation } from "../validation/comment-validation"
import { getProjectComments, createComment } from "../services/comment-service"

// GET /api/v1/projects/:id/comments
export const listComments = asyncWrapper(async (req: Request, res: Response) => {
  const id = getParam(req, "id")
  const comments = await getProjectComments(id)
  res.json({ data: comments })
})

// POST /api/v1/projects/:id/comments
export const addComment = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError(401, "Unauthorized")
  const id = getParam(req, "id")
  const validated = createCommentValidation.parse(req.body)
  const comment = await createComment(id, validated, req.user.userId)
  res.status(201).json({ data: comment })
})
