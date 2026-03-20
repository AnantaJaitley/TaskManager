import { prisma } from "@/lib/prisma";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "@/lib/jwt";

type RefreshBody = {
  refreshToken?: string;
};

type RefreshTokenPayload = {
  userId: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body: RefreshBody = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return Response.json(
        { message: "Refresh token is required" },
        { status: 400 }
      );
    }

    let decoded: RefreshTokenPayload;

    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return Response.json(
        { message: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    if (!user || !user.refreshToken) {
      return Response.json(
        { message: "User not found or refresh token missing" },
        { status: 401 }
      );
    }

    if (user.refreshToken !== refreshToken) {
      return Response.json(
        { message: "Refresh token does not match" },
        { status: 401 }
      );
    }

    const newAccessToken: string = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const newRefreshToken: string = generateRefreshToken({
      userId: user.id,
    });

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: newRefreshToken,
      },
    });

    return Response.json(
      {
        message: "Token refreshed successfully",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("REFRESH_ERROR", error);

    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}