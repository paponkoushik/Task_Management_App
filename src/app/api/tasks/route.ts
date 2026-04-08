import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createTaskSchema } from "@/lib/schemas";
import { validateMemberAssigneeIds } from "@/lib/task-assignees";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (currentUser.role !== "MANAGER") {
    return NextResponse.json(
      { error: "Only the manager can create tasks." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Task title is required. Description can be up to 500 characters." },
      { status: 400 },
    );
  }

  const validatedAssigneeIds = await validateMemberAssigneeIds(prisma, parsed.data.assigneeIds);

  if (!validatedAssigneeIds.ok) {
    return NextResponse.json(
      { error: validatedAssigneeIds.error },
      { status: validatedAssigneeIds.status },
    );
  }

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      storyPoints: parsed.data.storyPoints,
      estimate: parsed.data.estimate,
      status: "TODO",
      assigneeId: null,
      creatorId: currentUser.id,
      taskAssignments: {
        create: validatedAssigneeIds.assigneeIds.map((userId) => ({
          userId,
        })),
      },
    },
  });

  revalidatePath("/dashboard");

  return NextResponse.json({ task }, { status: 201 });
}
