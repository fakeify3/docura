# DOCURA Desktop (Tauri)

This is the desktop project source for DOCURA. It uses Tauri 2 to wrap the
same React UI as the web version, and invokes LibreOffice locally for
fully offline conversion.

## Build (Windows)

1. Install prerequisites:
   - Node.js 20+ and Bun
   - Rust toolchain (https://rustup.rs/)
   - Microsoft Visual C++ Build Tools 2022
   - LibreOffice 25.x

2. Copy your web-app `src/` into this folder's `src/` (or symlink it).

3. Install dependencies:
   ```
   bun install
   ```

4. Develop with hot reload:
   ```
   bun tauri dev
   ```

5. Build a Windows MSI installer:
   ```
   bun tauri build
   ```

6. Find the installer at:
   ```
   src-tauri/target/release/bundle/msi/DOCURA_1.0.0_x64_en-US.msi
   ```

## Bundling LibreOffice

For a fully self-contained installer, place a portable LibreOffice runtime
under `src-tauri/resources/portable-soffice/`. The Rust backend will prefer
the bundled binary over the system `soffice`.

## Architecture

- Web UI: React + TypeScript + Tailwind (shared with the web app).
- Conversion: `convert_docx` Rust command invokes `soffice --headless`.
- Files are written to a temp working directory; nothing is uploaded.
