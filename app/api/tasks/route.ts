import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

type CreateTaskBody = {
  title?: string;
  description?: string;
};

export async function GET(request: Request): Promise<Response> {
  try {
    const user = getUserFromRequest(request);

    const { searchParams } = new URL(request.url);

    const page: number = Number(searchParams.get("page") || "1");
    const limit: number = Number(searchParams.get("limit") || "10");
    const status: string = searchParams.get("status") || "";
    const search: string = searchParams.get("search") || "";

    const skip: number = (page - 1) * limit;

    const whereClause = {
      userId: user.userId,
      ...(status === "completed" ? { completed: true } : {}),
      ...(status === "pending" ? { completed: false } : {}),
      ...(search
        ? {
            title: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.task.count({
        where: whereClause,
      }),
    ]);

    return Response.json(
      {
        tasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_TASKS_ERROR", error);

    if (error instanceof Error) {
      const message: string = error.message.toLowerCase();

      if (
        message.includes("authorization") ||
        message.includes("jwt") ||
        message.includes("token")
      ) {
        return Response.json({ message: error.message }, { status: 401 });
      }
    }

    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = getUserFromRequest(request);
    const body: CreateTaskBody = await request.json();

    const { title, description } = body;

    if (!title || !title.trim()) {
      return Response.json(
        { message: "Task title is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        userId: user.userId,
      },
    });

    return Response.json(
      {
        message: "Task created successfully",
        task,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE_TASK_ERROR", error);

    if (error instanceof Error) {
      const message: string = error.message.toLowerCase();

      if (
        message.includes("authorization") ||
        message.includes("jwt") ||
        message.includes("token")
      ) {
        return Response.json({ message: error.message }, { status: 401 });
      }
    }

    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}