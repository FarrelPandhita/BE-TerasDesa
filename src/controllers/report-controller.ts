import { Response } from "express"
import { AuthRequest } from "../middleware/auth-middleware"
import { asyncWrapper } from "../utils/async-wrapper"
import { AppError } from "../utils/app-error"
import { getParam } from "../utils/get-param"
import {
  createReportValidation,
  updateReportStatusValidation,
  listReportsQueryValidation,
} from "../validation/report-validation"
import {
  createReport,
  listReports,
  getReportById,
  updateReportStatus,
  getMyReports,
} from "../services/report-service"

// POST /api/v1/reports
export const submitReport = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError(401, "Unauthorized")

  const files = Array.isArray(req.files) ? req.files : []
  const validated = createReportValidation.parse(req.body)
  const report = await createReport(validated, req.user.userId, files)

  res.status(201).json({ data: report })
})

// GET /api/v1/reports
export const getReports = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError(401, "Unauthorized")
  const isAdmin = req.user.role === "admin"
  const query = listReportsQueryValidation.parse(req.query)
  const result = await listReports(query, req.user.userId, isAdmin)
  res.json({ data: result })
})

// GET /api/v1/reports/me
export const getMyReportHistory = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError(401, "Unauthorized")
  const reports = await getMyReports(req.user.userId)
  res.json({ data: reports })
})

// GET /api/v1/reports/:id
export const getReport = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError(401, "Unauthorized")
  const id = getParam(req, "id")
  const isAdmin = req.user.role === "admin"
  const report = await getReportById(id, req.user.userId, isAdmin)
  res.json({ data: report })
})

// PATCH /api/v1/reports/:id/status
export const changeReportStatus = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError(401, "Unauthorized")
  const id = getParam(req, "id")
  const validated = updateReportStatusValidation.parse(req.body)
  const updated = await updateReportStatus(id, validated, req.user.userId)
  res.json({ data: updated })
})
