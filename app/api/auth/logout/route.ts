import { prisma } from "@/lib/prisma";
import { verifyRefreshToken } from "@/lib/jwt";

type LogoutBody = {
  refreshToken?: string;
};

type RefreshTokenPayload = {
  userId: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body: LogoutBody = await request.json();
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

    await prisma.user.update({
      where: {
        id: decoded.userId,
      },
      data: {
        refreshToken: null,
      },
    });

    return Response.json(
      { message: "Logout successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("LOGOUT_ERROR", error);

    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}