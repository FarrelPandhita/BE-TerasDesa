import request from "supertest"
import { app } from "../src/main"
import { createTestUser, createTestProject, cleanupTestData, disconnectPrisma } from "./test-util"

afterAll(async () => {
  await cleanupTestData()
  await disconnectPrisma()
})

describe("POST /api/v1/projects/:id/comments (Submit Comment)", () => {
  let citizenToken: string
  let projectId: string

  beforeAll(async () => {
    await cleanupTestData()
    const admin = await createTestUser("admin")
    const citizen = await createTestUser("citizen")
    citizenToken = citizen.token
    const project = await createTestProject(admin.user.id)
    projectId = project.id
  })

  it("should submit a normal (non-anonymous) comment", async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/comments`)
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ comment: "Proyek ini sangat membantu warga.", is_anonymous: false })

    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty("id")
    expect(res.body.data).toHaveProperty("comment", "Proyek ini sangat membantu warga.")
    expect(res.body.data.isAnonymous).toBe(false)
  })

  it("should submit an anonymous comment", async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/comments`)
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ comment: "Komentar rahasia.", is_anonymous: true })

    expect(res.status).toBe(201)
    expect(res.body.data.isAnonymous).toBe(true)
  })

  it("should reject comment without authentication", async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/comments`)
      .send({ comment: "No token comment." })

    expect(res.status).toBe(401)
  })

  it("should reject comment on non-existent project", async () => {
    const res = await request(app)
      .post("/api/v1/projects/00000000-0000-0000-0000-000000000000/comments")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ comment: "Ghost project.", is_anonymous: false })

    expect(res.status).toBe(404)
  })
})

describe("GET /api/v1/projects/:id/comments (List Comments)", () => {
  let projectId: string

  beforeAll(async () => {
    await cleanupTestData()
    const admin = await createTestUser("admin")
    const citizen = await createTestUser("citizen")
    const project = await createTestProject(admin.user.id)
    projectId = project.id

    // add a few comments
    const token = citizen.token
    await request(app)
      .post(`/api/v1/projects/${projectId}/comments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ comment: "Komentar pertama.", is_anonymous: false })

    await request(app)
      .post(`/api/v1/projects/${projectId}/comments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ comment: "Komentar anonim.", is_anonymous: true })
  })

  it("should return all comments for a project (public endpoint)", async () => {
    const res = await request(app).get(`/api/v1/projects/${projectId}/comments`)

    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThanOrEqual(2)
  })

  it("should mask author name for anonymous comments", async () => {
    const res = await request(app).get(`/api/v1/projects/${projectId}/comments`)

    const anonComment = res.body.data.find((c: { isAnonymous: boolean }) => c.isAnonymous)
    expect(anonComment).toBeDefined()
    expect(typeof anonComment.author).toBe("string") // masked name is a string like "T***"
  })
})
