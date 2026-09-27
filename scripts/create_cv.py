"""Create Felix Alexis Flores Rojas's one-page CV from verified information.

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
LEFT = 43
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
    pdf.setTitle("Félix Alexis Flores Rojas | CV - Diseño UX/UI y desarrollo front-end")
    pdf.setAuthor("Félix Alexis Flores Rojas")
    pdf.setSubject("Experiencia profesional, formación y competencias")
    pdf.setKeywords("Félix Alexis Flores Rojas, Alexis Flores, CV, UX, UI, front-end, HTML, CSS, JavaScript, Figma, Framer, Webflow, WordPress, Blender")
    pdf.setFillColor(IVORY)
    pdf.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    pdf.setFillColor(RED)
    pdf.rect(LEFT, PAGE_H - 28, 36, 3, fill=1, stroke=0)

    def text(value, top, size=11.5, bold=False, color=INK, x=LEFT):
        pdf.setFont("Yantramanav-Bold" if bold else "Yantramanav", size)
        pdf.setFillColor(color)
        pdf.drawString(x, PAGE_H - top, value)

    def paragraph(value, top, size=11.5, leading=15, color=INK, width=WIDTH, x=LEFT):
        style = ParagraphStyle("body", fontName="Yantramanav", fontSize=size,
                               leading=leading, textColor=color, alignment=TA_LEFT,
                               spaceBefore=0, spaceAfter=0)
        p = Paragraph(value, style)
        _, height = p.wrap(width, PAGE_H)
        p.drawOn(pdf, x, PAGE_H - top - height)
        return height

    def section(title, top):
        text(title, top, size=10, bold=True, color=RED)
        title_width = pdfmetrics.stringWidth(title, "Yantramanav-Bold", 10)
        pdf.setStrokeColor(RULE)
        pdf.setLineWidth(0.55)
        pdf.line(LEFT + title_width + 16, PAGE_H - top + 3, RIGHT, PAGE_H - top + 3)

    def link(label, uri, top, size=10.8, x=LEFT):
        text(label, top, size=size, color=RED, x=x)
        width = pdfmetrics.stringWidth(label, "Yantramanav", size)
        baseline = PAGE_H - top
        pdf.linkURL(uri, (x, baseline - 3, x + width, baseline + size), relative=0, thickness=0)

    # One column and live text preserve a predictable reading order for parsers.
    text("FÉLIX ALEXIS FLORES ROJAS", 66, size=29, bold=True)
    text("Diseñador UX/UI y desarrollador front-end", 90, size=15.8, bold=True)
    link("alexisfr.14@outlook.com", "mailto:alexisfr.14@outlook.com", 112, size=10.7)
    link("+52 55 4236 0215", "tel:+525542360215", 112, size=10.7, x=LEFT + 165)
    links = [
        ("Portafolio", "https://alexis01001415-oss.github.io/alexis-flores-portfolio/", LEFT),
        ("LinkedIn", "https://www.linkedin.com/in/felix-alexis-flores-rojas-94a885265/", LEFT + 65),
        ("GitHub", "https://github.com/alexis01001415-oss", LEFT + 124),
        ("Behance", "https://www.behance.net/alexisflores01001415", LEFT + 180),
    ]
    for label, uri, x in links:
        link(label, uri, 129, size=10.6, x=x)

    paragraph(
        "Diseño interfaces web y las llevo a producción con HTML, CSS, JavaScript y WordPress. "
        "Mi trabajo incluye investigación de usuarios, prototipos en Figma, pruebas de usabilidad "
        "y mejoras de accesibilidad, navegación y rendimiento.", 145, size=11.4, leading=14.2)

    section("EXPERIENCIA PROFESIONAL", 207)

    def job(company, role, dates, top, bullets):
        text(company, top, size=14.2, bold=True)
        date_width = pdfmetrics.stringWidth(dates, "Yantramanav", 10.3)
        text(dates, top, size=10.3, color=MUTED, x=RIGHT - date_width)
        text(role, top + 17, size=11.5, bold=True, color=RED)
        cursor = top + 28
        for value in bullets:
            text("-", cursor + 10.6, size=11.5, color=MUTED)
            height = paragraph(escape(value), cursor, width=WIDTH - 11, x=LEFT + 11)
            cursor += height + 3.5
        return cursor

    # The latest direct statement controls T-Line dates and current role.
    next_top = job("T-Line México", "Profesional de UX/UI y desarrollador front-end", "2023 - 2026", 232, [
        "Diseño y desarrollo de sitios responsive en WordPress; personalización con HTML, CSS y JavaScript.",
        "Wireframes, prototipos y flujos en Figma; pruebas de usabilidad y revisión de feedback de usuarios.",
        "Mejoras de velocidad, SEO y accesibilidad; mantenimiento de temas y complementos.",
        "Diseño de interfaces en Odoo y coordinación con desarrollo para implementar las propuestas.",
    ])
    next_top = job("Grupo Invictus", "Diseñador web y diseñador UX/UI", "Mar. 2023 - abr. 2024", next_top + 16, [
        "Diseño de interfaces, dashboards y prototipos en Figma; definición y validación de flujos de usuario.",
        "Pruebas de usabilidad e iteraciones con feedback; aplicación de criterios responsive y de accesibilidad.",
        "Colaboración con desarrollo y clientes para definir requerimientos y alinear las soluciones.",
    ])
    next_top = job("Fundación ADO", "Diseñador gráfico", "Jun. 2022 - mar. 2023", next_top + 16, [
        "Diseño de materiales informativos, campañas visuales e identificadores gráficos; videos corporativos.",
    ])
    next_top = job("Mobility ADO", "Auxiliar administrativo", "Nov. 2019 - nov. 2020", next_top + 16, [
        "Facturación, bases de datos, comunicación interna y apoyo en la coordinación de eventos.",
    ])

    section("FORMACIÓN", next_top + 21)
    h = paragraph(
        "<b>Licenciatura en Diseño Gráfico y Animación Digital</b><br/>"
        "Universidad Autónoma de Tamaulipas · Ago. 2021 - jul. 2024<br/>"
        "<b>Certificación profesional en Diseño UX de Google</b> · Coursera · Jun. 2022 - dic. 2023<br/>"
        "Cursos: UX/UI (Udemy); diseño UX/UI, producto, desarrollo web e inglés (Platzi).",
        next_top + 31, size=11.2, leading=14.7)

    skill_top = next_top + 31 + h + 24
    section("COMPETENCIAS Y HERRAMIENTAS", skill_top)
    skills = [
        ("UX/UI", "Investigación, prototipado, pruebas de usabilidad, Figma, FigJam, Miro y Maze."),
        ("Web", "HTML, CSS, JavaScript, GitHub, WordPress, Elementor, Framer, Webflow, Shopify y Odoo."),
        ("Visual e interacción", "Photoshop, Illustrator, Blender, Rive y LottieFiles."),
        ("IA", "Desarrollo asistido por inteligencia artificial (vibe coding)."),
    ]
    cursor = skill_top + 10
    for label, value in skills:
        cursor += paragraph(f"<b>{escape(label)}:</b> {escape(value)}", cursor,
                            size=11.2, leading=14.4) + 2
    if cursor > PAGE_H - 28:
        raise RuntimeError(f"CV content overflows page: last element at {cursor:.1f} pt")
    print(f"Content ends at {cursor:.1f} pt; bottom margin {PAGE_H - cursor:.1f} pt")
    pdf.showPage()
    pdf.save()
    copyfile(OUTPUT, PUBLIC)
    print(f"Created {OUTPUT}")
    print(f"Published identical copy: {PUBLIC}")


if __name__ == "__main__":
    make_pdf()
