import { NextRequest, NextResponse } from "next/server";

const RESERVED = new Set(["www", "app", "api", "localhost"]);
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];
  if (!host || host.endsWith("localhost") || host.includes("vercel.app")) return NextResponse.next();
  const [slug] = host.split(".");
  if (slug && !RESERVED.has(slug) && !request.nextUrl.pathname.startsWith("/s/")) {
    const url = request.nextUrl.clone();
    url.pathname = `/s/${slug}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
