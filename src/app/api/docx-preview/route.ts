/**
 * POST /api/docx-preview
 *
 * Body: multipart/form-data with field `file` (DOCX).
 * Returns: lightweight JSON describing the document (page hints, paragraphs,
 * tables, images, headings) so the UI can show a structural preview before
 * conversion. This is NOT a pixel-perfect rendering — the UI clearly labels
 * it as "Document structure preview".
 */
import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";

interface PreviewResponse {
  ok: boolean;
  fileName: string;
  fileSize: number;
  error?: string;
  // HTML produced by mammoth (sanitized on the client before render)
  html?: string;
  text?: string;
  paragraphCount?: number;
  tableCount?: number;
  imageCount?: number;
  headingCount?: number;
  messages?: { type: string; message: string }[];
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json<PreviewResponse>(
      { ok: false, fileName: "", fileSize: 0, error: "No file uploaded." },
      { status: 400 }
    );
  }
  const buffer = Buffer.from(await file.arrayBuffer());

  // basic validation
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    return NextResponse.json<PreviewResponse>(
      { ok: false, fileName: file.name, fileSize: buffer.length, error: "Not a valid DOCX file." },
      { status: 400 }
    );
  }

  try {
    const { value: html, messages } = await mammoth.convertToHtml(
      { buffer },
      {
        // include images as base64 data URLs so the preview can render them inline
        convertImage: mammoth.images.imgElement((image) =>
          image.read("base64").then((b64) => `data:${image.contentType};base64,${b64}`)
        ),
      }
    );

    // count structural features
    const paragraphCount = (html.match(/<p>/g) || []).length;
    const tableCount = (html.match(/<table>/g) || []).length;
    const imageCount = (html.match(/<img /g) || []).length;
    const headingCount = (html.match(/<h[1-6]/g) || []).length;

    // plain text preview (first 800 chars)
    const text = html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 800);

    return NextResponse.json<PreviewResponse>({
      ok: true,
      fileName: file.name,
      fileSize: buffer.length,
      html,
      text,
      paragraphCount,
      tableCount,
      imageCount,
      headingCount,
      messages: messages.map((m) => ({ type: m.type, message: m.message })),
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json<PreviewResponse>(
      { ok: false, fileName: file.name, fileSize: buffer.length, error: e.message || "Preview failed." },
      { status: 422 }
    );
  }
}
