import { NextResponse } from "next/server";
import { authenticateUser, createSessionToken, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and password." },
      { status: 400 },
    );
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);

  if (!user) {
    return NextResponse.json(
      { error: "Email or password is incorrect." },
      { status: 401 },
    );
  }

  const token = await createSessionToken({
    userId: user.id,
    role: user.role,
  });

  await setSessionCookie(token);

  return NextResponse.json({
    user,
  });
}
