import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "health_check_failed", error: error instanceof Error ? error.message : "unknown" }));
    return NextResponse.json({ status: "error", database: "unavailable" }, { status: 503 });
  }
}
