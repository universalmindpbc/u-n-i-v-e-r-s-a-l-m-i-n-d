#!/usr/bin/env python3
"""Build the versioned Universal Mind RCT scientific briefing PDF.

The signed-off Research page remains the content source. This builder preserves
its section order and wording while applying document-specific typography,
tables, page furniture, and the approved partner-review framing.
"""

from __future__ import annotations

import argparse
import html
import re
from pathlib import Path
from typing import Iterable

from lxml import etree
from lxml import html as lxml_html
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    LongTable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "i  a m" / "research.html"
DEFAULT_OUTPUT = (
    ROOT
    / "i  a m"
    / "a s s e t s"
    / "research"
    / "modul8-infinity-rct-scientific-briefing-v1.pdf"
)
LOGO = ROOT / "i  a m" / "a s s e t s" / "Universal Mind [ I o H ] Logo 512.png"

DOCUMENT_TITLE = "modul8 infinity Randomized Controlled Trial"
DOCUMENT_SUBTITLE = "Scientific Briefing for Research and Institutional Partners"
DOCUMENT_VERSION = "Version 1 - Partner Review Brief"
DOCUMENT_DATE = "31 August 2026"
STATUS_STATEMENT = (
    "This briefing describes a proposed randomized controlled trial. It is not "
    "a registered or ethics-approved clinical trial protocol. Final design "
    "decisions will be developed with research, clinical, and statistical partners."
)

BLACK = colors.HexColor("#080808")
INK = colors.HexColor("#11110F")
PAPER = colors.HexColor("#ECE9DF")
PAPER_LIGHT = colors.HexColor("#F6F3EA")
MUTED = colors.HexColor("#66665F")
LINE = colors.HexColor("#C8C5BB")
SIGNAL = colors.HexColor("#D8FF42")
COBALT = colors.HexColor("#4059FF")
AMBER = colors.HexColor("#FF7A31")
WHITE = colors.white


def register_fonts() -> None:
    font_dir = Path("/System/Library/Fonts/Supplemental")
    faces = {
        "UMSans": font_dir / "Arial.ttf",
        "UMSansBold": font_dir / "Arial Bold.ttf",
        "UMSansItalic": font_dir / "Arial Italic.ttf",
        "UMSansBoldItalic": font_dir / "Arial Bold Italic.ttf",
        "UMUnicode": font_dir / "Arial Unicode.ttf",
    }
    for name, path in faces.items():
        if not path.exists():
            raise FileNotFoundError(f"Required font is unavailable: {path}")
        pdfmetrics.registerFont(TTFont(name, str(path)))
    pdfmetrics.registerFontFamily(
        "UMSans",
        normal="UMSans",
        bold="UMSansBold",
        italic="UMSansItalic",
        boldItalic="UMSansBoldItalic",
    )


def collapse_space(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\xa0", " ")).strip()


def escape_inline_text(value: str) -> str:
    escaped = html.escape(value.replace("\xa0", " "))
    return escaped.replace("₂", '<font name="UMUnicode">₂</font>')


def inline_markup(node: etree._Element) -> str:
    pieces: list[str] = []
    if node.text:
        pieces.append(escape_inline_text(node.text))
    for child in node:
        tag = child.tag.lower() if isinstance(child.tag, str) else ""
        content = inline_markup(child)
        if tag in {"strong", "b"}:
            pieces.append(f"<b>{content}</b>")
        elif tag in {"em", "i"}:
            pieces.append(f"<i>{content}</i>")
        elif tag == "a":
            href = html.escape(child.get("href", ""), quote=True)
            pieces.append(f'<a href="{href}" color="#4059FF"><u>{content}</u></a>')
        elif tag == "br":
            pieces.append("<br/>")
        elif tag == "sup":
            pieces.append(f"<super>{content}</super>")
        elif tag == "sub":
            pieces.append(f"<sub>{content}</sub>")
        else:
            pieces.append(content)
        if child.tail:
            pieces.append(escape_inline_text(child.tail))
    return "".join(pieces).strip()


def element_text(node: etree._Element) -> str:
    return collapse_space("".join(node.itertext()))


def build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "cover_kicker": ParagraphStyle(
            "CoverKicker",
            parent=base["Normal"],
            fontName="UMSansBold",
            fontSize=8.5,
            leading=11,
            textColor=SIGNAL,
            spaceAfter=8 * mm,
            tracking=1.8,
            uppercase=True,
        ),
        "cover_title": ParagraphStyle(
            "CoverTitle",
            parent=base["Title"],
            fontName="UMSans",
            fontSize=35,
            leading=36,
            textColor=WHITE,
            alignment=TA_LEFT,
            spaceAfter=8 * mm,
        ),
        "cover_subtitle": ParagraphStyle(
            "CoverSubtitle",
            parent=base["Normal"],
            fontName="UMSans",
            fontSize=17,
            leading=21,
            textColor=colors.HexColor("#D9D9D4"),
            spaceAfter=8 * mm,
        ),
        "cover_meta": ParagraphStyle(
            "CoverMeta",
            parent=base["Normal"],
            fontName="UMSansBold",
            fontSize=8.5,
            leading=12,
            textColor=SIGNAL,
            spaceAfter=4 * mm,
        ),
        "cover_status": ParagraphStyle(
            "CoverStatus",
            parent=base["Normal"],
            fontName="UMSans",
            fontSize=9.2,
            leading=14,
            textColor=WHITE,
        ),
        "kicker": ParagraphStyle(
            "Kicker",
            parent=base["Normal"],
            fontName="UMSansBold",
            fontSize=7.7,
            leading=10,
            textColor=COBALT,
            spaceAfter=4 * mm,
            tracking=1.2,
        ),
        "study_title": ParagraphStyle(
            "StudyTitle",
            parent=base["Title"],
            fontName="UMSans",
            fontSize=28,
            leading=31,
            textColor=INK,
            spaceBefore=7 * mm,
            spaceAfter=5 * mm,
        ),
        "study_subtitle": ParagraphStyle(
            "StudySubtitle",
            parent=base["Normal"],
            fontName="UMSans",
            fontSize=13,
            leading=18,
            textColor=INK,
            leftIndent=5 * mm,
            borderColor=SIGNAL,
            borderWidth=0,
            borderPadding=(0, 0, 0, 0),
            spaceAfter=4 * mm,
        ),
        "section": ParagraphStyle(
            "Section",
            parent=base["Heading1"],
            fontName="UMSans",
            fontSize=23,
            leading=27,
            textColor=INK,
            spaceAfter=7 * mm,
            keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "H3",
            parent=base["Heading2"],
            fontName="UMSansBold",
            fontSize=13,
            leading=17,
            textColor=INK,
            spaceBefore=5 * mm,
            spaceAfter=2.5 * mm,
            keepWithNext=True,
        ),
        "h4": ParagraphStyle(
            "H4",
            parent=base["Heading3"],
            fontName="UMSansBold",
            fontSize=10.4,
            leading=14,
            textColor=INK,
            spaceBefore=4 * mm,
            spaceAfter=2 * mm,
            keepWithNext=True,
        ),
        "h5": ParagraphStyle(
            "H5",
            parent=base["Heading4"],
            fontName="UMSansBold",
            fontSize=9.2,
            leading=12.5,
            textColor=INK,
            spaceBefore=3 * mm,
            spaceAfter=1.5 * mm,
            keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="UMSans",
            fontSize=9.25,
            leading=13.7,
            textColor=INK,
            spaceAfter=3.2 * mm,
        ),
        "body_small": ParagraphStyle(
            "BodySmall",
            parent=base["BodyText"],
            fontName="UMSans",
            fontSize=7.8,
            leading=11,
            textColor=INK,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["BodyText"],
            fontName="UMSans",
            fontSize=8.8,
            leading=12.8,
            textColor=INK,
            leftIndent=0,
        ),
        "label": ParagraphStyle(
            "Label",
            parent=base["BodyText"],
            fontName="UMSansBold",
            fontSize=8.3,
            leading=12,
            textColor=INK,
        ),
        "value": ParagraphStyle(
            "Value",
            parent=base["BodyText"],
            fontName="UMSans",
            fontSize=8.3,
            leading=12,
            textColor=INK,
        ),
        "table_head": ParagraphStyle(
            "TableHead",
            parent=base["BodyText"],
            fontName="UMSansBold",
            fontSize=7.2,
            leading=9.6,
            textColor=WHITE,
        ),
        "table_body": ParagraphStyle(
            "TableBody",
            parent=base["BodyText"],
            fontName="UMSans",
            fontSize=7.15,
            leading=9.8,
            textColor=INK,
        ),
        "footer": ParagraphStyle(
            "Footer",
            parent=base["Normal"],
            fontName="UMSansBold",
            fontSize=6.6,
            leading=8,
            textColor=MUTED,
        ),
    }


class BriefingDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable) -> None:  # noqa: N802 - ReportLab API
        bookmark = getattr(flowable, "_bookmark_name", None)
        if not bookmark:
            return
        level = getattr(flowable, "_outline_level", 0)
        title = getattr(flowable, "_outline_title", bookmark)
        self.canv.bookmarkPage(bookmark)
        self.canv.addOutlineEntry(title, bookmark, level=level, closed=False)


def bookmark_paragraph(text: str, style: ParagraphStyle, name: str, level: int = 0) -> Paragraph:
    paragraph = Paragraph(html.escape(text), style)
    paragraph._bookmark_name = name  # type: ignore[attr-defined]
    paragraph._outline_level = level  # type: ignore[attr-defined]
    paragraph._outline_title = text  # type: ignore[attr-defined]
    return paragraph


def note_box(markup: str, styles: dict[str, ParagraphStyle]) -> Table:
    table = Table([[Paragraph(markup, styles["body"])]], colWidths=[155 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E1DED4")),
                ("BOX", (0, 0), (-1, -1), 0.7, COBALT),
                ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
            ]
        )
    )
    return table


def definition_table(node: etree._Element, styles: dict[str, ParagraphStyle]) -> LongTable:
    rows = []
    for item in node.xpath("./div"):
        dt = item.find("dt")
        dd = item.find("dd")
        if dt is None or dd is None:
            continue
        rows.append(
            [
                Paragraph(inline_markup(dt), styles["label"]),
                Paragraph(inline_markup(dd), styles["value"]),
            ]
        )
    parent_classes = (node.getparent().get("class", "") if node.getparent() is not None else "").split()
    compact = "research-program-summary" in parent_classes
    vertical_padding = 2 * mm if compact else 3.2 * mm
    table = LongTable(rows, colWidths=[47 * mm, 108 * mm], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E0DDD3")),
                ("LEFTPADDING", (0, 0), (-1, -1), 3.4 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3.4 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), vertical_padding),
                ("BOTTOMPADDING", (0, 0), (-1, -1), vertical_padding),
            ]
        )
    )
    return table


def data_table(node: etree._Element, styles: dict[str, ParagraphStyle]) -> LongTable:
    row_nodes = node.xpath("./thead/tr | ./tbody/tr | ./tr")
    rows = []
    header_rows = len(node.xpath("./thead/tr"))
    for row_index, row_node in enumerate(row_nodes):
        cells = []
        for cell in row_node.xpath("./th | ./td"):
            style = styles["table_head"] if row_index < header_rows else styles["table_body"]
            cells.append(Paragraph(inline_markup(cell), style))
        if cells:
            rows.append(cells)
    columns = max(len(row) for row in rows)
    if columns == 4:
        widths = [68 * mm, 29 * mm, 29 * mm, 29 * mm]
    elif columns == 3:
        widths = [62 * mm, 30 * mm, 63 * mm]
    else:
        widths = [155 * mm / columns] * columns
    table = LongTable(rows, colWidths=widths, repeatRows=header_rows, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 2.1 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2.1 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 2.1 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.1 * mm),
        ("ROWBACKGROUNDS", (0, header_rows), (-1, -1), [PAPER_LIGHT, colors.HexColor("#E6E3D9")]),
    ]
    if header_rows:
        commands.append(("BACKGROUND", (0, 0), (-1, header_rows - 1), BLACK))
    table.setStyle(TableStyle(commands))
    return table


def list_flowable(node: etree._Element, styles: dict[str, ParagraphStyle]) -> ListFlowable:
    items = [
        ListItem(Paragraph(inline_markup(li), styles["bullet"]), leftIndent=4 * mm)
        for li in node.xpath("./li")
    ]
    return ListFlowable(
        items,
        bulletType="bullet" if node.tag.lower() == "ul" else "1",
        start="circle" if node.tag.lower() == "ul" else "1",
        leftIndent=6 * mm,
        bulletFontName="UMSansBold",
        bulletFontSize=7,
        bulletColor=COBALT,
        spaceAfter=3 * mm,
    )


def flowables_from(node: etree._Element, styles: dict[str, ParagraphStyle]) -> list:
    output = []
    for child in node:
        if not isinstance(child.tag, str):
            continue
        tag = child.tag.lower()
        if tag in {"script", "nav", "footer"}:
            continue
        if tag == "header":
            continue
        if tag == "p":
            markup = inline_markup(child)
            if markup:
                output.append(Paragraph(markup, styles["body"]))
        elif tag in {"h3", "h4", "h5"}:
            style = styles[tag]
            output.append(Paragraph(html.escape(element_text(child)), style))
        elif tag == "blockquote":
            output.append(note_box(inline_markup(child), styles))
            output.append(Spacer(1, 3 * mm))
        elif tag in {"ul", "ol"}:
            output.append(list_flowable(child, styles))
        elif tag == "dl":
            output.append(definition_table(child, styles))
            output.append(Spacer(1, 2 * mm))
        elif tag == "table":
            output.append(data_table(child, styles))
            output.append(Spacer(1, 4 * mm))
        elif tag == "article":
            article_items = flowables_from(child, styles)
            if article_items:
                output.append(KeepTogether(article_items))
                output.append(Spacer(1, 2.5 * mm))
        else:
            output.extend(flowables_from(child, styles))
    return output


def cover_story(styles: dict[str, ParagraphStyle]) -> list:
    logo = Image(str(LOGO), width=42 * mm, height=42 * mm)
    status = Table(
        [[Paragraph(STATUS_STATEMENT, styles["cover_status"])]],
        colWidths=[144 * mm],
    )
    status.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#171717")),
                ("BOX", (0, 0), (-1, -1), 0.8, SIGNAL),
                ("LEFTPADDING", (0, 0), (-1, -1), 6 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5 * mm),
            ]
        )
    )
    return [
        Spacer(1, 10 * mm),
        logo,
        Spacer(1, 17 * mm),
        Paragraph("UNIVERSAL MIND", styles["cover_kicker"]),
        bookmark_paragraph(DOCUMENT_TITLE, styles["cover_title"], "cover", 0),
        Paragraph(DOCUMENT_SUBTITLE, styles["cover_subtitle"]),
        Paragraph(f"{DOCUMENT_VERSION}<br/>{DOCUMENT_DATE}", styles["cover_meta"]),
        Spacer(1, 14 * mm),
        status,
        Spacer(1, 13 * mm),
        PageBreak(),
    ]


def identity_story(root: etree._Element, styles: dict[str, ParagraphStyle]) -> list:
    identity = root.xpath(
        '//*[contains(concat(" ", normalize-space(@class), " "), " research-identity ")]'
    )
    if not identity:
        raise ValueError("Research identity block was not found")
    trial_heading = element_text(
        root.xpath(
            '//*[contains(concat(" ", normalize-space(@class), " "), " research-hero ")]//blockquote'
        )[0]
    )
    developed = element_text(
        root.xpath(
            '//*[contains(concat(" ", normalize-space(@class), " "), " research-developed ")]'
        )[0]
    )
    return [
        Paragraph("RCT TITLE &amp; PLATFORM IDENTIFICATION", styles["kicker"]),
        definition_table(identity[0], styles),
        HRFlowable(width="100%", thickness=1, color=SIGNAL, spaceBefore=6 * mm, spaceAfter=6 * mm),
        Paragraph("THE <i>modul8 infinity</i> STUDY", styles["study_title"]),
        Paragraph(html.escape(trial_heading), styles["study_subtitle"]),
        Paragraph(html.escape(developed), styles["kicker"]),
    ]


def section_story(root: etree._Element, styles: dict[str, ParagraphStyle]) -> list:
    story = []
    sections = root.xpath("//main/section")
    for index, section in enumerate(sections):
        heading = section.find(".//h2")
        if heading is None:
            continue
        title = element_text(heading)
        if index > 0:
            story.append(PageBreak())
        bookmark = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
        story.append(bookmark_paragraph(title, styles["section"], bookmark, 0))
        story.append(HRFlowable(width=34 * mm, thickness=3, color=SIGNAL, spaceAfter=5 * mm))
        section_content = []
        for child in section:
            if child.tag == "header":
                continue
            section_content.extend(flowables_from(child, styles))
        while section_content and isinstance(section_content[-1], Spacer):
            section_content.pop()
        story.extend(section_content)
    return story


def draw_cover(canvas, doc) -> None:
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(BLACK)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setFillColor(COBALT)
    canvas.circle(width - 19 * mm, height - 19 * mm, 48 * mm, fill=1, stroke=0)
    canvas.setFillColor(AMBER)
    canvas.circle(width - 10 * mm, 12 * mm, 33 * mm, fill=1, stroke=0)
    canvas.setFillColor(SIGNAL)
    canvas.rect(0, 0, 8 * mm, height, fill=1, stroke=0)
    canvas.setTitle(DOCUMENT_TITLE)
    canvas.setAuthor("Universal Mind")
    canvas.setSubject(DOCUMENT_SUBTITLE)
    canvas.setKeywords("modul8 infinity, randomized controlled trial, scientific briefing, Universal Mind")
    canvas.restoreState()


def draw_content_page(canvas, doc) -> None:
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.drawImage(
        str(LOGO),
        doc.leftMargin,
        height - 23 * mm,
        width=13.5 * mm,
        height=13.5 * mm,
        preserveAspectRatio=True,
        mask="auto",
    )
    canvas.setFont("UMSansBold", 7)
    canvas.setFillColor(INK)
    canvas.drawString(doc.leftMargin + 18 * mm, height - 15.5 * mm, "UNIVERSAL MIND")
    canvas.setFont("UMSans", 6.7)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - doc.rightMargin, height - 15.5 * mm, DOCUMENT_VERSION.upper())
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, height - 26 * mm, width - doc.rightMargin, height - 26 * mm)
    canvas.line(doc.leftMargin, 17 * mm, width - doc.rightMargin, 17 * mm)
    canvas.setFont("UMSans", 6.7)
    canvas.setFillColor(MUTED)
    canvas.drawString(doc.leftMargin, 11 * mm, "THE modul8 infinity STUDY")
    canvas.drawCentredString(width / 2, 11 * mm, DOCUMENT_DATE.upper())
    canvas.setFont("UMSansBold", 7)
    canvas.setFillColor(INK)
    canvas.drawRightString(width - doc.rightMargin, 11 * mm, f"{doc.page:02d}")
    canvas.restoreState()


def build(source: Path, output: Path) -> None:
    register_fonts()
    if not source.exists():
        raise FileNotFoundError(source)
    if not LOGO.exists():
        raise FileNotFoundError(LOGO)
    output.parent.mkdir(parents=True, exist_ok=True)
    root = lxml_html.fromstring(source.read_text(encoding="utf-8"))
    styles = build_styles()
    story = cover_story(styles)
    story.extend(identity_story(root, styles))
    story.extend(section_story(root, styles))
    doc = BriefingDocTemplate(
        str(output),
        pagesize=A4,
        rightMargin=27 * mm,
        leftMargin=28 * mm,
        topMargin=34 * mm,
        bottomMargin=20 * mm,
        title=DOCUMENT_TITLE,
        author="Universal Mind",
        subject=DOCUMENT_SUBTITLE,
    )
    doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_content_page)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    build(args.source.resolve(), args.output.resolve())
    print(args.output.resolve())
