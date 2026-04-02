import { OAuth2Client } from "google-auth-library"
import { prisma } from "../prisma/prisma-client"
import { v4 as uuid } from "uuid"
import { generateToken } from "../utils/jwt"
import { AppError } from "../utils/app-error"

// Verifies a Google ID token and returns a JWT. Creates the user account if it does not exist yet.
export async function loginWithGoogle(idToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new AppError(500, "Google OAuth is not configured on the server")
  }

  const client = new OAuth2Client(clientId)

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    })

    const payload = ticket.getPayload()
    if (!payload || !payload.email || !payload.name || !payload.sub) {
      throw new AppError(400, "Invalid Google token payload")
    }

    const email = payload.email as string
    const name = payload.name as string
    const googleId = payload.sub as string

    let user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { email },
          data: { googleId },
        })
      }
    } else {
      const newUserId = uuid()
      user = await prisma.user.create({
        data: {
          id: newUserId,
          email,
          name,
          username: (email.split("@")[0] ?? "user").substring(0, 80),
          phoneNumber: "-",
          googleId,
        },
      })
    }

    return generateToken(user.id, user.role)
  } catch (error) {
    console.error("[Google Auth Error]", error)
    throw new AppError(401, "Invalid Google ID Token")
  }
}
