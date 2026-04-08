import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { createSprintSchema } from "@/lib/schemas";

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
      { error: messages.api.onlyManagerCreatesSprints },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createSprintSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: messages.api.sprintNameRequired },
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
