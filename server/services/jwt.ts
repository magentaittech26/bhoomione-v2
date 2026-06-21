import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getPool } from "../db/pool.ts";

const JWT_SECRET = process.env.JWT_SECRET || "bhoomione_v2_ultra_secure_development_secret_key_2026";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string | null;
  tenantId: string | null;
}

export class JwtTokenService {
  /**
   * Generates a 15-minute cryptographically signed JWT access token.
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      {
        sub: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        tenantId: payload.tenantId,
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  }

  /**
   * Generates a revocable cryptographically secure refresh token string and registers it in database.
   */
  static async generateAndSaveRefreshToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(40).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    const pool = getPool();
    const query = `
      INSERT INTO refresh_tokens (user_id, token_hash, revoked, expires_at)
      VALUES ($1, $2, FALSE, $3)
    `;

    await pool.query(query, [userId, tokenHash, expiresAt]);
    return rawToken;
  }

  /**
   * Verifies access token and decodes payload. Returns decoded payload or throws error.
   */
  static verifyAccessToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.sub) {
      throw new Error("Invalid token payload structure.");
    }
    return {
      userId: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || null,
      tenantId: decoded.tenantId || null,
    };
  }

  /**
   * Validates refresh token from incoming authorization parameters.
   * Checks database states (existence, revocation, expiration bounds).
   * Returns user_id if valid, or null if invalid/revoked.
   */
  static async validateRefreshToken(rawToken: string): Promise<string | null> {
    try {
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const pool = getPool();

      const query = `
        SELECT user_id, revoked, expires_at 
        FROM refresh_tokens 
        WHERE token_hash = $1
      `;
      const result = await pool.query(query, [tokenHash]);

      if (result.rows.length === 0) {
        return null;
      }

      const { user_id, revoked, expires_at } = result.rows[0];

      // Verification checks
      if (revoked) {
        return null;
      }

      const expiryDate = new Date(expires_at);
      if (expiryDate.getTime() < Date.now()) {
        return null;
      }

      return user_id;
    } catch (err) {
      console.error("Failed to validate refresh token in PostgreSQL:", err);
      return null;
    }
  }

  /**
   * Revokes specific refresh token structure. Returns true if successful or false otherwise.
   */
  static async revokeRefreshToken(rawToken: string): Promise<boolean> {
    try {
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const pool = getPool();

      const query = `
        UPDATE refresh_tokens 
        SET revoked = TRUE 
        WHERE token_hash = $1
        RETURNING id
      `;
      const result = await pool.query(query, [tokenHash]);
      return result.rows.length > 0;
    } catch (err) {
      console.error("Failed to revoke refresh token in database:", err);
      return false;
    }
  }

  /**
   * Revokes all active refresh tokens for specific user security profile reset.
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      const pool = getPool();
      await pool.query("UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1", [userId]);
    } catch (err) {
      console.error("Failed to revoke all user tokens in database:", err);
    }
  }
}
