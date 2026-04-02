import multer from "multer"
import { AppError } from "../utils/app-error"

// Use memory storage for Buffer-based uploads to Supabase.
const storage = multer.memoryStorage()

// Configure multer with file filters and size limits.
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new AppError(400, "Only JPEG, PNG, and WebP images are allowed"))
    }
  },
})
