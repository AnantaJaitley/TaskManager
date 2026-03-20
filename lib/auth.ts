import { verifyAccessToken } from "@/lib/jwt";

type AccessTokenPayload = {
  userId: string;
  email: string;
};

export function getUserFromRequest(request: Request): AccessTokenPayload {
  const authorizationHeader: string | null = request.headers.get("authorization");

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    throw new Error("Authorization token missing or invalid");
  }

  const token: string = authorizationHeader.split(" ")[1];

  return verifyAccessToken(token);
}