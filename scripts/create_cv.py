"""Create a historical CV version; this is not the current published CV.

Requires reportlab and fonttools. Fonts come from @fontsource/yantramanav.
Writes only a legacy PDF under output/pdf; never modifies the website's CV.
"""

from pathlib import Path
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
OUTPUT = ROOT / "output/pdf/Alexis-Flores-CV-legacy.pdf"
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
    pdf = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1, invariant=1)
    pdf.setTitle("Felix Alexis Flores Rojas | CV - Diseño UX/UI")
    pdf.setAuthor("Felix Alexis Flores Rojas")
    pdf.setSubject("Diseño UX/UI, experiencia profesional, competencias y formación")
    pdf.setKeywords("Felix Alexis Flores Rojas, Alexis Flores, CV, UX, UI, Figma, diseño de producto, diseño gráfico, HTML, CSS, Blender, inteligencia artificial")

    def text(value, top, size=11.3, bold=False, color=INK, x=LEFT):
        pdf.setFont("Yantramanav-Bold" if bold else "Yantramanav", size)
        pdf.setFillColor(color)
        pdf.drawString(x, PAGE_H - top, value)

    def paragraph(value, top, size=11.3, leading=15, color=INK, width=WIDTH, x=LEFT):
        style = ParagraphStyle("body", fontName="Yantramanav", fontSize=size,
                               leading=leading, textColor=color, alignment=TA_LEFT,
                               spaceBefore=0, spaceAfter=0)
        p = Paragraph(value, style)
        _, height = p.wrap(width, PAGE_H)
        p.drawOn(pdf, x, PAGE_H - top - height)
        return height

    def section(title, top):
        text(title, top, size=10.1, bold=True, color=RED)
        title_width = pdfmetrics.stringWidth(title, "Yantramanav-Bold", 10.1)
        pdf.setStrokeColor(RULE)
        pdf.setLineWidth(0.55)
        pdf.line(LEFT + title_width + 16, PAGE_H - top + 3, RIGHT, PAGE_H - top + 3)

    def link(label, uri, top, size=10.7, x=LEFT):
        text(label, top, size=size, color=RED, x=x)
        width = pdfmetrics.stringWidth(label, "Yantramanav", size)
        baseline = PAGE_H - top
        pdf.linkURL(uri, (x, baseline - 3, x + width, baseline + size), relative=0, thickness=0)

    def page_start(number):
        pdf.setFillColor(IVORY)
        pdf.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        pdf.setFillColor(RED)
        pdf.rect(LEFT, PAGE_H - 28, 36, 3, fill=1, stroke=0)
        if number > 1:
            text("FELIX ALEXIS FLORES ROJAS", 52, size=12, bold=True)
            text("Diseñador UX/UI", 52, size=11, color=MUTED, x=RIGHT - 77)

    def page_end(number, content_end):
        if content_end > PAGE_H - 53:
            raise RuntimeError(f"Page {number} content exceeds safe area: {content_end:.1f} pt")
        pdf.setStrokeColor(RULE)
        pdf.setLineWidth(0.55)
        pdf.line(LEFT, 40, RIGHT, 40)
        text("Alexis Flores / Diseño UX/UI", PAGE_H - 25, size=9.3, color=MUTED)
        text(f"{number} / 2", PAGE_H - 25, size=9.3, color=MUTED, x=RIGHT - 20)
        print(f"Page {number}: content ends at {content_end:.1f} pt; safe bottom margin {PAGE_H - 53 - content_end:.1f} pt")
        pdf.showPage()

    def job(company, role, dates, top, bullets):
        text(company, top, size=14.5, bold=True)
        date_width = pdfmetrics.stringWidth(dates, "Yantramanav", 10.5)
        text(dates, top, size=10.5, color=MUTED, x=RIGHT - date_width)
        text(role, top + 17, size=11.5, bold=True, color=RED)
        cursor = top + 29
        for value in bullets:
            text("-", cursor + 10.6, color=MUTED)
            height = paragraph(escape(value), cursor, width=WIDTH - 11, x=LEFT + 11)
            cursor += height + 3
        return cursor

    # Live text and a single column keep a predictable reading order for parsers.
    page_start(1)
    text("FELIX ALEXIS FLORES ROJAS", 65, size=29, bold=True)
    text("Diseñador UX/UI", 91, size=19, bold=True)
    link("alexisfr.14@outlook.com", "mailto:alexisfr.14@outlook.com", 113)
    link("+52 55 4236 0215", "tel:+525542360215", 113, x=LEFT + 165)
    links = [
        ("Portafolio", "https://alexis01001415-oss.github.io/alexis-flores-portfolio/", LEFT),
        ("LinkedIn", "https://www.linkedin.com/in/felix-alexis-flores-rojas-94a885265/", LEFT + 65),
        ("GitHub", "https://github.com/alexis01001415-oss", LEFT + 124),
        ("Behance", "https://www.behance.net/alexisflores01001415", LEFT + 180),
    ]
    for label, uri, x in links:
        link(label, uri, 131, size=10.6, x=x)
    profile_end = 148 + paragraph(
        "Diseñador UX/UI enfocado en productos digitales: investigación, flujos de usuario, "
        "prototipos e interfaces. Combino diseño de experiencia, diseño gráfico y recursos 3D "
        "para resolver necesidades de uso y comunicación. Tengo dominio de HTML y CSS, "
        "conocimientos básicos de JavaScript y manejo avanzado de Figma y herramientas de creación web.",
        148, size=11.7, leading=15.5)
    section("EXPERIENCIA PROFESIONAL", profile_end + 23)

    # Current user guidance takes precedence over the older T-Line dates and role label.
    cursor = job("T-Line México", "Diseño UX/UI e implementación web", "2023 - 2026", profile_end + 48, [
        "Creación de wireframes, prototipos y flujos de usuario en Figma; revisión de feedback y pruebas de usabilidad para mejorar la navegación.",
        "Diseño de sitios responsive en WordPress, personalización de plantillas y maquetación con HTML y CSS; ajustes básicos de JavaScript.",
        "Diseño y optimización de interfaces en Odoo; coordinación con desarrollo para implementar las propuestas de experiencia de usuario.",
        "Mejoras de accesibilidad, SEO y velocidad de carga; mantenimiento de temas y complementos para conservar la estabilidad del sitio.",
    ])
    cursor = job("Grupo Invictus", "Diseñador UX/UI", "Mar. 2023 - abr. 2024", cursor + 17, [
        "Diseño de interfaces, wireframes, mockups y prototipos en Figma; dashboards y paneles de control para visualizar información.",
        "Validación de flujos con pruebas de usabilidad, análisis de datos y feedback; iteraciones de diseño responsive y accesibilidad.",
        "Colaboración con clientes y equipos de desarrollo para definir requerimientos, alinear objetivos y dar seguimiento a la implementación.",
    ])
    cursor = job("Fundación ADO", "Diseñador gráfico", "Jun. 2022 - mar. 2023", cursor + 17, [
        "Diseño de materiales informativos, campañas visuales e identificadores gráficos.",
        "Realización de videos corporativos y piezas de comunicación visual.",
    ])
    cursor = job("Mobility ADO", "Auxiliar administrativo", "Nov. 2019 - nov. 2020", cursor + 17, [
        "Facturación y comprobación de gastos en PACFE; manejo de bases de datos y comunicación interna.",
        "Apoyo en organización y documentación de eventos; trato con organizaciones civiles y difusión de información mediante materiales gráficos.",
    ])
    page_end(1, cursor)

    page_start(2)
    section("COMPETENCIAS Y HERRAMIENTAS", 85)
    skills = [
        ("Diseño UX/UI", "Investigación de usuarios, arquitectura de información, user flows, wireframes, prototipos, diseño de interacción, pruebas de usabilidad y accesibilidad. Manejo avanzado de Figma; FigJam, Miro y Maze."),
        ("Implementación web", "Dominio de HTML y CSS; JavaScript básico. Manejo avanzado de Framer, WordPress y Webflow; Elementor, Shopify, Odoo y GitHub."),
        ("Diseño gráfico y 3D", "Diseño visual, identidad gráfica y comunicación: Photoshop e Illustrator. Modelado, materiales y recursos 3D en Blender para integrar en productos digitales; Rive y LottieFiles para animación."),
        ("Inteligencia artificial", "Uso avanzado de ChatGPT y Claude; ingeniería de prompts, generación de imágenes, exploración de propuestas visuales y prototipado asistido por IA."),
    ]
    cursor = 99
    for label, value in skills:
        cursor += paragraph(f"<b>{escape(label)}.</b> {escape(value)}", cursor,
                            size=11.3, leading=15) + 10
    section("FORMACIÓN ACADÉMICA", cursor + 12)
    cursor += 24

    def education(title, institution, dates, top):
        height = paragraph(f"<b>{escape(title)}</b>", top, size=11.7, leading=15)
        height += paragraph(f"{escape(institution)} · {escape(dates)}", top + height + 1,
                            size=10.9, leading=14, color=MUTED)
        return top + height + 13

    cursor = education("Licenciatura en Diseño Gráfico y Animación Digital",
                       "Universidad Autónoma de Tamaulipas", "Ago. 2021 - jul. 2024", cursor)
    cursor = education("Bachillerato", "Colegio de Bachilleres No. 2", "Ago. 2014 - jul. 2018", cursor)
    section("FORMACIÓN COMPLEMENTARIA", cursor + 11)
    cursor += 25
    # All six entries and dates are transcribed from the user's original CV render.
    courses = [
        ("Certificación profesional en diseño de experiencia de usuario (UX) de Google", "Coursera", "Jun. 2022 - dic. 2023"),
        ("Curso de Diseño UX/UI", "Udemy", "Jun. 2022 - feb. 2023"),
        ("Diseño UX/UI", "Platzi", "Feb. 2022 - dic. 2023"),
        ("Diseño de producto", "Platzi", "Feb. 2022 - dic. 2023"),
        ("Desarrollo web", "Platzi", "Feb. 2022 - dic. 2023"),
        ("Inglés", "Platzi", "Feb. 2022 - dic. 2023"),
    ]
    for title, institution, dates in courses:
        cursor = education(title, institution, dates, cursor)
    page_end(2, cursor)
    pdf.save()
    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    make_pdf()
