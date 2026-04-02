import request from "supertest"
import { app } from "../src/main"
import { createTestUser, cleanupTestData, disconnectPrisma } from "./test-util"

afterAll(async () => {
  await cleanupTestData()
  await disconnectPrisma()
})

describe("POST /api/v1/users (Register)", () => {
  afterAll(async () => {
    await cleanupTestData()
  })

  it("should register a new user successfully", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send({
        username: "budisantoso",
        name: "Budi Santoso",
        email: "budi_register_test@mail.com",
        phone_number: "081234567890",
        password: "Pass123!",
      })

    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty("id")
    expect(res.body.data.email).toBe("budi_register_test@mail.com")
    expect(res.body.data.role).toBe("citizen")
    expect(res.body.data).not.toHaveProperty("passwordHash")
  })

  it("should reject duplicate email", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send({
        username: "budisantoso2",
        name: "Budi Santoso 2",
        email: "budi_register_test@mail.com",
        phone_number: "081234567890",
        password: "Pass123!",
      })

    expect(res.status).toBe(409)
  })

  it("should reject invalid payload (missing password)", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send({
        username: "nopass",
        name: "No Password",
        email: "nopass@mail.com",
        phone_number: "081234567890",
      })

    expect(res.status).toBe(400)
  })
})

describe("POST /api/v1/users/login", () => {
  let registeredEmail: string

  beforeAll(async () => {
    await cleanupTestData()
    const { user } = await createTestUser("citizen")
    registeredEmail = user.email
  })

  it("should login with correct credentials", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({ email: registeredEmail, password: "Test123!" })

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("token")
    expect(typeof res.body.data.token).toBe("string")
  })

  it("should reject wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({ email: registeredEmail, password: "WrongPassword123!" })

    expect(res.status).toBe(401)
  })

  it("should reject non-existent email", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({ email: "nobody@nowhere.com", password: "Pass123!" })

    expect(res.status).toBe(401)
  })
})

describe("GET /api/v1/users/current", () => {
  let token: string

  beforeAll(async () => {
    await cleanupTestData()
    const result = await createTestUser("citizen")
    token = result.token
  })

  it("should return current user profile with valid token", async () => {
    const res = await request(app)
      .get("/api/v1/users/current")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("id")
    expect(res.body.data).toHaveProperty("email")
    expect(res.body.data).toHaveProperty("role")
    expect(res.body.data).not.toHaveProperty("passwordHash")
  })

  it("should reject request without token", async () => {
    const res = await request(app).get("/api/v1/users/current")

    expect(res.status).toBe(401)
  })

  it("should reject request with invalid token", async () => {
    const res = await request(app)
      .get("/api/v1/users/current")
      .set("Authorization", "Bearer invalid.token.here")

    expect(res.status).toBe(401)
  })
})
