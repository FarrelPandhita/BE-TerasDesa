import bcrypt from "bcrypt"
import { prisma } from "../prisma/prisma-client"
import { v4 as uuid } from "uuid"
import { generateToken } from "../utils/jwt"
import { AppError } from "../utils/app-error"
import { RegisterUserRequest, LoginUserRequest } from "../validation/user-validation"

// creates a new user after checking email uniqueness
export async function registerUser(data: RegisterUserRequest) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new AppError(409, "Email is already registered")

  const hashedPassword = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      id: uuid(),
      username: data.username,
      name: data.name,
      phoneNumber: data.phone_number,
      email: data.email,
      passwordHash: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      name: true,
      phoneNumber: true,
      email: true,
      role: true,
    },
  })

  return user
}

// authenticates user by email/password and returns JWT
export async function loginUser(data: LoginUserRequest): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (!user || !user.passwordHash) {
    throw new AppError(401, "Invalid email or password")
  }

  const match = await bcrypt.compare(data.password, user.passwordHash)
  if (!match) {
    throw new AppError(401, "Invalid email or password")
  }

  return generateToken(user.id, user.role)
}

// fetches user profile by id
export async function getUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      phoneNumber: true,
      email: true,
      role: true,
    },
  })

  if (!user) throw new AppError(404, "User not found")
  return user
}
