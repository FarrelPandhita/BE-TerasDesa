import { prisma } from "../src/prisma/prisma-client"
import bcrypt from "bcrypt"
import { v4 as uuid } from "uuid"
import jwt from "jsonwebtoken"

const SECRET = process.env.JWT_SECRET!

// Generates a valid JWT token for testing purposes.
export function generateTestToken(userId: string, role: "admin" | "citizen"): string {
  return jwt.sign({ userId, role }, SECRET, { expiresIn: "1d" })
}

// Creates a test user and returns the user record and a valid token.
export async function createTestUser(role: "admin" | "citizen" = "citizen") {
  const id = uuid()
  const user = await prisma.user.create({
    data: {
      id,
      username: `testuser_${id.substring(0, 8)}`,
      name: `Test User ${id.substring(0, 8)}`,
      email: `test_${id.substring(0, 8)}@mail.com`,
      phoneNumber: "081200000000",
      passwordHash: await bcrypt.hash("Test123!", 10),
      role,
    },
  })
  const token = generateTestToken(user.id, role)
  return { user, token }
}

// Creates a test project owned by the given admin user.
export async function createTestProject(adminId: string) {
  const id = uuid()
  return prisma.project.create({
    data: {
      id,
      title: `Test Project ${id.substring(0, 8)}`,
      description: "A test project for automated testing.",
      location: "Test Location",
      totalBudget: BigInt(100000000),
      status: "berjalan",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      createdBy: adminId,
    },
  })
}

// Creates a test report submitted by the given user.
export async function createTestReport(userId: string, projectId?: string) {
  const id = uuid()
  return prisma.report.create({
    data: {
      id,
      title: `Test Report ${id.substring(0, 8)}`,
      description: "A test report detail.",
      location: "Test Location",
      userId,
      projectId,
      status: "diterima",
    },
  })
}

// Removes all test data from the database in the correct order (respecting foreign keys).
export async function cleanupTestData() {
  await prisma.comment.deleteMany()
  await prisma.reportImage.deleteMany()
  await prisma.report.deleteMany()
  await prisma.projectUpdate.deleteMany()
  await prisma.projectTimeline.deleteMany()
  await prisma.detailPengeluaranAnggaran.deleteMany()
  await prisma.projectFunding.deleteMany()
  await prisma.projectImage.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
}

// Disconnects the Prisma client after all tests finish.
export async function disconnectPrisma() {
  await prisma.$disconnect()
}
