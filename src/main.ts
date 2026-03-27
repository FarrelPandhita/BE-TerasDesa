import "dotenv/config"
import express from "express"
import helmet from "helmet"
import cors from "cors"

import userRoutes from "./routes/user-routes"
import projectRoutes from "./routes/project-routes"
import statisticsRoutes from "./routes/statistics-routes"
import { errorMiddleware } from "./middleware/error-middleware"

const app = express()

// security
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}))

// body parsing
app.use(express.json({ limit: "5mb" }))
app.use(express.urlencoded({ extended: true }))

// versioned routes
app.use("/api/v1", userRoutes)
app.use("/api/v1", projectRoutes)
app.use("/api/v1", statisticsRoutes)

// health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// global error handler (must be last)
app.use(errorMiddleware)

// start server
const PORT = process.env.PORT 
app.listen(PORT, () => {
  console.log(`[TerasDesa] API running on port ${PORT}`)
})