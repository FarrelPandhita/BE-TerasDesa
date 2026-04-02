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

// All report endpoints require auth
router.post("/reports", authMiddleware, upload.single("image"), submitReport)
router.get("/reports/me", authMiddleware, getMyReportHistory)
router.get("/reports", authMiddleware, getReports)
router.get("/reports/:id", authMiddleware, getReport)

// Admin only
router.patch("/reports/:id/status", authMiddleware, roleGuard("admin"), changeReportStatus)

export default router
