import express from "express"
import { authMiddleware } from "../middleware/auth-middleware"
import { roleGuard } from "../middleware/role-middleware"
import { upload } from "../middleware/upload-middleware"
import {
  submitReport,
  getReports,
  getMyReportHistory,
  getReport,
  changeReportStatus,
} from "../controllers/report-controller"

const router = express.Router()

// Citizen only — submit report requires auth and citizen role
router.post("/reports", authMiddleware, roleGuard("citizen"), upload.array("images", 2), submitReport)
router.get("/reports/me", authMiddleware, getMyReportHistory)
router.get("/reports", authMiddleware, getReports)
router.get("/reports/:id", authMiddleware, getReport)

// Admin only
router.patch("/reports/:id/status", authMiddleware, roleGuard("admin"), changeReportStatus)

export default router
