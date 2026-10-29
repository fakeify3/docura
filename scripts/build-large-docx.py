"""Build a large DOCX similar to the user's group-project (1.5 MB)."""
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
import os

out_dir = "/tmp/docura-test"
os.makedirs(out_dir, exist_ok=True)
docx_path = os.path.join(out_dir, "group-project.docx")
img_path = os.path.join(out_dir, "logo.png")

# Make a larger image
from PIL import Image, ImageDraw
img = Image.new("RGB", (1600, 600), (40, 80, 160))
d = ImageDraw.Draw(img)
d.rectangle([0, 0, 1600, 600], outline=(255, 255, 255), width=4)
d.text((40, 280), "DRUGSCAN GROUP PROJECT", fill=(255, 255, 255))
img.save(img_path, "PNG", quality=95, optimize=False)

doc = Document()

# Cover page — similar to user's
sec = doc.sections[0]
sec.page_width = Inches(8.27)
sec.page_height = Inches(11.69)

# Title
h = doc.add_heading("DRUGSCAN", level=0)
h.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub = doc.add_paragraph("A Group Project Report")
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub.runs[0].italic = True

doc.add_paragraph("Mount Kenya University", style="Intense Quote").alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.add_paragraph("School of Pure and Applied Sciences", style="Intense Quote").alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.add_paragraph("Department of Information Technology", style="Intense Quote").alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.add_paragraph()
doc.add_picture(img_path, width=Inches(5.0))
doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.add_paragraph()
doc.add_paragraph("Submitted by:").bold = True
names = [
    "IMMACULATE MUTHEU MULI   (REG: ABC101/2023)",
    "JOHN KAMAU MAINA         (REG: ABC102/2023)",
    "MARY WANGARI NJORO       (REG: ABC103/2023)",
    "PETER OTIENO OCHIENG    (REG: ABC104/2023)",
    "FAITH ACHIENG OWINO     (REG: ABC105/2023)",
]
for name in names:
    p = doc.add_paragraph(name)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.add_paragraph()
doc.add_paragraph("Supervisor: Dr. Jane Mwangi").alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.add_paragraph("Academic Year 2024/2025").alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.add_page_break()

# Declaration page
doc.add_heading("DECLARATION", level=1)
for _ in range(5):
    p = doc.add_paragraph(
        "We, the undersigned, declare that this project is our original work and has not been presented for a "
        "degree or any other award in any other university. The work has been done in collaboration with our "
        "supervisor and we acknowledge their guidance and input throughout the research process."
    )

# Make it big — many sections with paragraphs and tables
for section_num in range(1, 11):
    doc.add_heading(f"Chapter {section_num}: Section {section_num}", level=1)
    doc.add_paragraph(
        "This chapter introduces the conceptual framework of the project and explains the methodology "
        "used in the research process. We cover background, problem statement, objectives, and the scope "
        "of the study as well as the significance of the findings and limitations encountered."
    )

    doc.add_heading(f"{section_num}.1 Background", level=2)
    for i in range(20):
        doc.add_paragraph(
            f"Background paragraph {i}: This section provides detailed context on the topic under study. "
            "We draw on existing literature, current industry practices, and documented case studies to "
            "establish a foundation for the research. The discussion here sets the stage for the rest "
            "of the report by clarifying the conceptual scope and the practical boundaries of the work."
        )

    doc.add_heading(f"{section_num}.2 Methodology", level=2)
    for i in range(15):
        doc.add_paragraph(
            f"Methodology paragraph {i}: The research design adopted a mixed-methods approach combining "
            "both qualitative and quantitative data collection. Primary data was gathered through surveys "
            "and interviews, while secondary data came from published academic sources and industry reports. "
            "Statistical analysis was performed using established methods and verified through replication."
        )

    doc.add_heading(f"{section_num}.3 Findings", level=2)
    table = doc.add_table(rows=8, cols=5)
    table.style = "Light Grid Accent 1"
    for r in range(8):
        for c in range(5):
            table.cell(r, c).text = f"R{r}C{c} value"

    doc.add_heading(f"{section_num}.4 Discussion", level=2)
    for i in range(10):
        doc.add_paragraph(
            f"Discussion paragraph {i}: The findings of this section are consistent with prior work in the "
            "field. We observe a strong correlation between the variables under investigation, supporting "
            "the hypothesis presented in the introduction. However, the limitations of our sample size "
            "suggest caution in generalizing the results to broader populations."
        )

    doc.add_heading(f"{section_num}.5 Conclusion", level=2)
    doc.add_paragraph(
        "In conclusion, this section has presented the analysis of the data collected and the findings "
        "derived from it. The results support the proposed model and suggest avenues for future research."
    )

# Add a big image gallery section
doc.add_heading("Appendix A: Figures", level=1)
for _ in range(8):
    doc.add_picture(img_path, width=Inches(4.5))

doc.save(docx_path)
size = os.path.getsize(docx_path)
print(f"DOCX written: {docx_path} ({size} bytes, {size/1024/1024:.2f} MB)")
