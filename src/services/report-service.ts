import { v4 as uuid } from "uuid"
import { prisma } from "../prisma/prisma-client"
import { AppError } from "../utils/app-error"
import { uploadFile, getPublicUrl, deleteFile } from "./storage-service"
import {
  CreateReportRequest,
  UpdateReportStatusRequest,
  ListReportsQuery,
} from "../validation/report-validation"

// Creates a new citizen report with an initial status of "diterima" and optional image upload.
export async function createReport(
  data: CreateReportRequest,
  userId: string,
  file?: Express.Multer.File
) {
  if (data.project_id) {
    const project = await prisma.project.findFirst({
      where: { id: data.project_id, deletedAt: null },
    })
    if (!project) throw new AppError(404, "Linked project not found")
  }

  let imageUrl: string | null = null
  let storagePath: string | null = null

  if (file) {
    storagePath = await uploadFile("report-photos", file, "reports")
    imageUrl = getPublicUrl("report-photos", storagePath)
  }

  try {
    const report = await prisma.report.create({
      data: {
        id: uuid(),
        userId,
        projectId: data.project_id ?? null,
        title: data.title,
        description: data.description,
        location: data.location,
        status: "diterima",
        imageUrl,
      },
      select: {
        id: true,
        title: true,
        status: true,
        imageUrl: true,
        createdAt: true,
      },
    })

    return report
  } catch (error) {
    // Rollback: delete the uploaded file if database insertion fails.
    if (storagePath) {
      await deleteFile("report-photos", storagePath)
    }
    throw error // Re-throw the original error to be handled by the controller.
  }
}

// Returns paginated reports. Admins see all; citizens see only their own.
export async function listReports(
  query: ListReportsQuery,
  requestingUserId: string,
  isAdmin: boolean
) {
  const { status, page, limit } = query
  const skip = (page - 1) * limit

  const [items, total] = await prisma.$transaction([
    prisma.report.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(!isAdmin ? { userId: requestingUserId } : {}),
      },
      select: {
        id: true,
        title: true,
        location: true,
        status: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { name: true, username: true } },
        project: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.report.count({
      where: {
        ...(status ? { status } : {}),
        ...(!isAdmin ? { userId: requestingUserId } : {}),
      },
    }),
  ])

  return {
    items: items.map(({ ...rest }) => rest),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// Returns full report detail. Citizens can only access their own report.
export async function getReportById(
  id: string,
  requestingUserId: string,
  isAdmin: boolean
) {
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, username: true, phoneNumber: true } },
      project: { select: { id: true, title: true } },
      verifier: { select: { id: true, name: true } },
    },
  })

  if (!report) throw new AppError(404, "Report not found")

  if (!isAdmin && report.userId !== requestingUserId) {
    throw new AppError(403, "Forbidden")
  }

  return {
    id: report.id,
    title: report.title,
    description: report.description,
    location: report.location,
    status: report.status,
    imageUrl: report.imageUrl,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    user: report.user,
    project: report.project,
    verifier: report.verifier,
  }
}

// Updates report status and records the admin who verified it.
export async function updateReportStatus(
  id: string,
  data: UpdateReportStatusRequest,
  adminId: string
) {
  const report = await prisma.report.findUnique({ where: { id } })
  if (!report) throw new AppError(404, "Report not found")

  const updated = await prisma.report.update({
    where: { id },
    data: {
      status: data.status,
      verifiedBy: adminId,
    },
    select: {
      id: true,
      status: true,
      verifiedBy: true,
      updatedAt: true,
    },
  })

  return updated
}

// Returns a lightweight list of all reports belonging to the given user.
export async function getMyReports(userId: string) {
  return prisma.report.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      status: true,
      location: true,
      imageUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })
}
