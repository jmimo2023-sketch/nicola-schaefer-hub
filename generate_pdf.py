#!/usr/bin/env python3
"""
Generate PDF from DIAGNOSTIC_REPORT.md for Nicola Schaefer Hub
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics import renderPDF
import os

# Colors
ACCENT = HexColor('#467a49')
DARK = HexColor('#1a1a1a')
GRAY = HexColor('#71717a')
LIGHT_BG = HexColor('#f4f3f3')
GREEN = HexColor('#22c55e')
AMBER = HexColor('#f59e0b')
RED = HexColor('#ef4444')

def create_pdf():
    doc = SimpleDocTemplate(
        "E:/Niki/nicola-schaefer-hub/DIAGNOSTIC_REPORT.pdf",
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()

    # Custom styles
    styles.add(ParagraphStyle(
        name='Title_Custom',
        parent=styles['Normal'],
        fontSize=28,
        textColor=ACCENT,
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))

    styles.add(ParagraphStyle(
        name='Heading1_Custom',
        parent=styles['Normal'],
        fontSize=18,
        textColor=ACCENT,
        spaceBefore=20,
        spaceAfter=12,
        fontName='Helvetica-Bold'
    ))

    styles.add(ParagraphStyle(
        name='Heading2_Custom',
        parent=styles['Normal'],
        fontSize=14,
        textColor=DARK,
        spaceBefore=15,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    ))

    styles.add(ParagraphStyle(
        name='Body_Custom',
        parent=styles['Normal'],
        fontSize=10,
        textColor=DARK,
        spaceBefore=6,
        spaceAfter=6,
        alignment=TA_JUSTIFY,
        leading=14
    ))

    styles.add(ParagraphStyle(
        name='Code_Custom',
        parent=styles['Normal'],
        fontSize=8,
        textColor=GRAY,
        backColor=LIGHT_BG,
        fontName='Courier',
        leftIndent=10,
        rightIndent=10,
        spaceBefore=10,
        spaceAfter=10
    ))

    styles.add(ParagraphStyle(
        name='Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=GRAY,
        alignment=TA_CENTER,
        spaceAfter=30
    ))

    story = []

    # ===== COVER PAGE =====
    story.append(Spacer(1, 4*cm))
    story.append(Paragraph("NICOLA SCHAEFER HUB", styles['Title_Custom']))
    story.append(Paragraph("Diagnóstico Completo & Plan de Mejoras", styles['Subtitle']))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph("Knowledge Chain Document v1.0", ParagraphStyle('Version', parent=styles['Normal'], fontSize=11, alignment=TA_CENTER, textColor=GRAY)))
    story.append(Spacer(1, 3*cm))

    # Date info
    info_data = [
        ['Fecha:', '26 Abril 2026'],
        ['Versión:', '1.0'],
        ['Estado:', 'Diagnosticado'],
        ['Total Casos de Uso:', '120'],
        ['Health Score:', '69.7% (C+)']
    ]
    info_table = Table(info_data, colWidths=[4*cm, 8*cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), GRAY),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)

    story.append(PageBreak())

    # ===== TABLE OF CONTENTS =====
    story.append(Paragraph("Índice", styles['Heading1_Custom']))
    toc_items = [
        "1. Resumen Ejecutivo",
        "2. Diagnóstico por Flujo (20 casos cada uno)",
        "3. Estadísticas y Métricas",
        "4. Plan de Mejoras",
        "5. Cadena de Conocimiento",
        "6. Recomendaciones Ejecutivas"
    ]
    for item in toc_items:
        story.append(Paragraph(item, styles['Body_Custom']))

    story.append(PageBreak())

    # ===== 1. RESUMEN EJECUTIVO =====
    story.append(Paragraph("1. Resumen Ejecutivo", styles['Heading1_Custom']))
    story.append(Paragraph(
        "El Nicola Schaefer Hub es una plataforma de gestión de contenido para Instagram construida "
        "con React 19, TypeScript, Firebase y Supabase. El sistema permite crear, programar y analizar "
        "contenido para Instagram Business.",
        styles['Body_Custom']
    ))
    story.append(Spacer(1, 0.5*cm))

    # Strengths
    story.append(Paragraph("Fortalezas Detectadas", styles['Heading2_Custom']))
    strengths = [
        "✅ Stack tecnológico moderno y escalable",
        "✅ Panel de analytics funcional con gráficos",
        "✅ Studio con integración Canva activa",
        "✅ Calendario visual con drag & drop",
        "✅ Generator AI con capacidades completas",
        "✅ Sistema bilingual (ES/DE)",
        "✅ Onboarding wizard implementado"
    ]
    for s in strengths:
        story.append(Paragraph(s, styles['Body_Custom']))

    story.append(Spacer(1, 0.5*cm))

    # Weaknesses
    story.append(Paragraph("Debilidades Detectadas", styles['Heading2_Custom']))
    weaknesses = [
        "⚠️ No hay testing E2E",
        "⚠️ Sin monitoreo de errores en producción",
        "⚠️ UI inconsistente en algunos paneles",
        "⚠️ Falta documentación de APIs",
        "⚠️ Sin logs estructurados",
        "⚠️ Rendimiento mejorable en grids grandes"
    ]
    for w in weaknesses:
        story.append(Paragraph(w, styles['Body_Custom']))

    story.append(PageBreak())

    # ===== 2. DIAGNÓSTICO POR FLUJO =====
    story.append(Paragraph("2. Diagnóstico por Flujo", styles['Heading1_Custom']))

    # Overview Table
    story.append(Paragraph("2.1 Resumen de Implementación", styles['Heading2_Custom']))

    header = ['Flujo', 'Total', 'Implementados', 'Pendientes', 'Cobertura']
    data = [
        header,
        ['Studio Panel', '20', '18', '2', '90%'],
        ['AI Generator', '20', '17', '3', '85%'],
        ['Connections', '20', '16', '4', '80%'],
        ['Calendar Panel', '20', '15', '5', '75%'],
        ['Onboarding', '20', '14', '6', '70%'],
        ['Analytics Dashboard', '20', '12', '8', '60%'],
        ['TOTAL', '120', '92', '28', '76.7%']
    ]

    table = Table(data, colWidths=[4*cm, 2*cm, 2.5*cm, 2.5*cm, 2.5*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, -1), (-1, -1), LIGHT_BG),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY),
    ]))
    story.append(table)

    story.append(PageBreak())

    # ===== 3. ESTADÍSTICAS Y MÉTRICAS =====
    story.append(Paragraph("3. Estadísticas y Métricas", styles['Heading1_Custom']))

    story.append(Paragraph("3.1 Distribución por Prioridad", styles['Heading2_Custom']))

    priority_data = [
        header,
        ['Critical', '35', '35', '0', '100%'],
        ['High', '45', '42', '3', '93%'],
        ['Medium', '28', '12', '16', '43%'],
        ['Low', '12', '3', '9', '25%']
    ]

    p_table = Table(priority_data, colWidths=[3*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY),
    ]))
    story.append(p_table)
    story.append(Spacer(1, 0.5*cm))

    # 3.2 Health Score
    story.append(Paragraph("3.2 Health Score General", styles['Heading2_Custom']))

    health_data = [
        ['Métrica', 'Score', 'Estado'],
        ['Code Quality', '82%', '███████████████░░'],
        ['Test Coverage', '45%', '█████████░░░░░░░░░░'],
        ['Documentation', '58%', '███████████░░░░░░░░'],
        ['Error Handling', '70%', '█████████████░░░░░░'],
        ['Performance', '78%', '██████████████░░░░░'],
        ['Security', '85%', '█████████████████░░░'],
        ['OVERALL', '69.7%', '█████████████░░░░░░░'],
    ]

    h_table = Table(health_data, colWidths=[5*cm, 2.5*cm, 6*cm])
    h_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY),
        ('BACKGROUND', (0, -1), (-1, -1), LIGHT_BG),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    story.append(h_table)
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Rating: C+ (Needs Improvement)",
                          ParagraphStyle('Rating', parent=styles['Normal'], fontSize=10, alignment=TA_CENTER, textColor=AMBER)))

    story.append(PageBreak())

    # ===== 4. PLAN DE MEJORAS =====
    story.append(Paragraph("4. Plan de Mejoras", styles['Heading1_Custom']))

    story.append(Paragraph("4.1 Matriz de Prioridad", styles['Heading2_Custom']))

    matrix_data = [
        ['', 'HIGH IMPACT', 'LOW IMPACT'],
        ['HIGH URGENCY', 'P1: Quick Wins\n(Esta semana)', 'P2: Consider Later'],
        ['LOW URGENCY', 'P3: Strategic Projects', 'P4: Backlog']
    ]

    m_table = Table(matrix_data, colWidths=[4.5*cm, 5.5*cm, 5.5*cm])
    m_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GRAY),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, GRAY),
        ('BACKGROUND', (1, 1), (1, 1), HexColor('#dcfce7')),
        ('BACKGROUND', (2, 1), (2, 1), HexColor('#fef3c7')),
        ('BACKGROUND', (1, 2), (1, 2), HexColor('#dbeafe')),
        ('BACKGROUND', (2, 2), (2, 2), LIGHT_BG),
    ]))
    story.append(m_table)
    story.append(Spacer(1, 0.5*cm))

    # 4.2 Phase 1
    story.append(Paragraph("4.2 Phase 1: Quick Wins (Week 1-2)", styles['Heading2_Custom']))

    phase1_data = [
        ['Proyecto', 'Problema', 'Solución', 'Esfuerzo'],
        ['P1-A: Error Handling', 'No feedback en upload falla', 'Toast con retry', '2 horas'],
        ['P1-B: Empty States', 'Sin guidance en estados vacíos', 'Verificar todos paneles', '4 horas'],
        ['P1-C: Loading Skeletons', 'Spinner vs skeleton profesional', 'Skeleton components', '6 horas'],
        ['P1-D: Toast Notifications', 'Sin feedback visual', 'Toast centralizado', '2 horas'],
        ['P1-E: Analytics Cache', 'Dashboard falla si API down', 'Stale-while-revalidate', '4 horas'],
    ]

    p1_table = Table(phase1_data, colWidths=[3.5*cm, 4*cm, 4*cm, 2*cm])
    p1_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (3, 0), (3, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(p1_table)

    story.append(PageBreak())

    # 4.3 Phase 2
    story.append(Paragraph("4.3 Phase 2: Strategic Projects (Week 3-6)", styles['Heading2_Custom']))

    phase2_items = [
        "<b>P2-A: E2E Testing Suite (40h)</b><br/>Playwright para Studio upload, Calendar drag & drop, AI generation, Login/Auth",
        "<b>P2-B: Performance Optimization (24h)</b><br/>Code splitting, lazy load panels, optimize images, CDN",
        "<b>P2-C: Monitoring & Observability (16h)</b><br/>Sentry error tracking, analytics events, performance monitoring",
        "<b>P2-D: API Documentation (20h)</b><br/>Swagger/OpenAPI, JSDoc, Postman collection"
    ]
    for item in phase2_items:
        story.append(Paragraph(item, styles['Body_Custom']))
        story.append(Spacer(1, 0.3*cm))

    story.append(Spacer(1, 0.5*cm))

    # 4.4 Phase 3
    story.append(Paragraph("4.4 Phase 3: Feature Gaps (Week 7-12)", styles['Heading2_Custom']))

    phase3_items = [
        "<b>P3-A: Instagram Publishing (60h)</b><br/>Meta Content Publishing API, publicar desde Calendar, preview, queue automation",
        "<b>P3-B: Calendar Drag & Drop Full (24h)</b><br/>Test coverage, optimistic UI, conflict resolution",
        "<b>P3-C: AI Content Refinement (40h)</b><br/>Fine-tune prompts, learning from rejections, A/B testing",
        "<b>P3-D: Multi-account Support (80h)</b><br/>Account switcher, per-account settings, team collaboration"
    ]
    for item in phase3_items:
        story.append(Paragraph(item, styles['Body_Custom']))
        story.append(Spacer(1, 0.3*cm))

    story.append(PageBreak())

    # ===== 5. CADENA DE CONOCIMIENTO =====
    story.append(Paragraph("5. Cadena de Conocimiento", styles['Heading1_Custom']))

    story.append(Paragraph("5.1 Tech Stack", styles['Heading2_Custom']))

    tech_data = [
        ['Categoría', 'Tecnología', 'Uso'],
        ['Frontend', 'React 19 + TypeScript', 'UI Components'],
        ['Frontend', 'Tailwind CSS + Vite', 'Styling & Build'],
        ['Frontend', 'Recharts + Framer Motion', 'Charts & Animations'],
        ['Backend', 'Firebase Auth/Firestore', 'Auth & Database'],
        ['Backend', 'Supabase', 'Asset Storage'],
        ['AI', 'Gemini API', 'Content Generation'],
        ['AI', 'Canva SDK', 'Design Automation'],
        ['External', 'Meta Graph API', 'Instagram Analytics'],
    ]

    tech_table = Table(tech_data, colWidths=[3*cm, 5*cm, 6*cm])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 0.5*cm))

    story.append(Paragraph("5.2 Flujos Principales", styles['Heading2_Custom']))

    flows = [
        "<b>Content Creation:</b> User → Studio → Upload/Browse → Edit Canva → Save → Calendar → Schedule → Publish",
        "<b>AI Generation:</b> User → Generator → Select Options → Generate → Review → Edit/Regenerate → Save/Schedule",
        "<b>Analytics:</b> Meta API → Firestore → Dashboard → Visualize → Insights → Recommendations"
    ]
    for flow in flows:
        story.append(Paragraph(flow, styles['Body_Custom']))
        story.append(Spacer(1, 0.2*cm))

    story.append(PageBreak())

    # ===== 6. RECOMENDACIONES =====
    story.append(Paragraph("6. Recomendaciones Ejecutivas", styles['Heading1_Custom']))

    story.append(Paragraph("Acciones Inmediatas (Esta Semana)", styles['Heading2_Custom']))
    immediate = [
        "✅ Implementar error boundaries en todos los panels",
        "✅ Agregar loading skeletons",
        "✅ Mejorar empty states con CTAs claros",
        "✅ Documentar API keys-needed en README"
    ]
    for item in immediate:
        story.append(Paragraph(item, styles['Body_Custom']))

    story.append(Spacer(1, 0.5*cm))

    story.append(Paragraph("Short-term (2 semanas)", styles['Heading2_Custom']))
    shortterm = [
        "🚧 Escribir tests E2E con Playwright",
        "🚧 Optimizar bundle size (1.8MB → <500KB target)",
        "🚧 Implementar Sentry error tracking"
    ]
    for item in shortterm:
        story.append(Paragraph(item, styles['Body_Custom']))

    story.append(Spacer(1, 0.5*cm))

    story.append(Paragraph("Medium-term (1 mes)", styles['Heading2_Custom']))
    mediumterm = [
        "📋 Integrar Meta Content Publishing API",
        "📋 Mejorar drag & drop en Calendar",
        "📋 Fine-tune AI prompts"
    ]
    for item in mediumterm:
        story.append(Paragraph(item, styles['Body_Custom']))

    story.append(Spacer(1, 0.5*cm))

    story.append(Paragraph("Long-term (Quarter)", styles['Heading2_Custom']))
    longterm = [
        "📌 Mobile app MVP",
        "📌 Multi-account support",
        "📌 Team collaboration"
    ]
    for item in longterm:
        story.append(Paragraph(item, styles['Body_Custom']))

    story.append(Spacer(1, 1*cm))

    # Footer
    story.append(Paragraph(
        "_________________________________________________<br/>"
        "Documento generado: 26 Abril 2026 | Versión: 1.0<br/>"
        "Próxima actualización: 26 Mayo 2026<br/>"
        "<b>Autor:</b> Claude Code AI",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, alignment=TA_CENTER, textColor=GRAY)
    ))

    # Build PDF
    doc.build(story)
    print("PDF generated successfully: E:/Niki/nicola-schaefer-hub/DIAGNOSTIC_REPORT.pdf")

if __name__ == "__main__":
    create_pdf()