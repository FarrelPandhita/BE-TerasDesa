import bcrypt from "bcrypt"
import { prisma } from "../prisma/prisma-client"
import { v4 as uuid } from "uuid"
import { generateToken } from "../utils/jwt"
import { AppError } from "../utils/app-error"
import { RegisterUserRequest, LoginUserRequest } from "../validation/user-validation"

// Register
export async function registerUser(data: RegisterUserRequest) {
  // Check if email already used
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

// Login
export async function loginUser(data: LoginUserRequest): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  })

  // Use a generic error message to avoid email enumeration attacks
  if (!user || !user.passwordHash) {
    throw new AppError(401, "Invalid email or password")
  }

  const match = await bcrypt.compare(data.password, user.passwordHash)
  if (!match) {
    throw new AppError(401, "Invalid email or password")
  }

  // this token includes role for RBAC
  return generateToken(user.id, user.role)
}

// Get Current User
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
