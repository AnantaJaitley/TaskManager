import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

type RegisterBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    console.log("REGISTER STEP 1: request received");

    const body: RegisterBody = await request.json();
    console.log("REGISTER STEP 2: body parsed", body);

    const { email, password } = body;

    if (!email || !password) {
      console.log("REGISTER STEP 3: missing email or password");
      return Response.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail: string = email.trim().toLowerCase();
    const trimmedPassword: string = password.trim();

    if (!trimmedEmail.includes("@")) {
      console.log("REGISTER STEP 4: invalid email");
      return Response.json(
        { message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    if (trimmedPassword.length < 6) {
      console.log("REGISTER STEP 5: password too short");
      return Response.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    console.log("REGISTER STEP 6: checking existing user");

    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    console.log("REGISTER STEP 7: existing user check done", existingUser);

    if (existingUser) {
      return Response.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    console.log("REGISTER STEP 8: hashing password");

    const hashedPassword: string = await bcrypt.hash(trimmedPassword, 10);

    console.log("REGISTER STEP 9: creating user");

    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    console.log("REGISTER STEP 10: user created", user);

    return Response.json(
      {
        message: "User registered successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER_ERROR", error);

    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}