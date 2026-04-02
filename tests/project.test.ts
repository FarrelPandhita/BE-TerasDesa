import request from "supertest"
import { app } from "../src/main"
import { createTestUser, createTestProject, cleanupTestData, disconnectPrisma } from "./test-util"

afterAll(async () => {
  await cleanupTestData()
  await disconnectPrisma()
})

describe("GET /api/v1/projects (Public List)", () => {
  let adminId: string

  beforeAll(async () => {
    await cleanupTestData()
    const { user } = await createTestUser("admin")
    adminId = user.id
    await createTestProject(adminId)
    await createTestProject(adminId)
  })

  it("should return paginated list of projects without auth", async () => {
    const res = await request(app).get("/api/v1/projects")

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("items")
    expect(res.body.data).toHaveProperty("total")
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(2)
  })

  it("should support pagination via query params", async () => {
    const res = await request(app).get("/api/v1/projects?page=1&limit=1")

    expect(res.status).toBe(200)
    expect(res.body.data.items.length).toBe(1)
    expect(res.body.data.totalPages).toBeGreaterThanOrEqual(2)
  })
})

describe("GET /api/v1/projects/:id (Public Detail)", () => {
  let projectId: string

  beforeAll(async () => {
    await cleanupTestData()
    const { user } = await createTestUser("admin")
    const project = await createTestProject(user.id)
    projectId = project.id
  })

  it("should return full project detail", async () => {
    const res = await request(app).get(`/api/v1/projects/${projectId}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("id", projectId)
    expect(res.body.data).toHaveProperty("title")
    expect(res.body.data).toHaveProperty("totalBudget")
    expect(res.body.data).toHaveProperty("timelines")
    expect(res.body.data).toHaveProperty("expenses")
    expect(res.body.data).toHaveProperty("comments")
  })

  it("should return 404 for non-existent project", async () => {
    const res = await request(app).get("/api/v1/projects/00000000-0000-0000-0000-000000000000")

    expect(res.status).toBe(404)
  })
})

describe("POST /api/v1/projects (Admin Only)", () => {
  let adminToken: string
  let citizenToken: string

  beforeAll(async () => {
    await cleanupTestData()
    const admin = await createTestUser("admin")
    const citizen = await createTestUser("citizen")
    adminToken = admin.token
    citizenToken = citizen.token
  })

  it("should allow admin to create a project", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Proyek Jembatan Desa",
        description: "Pembangunan jembatan penghubung antar dusun.",
        location: "Dusun Karanganyar",
        total_budget: 500000000,
        status: "perencanaan",
        start_date: "2026-06-01",
        end_date: "2026-12-31",
        timeline: [
          { stage_name: "Tahap Awal", stage_date: "2026-06-01", status: "belum" },
        ],
        expenses: [
          { expense_name: "Material", amount: 200000000, percentage: 40 },
        ],
      })

    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty("id")
    expect(res.body.data).toHaveProperty("title", "Proyek Jembatan Desa")
  })

  it("should reject citizen from creating a project", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({
        title: "Proyek Ilegal",
        description: "Warga biasa tidak boleh.",
        location: "Somewhere",
        total_budget: "100000",
        status: "perencanaan",
        start_date: "2026-01-01",
        end_date: "2026-06-01",
        timeline: [],
        expenses: [],
      })

    expect(res.status).toBe(403)
  })

  it("should reject unauthenticated request", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .send({ title: "No token" })

    expect(res.status).toBe(401)
  })
})
