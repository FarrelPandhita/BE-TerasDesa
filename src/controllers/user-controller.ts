import { Request, Response } from "express"
import { registerUser, loginUser } from "../services/user-service"
import { loginGoogle } from "../services/google-auth-service"

export async function currentUser(req: any, res: Response) {

  res.json({
    data: req.user
  })

}
export async function register(req: Request, res: Response) {
  const user = await registerUser(req.body)
  res.json({ data: user })
}

export async function login(req: Request, res: Response) {
  const token = await loginUser(req.body)
  res.json({ data: { token } })
}

export async function oauthGoogle(req: Request, res: Response) {
  const token = await loginGoogle(req.body.id_token)
  res.json({ data: { token } })
}