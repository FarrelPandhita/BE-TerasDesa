import { z } from "zod"

// Project Schemas

const timelineEntrySchema = z.object({
  stage_name: z.string().min(1).max(150),
  stage_date: z.iso.date("stage_date must be a valid date (YYYY-MM-DD)"),
  status: z.enum(["belum", "diproses", "selesai"]),
})

const expenseEntrySchema = z.object({
  expense_name: z.string().min(1).max(150),
  amount: z.number().int().positive(),
  percentage: z.number().min(0).max(100),
})

export const createProjectValidation = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  location: z.string().min(1).max(200),
  rw: z.string().max(10).optional(),
  total_budget: z.coerce.number().int().positive(),
  start_date: z.iso.date("start_date must be a valid date (YYYY-MM-DD)"),
  end_date: z.iso.date("end_date must be a valid date (YYYY-MM-DD)"),
  status: z.enum(["perencanaan", "berjalan", "selesai"]).optional().default("perencanaan"),
  // Accept either a parsed array or a JSON string (sent via multipart/form-data).
  // On invalid JSON, return the raw value so z.array() emits a ZodError (400) instead of SyntaxError (500).
  timeline: z.preprocess(
    (val) => {
      if (typeof val !== "string") return val
      try { return JSON.parse(val) } catch { return val }
    },
    z.array(timelineEntrySchema).optional().default([])
  ),
  expenses: z.preprocess(
    (val) => {
      if (typeof val !== "string") return val
      try { return JSON.parse(val) } catch { return val }
    },
    z.array(expenseEntrySchema).optional().default([])
  ),
})

export const updateProjectProgressValidation = z.object({
  progress: z.number().int().min(0).max(100),
  description: z.string().min(1).max(5000),
})

export const listProjectsQueryValidation = z.object({
  search: z.string().max(100).optional(),
  rw: z.string().max(10).optional(),
  tahun: z.string()
    .optional()
    .refine((v) => !v || /^\d{4}$/.test(v), { message: "tahun must be a 4-digit year" }),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

// Inferred Types

export type CreateProjectRequest = z.infer<typeof createProjectValidation>
export type UpdateProgressRequest = z.infer<typeof updateProjectProgressValidation>
export type ListProjectsQuery = z.infer<typeof listProjectsQueryValidation>
