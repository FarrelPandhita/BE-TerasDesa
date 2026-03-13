import { OAuth2Client } from "google-auth-library"
import { prisma } from "../prisma/prisma-client"
import { generateToken } from "../utils/jwt"
import { v4 as uuidv4 } from "uuid"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function loginGoogle(idToken: string) {

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID as string
  })

  const payload = ticket.getPayload()
  

  const email = payload?.email as string
  const name = payload?.name as string
  const googleId = payload?.sub as string

  let user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        name,
        googleId
      }
    })
  }

  const token = generateToken(user.id)

  return token
}