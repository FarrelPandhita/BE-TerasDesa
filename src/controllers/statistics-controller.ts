import { Request, Response } from "express"
import { asyncWrapper } from "../utils/async-wrapper"
import { getDashboardStats, getReportsPieBreakdown } from "../services/statistics-service"

// GET /api/v1/statistics/dashboard
export const dashboardStats = asyncWrapper(async (_req: Request, res: Response) => {
  const stats = await getDashboardStats()
  res.json({ data: stats })
})

// GET /api/v1/statistics/reports-pie
export const reportsPie = asyncWrapper(async (_req: Request, res: Response) => {
  const data = await getReportsPieBreakdown()
  res.json({ data })
})
