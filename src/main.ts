import "dotenv/config"
import express from "express"
import helmet from "helmet"
import cors from "cors"

import userRoutes from "./routes/user-routes"
import projectRoutes from "./routes/project-routes"
import statisticsRoutes from "./routes/statistics-routes"
import { errorMiddleware } from "./middleware/error-middleware"

const app = express()

// Security Middleware
app.use(helmet()) // Sets secure HTTP headers
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}))

// Body Parsing
app.use(express.json({ limit: "5mb" }))           // Limit payload size
app.use(express.urlencoded({ extended: true }))    // Support form-encoded bodies

// Routes
app.use("/api", userRoutes)
app.use("/api", projectRoutes)
app.use("/api", statisticsRoutes)

// Health Check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Global Error Handler (MUST be last)
app.use(errorMiddleware)

// Start Server
const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => {
  console.log(`[TerasDesa] API running on port ${PORT}`)
})