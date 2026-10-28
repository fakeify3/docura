/**
 * Quick sanity test for the conversion engine.
 */
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import { convertDocxToPdf, inspectPdf, checkEngine } from "../src/lib/conversion-engine";

const TMP = "/tmp/docura-test";
mkdirSync(TMP, { recursive: true });
const docxPath = join(TMP, "sample.docx");
const pdfPath = join(TMP, "sample.pdf");

// 1. Build a real DOCX with python-docx
execSync(`python3 ${__dirname}/build-sample-docx.py`, { stdio: "inherit" });

const docxBuffer = readFileSync(docxPath);

(async () => {
  const engine = await checkEngine();
  console.log("Engine status:", engine);

  const res = await convertDocxToPdf(docxBuffer, "sample.docx", {
    onProgress: (s) => console.log("  stage:", s),
  });
  console.log("Result:", {
    ok: res.ok,
    outputName: res.outputName,
    durationMs: res.durationMs,
    inputSize: res.inputSize,
    outputSize: res.outputSize,
    pages: res.pages,
    error: res.errorMessage,
  });

  if (res.ok && res.outputBuffer) {
    writeFileSync(pdfPath, res.outputBuffer);
    console.log("PDF written to:", pdfPath);
    const info = inspectPdf(res.outputBuffer);
    console.log("PDF inspect:", info);
    try {
      execSync(`pdftoppm -f 1 -l 1 -r 80 -png "${pdfPath}" "${TMP}/page"`);
      console.log("Rendered first page OK");
    } catch (e) {
      console.log("pdftoppm not available, skipping render test");
    }
  } else {
    console.log("FAILED:", res.errorMessage);
    process.exit(1);
  }
})();
