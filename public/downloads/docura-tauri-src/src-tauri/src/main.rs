// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::process::Command;
use tauri::{command, Manager};

/// Resolve the soffice binary path. Prefers a bundled portable runtime
/// placed in resources/portable-soffice/, falls back to system soffice.
fn soffice_path(app: &tauri::AppHandle) -> String {
    if let Ok(resource_dir) = app.path().resource_dir() {
        let candidate = resource_dir
            .join("portable-soffice")
            .join(if cfg!(windows) { "soffice.exe" } else { "soffice" });
        if candidate.exists() {
            return candidate.to_string_lossy().to_string();
        }
    }
    "soffice".to_string()
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
    let profile_dir = PathBuf::from(&output_dir).join(".docura-profile");
    std::fs::create_dir_all(&profile_dir).map_err(|e| e.to_string())?;

    let output = Command::new(&soffice)
        .args([
            "--headless",
            "--norestore",
            "--nolockcheck",
            "--nodefault",
            &format!("-env:UserInstallation=file://{}", profile_dir.to_string_lossy()),
            "--convert-to",
            "pdf:writer_pdf_Export",
            "--outdir",
            &output_dir,
            &input_path,
        ])
        .output()
        .map_err(|e| format!("Failed to invoke soffice: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stem = PathBuf::from(&input_path)
        .file_stem()
        .ok_or("Invalid input filename")?
        .to_string_lossy()
        .to_string();
    let out_pdf = PathBuf::from(&output_dir).join(format!("{}.pdf", stem));
    if !out_pdf.exists() {
        return Err("Conversion produced no PDF output.".to_string());
    }
    Ok(out_pdf.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![convert_docx])
        .run(tauri::generate_context!())
        .expect("error while running DOCURA desktop");
}
