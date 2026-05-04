"""
strip_black_bg.py
=================
Convierte PNGs RGB sin alpha en PNGs RGBA con el fondo negro removido.

Estrategia: flood fill desde las 4 esquinas. Cualquier pixel near-black
conectado al borde se vuelve transparente. Las áreas oscuras dentro del
cat (rayas marrones, sombras) NO se tocan porque no están conectadas al
fondo desde el exterior.

Threshold de "near-black": luminance < BLACK_THRESHOLD (default 18).
Anti-aliasing edge softening: si un pixel está a 1-2 px del borde
descubierto y su luminance < SOFT_THRESHOLD, reduce alpha proporcionalmente
para que el contorno no quede serrucho.
"""
import sys
from collections import deque
from PIL import Image

BLACK_THRESHOLD = 18      # luma <= este valor → fondo (alpha 0)
SOFT_THRESHOLD = 45       # luma entre BLACK y SOFT → alpha reducido
SOFT_RADIUS = 2           # px alrededor del borde donde aplicar soft

def luma(px):
    r, g, b = px[0], px[1], px[2]
    # Rec. 709 luma approximation
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def strip(in_path: str, out_path: str) -> None:
    img = Image.open(in_path).convert('RGBA')
    w, h = img.size
    pixels = img.load()

    # Marcamos cada pixel del fondo conectado a un borde como transparente.
    # Empezamos en las 4 esquinas y avanzamos en BFS.
    seen = bytearray(w * h)  # 0 = no visto, 1 = visto/marcado como bg
    q = deque()
    for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
                 (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        if luma(pixels[x, y]) <= BLACK_THRESHOLD:
            q.append((x, y))
            seen[y * w + x] = 1

    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                idx = ny * w + nx
                if seen[idx] == 0:
                    p = pixels[nx, ny]
                    if luma(p) <= BLACK_THRESHOLD:
                        seen[idx] = 1
                        q.append((nx, ny))

    # Aplicamos transparencia: pixels marcados → alpha 0.
    # Edges: para los pixels NO marcados pero adyacentes a uno marcado y
    # con luma < SOFT_THRESHOLD, reducimos alpha proporcional.
    for y in range(h):
        for x in range(w):
            if seen[y * w + x]:
                pixels[x, y] = (0, 0, 0, 0)

    # Soft edges — segunda pasada para los bordes.
    for y in range(h):
        for x in range(w):
            if seen[y * w + x]:
                continue
            # ¿Hay un pixel marcado en SOFT_RADIUS?
            adj_marked = False
            for dy in range(-SOFT_RADIUS, SOFT_RADIUS + 1):
                for dx in range(-SOFT_RADIUS, SOFT_RADIUS + 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and seen[ny * w + nx]:
                        adj_marked = True
                        break
                if adj_marked:
                    break
            if not adj_marked:
                continue
            p = pixels[x, y]
            l = luma(p)
            if l < SOFT_THRESHOLD:
                # Mapeo lineal: BLACK → alpha 0, SOFT → alpha 255
                alpha = int(255 * (l - BLACK_THRESHOLD) / max(1, SOFT_THRESHOLD - BLACK_THRESHOLD))
                alpha = max(0, min(255, alpha))
                pixels[x, y] = (p[0], p[1], p[2], alpha)

    img.save(out_path, 'PNG', optimize=True)
    print(f'OK {in_path} -> {out_path}')

if __name__ == '__main__':
    files = sys.argv[1:]
    for f in files:
        strip(f, f)  # in-place
