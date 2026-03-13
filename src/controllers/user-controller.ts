import { Request, Response } from "express"
import { registerUser, loginUser } from "../services/user-service"
import { loginGoogle } from "../services/google-auth-service"
import { registerUserValidation } from "../validation/user-validation"
import { ZodError } from "zod"

export async function currentUser(req: any, res: Response) {

  res.json({
    data: req.user
  })

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
  const token = await loginUser(req.body)
  res.json({ data: { token } })
}

export async function oauthGoogle(req: Request, res: Response) {
  const token = await loginGoogle(req.body.id_token)
  res.json({ data: { token } })
}