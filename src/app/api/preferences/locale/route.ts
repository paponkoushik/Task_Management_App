import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE_NAME } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { locale?: string } | null;

  if (!isLocale(body?.locale)) {
    const messages = await getDictionary();
    return NextResponse.json({ error: messages.api.invalidLocale }, { status: 400 });
  }

  const cookieStore = await cookies();

  cookieStore.set(LOCALE_COOKIE_NAME, body.locale, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  const messages = await getDictionary(body.locale);

  return NextResponse.json({ ok: true, message: messages.api.localeSaved });
}
