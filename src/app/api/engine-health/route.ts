/**
 * GET /api/engine-health
 *
 * Reports whether the LibreOffice conversion engine is available and
 * which version is installed. Used by the UI to honestly disclose whether
 * real conversion will work in this environment.
 */
import { NextResponse } from "next/server";
import { checkEngine } from "@/lib/conversion-engine";

export const runtime = "nodejs";

export async function GET() {
  const status = await checkEngine();
  return NextResponse.json({
    available: status.available,
    version: status.version,
    engineName: "LibreOffice (headless)",
  });
}
