"""
build_og_image.py
=================
Genera la imagen Open Graph 1200×630 que aparece como preview cuando se
comparte el link de ADE en WhatsApp, Slack, X, LinkedIn, iMessage, etc.

Composición:
  - Fondo cream #FBF1D8 con halo dorado central (gradiente radial)
  - Sparkle dots ambientales
  - Cat (idle) full-body a la derecha
  - "PROJECT ADE" pill arriba a la izquierda
  - "ADE" título gigante
  - Pill naranja "EL GATO QUE CAZA IDEAS"
  - Tagline "Conecta palabras. Descubre ideas. Juega 30 segundos."

Output: public/og-image.png
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ─── Configuración ───────────────────────────────────────────────────
WIDTH, HEIGHT = 1200, 630
BG = (251, 241, 216)          # #FBF1D8 ade-beige
DARK = (26, 35, 50)           # #1A2332 ade-dark
GOLD = (255, 214, 0)          # #FFD600 ade-gold
ACCENT = (255, 112, 67)       # #FF7043 ade-accent

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAT_PATH = os.path.join(PROJECT_ROOT, 'public', 'assets', 'ade', 'character', 'ade-idle.png')
OUT_PATH = os.path.join(PROJECT_ROOT, 'public', 'og-image.png')

# ─── Helpers ─────────────────────────────────────────────────────────
def font(size: int, bold: bool = True):
    """Carga una fuente del sistema. Windows: arialbd.ttf / arial.ttf."""
    candidates_bold = ['arialbd.ttf', 'segoeuib.ttf', 'tahomabd.ttf']
    candidates_reg  = ['arial.ttf', 'segoeui.ttf', 'tahoma.ttf']
    names = candidates_bold if bold else candidates_reg
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    # Fallback: default
    return ImageFont.load_default()

def radial_gradient(size, center, inner_color, outer_color, radius):
    """Crea un gradiente radial circular."""
    w, h = size
    cx, cy = center
    layer = Image.new('RGBA', size, outer_color)
    px = layer.load()
    inner = inner_color
    outer = outer_color
    r2 = radius * radius
    for y in range(h):
        for x in range(w):
            dx = x - cx
            dy = y - cy
            d2 = dx * dx + dy * dy
            t = min(1.0, d2 / r2)
            t = t ** 0.6  # easing — más glow concentrado al centro
            r = int(inner[0] * (1 - t) + outer[0] * t)
            g = int(inner[1] * (1 - t) + outer[1] * t)
            b = int(inner[2] * (1 - t) + outer[2] * t)
            a = int(inner[3] * (1 - t) + outer[3] * t)
            px[x, y] = (r, g, b, a)
    return layer

def draw_text_centered(draw, xy, text, fnt, fill):
    """Dibuja texto con anchor center."""
    draw.text(xy, text, font=fnt, fill=fill, anchor='mm')

def draw_pill(draw, xy, text, fnt, padding=(20, 10), bg=None, border=None,
              text_color=DARK):
    """Dibuja un pill rounded con texto centrado."""
    bbox = draw.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x, y = xy
    px, py = padding
    rect = (x - tw / 2 - px, y - th / 2 - py, x + tw / 2 + px, y + th / 2 + py)
    radius = (rect[3] - rect[1]) / 2
    if bg:
        draw.rounded_rectangle(rect, radius=radius, fill=bg)
    if border:
        draw.rounded_rectangle(rect, radius=radius, outline=border, width=2)
    draw.text((x, y - 2), text, font=fnt, fill=text_color, anchor='mm')

# ─── Build ───────────────────────────────────────────────────────────
def build():
    # Base cream
    img = Image.new('RGBA', (WIDTH, HEIGHT), BG + (255,))

    # Halo dorado radial — centrado a la derecha donde irá el cat
    halo_center = (WIDTH * 0.72, HEIGHT * 0.50)
    halo = radial_gradient(
        (WIDTH, HEIGHT),
        halo_center,
        (255, 214, 0, 90),    # dorado tenue al centro
        (251, 241, 216, 0),   # transparente afuera
        radius=420,
    )
    img = Image.alpha_composite(img, halo)

    draw = ImageDraw.Draw(img)

    # Sparkle dots — patrón sutil
    sparkles = [(120, 90, 6), (190, 220, 4), (90, 350, 5), (160, 480, 4),
                (1080, 100, 5), (1140, 280, 4), (1050, 500, 6)]
    for x, y, r in sparkles:
        for ring, alpha in [(r * 3, 35), (r * 2, 70), (r, 200)]:
            draw.ellipse(
                (x - ring, y - ring, x + ring, y + ring),
                fill=(245, 196, 0, alpha),
            )

    # ─── Cat a la derecha ────────────────────────────────────────────
    if os.path.exists(CAT_PATH):
        cat = Image.open(CAT_PATH).convert('RGBA')
        # Escalar el cat para que ocupe ~470px de alto, manteniendo ratio
        cat_h = 480
        cat_w = int(cat.width * cat_h / cat.height)
        cat = cat.resize((cat_w, cat_h), Image.LANCZOS)
        # Posicionar a la derecha, alineado al fondo
        cat_x = WIDTH - cat_w - 60
        cat_y = HEIGHT - cat_h - 30
        # Sombra suave debajo del cat
        shadow = Image.new('RGBA', (cat_w, 30), (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(shadow)
        sdraw.ellipse((cat_w * 0.15, 5, cat_w * 0.85, 25), fill=(26, 35, 50, 80))
        shadow = shadow.filter(ImageFilter.GaussianBlur(8))
        img.paste(shadow, (cat_x, HEIGHT - 60), shadow)
        img.paste(cat, (cat_x, cat_y), cat)

    # ─── Texto a la izquierda ────────────────────────────────────────
    LEFT_X = 80

    # PROJECT ADE label — pequeño tracking ancho
    f_label = font(20, bold=True)
    label = 'P R O J E C T   A D E'
    draw.text((LEFT_X, 90), label, font=f_label, fill=(26, 35, 50, 130))

    # ADE título gigante
    f_title = font(220, bold=True)
    title_bbox = draw.textbbox((LEFT_X, 110), 'ADE', font=f_title)
    # Dibujamos el título con sombra dorada sutil + texto principal
    # Halo dorado debajo del título
    halo_title = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(halo_title)
    hdraw.text((LEFT_X, 110), 'ADE', font=f_title, fill=(255, 214, 0, 100))
    halo_title = halo_title.filter(ImageFilter.GaussianBlur(10))
    img = Image.alpha_composite(img, halo_title)
    draw = ImageDraw.Draw(img)
    draw.text((LEFT_X, 110), 'ADE', font=f_title, fill=DARK)

    # Pill "EL GATO QUE CAZA IDEAS"
    f_pill = font(22, bold=True)
    pill_y = title_bbox[3] + 50
    draw_pill(
        draw,
        (LEFT_X + 200, pill_y),
        'EL GATO QUE CAZA IDEAS',
        f_pill,
        padding=(28, 14),
        bg=(255, 240, 230, 200),
        border=(255, 112, 67, 80),
        text_color=ACCENT,
    )

    # Tagline
    f_tagline = font(32, bold=False)
    draw.text(
        (LEFT_X, pill_y + 70),
        'Conecta palabras.\nDescubre ideas. Juega 30 segundos.',
        font=f_tagline,
        fill=(26, 35, 50, 200),
    )

    # ─── Output ──────────────────────────────────────────────────────
    img.convert('RGB').save(OUT_PATH, 'PNG', optimize=True)
    print(f'OK -> {OUT_PATH}  ({os.path.getsize(OUT_PATH):,} bytes)')

if __name__ == '__main__':
    build()
