#!/usr/bin/env python3
"""Zip the DOCURA Tauri desktop source project for download."""
import os
import zipfile

SRC_ROOT = "/home/z/my-project/public/downloads/docura-tauri-src"
OUT_ZIP = "/home/z/my-project/public/downloads/docura-tauri-source.zip"

with zipfile.ZipFile(OUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
    for root, _, files in os.walk(SRC_ROOT):
        for f in files:
            full = os.path.join(root, f)
            arcname = os.path.relpath(full, SRC_ROOT)
            # store under docura-tauri-src/ prefix for cleanliness
            zf.write(full, os.path.join("docura-tauri-src", arcname))

print(f"Wrote {OUT_ZIP}")
