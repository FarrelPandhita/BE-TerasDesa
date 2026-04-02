import request from "supertest"
import { app } from "../src/main"
import { cleanupTestData, disconnectPrisma } from "./test-util"

afterAll(async () => {
  await cleanupTestData()
  await disconnectPrisma()
})

describe("GET /api/v1/health", () => {
  it("should return health check", async () => {
    const res = await request(app).get("/api/v1/health")

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("status", "ok")
    expect(res.body).toHaveProperty("timestamp")
  })
})

describe("GET /api/v1/statistics/dashboard", () => {
  it("should return dashboard statistics", async () => {
    const res = await request(app).get("/api/v1/statistics/dashboard")

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("total_budget")
    expect(res.body.data).toHaveProperty("reports")
    expect(res.body.data.reports).toHaveProperty("total")
    expect(res.body.data.reports).toHaveProperty("unprocessed")
    expect(res.body.data).toHaveProperty("projects")
    expect(res.body.data.projects).toHaveProperty("total")
    expect(res.body.data.projects).toHaveProperty("active")
    expect(res.body.data.projects).toHaveProperty("finished")
  })
})

describe("GET /api/v1/statistics/reports-pie", () => {
  it("should return report pie breakdown", async () => {
    const res = await request(app).get("/api/v1/statistics/reports-pie")

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("total")
    expect(res.body.data).toHaveProperty("breakdown")
    expect(res.body.data.breakdown).toHaveLength(3)

    const statuses = res.body.data.breakdown.map((b: { status: string }) => b.status)
    expect(statuses).toContain("diterima")
    expect(statuses).toContain("diproses")
    expect(statuses).toContain("selesai")
  })
})
