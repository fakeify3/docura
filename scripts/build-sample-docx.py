"""Generate a real DOCX file for engine verification."""
from PIL import Image, ImageDraw
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.section import WD_ORIENTATION
import sys, os

out_dir = "/tmp/docura-test"
os.makedirs(out_dir, exist_ok=True)
docx_path = os.path.join(out_dir, "sample.docx")
img_path = os.path.join(out_dir, "logo.png")

# Create a small PNG with Pillow
img = Image.new("RGB", (240, 80), (40, 80, 160))
d = ImageDraw.Draw(img)
d.rectangle([0, 0, 240, 80], outline=(255, 255, 255), width=2)
d.text((20, 28), "DOCURA TEST", fill=(255, 255, 255))
img.save(img_path)

doc = Document()
sec = doc.sections[0]
sec.orientation = WD_ORIENTATION.PORTRAIT
sec.page_width = Inches(8.5)
sec.page_height = Inches(11)
doc.add_heading("DOCURA Sample Document", level=0)
sub = doc.add_paragraph("Generated programmatically for engine verification.")
sub.runs[0].italic = True

doc.add_heading("Section 1: Typography", level=1)
p = doc.add_paragraph()
p.add_run("This is normal text. ")
p.add_run("This is bold. ").bold = True
p.add_run("This is italic.").italic = True

doc.add_heading("Section 2: A List", level=1)
for i in range(1, 4):
    doc.add_paragraph(f"Item number {i}", style="List Bullet")

doc.add_heading("Section 3: A Table", level=1)
table = doc.add_table(rows=3, cols=3)
for r in range(3):
    for c in range(3):
        table.cell(r, c).text = f"R{r}C{c}"

doc.add_heading("Section 4: An Image", level=1)
doc.add_picture(img_path, width=Inches(2.5))

doc.add_page_break()
doc.add_heading("Page 2", level=1)
doc.add_paragraph("This is on the second page.")
doc.save(docx_path)
print("DOCX written:", docx_path)
