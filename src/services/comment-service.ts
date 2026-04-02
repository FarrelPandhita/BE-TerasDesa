import { v4 as uuid } from "uuid"
import { prisma } from "../prisma/prisma-client"
import { AppError } from "../utils/app-error"
import { CreateCommentRequest } from "../validation/comment-validation"

// Returns all comments for a project, with anonymous authors masked.
export async function getProjectComments(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  })
  if (!project) throw new AppError(404, "Project not found")

  const comments = await prisma.comment.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, username: true } },
    },
  })

  return comments.map((c) => ({
    id: c.id,
    comment: c.comment,
    isAnonymous: c.isAnonymous,
    createdAt: c.createdAt,
    author: c.isAnonymous
      ? maskName(c.user.name)
      : { id: c.user.id, name: c.user.name, username: c.user.username },
  }))
}

// Creates a new comment on a project for the authenticated user.
export async function createComment(
  projectId: string,
  data: CreateCommentRequest,
  userId: string
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  })
  if (!project) throw new AppError(404, "Project not found")

  const comment = await prisma.comment.create({
    data: {
      id: uuid(),
      userId,
      projectId,
      comment: data.comment,
      isAnonymous: data.is_anonymous,
    },
    select: {
      id: true,
      comment: true,
      isAnonymous: true,
      createdAt: true,
    },
  })

  return comment
}

// Masks a name to show only the first character followed by asterisks.
function maskName(name: string): string {
  if (!name) return "Anonim"
  return name.charAt(0) + "***"
}
