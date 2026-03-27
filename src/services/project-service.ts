import { v4 as uuid } from "uuid"
import { prisma } from "../prisma/prisma-client"
import { AppError } from "../utils/app-error"
import {
  CreateProjectRequest,
  UpdateProgressRequest,
  ListProjectsQuery,
} from "../validation/project-validation"

// Return Types
export interface ProjectListItem {
  id: string
  title: string
  location: string
  totalBudget: string
  status: string
  progress: number
  startDate: Date
  endDate: Date
}

export interface ProjectListResult {
  items: ProjectListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// List Projects (public)
export async function listProjects(query: ListProjectsQuery) {
  const { search, tahun, page, limit } = query
  const skip = (page - 1) * limit

  const [items, total] = await prisma.$transaction([
    prisma.project.findMany({
      where: {
        deletedAt: null,
        ...(search
          ? { title: { contains: search } }
          : {}),
        ...(tahun
          ? {
              startDate: {
                gte: new Date(`${tahun}-01-01`),
                lte: new Date(`${tahun}-12-31`),
              },
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        location: true,
        totalBudget: true,
        status: true,
        progress: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.project.count({
      where: {
        deletedAt: null,
        ...(search ? { title: { contains: search } } : {}),
      },
    }),
  ])

  return {
    items: items.map((p) => ({
      ...p,
      totalBudget: p.totalBudget.toString(), // BigInt → string for JSON safety
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// Get Single Project (public)
export async function getProjectById(id: string) {
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: {
      timelines: { orderBy: { stageDate: "asc" } },
      expenses: true,
      updates: { orderBy: { createdAt: "desc" } },
      fundings: true,

    },
  })

  if (!project) throw new AppError(404, "Project not found")

  return {
    ...project,
    totalBudget: project.totalBudget.toString(),
    expenses: project.expenses.map((e) => ({
      ...e,
      amount: e.amount.toString(),
    })),
    fundings: project.fundings.map((f) => ({
      ...f,
      amount: f.amount.toString(),
    })),
    updates: project.updates,
    timelines: project.timelines,

  }
}

// Create Project (admin)
export async function createProject(
  data: CreateProjectRequest,
  adminId: string
) {
  const projectId = uuid()

  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({
      data: {
        id: projectId,
        title: data.title,
        description: data.description,
        location: data.location,
        totalBudget: BigInt(data.total_budget),
        status: data.status,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        createdBy: adminId,
      },
    })

    if (data.timeline.length > 0) {
      await tx.projectTimeline.createMany({
        data: data.timeline.map((t) => ({
          id: uuid(),
          projectId,
          stageName: t.stage_name,
          stageDate: new Date(t.stage_date),
          status: t.status,
        })),
      })
    }

    if (data.expenses.length > 0) {
      await tx.detailPengeluaranAnggaran.createMany({
        data: data.expenses.map((e) => ({
          id: uuid(),
          projectId,
          expenseName: e.expense_name,
          amount: BigInt(e.amount),
          percentage: e.percentage,
        })),
      })
    }

    return p
  })

  return { id: project.id, title: project.title }
}

// Update Project Progress (admin)
export async function updateProjectProgress(
  projectId: string,
  data: UpdateProgressRequest
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  })
  if (!project) throw new AppError(404, "Project not found")

  await prisma.$transaction([
    prisma.projectUpdate.create({
      data: {
        id: uuid(),
        projectId,
        progress: data.progress,
        description: data.description,
      },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: {
        progress: data.progress,
        status: data.progress >= 100 ? "selesai" : "berjalan",
      },
    }),
  ])

  return { message: "Progress updated successfully" }
}

// Helpers
function maskName(name: string): string {
  if (!name) return "Anonim"
  return name.charAt(0) + "***"
}
