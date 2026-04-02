import { z } from "zod"

export const createReportValidation = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  location: z.string().min(1).max(200),
  project_id: z.uuid().optional(),
})

export const updateReportStatusValidation = z.object({
  status: z.enum(["diterima", "diproses", "selesai"]),
})

export const listReportsQueryValidation = z.object({
  status: z.enum(["diterima", "diproses", "selesai"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export type CreateReportRequest = z.infer<typeof createReportValidation>
export type UpdateReportStatusRequest = z.infer<typeof updateReportStatusValidation>
export type ListReportsQuery = z.infer<typeof listReportsQueryValidation>
