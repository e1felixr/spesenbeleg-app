"""Einmal-Skript: erzeugt einfache E1-gruene Platzhalter-Icons (Beleg + Kamera).
Nicht Teil der PWA-Laufzeit - kann nach Erzeugung geloescht werden.
"""
from PIL import Image, ImageDraw

E1_GREEN = (102, 179, 47)       # #66b32f
E1_DARK = (58, 109, 27)         # #3a6d1b
WHITE = (255, 255, 255)
GREY = (200, 210, 195)


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), E1_GREEN)
    d = ImageDraw.Draw(img)

    # Beleg (weisses Papier mit gezacktem unteren Rand)
    pad = size * 0.20
    receipt_w = size * 0.46
    receipt_h = size * 0.62
    rx0 = size * 0.30
    ry0 = pad
    rx1 = rx0 + receipt_w
    ry1 = ry0 + receipt_h * 0.86

    d.rounded_rectangle([rx0, ry0, rx1, ry1], radius=size * 0.03, fill=WHITE)

    # Zickzack-Unterkante des Belegs
    zig_n = 7
    zig_h = size * 0.035
    step = receipt_w / zig_n
    pts = [(rx0, ry1)]
    for i in range(zig_n):
        x_mid = rx0 + step * (i + 0.5)
        x_end = rx0 + step * (i + 1)
        pts.append((x_mid, ry1 + zig_h))
        pts.append((x_end, ry1))
    pts.append((rx1, ry1))
    pts.append((rx0, ry1))
    d.polygon(pts, fill=WHITE)

    # Textzeilen auf dem Beleg
    line_x0 = rx0 + receipt_w * 0.16
    line_x1 = rx1 - receipt_w * 0.16
    n_lines = 5
    for i in range(n_lines):
        ly = ry0 + receipt_h * (0.16 + i * 0.11)
        lw = size * 0.012
        x1 = line_x1 if i % 2 == 0 else line_x0 + (line_x1 - line_x0) * 0.6
        d.line([(line_x0, ly), (x1, ly)], fill=GREY, width=max(1, int(lw)))

    # Kamera-Badge unten rechts (symbolisiert: Beleg fotografieren)
    cam_r = size * 0.24
    cam_cx = size * 0.72
    cam_cy = size * 0.76
    d.ellipse(
        [cam_cx - cam_r, cam_cy - cam_r, cam_cx + cam_r, cam_cy + cam_r],
        fill=E1_DARK,
        outline=WHITE,
        width=max(2, int(size * 0.012)),
    )
    lens_r = cam_r * 0.5
    d.ellipse(
        [cam_cx - lens_r, cam_cy - lens_r, cam_cx + lens_r, cam_cy + lens_r],
        fill=WHITE,
    )
    lens_r2 = cam_r * 0.28
    d.ellipse(
        [cam_cx - lens_r2, cam_cy - lens_r2, cam_cx + lens_r2, cam_cy + lens_r2],
        fill=E1_GREEN,
    )

    return img


if __name__ == "__main__":
    import os
    base = os.path.dirname(os.path.abspath(__file__))
    for size in (192, 512):
        img = draw_icon(size)
        out = os.path.join(base, "icons", f"icon-{size}.png")
        img.save(out, "PNG")
        print("geschrieben:", out)
