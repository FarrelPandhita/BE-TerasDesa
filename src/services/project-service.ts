import { v4 as uuid } from "uuid"
import { prisma } from "../prisma/prisma-client"
import { AppError } from "../utils/app-error"
import { uploadFile, getPublicUrl, deleteFile } from "./storage-service"
import {
  CreateProjectRequest,
  UpdateProgressRequest,
  ListProjectsQuery,
} from "../validation/project-validation"

const IMAGE_BUCKET = "project-images"
const IMAGE_FOLDER = "projects"

export interface ProjectListItem {
  id: string
  title: string
  location: string
  totalBudget: string
  status: string
  progress: number
  startDate: Date
  endDate: Date
  images: string[]
}

export interface ProjectListResult {
  items: ProjectListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Returns paginated list of projects with optional search and year filter.
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
        images: { select: { imageUrl: true }, orderBy: { order: "asc" } },
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
      totalBudget: p.totalBudget.toString(),
      images: p.images.map((img) => img.imageUrl),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// Returns full project detail including timelines, expenses, updates, fundings, images, and comments.
export async function getProjectById(id: string) {
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: {
      timelines: { orderBy: { stageDate: "asc" } },
      expenses: true,
      updates: { orderBy: { createdAt: "desc" } },
      fundings: true,
      images: { orderBy: { order: "asc" } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
      },
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
    images: project.images.map((img) => img.imageUrl),
    updates: project.updates,
    timelines: project.timelines,
    comments: project.comments.map((c) => ({
      id: c.id,
      comment: c.comment,
      isAnonymous: c.isAnonymous,
      createdAt: c.createdAt,
      author: c.isAnonymous
        ? maskName(c.user.name)
        : { id: c.user.id, name: c.user.name, username: c.user.username },
    })),
  }
}

// Creates a new project inside a transaction, including optional timeline, expense, and image entries.
export async function createProject(
  data: CreateProjectRequest,
  adminId: string,
  files: Express.Multer.File[] = []
) {
  const projectId = uuid()
  const uploadedPaths: string[] = []

  // Upload images first; if DB write fails, these paths are used for rollback.
  for (const file of files) {
    const path = await uploadFile(IMAGE_BUCKET, file, IMAGE_FOLDER)
    uploadedPaths.push(path)
  }

  try {
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

      if (uploadedPaths.length > 0) {
        await tx.projectImage.createMany({
          data: uploadedPaths.map((filePath, index) => ({
            id: uuid(),
            projectId,
            imageUrl: getPublicUrl(IMAGE_BUCKET, filePath),
            order: index,
          })),
        })
      }

      return p
    })

    return { id: project.id, title: project.title }
  } catch (error) {
    // Rollback: delete all uploaded images if the database transaction fails.
    await Promise.all(uploadedPaths.map((p) => deleteFile(IMAGE_BUCKET, p)))
    throw error
  }
}

// Logs a progress update and updates the project's current progress and status.
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

// Masks a name to show only the first character followed by asterisks.
function maskName(name: string): string {
  if (!name) return "Anonim"
  return name.charAt(0) + "***"
}
