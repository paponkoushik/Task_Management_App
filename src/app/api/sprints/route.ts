import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createSprintSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (currentUser.role !== "MANAGER") {
    return NextResponse.json(
      { error: "Only the manager can create sprints." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createSprintSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Sprint name is required. Goal can be up to 220 characters." },
      { status: 400 },
    );
  }

  const sprint = await prisma.sprint.create({
    data: {
      name: parsed.data.name,
      goal: parsed.data.goal,
      creatorId: currentUser.id,
      status: "ACTIVE",
    },
  });

  revalidatePath("/dashboard");

  return NextResponse.json({ sprint }, { status: 201 });
}
