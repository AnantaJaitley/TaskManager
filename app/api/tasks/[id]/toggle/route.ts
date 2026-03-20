import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const user = getUserFromRequest(request);
    const { id } = await context.params;

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });

    if (!existingTask) {
      return Response.json({ message: "Task not found" }, { status: 404 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        completed: !existingTask.completed,
      },
    });

    return Response.json(
      {
        message: "Task status toggled successfully",
        task: updatedTask,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("TOGGLE_TASK_ERROR", error);
    return Response.json(
      { message: "Unauthorized or internal server error" },
      { status: 401 }
    );
  }
}