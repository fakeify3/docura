"""Build a HEAVY 1.5 MB DOCX with large embedded images."""
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import os

out_dir = "/tmp/docura-test"
os.makedirs(out_dir, exist_ok=True)
docx_path = os.path.join(out_dir, "heavy.docx")

# Make a large image (3000x2000) — similar to what a user might embed
from PIL import Image, ImageDraw
img_big = Image.new("RGB", (3000, 2000), (40, 80, 160))
d = ImageDraw.Draw(img_big)
for i in range(0, 3000, 50):
    d.line([(i, 0), (i, 2000)], fill=(60, 100, 180), width=1)
for i in range(0, 2000, 50):
    d.line([(0, i), (3000, i)], fill=(60, 100, 180), width=1)
d.rectangle([100, 100, 2900, 1900], outline=(255, 255, 255), width=10)
d.text((200, 950), "DRUGSCAN GROUP PROJECT", fill=(255, 255, 255))
img_big.save(os.path.join(out_dir, "big.png"), "PNG")

doc = Document()
sec = doc.sections[0]
sec.page_width = Inches(8.27)
sec.page_height = Inches(11.69)

# Cover
h = doc.add_heading("DRUGSCAN", level=0)
h.alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.add_paragraph("A Group Project Report").alignment = WD_ALIGN_PARAGRAPH.CENTER

# Embed many large images
for i in range(8):
    doc.add_picture(os.path.join(out_dir, "big.png"), width=Inches(6.0))

# Some text
for i in range(50):
    doc.add_paragraph(
        f"Paragraph {i}: This is filler content to make the document larger and "
        "more representative of a real academic group project report with "
        "lots of text content across multiple sections."
    )

doc.save(docx_path)
size = os.path.getsize(docx_path)
print(f"Heavy DOCX written: {docx_path} ({size} bytes, {size/1024/1024:.2f} MB)")
