from datetime import datetime, timezone
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
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

# Paleta corporativa adaptada para impresión (Fondo blanco)
_DARK = colors.HexColor("#0F172A")
_ACCENT = colors.HexColor("#0066FF")
_LABEL_BG = colors.HexColor("#F8FAFC")
_TEXT = colors.HexColor("#334155")
_BORDER = colors.HexColor("#E2E8F0")

def _section_table(data: list[list[str]]) -> Table:
    # 60mm + 110mm = 170mm (El ancho exacto útil de un A4 con márgenes de 20mm)
    table = Table(data, colWidths=[60 * mm, 110 * mm])
    table.setStyle(
        TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TEXTCOLOR", (0, 0), (0, -1), _DARK),
            ("TEXTCOLOR", (1, 0), (1, -1), _TEXT),
            ("BACKGROUND", (0, 0), (0, -1), _LABEL_BG),
            ("GRID", (0, 0), (-1, -1), 0.5, _BORDER),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])
    )
    return table

def generar_precontrato(contrato, usuario, vehiculo) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm,
    )

    # LA CORRECCIÓN: El atributo 'leading' evita que el texto se aplaste
    title_style = ParagraphStyle(
        "Title", fontSize=26, fontName="Helvetica-Bold",
        textColor=_DARK, alignment=TA_CENTER, leading=32, spaceAfter=2 * mm,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", fontSize=12, fontName="Helvetica",
        textColor=_ACCENT, alignment=TA_CENTER, leading=16, spaceAfter=8 * mm,
    )
    section_style = ParagraphStyle(
        "Section", fontSize=11, fontName="Helvetica-Bold",
        textColor=_DARK, spaceBefore=8 * mm, spaceAfter=3 * mm, leading=14
    )
    date_style = ParagraphStyle(
        "Date", fontSize=8, fontName="Helvetica",
        textColor=colors.grey, alignment=TA_RIGHT, spaceAfter=6 * mm,
    )
    footer_style = ParagraphStyle(
        "Footer", fontSize=8, fontName="Helvetica-Oblique",
        textColor=colors.grey, alignment=TA_CENTER, spaceBefore=6 * mm,
    )

    fecha_gen = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")

    story = [
        Paragraph("ZENITH", title_style),
        Paragraph("PRECONTRATO DE RENTING", subtitle_style),
        HRFlowable(width="100%", thickness=2, color=_ACCENT),
        Spacer(1, 4 * mm),
        Paragraph(f"Ref. Documento: {fecha_gen}", date_style),

        Paragraph("1. DATOS DEL CLIENTE", section_style),
        _section_table([
            ["Titular", f"{usuario.nombre} {usuario.apellidos}"],
            ["Correo Electrónico", usuario.email],
        ]),

        Paragraph("2. ESPECIFICACIONES DEL VEHÍCULO", section_style),
        _section_table([
            ["Marca y Modelo", f"{vehiculo.marca} {vehiculo.modelo}"],
            ["Año de Matriculación", str(vehiculo.anio)],
            ["Kilometraje Actual", f"{vehiculo.kilometraje:,} km".replace(",", ".")],
            ["Motorización", vehiculo.combustible.value.capitalize()],
            ["Color", vehiculo.color or "No especificado"],
            ["Clasificación", vehiculo.origen.value.capitalize()],
        ]),

        Paragraph("3. CONDICIONES FINANCIERAS (SIN I.V.A)", section_style),
        _section_table([
            ["Duración del Contrato", f"{contrato.plazo_meses} meses"],
            ["Límite de Kilometraje", f"{contrato.km_anuales:,} km/año".replace(",", ".")],
            ["Aportación Inicial", f"{float(contrato.aportacion_inicial):.2f} €"],
            ["Cuota Mensual Estimada", f"{float(contrato.cuota_mensual):.2f} € / mes"],
            ["Valor Total del Contrato", f"{float(contrato.total_contrato):.2f} €"],
        ]),

        Spacer(1, 15 * mm),
        HRFlowable(width="100%", thickness=0.5, color=_BORDER),
        Paragraph(
            "El presente documento constituye una simulación y carece de validez jurídica vinculante. "
            "La formalización del renting está sujeta a la aprobación del departamento de riesgos financieros de Zenith.",
            footer_style,
        ),
    ]

    doc.build(story)
    return buffer.getvalue()