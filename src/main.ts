import "dotenv/config"
import os from "os"
import express from "express"
import helmet from "helmet"
import cors from "cors"
import morgan from "morgan"

import userRoutes from "./routes/user-routes"
import projectRoutes from "./routes/project-routes"
import reportRoutes from "./routes/report-routes"
import statisticsRoutes from "./routes/statistics-routes"
import { errorMiddleware } from "./middleware/error-middleware"
import { logger } from "./utils/logger"

const app = express()

if (process.env.NODE_ENV !== "test") {
  // Lazy-load to prevent "event-loop-stats not found" warning during Jest test runs.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const statusMonitor = require("express-status-monitor")
  // APM dashboard at /api/v1/system-status
  app.use(statusMonitor({ 
    path: "/api/v1/system-status",
    socketPath: "/farrel/socket.io" 
  }))
}

// security
app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without origin (like from Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
      : [];
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
}))

// HTTP request logging to combined log file
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined", {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }))
}

// body parsing
app.use(express.json({ limit: "5mb" }))
app.use(express.urlencoded({ extended: true }))

// versioned routes
app.use("/api/v1", userRoutes)
app.use("/api/v1", projectRoutes)
app.use("/api/v1", reportRoutes)
app.use("/api/v1", statisticsRoutes)

// health check with system metrics
app.get("/api/v1/health", (_req, res) => {
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMemPercent = (((totalMem - freeMem) / totalMem) * 100).toFixed(1)
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    memory: {
      totalMB: (totalMem / 1024 / 1024).toFixed(0),
      freeMB: (freeMem / 1024 / 1024).toFixed(0),
      usedPercent: `${usedMemPercent}%`,
    },
  })
})

// global error handler (must be last)
app.use(errorMiddleware)

// export app for testing (Supertest uses this without starting the server)
export { app }

// start server only when run directly (not imported by tests)
if (require.main === module) {
  // Fail fast if critical env vars are missing.
  const required = ["DATABASE_URL", "JWT_SECRET", "PORT"]
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`[FATAL] Missing required env var: ${key}`)
      process.exit(1)
    }
  }

  const PORT = process.env.PORT
  app.listen(PORT, () => {
    logger.info(`[TerasDesa] API running on port ${PORT}`)
  })
}