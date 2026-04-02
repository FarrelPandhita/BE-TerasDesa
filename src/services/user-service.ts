import bcrypt from "bcrypt"
import { prisma } from "../prisma/prisma-client"
import { v4 as uuid } from "uuid"
import { generateToken } from "../utils/jwt"
import { AppError } from "../utils/app-error"
import { uploadFile, deleteFile, getPublicUrl, extractPathFromUrl } from "./storage-service"
import { RegisterUserRequest, LoginUserRequest } from "../validation/user-validation"

// Registers a new user after checking for duplicate email and hashing the password.
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
      profilePictureUrl: true,
    },
  })

  return user
}

// Authenticates a user by email and password, returning a signed JWT on success.
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

// Fetches the current authenticated user's profile by their ID.
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
      profilePictureUrl: true,
    },
  })

  if (!user) throw new AppError(404, "User not found")
  return user
}

// Updates a user's profile picture and deletes the old photo if it exists.
export async function updateProfilePicture(userId: string, file: Express.Multer.File) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, profilePictureUrl: true },
  })

  if (!user) throw new AppError(404, "User not found")

  // Upload new photo
  const storagePath = await uploadFile("profile-pictures", file, "profiles")
  const profilePictureUrl = getPublicUrl("profile-pictures", storagePath)

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { profilePictureUrl },
    })

    // If change successful, delete OLD picture from Supabase to optimize storage.
    if (user.profilePictureUrl) {
      const oldPath = extractPathFromUrl(user.profilePictureUrl, "profile-pictures")
      if (oldPath) {
        await deleteFile("profile-pictures", oldPath)
      }
    }

    return { profilePictureUrl }
  } catch (error) {
    // If update DB fails, rollback: delete the newly uploaded file.
    await deleteFile("profile-pictures", storagePath)
    throw error
  }
}
