// import { prisma } from "@/lib/prisma";

export async function GET(): Promise<Response> {
  try {
    // const users = await prisma.user.findMany({
    //   select: {
    //     id: true,
    //     email: true,
    //     createdAt: true,
    //   },
    // });

    return Response.json({ databaseUrl: process.env.DATABASE_URL }, { status: 200 });
  } catch (error) {
    console.error("TEST_ROUTE_ERROR", error);

    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
    
  }
}