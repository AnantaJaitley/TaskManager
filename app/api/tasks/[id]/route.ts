import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

type UpdateTaskBody = {
  title?: string;
  description?: string;
  completed?: boolean;
};

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
    const body: UpdateTaskBody = await request.json();

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
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.description !== undefined
          ? { description: body.description?.trim() || null }
          : {}),
        ...(body.completed !== undefined ? { completed: body.completed } : {}),
      },
    });

    return Response.json(
      {
        message: "Task updated successfully",
        task: updatedTask,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE_TASK_ERROR", error);
    return Response.json(
      { message: "Unauthorized or internal server error" },
      { status: 401 }
    );
  }
}

export async function DELETE(
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

    await prisma.task.delete({
      where: { id },
    });

    return Response.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE_TASK_ERROR", error);
    return Response.json(
      { message: "Unauthorized or internal server error" },
      { status: 401 }
    );
  }
}