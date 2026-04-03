import { v4 as uuid } from "uuid"
import { prisma } from "../prisma/prisma-client"
import { AppError } from "../utils/app-error"
import { uploadFile, getPublicUrl, deleteFile } from "./storage-service"
import {
  CreateReportRequest,
  UpdateReportStatusRequest,
  ListReportsQuery,
} from "../validation/report-validation"

const IMAGE_BUCKET = "report-photos"
const IMAGE_FOLDER = "reports"

// Creates a new citizen report with status "diterima" and up to 2 optional image uploads.
export async function createReport(
  data: CreateReportRequest,
  userId: string,
  files: Express.Multer.File[] = []
) {
  if (data.project_id) {
    const project = await prisma.project.findFirst({
      where: { id: data.project_id, deletedAt: null },
    })
    if (!project) throw new AppError(404, "Linked project not found")
  }

  const uploadedPaths: string[] = []

  for (const file of files) {
    const path = await uploadFile(IMAGE_BUCKET, file, IMAGE_FOLDER)
    uploadedPaths.push(path)
  }

  // Pre-compute URLs once to avoid redundant getPublicUrl calls.
  const imageUrls = uploadedPaths.map((p) => getPublicUrl(IMAGE_BUCKET, p))

  try {
    const report = await prisma.$transaction(async (tx) => {
      const r = await tx.report.create({
        data: {
          id: uuid(),
          userId,
          projectId: data.project_id ?? null,
          title: data.title,
          description: data.description,
          location: data.location,
          status: "diterima",
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      })

      if (imageUrls.length > 0) {
        await tx.reportImage.createMany({
          data: imageUrls.map((url) => ({
            id: uuid(),
            reportId: r.id,
            imageUrl: url,
          })),
        })
      }

      return r
    })

    return { ...report, images: imageUrls }
  } catch (error) {
    await Promise.all(uploadedPaths.map((p) => deleteFile(IMAGE_BUCKET, p)))
    throw error
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
        createdAt: true,
        updatedAt: true,
        user: { select: { name: true, username: true } },
        project: { select: { id: true, title: true } },
        images: { select: { imageUrl: true } },
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
    items: items.map(({ images, ...rest }) => ({
      ...rest,
      images: images.map((img) => img.imageUrl),
    })),
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
      images: { select: { imageUrl: true } },
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
    images: report.images.map((img) => img.imageUrl),
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
  const reports = await prisma.report.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      status: true,
      location: true,
      createdAt: true,
      images: { select: { imageUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return reports.map(({ images, ...rest }) => ({
    ...rest,
    images: images.map((img) => img.imageUrl),
  }))
}
