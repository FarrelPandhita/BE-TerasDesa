import { OAuth2Client } from "google-auth-library"
import { prisma } from "../prisma/prisma-client"
import { v4 as uuid } from "uuid"
import { generateToken } from "../utils/jwt"
import { AppError } from "../utils/app-error"

export async function loginWithGoogle(idToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new AppError(500, "Google OAuth is not configured on the server")
  }

  const client = new OAuth2Client(clientId)

  const ticket = await client.verifyIdToken({ idToken, audience: clientId })
  const payload = ticket.getPayload()

  if (!payload || !payload.email || !payload.name || !payload.sub) {
    throw new AppError(400, "Invalid Google token payload")
  }

  const { email, name, sub: googleId } = payload

  let user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    // link google account if user registered manually before
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { email },
        data: { googleId },
      })
    }
  } else {
    // auto-register new user from google profile
    user = await prisma.user.create({
      data: {
        id: uuid(),
        email,
        name,
        username: (email.split("@")[0] ?? "user").substring(0, 80),
        phoneNumber: "-",
        googleId,
      },
    })
  }

  return generateToken(user.id, user.role)
}
