import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body: LoginBody = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail: string = email.trim().toLowerCase();
    const trimmedPassword: string = password.trim();

    const user = await prisma.user.findUnique({
      where: {
        email: trimmedEmail,
      },
    });

    if (!user) {
      return Response.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid: boolean = await bcrypt.compare(
      trimmedPassword,
      user.password
    );

    if (!isPasswordValid) {
      return Response.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const accessToken: string = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken: string = generateRefreshToken({
      userId: user.id,
    });

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken,
      },
    });

    return Response.json(
      {
        message: "Login successful",
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("LOGIN_ERROR", error);

    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}