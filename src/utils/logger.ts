import winston from "winston"
import "winston-daily-rotate-file"

// Centralized logger using Winston with daily log rotation.
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console output with human-readable coloring for development.
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
          const stack = info.stack ? ` ${info.stack}` : ""
          return `${info.timestamp} [${info.level}]: ${info.message}${stack}`
        })
      ),
    }),
    // Daily rotated error-only log, auto-deleted after 14 days.
    new winston.transports.DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "14d",
    }),
    // Daily rotated combined log for all events.
    new winston.transports.DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
})
