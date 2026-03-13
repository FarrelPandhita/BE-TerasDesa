import bcrypt from "bcrypt"
import { prisma } from "../prisma/prisma-client"
import { v4 as uuid } from "uuid"
import { generateToken } from "../utils/jwt"

export async function registerUser(data: any) {

  const hashedPassword = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      id: uuid(),
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword
    }
  })

  return user
}

export async function loginUser(data: any) {

  const user = await prisma.user.findUnique({
    where: { email: data.email }
  })

  if (!user) throw new Error("User not found")

  const match = await bcrypt.compare(
    data.password,
    user.passwordHash!
  )

  if (!match) throw new Error("Invalid password")

  const token = generateToken(user.id)

  return token
}