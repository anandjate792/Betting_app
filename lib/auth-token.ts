import jwt from "jsonwebtoken"

export function generateToken(userId: string, email: string, role: string) {
  return jwt.sign({ id: userId, email, role }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d",
  })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
  } catch {
    return null
  }
}
