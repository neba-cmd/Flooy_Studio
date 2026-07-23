import { NextRequest, NextResponse } from "next/server";
import * as cookie from "cookie";
import { verifyPageAuthToken } from "@/lib/page-auth";

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookie.parse(cookieHeader);

  const secret = process.env.PAGE_ACCESS_PASSWORD;
  const authenticated = Boolean(secret) && await verifyPageAuthToken(cookies.authToken, secret!);

  if (authenticated) {
    return NextResponse.json(
      { authenticated: true },
      { status: 200, headers: { "Cache-Control": "private, no-store" } }
    );
  } else {
    return NextResponse.json(
      { authenticated: false },
      { status: 401, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
