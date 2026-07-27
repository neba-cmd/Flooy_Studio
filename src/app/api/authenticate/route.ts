import { NextRequest, NextResponse } from "next/server";
import * as cookie from "cookie";
import { createPageAuthToken, TOKEN_TTL_SECONDS } from "@/lib/page-auth";
import { publicApiLimiter, requestClientKey } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
  const rate = publicApiLimiter.check(`page-auth:${requestClientKey(request)}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { message: "Too many password attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { password } = body;
  const correctPassword = process.env.PAGE_ACCESS_PASSWORD;

  if (!correctPassword) {
    console.error("PAGE_ACCESS_PASSWORD environment variable is not set");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }

  if (typeof password === "string" && password.length <= 256 && password === correctPassword) {
    const response = NextResponse.json({ success: true }, { status: 200 });
    const token = await createPageAuthToken(correctPassword);

    response.headers.set(
      "Set-Cookie",
      cookie.serialize("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: TOKEN_TTL_SECONDS,
        sameSite: "strict",
        path: "/",
      }),
    );

    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } else {
    return NextResponse.json({ message: "Incorrect password" }, { status: 401 });
  }
}
