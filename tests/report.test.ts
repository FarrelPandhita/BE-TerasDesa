import request from "supertest"
import { app } from "../src/main"
import { createTestUser, createTestProject, cleanupTestData, disconnectPrisma } from "./test-util"

afterAll(async () => {
  await cleanupTestData()
  await disconnectPrisma()
})

describe("POST /api/v1/reports (Create Report)", () => {
  let citizenToken: string
  let adminToken: string

  beforeAll(async () => {
    await cleanupTestData()
    const citizen = await createTestUser("citizen")
    const admin = await createTestUser("admin")
    citizenToken = citizen.token
    adminToken = admin.token
  })

  it("should create a report without images and return images array", async () => {
    const res = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${citizenToken}`)
      .field("title", "Jalan berlubang di depan SD")
      .field("description", "Lubang besar yang membahayakan pengendara.")
      .field("location", "Jl. Merdeka No. 5")

    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty("id")
    expect(res.body.data).toHaveProperty("title", "Jalan berlubang di depan SD")
    expect(res.body.data).toHaveProperty("status", "diterima")
    expect(res.body.data).toHaveProperty("images")
    expect(Array.isArray(res.body.data.images)).toBe(true)
    expect(res.body.data.images.length).toBe(0)
  })

  it("should reject admin from submitting a report (citizen only)", async () => {
    const res = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("title", "Admin laporan")
      .field("description", "Admin tidak boleh lapor.")
      .field("location", "Kantor Desa")

    expect(res.status).toBe(403)
  })

  it("should reject more than 2 image files", async () => {
    const fakeImage = Buffer.from("fake-image-data")
    const res = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${citizenToken}`)
      .field("title", "Terlalu banyak foto")
      .field("description", "3 foto tidak diperbolehkan.")
      .field("location", "Jl. Test")
      .attach("images", fakeImage, { filename: "img1.jpg", contentType: "image/jpeg" })
      .attach("images", fakeImage, { filename: "img2.jpg", contentType: "image/jpeg" })
      .attach("images", fakeImage, { filename: "img3.jpg", contentType: "image/jpeg" })

    expect(res.status).toBe(500)
  })

  // Service role key has full Supabase permissions; single image upload should succeed end-to-end.
  it("should successfully create a report with a single image attachment", async () => {
    const res = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${citizenToken}`)
      .field("title", "Laporan dengan foto")
      .field("description", "Bukti terlampir.")
      .field("location", "Jl. Sudirman")
      .attach("images", Buffer.from("fake-image-data"), {
        filename: "test-photo.jpg",
        contentType: "image/jpeg",
      })

    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty("images")
    expect(Array.isArray(res.body.data.images)).toBe(true)
    expect(res.body.data.images.length).toBe(1)
  })

  it("should reject unauthenticated report submission", async () => {
    const res = await request(app)
      .post("/api/v1/reports")
      .field("title", "No token report")
      .field("description", "Should fail.")
      .field("location", "Unknown")

    expect(res.status).toBe(401)
  })
})

describe("GET /api/v1/reports (List Reports)", () => {
  let adminToken: string
  let citizenToken: string

  beforeAll(async () => {
    await cleanupTestData()
    const admin = await createTestUser("admin")
    const citizen = await createTestUser("citizen")
    adminToken = admin.token
    citizenToken = citizen.token

    // create a report as citizen
    await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${citizenToken}`)
      .field("title", "Laporan warga")
      .field("description", "Detail masalah.")
      .field("location", "Desa Makmur")
  })

  it("should return reports for authenticated user", async () => {
    const res = await request(app)
      .get("/api/v1/reports")
      .set("Authorization", `Bearer ${citizenToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("items")
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1)
  })

  it("should allow admin to see all reports", async () => {
    const res = await request(app)
      .get("/api/v1/reports")
      .set("Authorization", `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("items")
  })
})

describe("PATCH /api/v1/reports/:id/status (Admin Only)", () => {
  let adminToken: string
  let citizenToken: string
  let reportId: string

  beforeAll(async () => {
    await cleanupTestData()
    const admin = await createTestUser("admin")
    const citizen = await createTestUser("citizen")
    adminToken = admin.token
    citizenToken = citizen.token

    const reportRes = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${citizenToken}`)
      .field("title", "Laporan untuk di-update")
      .field("description", "Perlu ditangani.")
      .field("location", "Desa Sejahtera")

    reportId = reportRes.body.data.id
  })

  it("should allow admin to update report status", async () => {
    const res = await request(app)
      .patch(`/api/v1/reports/${reportId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "diproses" })

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("status", "diproses")
  })

  it("should reject citizen from updating status", async () => {
    const res = await request(app)
      .patch(`/api/v1/reports/${reportId}/status`)
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ status: "selesai" })

    expect(res.status).toBe(403)
  })
})
