import request from "supertest"
import { app } from "../src/main"
import { createTestUser, createTestProject, cleanupTestData, disconnectPrisma } from "./test-util"

afterAll(async () => {
  await cleanupTestData()
  await disconnectPrisma()
})

describe("GET /api/v1/projects (Public List)", () => {
  beforeAll(async () => {
    await cleanupTestData()
    const { user } = await createTestUser("admin")
    await createTestProject(user.id)
    await createTestProject(user.id)
  })

  it("should return paginated list of projects without auth", async () => {
    const res = await request(app).get("/api/v1/projects")

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("items")
    expect(res.body.data).toHaveProperty("total")
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(2)
    expect(Array.isArray(res.body.data.items[0].images)).toBe(true)
  })

  it("should support pagination via query params", async () => {
    const res = await request(app).get("/api/v1/projects?page=1&limit=1")

    expect(res.status).toBe(200)
    expect(res.body.data.items.length).toBe(1)
    expect(res.body.data.totalPages).toBeGreaterThanOrEqual(2)
  })
})

describe("GET /api/v1/projects (Year Filter)", () => {
  beforeAll(async () => {
    await cleanupTestData()
    const { user } = await createTestUser("admin")
    await createTestProject(user.id, { startDate: "2025-06-01", endDate: "2025-12-31" })
    await createTestProject(user.id, { startDate: "2026-03-01", endDate: "2026-09-30" })
    await createTestProject(user.id, { startDate: "2026-07-01", endDate: "2027-01-31" })
  })

  it("should return only projects matching the tahun filter", async () => {
    const res = await request(app).get("/api/v1/projects?tahun=2026")

    expect(res.status).toBe(200)
    expect(res.body.data.total).toBe(2)
    expect(res.body.data.items.length).toBe(2)
  })

  it("should reject invalid tahun format", async () => {
    const res = await request(app).get("/api/v1/projects?tahun=abc")

    expect(res.status).toBe(400)
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
    expect(res.body.data).toHaveProperty("images")
    expect(Array.isArray(res.body.data.images)).toBe(true)
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

  it("should allow admin to create a project via multipart/form-data without images", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("title", "Proyek Jembatan Desa")
      .field("description", "Pembangunan jembatan penghubung antar dusun.")
      .field("location", "Dusun Karanganyar")
      .field("total_budget", "500000000")
      .field("status", "perencanaan")
      .field("start_date", "2026-06-01")
      .field("end_date", "2026-12-31")
      .field("timeline", JSON.stringify([
        { stage_name: "Tahap Awal", stage_date: "2026-06-01", status: "belum" },
      ]))
      .field("expenses", JSON.stringify([
        { expense_name: "Material", amount: 200000000, percentage: 40 },
      ]))

    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty("id")
    expect(res.body.data).toHaveProperty("title", "Proyek Jembatan Desa")
  })

  it("should reject more than 3 image files", async () => {
    const fakeImage = Buffer.from("fake-image-data")
    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("title", "Proyek Gambar Banyak")
      .field("description", "Test maks image.")
      .field("location", "Test")
      .field("total_budget", "100000000")
      .field("start_date", "2026-01-01")
      .field("end_date", "2026-12-31")
      .attach("images", fakeImage, { filename: "img1.jpg", contentType: "image/jpeg" })
      .attach("images", fakeImage, { filename: "img2.jpg", contentType: "image/jpeg" })
      .attach("images", fakeImage, { filename: "img3.jpg", contentType: "image/jpeg" })
      .attach("images", fakeImage, { filename: "img4.jpg", contentType: "image/jpeg" })

    expect(res.status).toBe(400)
  })

  it("should reject invalid timeline JSON string", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("title", "Proyek JSON Rusak")
      .field("description", "Timeline tidak valid.")
      .field("location", "Test")
      .field("total_budget", "100000000")
      .field("start_date", "2026-01-01")
      .field("end_date", "2026-12-31")
      .field("timeline", "not-valid-json")

    expect(res.status).toBe(400)
  })

  it("should reject citizen from creating a project", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${citizenToken}`)
      .field("title", "Proyek Ilegal")
      .field("description", "Warga biasa tidak boleh.")
      .field("location", "Somewhere")
      .field("total_budget", "100000")
      .field("status", "perencanaan")
      .field("start_date", "2026-01-01")
      .field("end_date", "2026-06-01")

    expect(res.status).toBe(403)
  })

  it("should reject unauthenticated request", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .field("title", "No token")

    expect(res.status).toBe(401)
  })
})

describe("POST /api/v1/projects/:id/updates (Progress Update)", () => {
  let adminToken: string
  let projectId: string

  beforeAll(async () => {
    await cleanupTestData()
    const admin = await createTestUser("admin")
    adminToken = admin.token
    const project = await createTestProject(admin.user.id)
    projectId = project.id
  })

  it("should set status to selesai when progress reaches 100", async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/updates`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ progress: 100, description: "Proyek selesai." })

    expect(res.status).toBe(200)

    const detail = await request(app).get(`/api/v1/projects/${projectId}`)
    expect(detail.body.data.status).toBe("selesai")
    expect(detail.body.data.progress).toBe(100)
  })

  it("should revert status to berjalan when progress drops below 100", async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/updates`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ progress: 75, description: "Revisi progres." })

    expect(res.status).toBe(200)

    const detail = await request(app).get(`/api/v1/projects/${projectId}`)
    expect(detail.body.data.status).toBe("berjalan")
    expect(detail.body.data.progress).toBe(75)
  })

  it("should return 404 for non-existent project", async () => {
    const res = await request(app)
      .post("/api/v1/projects/00000000-0000-0000-0000-000000000000/updates")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ progress: 50, description: "Ghost project." })

    expect(res.status).toBe(404)
  })
})
