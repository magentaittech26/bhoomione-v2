import { Request, Response, NextFunction } from "express";
import { JwtTokenService, TokenPayload } from "../services/jwt.ts";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access denied. Authentication token is missing." });
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const payload = JwtTokenService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    console.error("JWT Authorization failure:", error.message);
    res.status(401).json({ error: "Authentication token is invalid or expired." });
  }
}
