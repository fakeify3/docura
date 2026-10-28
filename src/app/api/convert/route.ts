/**
 * POST /api/convert
 *
 * Body: multipart/form-data with field `file` (DOCX) and optional `settings` JSON.
 * Returns: the PDF as a binary download with metadata headers.
 */
import { NextRequest, NextResponse } from "next/server";
import { convertDocxToPdf } from "@/lib/conversion-engine";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "No file uploaded.", kind: "invalid_format" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const res = await convertDocxToPdf(buffer, file.name);

  if (!res.ok || !res.outputBuffer) {
    return NextResponse.json(
      {
        ok: false,
        error: res.errorMessage,
        kind: res.errorKind,
        durationMs: res.durationMs,
        inputSize: res.inputSize,
      },
      { status: 422 }
    );
  }

  // Return the PDF as a downloadable file, with metadata in headers
  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(res.outputName)}"`
  );
  headers.set("X-Output-Name", encodeURIComponent(res.outputName));
  headers.set("X-Duration-Ms", String(res.durationMs));
  headers.set("X-Input-Size", String(res.inputSize));
  headers.set("X-Output-Size", String(res.outputSize));
  headers.set("X-Pages", String(res.pages ?? ""));
  headers.set("X-Status", "success");

  return new NextResponse(res.outputBuffer, { status: 200, headers });
}
