import express from "express"
import { dashboardStats } from "../controllers/statistics-controller"

const router = express.Router()

router.get("/statistics/dashboard", dashboardStats)

export default router
