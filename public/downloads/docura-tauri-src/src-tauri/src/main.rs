// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::process::Command;
use tauri::{command, Manager};

/// Resolve the soffice binary path. Tries in order:
/// 1. DOCURA_SOFFICE_BIN env var
/// 2. A bundled portable runtime at resources/portable-soffice/
/// 3. Common system install paths (Windows, macOS, Linux)
/// 4. The bare name `soffice` / `libreoffice` (relies on PATH)
///
/// Returns the resolved path or the bare name so the OS can resolve it.
fn soffice_path(app: &tauri::AppHandle) -> String {
    // 1. Env var override (highest priority)
    if let Ok(path) = std::env::var("DOCURA_SOFFICE_BIN") {
        if !path.is_empty() {
            return path;
        }
    }

    // 2. Bundled portable runtime
    if let Ok(resource_dir) = app.path().resource_dir() {
        let candidate = resource_dir
            .join("portable-soffice")
            .join(if cfg!(windows) { "soffice.exe" } else { "soffice" });
        if candidate.exists() {
            return candidate.to_string_lossy().to_string();
        }
    }

    // 3. Common system install paths
    let system_candidates: &[&str] = if cfg!(target_os = "windows") {
        &[
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        ]
    } else if cfg!(target_os = "macos") {
        &[
            "/Applications/LibreOffice.app/Contents/MacOS/soffice",
            "/usr/local/bin/soffice",
            "/opt/homebrew/bin/soffice",
        ]
    } else {
        // Linux / BSD
        &[
            "/usr/bin/soffice",
            "/usr/bin/libreoffice",
            "/usr/lib/libreoffice/program/soffice",
            "/usr/local/bin/soffice",
            "/opt/libreoffice/program/soffice",
        ]
    };

    for candidate in system_candidates {
        if std::path::Path::new(candidate).exists() {
            return candidate.to_string();
        }
    }

    // 4. Fall back to PATH-resolved name (OS will search PATH)
    if cfg!(windows) {
        "soffice.exe".to_string()
    } else {
        "soffice".to_string()
    }
}

/// Convert a DOCX file to PDF using LibreOffice headless.
/// Files are processed locally; nothing is uploaded.
#[command]
fn convert_docx(
    app: tauri::AppHandle,
    input_path: String,
    output_dir: String,
) -> Result<String, String> {
    let soffice = soffice_path(&app);

    // Verify the binary is actually reachable before invoking it.
    // On Linux/macOS, `soffice --version` exits 0 if available.
    // On Windows, we just try the spawn and rely on the OS error.
    #[cfg(not(target_os = "windows"))]
    {
        let probe = Command::new(&soffice)
            .arg("--version")
            .output();
        if let Err(ref e) = probe {
            return Err(format!(
                "LibreOffice engine not found at \"{}\". Install LibreOffice and ensure soffice is on the PATH, or set DOCURA_SOFFICE_BIN to point at the soffice executable. (underlying error: {})",
                soffice, e
            ));
        }
        if let Ok(out) = probe {
            if !out.status.success() {
                return Err(format!(
                    "LibreOffice engine at \"{}\" did not respond to --version. Reinstall LibreOffice.",
                    soffice
                ));
            }
        }
    }

    let profile_dir = PathBuf::from(&output_dir).join(".docura-profile");
    std::fs::create_dir_all(&profile_dir).map_err(|e| format!("Failed to create temp profile dir: {}", e))?;

    let output = Command::new(&soffice)
        .args([
            "--headless",
            "--norestore",
            "--nolockcheck",
            "--nodefault",
            "--nofirststartwizard",
            &format!("-env:UserInstallation=file://{}", profile_dir.to_string_lossy()),
            "--convert-to",
            "pdf:writer_pdf_Export",
            "--outdir",
            &output_dir,
            &input_path,
        ])
        .env("HOME", &profile_dir)
        .env("USERPROFILE", &profile_dir)
        .output()
        .map_err(|e| {
            format!(
                "Failed to invoke LibreOffice at \"{}\": {}. Install LibreOffice and ensure soffice is on the PATH, or set DOCURA_SOFFICE_BIN.",
                soffice, e
            )
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        if stderr.to_lowercase().contains("encrypted") || stderr.to_lowercase().contains("password") {
            return Err("Document is encrypted or password-protected. Remove the password in Word first, then re-upload.".to_string());
        }
        if stderr.to_lowercase().contains("not found") || stderr.to_lowercase().contains("no such file") {
            return Err(format!("LibreOffice engine not found at \"{}\". Install LibreOffice and ensure soffice is on the PATH, or set DOCURA_SOFFICE_BIN.", soffice));
        }
        return Err(format!("Conversion failed: {}", stderr));
    }

    let stem = PathBuf::from(&input_path)
        .file_stem()
        .ok_or("Invalid input filename")?
        .to_string_lossy()
        .to_string();
    let out_pdf = PathBuf::from(&output_dir).join(format!("{}.pdf", stem));
    if !out_pdf.exists() {
        return Err("Conversion produced no PDF output. The source document may be corrupted or unsupported.".to_string());
    }
    Ok(out_pdf.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![convert_docx])
        .run(tauri::generate_context!())
        .expect("error while running DOCURA desktop");
}
