import jwt from "jsonwebtoken";

type AccessTokenPayload = {
  userId: string;
  email: string;
};

type RefreshTokenPayload = {
  userId: string;
};

const accessSecret: string = process.env.JWT_ACCESS_SECRET || "";
const refreshSecret: string = process.env.JWT_REFRESH_SECRET || "";

if (!accessSecret || !refreshSecret) {
  throw new Error("JWT secrets are missing in environment variables");
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, accessSecret, {
    expiresIn: "15m",
  });
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, refreshSecret, {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, refreshSecret) as RefreshTokenPayload;
}