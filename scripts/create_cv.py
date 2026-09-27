"""Create Alexis Flores's one-page CV from confirmed professional information.

Requires: reportlab, fonttools. Run from any directory with Python 3.
Fonts come from the repository's @fontsource/yantramanav npm dependency.
The website receives a byte-identical copy of the final PDF.
"""

from pathlib import Path
from shutil import copyfile
from xml.sax.saxutils import escape

from fontTools.ttLib import TTFont as FontToolsFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output/pdf/Alexis-Flores-CV.pdf"
PUBLIC = ROOT / "public/documents/Alexis-Flores-CV.pdf"
TEMP = ROOT / "tmp/pdfs"
PAGE_W, PAGE_H = A4
LEFT = 48
RIGHT = PAGE_W - LEFT
WIDTH = RIGHT - LEFT
IVORY = colors.HexColor("#F2EAE3")
INK = colors.HexColor("#131211")
MUTED = colors.HexColor("#514944")
RED = colors.HexColor("#AD0027")
RULE = colors.HexColor("#C8BFB7")


def register_fonts():
    TEMP.mkdir(parents=True, exist_ok=True)
    for weight, name in [(400, "Yantramanav"), (700, "Yantramanav-Bold")]:
        source = ROOT / f"node_modules/@fontsource/yantramanav/files/yantramanav-latin-{weight}-normal.woff"
        if not source.exists():
            raise FileNotFoundError("Install npm dependencies first; Yantramanav is missing.")
        target = TEMP / f"yantramanav-{weight}.ttf"
        font = FontToolsFont(str(source))
        font.flavor = None
        font.save(str(target))
        pdfmetrics.registerFont(TTFont(name, str(target)))
    pdfmetrics.registerFontFamily("Yantramanav", normal="Yantramanav", bold="Yantramanav-Bold")


def make_pdf():
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1, invariant=1)
    pdf.setTitle("Alexis Flores | CV - UX/UI y desarrollo front-end")
    pdf.setAuthor("Alexis Flores")
    pdf.setSubject("Perfil profesional, experiencia, competencias y proyectos seleccionados")
    pdf.setKeywords("Alexis Flores, CV, UX, UI, front-end, HTML, CSS, JavaScript, Framer, Webflow, WordPress, Blender")
    pdf.setFillColor(IVORY)
    pdf.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    pdf.setFillColor(RED)
    pdf.rect(LEFT, PAGE_H - 30, 40, 4, fill=1, stroke=0)

    def text(value, top, size=11.5, bold=False, color=INK, x=LEFT):
        pdf.setFont("Yantramanav-Bold" if bold else "Yantramanav", size)
        pdf.setFillColor(color)
        pdf.drawString(x, PAGE_H - top, value)

    def paragraph(value, top, size=11.6, leading=15.8, color=INK, width=WIDTH):
        style = ParagraphStyle("body", fontName="Yantramanav", fontSize=size,
                               leading=leading, textColor=color, alignment=TA_LEFT,
                               spaceBefore=0, spaceAfter=0)
        p = Paragraph(value, style)
        _, height = p.wrap(width, PAGE_H)
        p.drawOn(pdf, LEFT, PAGE_H - top - height)
        return height

    def section(title, top):
        text(title, top, size=10, bold=True, color=RED)
        title_width = pdfmetrics.stringWidth(title, "Yantramanav-Bold", 10)
        pdf.setStrokeColor(RULE)
        pdf.setLineWidth(0.55)
        pdf.line(LEFT + title_width + 16, PAGE_H - top + 3, RIGHT, PAGE_H - top + 3)

    def link(label, uri, top, size=10.8):
        text(label, top, size=size, color=RED)
        width = pdfmetrics.stringWidth(label, "Yantramanav", size)
        baseline = PAGE_H - top
        pdf.linkURL(uri, (LEFT, baseline - 3, LEFT + width, baseline + size), relative=0, thickness=0)

    # One column and real text preserve a simple reading order for CV parsers.
    text("ALEXIS FLORES", 79, size=37, bold=True)
    text("Diseñador UX/UI y desarrollador front-end", 108, size=16.5, bold=True)
    link("Portafolio: alexis01001415-oss.github.io/alexis-flores-portfolio/",
         "https://alexis01001415-oss.github.io/alexis-flores-portfolio/", 131)
    link("GitHub: github.com/alexis01001415-oss", "https://github.com/alexis01001415-oss", 148)

    section("PERFIL", 181)
    paragraph(
        "Combino diseño UX/UI y desarrollo front-end para crear experiencias digitales claras y con personalidad. "
        "Trabajo con código, herramientas de diseño web y Blender. Integro el desarrollo asistido por IA "
        "en mi proceso de exploración y construcción de interfaces.", 191)

    section("EXPERIENCIA PROFESIONAL", 269)
    text("T-Line México", 295, size=15, bold=True)
    text("2023 - 2026", 295, size=11, color=MUTED, x=RIGHT - 57)
    text("Profesional de UX/UI y front-end developer", 316, size=12)
    text("Grupo Victus", 348, size=15, bold=True)
    text("Anteriormente", 348, size=11, color=MUTED, x=RIGHT - 68)
    text("Diseñador web y diseñador UX/UI", 369, size=12)

    section("COMPETENCIAS Y HERRAMIENTAS", 407)
    rows = [
        ("Diseño digital", "UX/UI, diseño web e interfaces responsive."),
        ("Desarrollo front-end", "HTML, CSS, JavaScript y GitHub."),
        ("Plataformas web", "WordPress, Framer y Webflow."),
        ("3D e IA", "Blender y desarrollo asistido por IA (vibe coding)."),
    ]
    for index, (label, value) in enumerate(rows):
        paragraph(f"<b>{escape(label)}</b>  {escape(value)}", 421 + index * 22, size=11.7, leading=15.5)

    section("PROYECTOS SELECCIONADOS", 538)
    projects = [
        ("Curiosity Marketplace", "marketplace.curiositycloud.com", "https://marketplace.curiositycloud.com/"),
        ("Macloud Seguridad Privada Residencial", "seguridadmacloud.com.mx", "https://seguridadmacloud.com.mx/"),
        ("Gatical Seguridad Privada - Acapulco", "gaticalseguridadprivada.framer.website", "https://gaticalseguridadprivada.framer.website/"),
    ]
    for index, (name, label, uri) in enumerate(projects):
        top = 564 + index * 43
        text(name, top, size=12.6, bold=True)
        link(label, uri, top + 17, size=10.4)

    pdf.setStrokeColor(RULE)
    pdf.setLineWidth(0.55)
    pdf.line(LEFT, 51, RIGHT, 51)
    text("Alexis Flores  /  Diseño UX/UI + desarrollo front-end", PAGE_H - 34, size=9, color=MUTED)
    pdf.showPage()
    pdf.save()
    copyfile(OUTPUT, PUBLIC)
    print(f"Created {OUTPUT}")
    print(f"Published identical copy: {PUBLIC}")


if __name__ == "__main__":
    make_pdf()
