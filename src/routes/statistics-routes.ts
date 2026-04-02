import express from "express"
import { dashboardStats, reportsPie } from "../controllers/statistics-controller"

const router = express.Router()

// Public statistics endpoints
router.get("/statistics/dashboard", dashboardStats)
router.get("/statistics/reports-pie", reportsPie)

export default router
