import { Request, Response } from "express"
import { registerUser, loginUser, getUser } from "../services/user-service"
import { registerUserValidation, loginUserValidation } from "../validation/user-validation"
import { ZodError } from "zod"

export async function currentUser(req: any, res: Response) {
  try {
    const user = await getUser(req.user.userId)
    res.json({
      data: user
    })
  } catch (error) {
    res.status(404).json({
      errors: "User not found"
    })
  }
}
export async function register(req: Request, res: Response) {
    try {

    const validated = registerUserValidation.parse(req.body)

    const user = await registerUser(validated)

    res.status(201).json({
      data: user
    })

  } catch (error) {

    if (error instanceof ZodError) {

    return res.status(400).json({
      errors: error.issues.map(issue => issue.message)
    })

    }

    return res.status(500).json({
      errors: "Internal server error"
    })

  }
}

export async function login(req: Request, res: Response) {
  try {
    const validated = loginUserValidation.parse(req.body)
    const token = await loginUser(validated)
    res.json({ data: { token } })
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        errors: error.issues.map(issue => issue.message)
      })
    }
    
    // Tangani error yang dilempar oleh service (misal, "User not found" atau "Invalid password")
    if (error instanceof Error) {
      return res.status(401).json({
        errors: error.message
      })
    }

    return res.status(500).json({
      errors: "Internal server error"
    })
  }
}