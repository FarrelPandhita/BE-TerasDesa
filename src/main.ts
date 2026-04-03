import "dotenv/config"
import express from "express"
import helmet from "helmet"
import cors from "cors"

import userRoutes from "./routes/user-routes"
import projectRoutes from "./routes/project-routes"
import reportRoutes from "./routes/report-routes"
import statisticsRoutes from "./routes/statistics-routes"
import { errorMiddleware } from "./middleware/error-middleware"

const app = express()

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

// body parsing
app.use(express.json({ limit: "5mb" }))
app.use(express.urlencoded({ extended: true }))

// versioned routes
app.use("/api/v1", userRoutes)
app.use("/api/v1", projectRoutes)
app.use("/api/v1", reportRoutes)
app.use("/api/v1", statisticsRoutes)

// health check
app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
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
    console.log(`[TerasDesa] API running on port ${PORT}`)
  })
}