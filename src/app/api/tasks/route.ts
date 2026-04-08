import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { createTaskSchema } from "@/lib/schemas";
import { validateMemberAssigneeIds } from "@/lib/task-assignees";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const messages = await getDictionary();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: messages.api.unauthorized }, { status: 401 });
  }

  if (currentUser.role !== "MANAGER") {
    return NextResponse.json(
      { error: messages.api.onlyManagerCreatesTasks },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: messages.api.taskTitleRequired },
      { status: 400 },
    );
  }

  const validatedAssigneeIds = await validateMemberAssigneeIds(
    prisma,
    parsed.data.assigneeIds,
    messages,
  );

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
