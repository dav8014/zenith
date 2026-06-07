from datetime import datetime, timezone
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

_DARK = colors.HexColor("#1A1A2E")
_ACCENT = colors.HexColor("#4F8EF7")
_LABEL_BG = colors.HexColor("#EEF2FA")
_BORDER = colors.HexColor("#C8D4E8")


def _section_table(data: list[list[str]]) -> Table:
    table = Table(data, colWidths=[62 * mm, 108 * mm])
    table.setStyle(
        TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("TEXTCOLOR", (0, 0), (0, -1), _DARK),
            ("BACKGROUND", (0, 0), (0, -1), _LABEL_BG),
            ("GRID", (0, 0), (-1, -1), 0.5, _BORDER),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])
    )
    return table


def generar_precontrato(contrato, usuario, vehiculo) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    title_style = ParagraphStyle(
        "Title", fontSize=30, fontName="Helvetica-Bold",
        textColor=_DARK, alignment=TA_CENTER, spaceAfter=1 * mm,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", fontSize=13, fontName="Helvetica",
        textColor=_ACCENT, alignment=TA_CENTER, spaceAfter=5 * mm,
    )
    section_style = ParagraphStyle(
        "Section", fontSize=11, fontName="Helvetica-Bold",
        textColor=_DARK, spaceBefore=5 * mm, spaceAfter=2 * mm,
    )
    date_style = ParagraphStyle(
        "Date", fontSize=9, fontName="Helvetica",
        textColor=colors.grey, alignment=TA_RIGHT, spaceAfter=4 * mm,
    )
    footer_style = ParagraphStyle(
        "Footer", fontSize=7, fontName="Helvetica-Oblique",
        textColor=colors.grey, alignment=TA_CENTER, spaceBefore=4 * mm,
    )

    fecha_gen = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")

    story = [
        Paragraph("ZENITH", title_style),
        Paragraph("Precontrato de Renting", subtitle_style),
        HRFlowable(width="100%", thickness=1.5, color=_ACCENT),
        Spacer(1, 3 * mm),
        Paragraph(f"Fecha de generación: {fecha_gen}", date_style),

        Paragraph("Datos del Cliente", section_style),
        _section_table([
            ["Nombre", usuario.nombre],
            ["Apellidos", usuario.apellidos],
            ["Email", usuario.email],
        ]),

        Paragraph("Datos del Vehículo", section_style),
        _section_table([
            ["Marca", vehiculo.marca],
            ["Modelo", vehiculo.modelo],
            ["Año", str(vehiculo.anio)],
            ["Kilometraje", f"{vehiculo.kilometraje} km"],
            ["Combustible", vehiculo.combustible.value.capitalize()],
            ["Color", vehiculo.color or "-"],
            ["Origen", vehiculo.origen.value.capitalize()],
        ]),

        Paragraph("Condiciones del Contrato", section_style),
        _section_table([
            ["Plazo", f"{contrato.plazo_meses} meses"],
            ["Kilómetros anuales", f"{contrato.km_anuales:,} km".replace(",", ".")],
            ["Aportación inicial", f"{contrato.aportacion_inicial} EUR"],
            ["Cuota mensual", f"{contrato.cuota_mensual} EUR"],
            ["Total contrato", f"{contrato.total_contrato} EUR"],
        ]),

        Spacer(1, 8 * mm),
        HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey),
        Paragraph(
            "Este documento es un precontrato sin validez jurídica hasta su firma por ambas partes.",
            footer_style,
        ),
    ]

    doc.build(story)
    return buffer.getvalue()
