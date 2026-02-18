#!/usr/bin/env python3
"""
Bee Call Center Game Presentation
Black and Yellow Honeycomb Theme
"""

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.graphics.shapes import Drawing, Polygon, String, Circle
from reportlab.graphics import renderPDF
from PIL import Image as PILImage
import os

# Register fonts
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

# Color scheme - Black and Yellow
BLACK = colors.HexColor('#0A0A0F')
DARK_GRAY = colors.HexColor('#1A1A2E')
GOLD = colors.HexColor('#FFD700')
AMBER = colors.HexColor('#FFA500')
HONEY = colors.HexColor('#F5C518')
WHITE = colors.white

# Page size
PAGE_WIDTH, PAGE_HEIGHT = landscape(A4)

def draw_hexagon_pattern(canvas, doc):
    """Draw honeycomb pattern as background"""
    canvas.saveState()
    
    # Dark background
    canvas.setFillColor(BLACK)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1)
    
    # Honeycomb pattern
    hex_size = 40
    canvas.setStrokeColor(colors.HexColor('#FFD70020'))
    canvas.setLineWidth(0.5)
    
    for row in range(-1, 20):
        for col in range(-1, 25):
            x = col * hex_size * 1.5
            y = row * hex_size * 1.732
            if row % 2 == 1:
                x += hex_size * 0.75
            
            # Draw hexagon outline
            canvas.saveState()
            canvas.translate(x, y)
            path = canvas.beginPath()
            for i in range(6):
                angle = i * 60 - 30
                import math
                px = hex_size * 0.5 * math.cos(math.radians(angle))
                py = hex_size * 0.5 * math.sin(math.radians(angle))
                if i == 0:
                    path.moveTo(px, py)
                else:
                    path.lineTo(px, py)
            path.close()
            canvas.drawPath(path, stroke=1, fill=0)
            canvas.restoreState()
    
    canvas.restoreState()

def create_title_slide(story, styles):
    """Title slide with game name and hero image"""
    story.append(Spacer(1, 30))
    
    # Main title
    title_style = ParagraphStyle(
        name='Title',
        fontName='Microsoft YaHei',
        fontSize=56,
        leading=70,
        alignment=TA_CENTER,
        textColor=GOLD,
    )
    
    story.append(Paragraph('<b>🐝 ПЧЕЛИНЫЙ КОЛЛ-ЦЕНТР</b>', title_style))
    story.append(Spacer(1, 10))
    
    # Subtitle
    subtitle_style = ParagraphStyle(
        name='Subtitle',
        fontName='Microsoft YaHei',
        fontSize=28,
        leading=36,
        alignment=TA_CENTER,
        textColor=AMBER,
    )
    story.append(Paragraph('Bee Call Center', subtitle_style))
    story.append(Spacer(1, 30))
    
    # Hero image
    img_path = '/home/z/my-project/download/hive_background.png'
    if os.path.exists(img_path):
        pil_img = PILImage.open(img_path)
        orig_w, orig_h = pil_img.size
        target_width = 600
        scale = target_width / orig_w
        img = Image(img_path, width=target_width, height=orig_h * scale)
        story.append(img)
    
    story.append(Spacer(1, 20))
    
    # Tagline
    tagline_style = ParagraphStyle(
        name='Tagline',
        fontName='Microsoft YaHei',
        fontSize=20,
        leading=28,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    story.append(Paragraph('Мобильная игра в стиле Apple Arcade', tagline_style))
    story.append(Paragraph('Танцуй вместо разговоров! 💃', tagline_style))

def create_concept_slide(story, styles):
    """Game concept slide"""
    # Slide title
    slide_title = ParagraphStyle(
        name='SlideTitle',
        fontName='Microsoft YaHei',
        fontSize=36,
        leading=44,
        alignment=TA_CENTER,
        textColor=GOLD,
    )
    story.append(Spacer(1, 20))
    story.append(Paragraph('<b>🎯 КОНЦЕПЦИЯ ИГРЫ</b>', slide_title))
    story.append(Spacer(1, 30))
    
    # Two-column layout
    left_style = ParagraphStyle(
        name='LeftText',
        fontName='Microsoft YaHei',
        fontSize=16,
        leading=24,
        alignment=TA_LEFT,
        textColor=WHITE,
    )
    
    # Left content
    left_content = [
        Paragraph('<b><font color="#FFD700">📍 Окружение:</font></b>', left_style),
        Paragraph('Улей-колл-центр, где пчёлы общаются танцами', left_style),
        Spacer(1, 15),
        Paragraph('<b><font color="#FFD700">👥 Клиенты:</font></b>', left_style),
        Paragraph('🌻 Пчёлы соседних полянок', left_style),
        Paragraph('🌲 Пчёлы соседнего леса', left_style),
        Paragraph('🏡 Пчёлы соседних ульев', left_style),
        Spacer(1, 15),
        Paragraph('<b><font color="#FFD700">⚠️ Враги:</font></b>', left_style),
        Paragraph('🦅 Шершни из дубовой рощи', left_style),
        Paragraph('Похищают пчёл-операторов!', left_style),
    ]
    
    # Right content - image
    img_path = '/home/z/my-project/download/bee_operator.png'
    right_content = []
    if os.path.exists(img_path):
        pil_img = PILImage.open(img_path)
        orig_w, orig_h = pil_img.size
        target_width = 280
        scale = target_width / orig_w
        img = Image(img_path, width=target_width, height=orig_h * scale)
        right_content = [[img]]
    
    # Create table for layout
    table_data = [[left_content, right_content[0] if right_content else ['']]]
    table = Table(table_data, colWidths=[400, 320])
    table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(table)

def create_mechanics_slide(story, styles):
    """Game mechanics slide"""
    slide_title = ParagraphStyle(
        name='SlideTitle',
        fontName='Microsoft YaHei',
        fontSize=36,
        leading=44,
        alignment=TA_CENTER,
        textColor=GOLD,
    )
    story.append(Spacer(1, 20))
    story.append(Paragraph('<b>🎮 МЕХАНИКА ИГРЫ</b>', slide_title))
    story.append(Spacer(1, 30))
    
    # Buttons info
    button_style = ParagraphStyle(
        name='ButtonText',
        fontName='Microsoft YaHei',
        fontSize=18,
        leading=26,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    
    # Two main buttons
    btn_data = [
        [
            Paragraph('<b><font color="#8B5CF6">🐝 НАНЯТЬ</font></b><br/><br/>Тратит 1⭐ баланса<br/>Добавляет пчелу-оператора<br/>Максимум: 12 пчёл', button_style),
            Paragraph('<b><font color="#FFD700">📞 ОТВЕТИТЬ</font></b><br/><br/>Принимает входящий танец<br/>Приносит +1⭐ баланса<br/>Освобождает пойманных пчёл', button_style),
        ]
    ]
    
    btn_table = Table(btn_data, colWidths=[350, 350])
    btn_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#1A1A2E')),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#1A1A2E')),
        ('BOX', (0, 0), (0, 0), 2, colors.HexColor('#8B5CF6')),
        ('BOX', (1, 0), (1, 0), 2, GOLD),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 20),
        ('RIGHTPADDING', (0, 0), (-1, -1), 20),
        ('TOPPADDING', (0, 0), (-1, -1), 30),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 30),
    ]))
    story.append(btn_table)
    story.append(Spacer(1, 30))
    
    # Game flow
    flow_style = ParagraphStyle(
        name='FlowText',
        fontName='Microsoft YaHei',
        fontSize=16,
        leading=24,
        alignment=TA_CENTER,
        textColor=AMBER,
    )
    story.append(Paragraph('⏱️ Каждые 2 секунды: новые клиенты → случайные атаки шершней', flow_style))

def create_hornet_slide(story, styles):
    """Hornet enemy slide"""
    slide_title = ParagraphStyle(
        name='SlideTitle',
        fontName='Microsoft YaHei',
        fontSize=36,
        leading=44,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#EF4444'),
    )
    story.append(Spacer(1, 20))
    story.append(Paragraph('<b>⚠️ ШЕРШНИ ИЗ ДУБОВОЙ РОЩИ</b>', slide_title))
    story.append(Spacer(1, 30))
    
    content_style = ParagraphStyle(
        name='ContentText',
        fontName='Microsoft YaHei',
        fontSize=18,
        leading=28,
        alignment=TA_LEFT,
        textColor=WHITE,
    )
    
    left_content = [
        Paragraph('<b><font color="#EF4444">🦅 Атака шершней:</font></b>', content_style),
        Spacer(1, 10),
        Paragraph('• 20% шанс каждые 2 секунды', content_style),
        Paragraph('• Длительность: 8 секунд', content_style),
        Paragraph('• Похищают 1-2 пчёл-операторов', content_style),
        Spacer(1, 15),
        Paragraph('<b><font color="#EF4444">⚡ Эффекты:</font></b>', content_style),
        Spacer(1, 10),
        Paragraph('• Пойманные пчёлы не работают', content_style),
        Paragraph('• 40% шанс потерять половину дохода', content_style),
        Paragraph('• 30% шанс спасти пчелу при ответе', content_style),
    ]
    
    # Hornet image
    img_path = '/home/z/my-project/download/hornet_villain.png'
    right_content = []
    if os.path.exists(img_path):
        pil_img = PILImage.open(img_path)
        orig_w, orig_h = pil_img.size
        target_width = 280
        scale = target_width / orig_w
        img = Image(img_path, width=target_width, height=orig_h * scale)
        right_content = [[img]]
    
    table_data = [[left_content, right_content[0] if right_content else ['']]]
    table = Table(table_data, colWidths=[420, 300])
    table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(table)

def create_achievement_slide(story, styles):
    """Achievement slide"""
    slide_title = ParagraphStyle(
        name='SlideTitle',
        fontName='Microsoft YaHei',
        fontSize=36,
        leading=44,
        alignment=TA_CENTER,
        textColor=GOLD,
    )
    story.append(Spacer(1, 20))
    story.append(Paragraph('<b>🏆 ДОСТИЖЕНИЕ</b>', slide_title))
    story.append(Spacer(1, 30))
    
    # Achievement description
    achievement_style = ParagraphStyle(
        name='AchieveText',
        fontName='Microsoft YaHei',
        fontSize=24,
        leading=36,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    
    story.append(Paragraph('Стать самым сбалансированным ульем-коллцентром!', achievement_style))
    story.append(Spacer(1, 30))
    
    # Achievement image
    img_path = '/home/z/my-project/download/achievement_trophy.png'
    if os.path.exists(img_path):
        pil_img = PILImage.open(img_path)
        orig_w, orig_h = pil_img.size
        target_width = 200
        scale = target_width / orig_w
        img = Image(img_path, width=target_width, height=orig_h * scale)
        story.append(img)
    
    story.append(Spacer(1, 30))
    
    # Goal
    goal_style = ParagraphStyle(
        name='GoalText',
        fontName='Microsoft YaHei',
        fontSize=28,
        leading=40,
        alignment=TA_CENTER,
        textColor=AMBER,
    )
    story.append(Paragraph('<b>⚖️ БАЛАНС = ОПЕРАТОРЫ</b>', goal_style))
    story.append(Spacer(1, 15))
    story.append(Paragraph('Когда количество пчёл равно балансу очков', achievement_style))

def create_features_slide(story, styles):
    """Features slide"""
    slide_title = ParagraphStyle(
        name='SlideTitle',
        fontName='Microsoft YaHei',
        fontSize=36,
        leading=44,
        alignment=TA_CENTER,
        textColor=GOLD,
    )
    story.append(Spacer(1, 20))
    story.append(Paragraph('<b>✨ ОСОБЕННОСТИ</b>', slide_title))
    story.append(Spacer(1, 30))
    
    feature_style = ParagraphStyle(
        name='FeatureText',
        fontName='Microsoft YaHei',
        fontSize=16,
        leading=26,
        alignment=TA_LEFT,
        textColor=WHITE,
    )
    
    features_left = [
        Paragraph('<b><font color="#FFD700">🎨 Дизайн Apple Arcade</font></b>', feature_style),
        Paragraph('• Тёмная тема с градиентами', feature_style),
        Paragraph('• Glassmorphism эффекты', feature_style),
        Paragraph('• Медово-золотые акценты', feature_style),
        Spacer(1, 15),
        Paragraph('<b><font color="#FFD700">📱 Mobile-First</font></b>', feature_style),
        Paragraph('• Оптимизация для iPhone 12 mini', feature_style),
        Paragraph('• Большие touch-friendly кнопки', feature_style),
        Paragraph('• Поддержка safe-area-inset', feature_style),
    ]
    
    features_right = [
        Paragraph('<b><font color="#FFD700">🎭 Анимации</font></b>', feature_style),
        Paragraph('• Плавающие пчёлы', feature_style),
        Paragraph('• Тряска захваченных', feature_style),
        Paragraph('• Пульсация предупреждений', feature_style),
        Spacer(1, 15),
        Paragraph('<b><font color="#FFD700">🛠️ Технологии</font></b>', feature_style),
        Paragraph('• Next.js 15 + React 19', feature_style),
        Paragraph('• TypeScript', feature_style),
        Paragraph('• CSS-in-JS анимации', feature_style),
    ]
    
    table_data = [[features_left, features_right]]
    table = Table(table_data, colWidths=[350, 350])
    table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(table)

def create_tech_slide(story, styles):
    """Tech stack slide"""
    slide_title = ParagraphStyle(
        name='SlideTitle',
        fontName='Microsoft YaHei',
        fontSize=36,
        leading=44,
        alignment=TA_CENTER,
        textColor=GOLD,
    )
    story.append(Spacer(1, 20))
    story.append(Paragraph('<b>🛠️ ТЕХНОЛОГИИ</b>', slide_title))
    story.append(Spacer(1, 30))
    
    tech_style = ParagraphStyle(
        name='TechText',
        fontName='Microsoft YaHei',
        fontSize=18,
        leading=28,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    
    # Tech stack table
    tech_data = [
        [Paragraph('<b>Frontend</b>', tech_style), Paragraph('<b>Backend</b>', tech_style), Paragraph('<b>Стилизация</b>', tech_style)],
        [Paragraph('React 19', tech_style), Paragraph('Next.js 15', tech_style), Paragraph('CSS-in-JS', tech_style)],
        [Paragraph('TypeScript', tech_style), Paragraph('App Router', tech_style), Paragraph('Glassmorphism', tech_style)],
        [Paragraph('Hooks', tech_style), Paragraph('SSR/SSG', tech_style), Paragraph('Animations', tech_style)],
    ]
    
    tech_table = Table(tech_data, colWidths=[230, 230, 230])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2A2A3E')),
        ('TEXTCOLOR', (0, 0), (-1, 0), GOLD),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#1A1A2E')),
        ('BOX', (0, 0), (-1, -1), 1, GOLD),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#FFD70040')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 15),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 30))
    
    # Bee dance image
    img_path = '/home/z/my-project/download/bee_dance.png'
    if os.path.exists(img_path):
        pil_img = PILImage.open(img_path)
        orig_w, orig_h = pil_img.size
        target_width = 200
        scale = target_width / orig_w
        img = Image(img_path, width=target_width, height=orig_h * scale)
        story.append(img)

def create_final_slide(story, styles):
    """Final slide with call to action"""
    story.append(Spacer(1, 60))
    
    title_style = ParagraphStyle(
        name='FinalTitle',
        fontName='Microsoft YaHei',
        fontSize=48,
        leading=60,
        alignment=TA_CENTER,
        textColor=GOLD,
    )
    story.append(Paragraph('<b>🐝 ИГРАЙТЕ СЕЙЧАС!</b>', title_style))
    story.append(Spacer(1, 30))
    
    sub_style = ParagraphStyle(
        name='FinalSub',
        fontName='Microsoft YaHei',
        fontSize=24,
        leading=36,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    story.append(Paragraph('localhost:3000', sub_style))
    story.append(Spacer(1, 40))
    
    tagline_style = ParagraphStyle(
        name='Tagline',
        fontName='Microsoft YaHei',
        fontSize=20,
        leading=30,
        alignment=TA_CENTER,
        textColor=AMBER,
    )
    story.append(Paragraph('Создано с ❤️ и 🐝', tagline_style))

def main():
    output_path = '/home/z/my-project/download/bee_call_center_presentation.pdf'
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=landscape(A4),
        leftMargin=30,
        rightMargin=30,
        topMargin=30,
        bottomMargin=30,
    )
    
    styles = getSampleStyleSheet()
    story = []
    
    # Slide 1: Title
    create_title_slide(story, styles)
    story.append(PageBreak())
    
    # Slide 2: Concept
    create_concept_slide(story, styles)
    story.append(PageBreak())
    
    # Slide 3: Mechanics
    create_mechanics_slide(story, styles)
    story.append(PageBreak())
    
    # Slide 4: Hornet Enemy
    create_hornet_slide(story, styles)
    story.append(PageBreak())
    
    # Slide 5: Achievement
    create_achievement_slide(story, styles)
    story.append(PageBreak())
    
    # Slide 6: Features
    create_features_slide(story, styles)
    story.append(PageBreak())
    
    # Slide 7: Tech Stack
    create_tech_slide(story, styles)
    story.append(PageBreak())
    
    # Slide 8: Final
    create_final_slide(story, styles)
    
    # Build PDF with honeycomb background
    doc.build(story, onFirstPage=draw_hexagon_pattern, onLaterPages=draw_hexagon_pattern)
    
    print(f"✅ Presentation created: {output_path}")

if __name__ == '__main__':
    main()
