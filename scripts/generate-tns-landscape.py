#!/usr/bin/env python3
"""Generate the bundled "Touch'N'Stars" atlas landscape.

Produces the twelve order-0 HiPS tiles (plus the Allsky preview) that the
Celestia Atlas landscape renderer expects, without any Stellarium tooling.
The scenery is drawn procedurally: a moonlit meadow with layered rolling
hills, a hazy distant range and tree lines, all kept low so the sky stays
free. Everything is first painted into an equirectangular panorama, which is
then resampled into the HEALPix tiles.

The tile layout is the exact inverse of `horizontalToHealpixPixel()` in
node_modules/@acocalypso/celestia-atlas/src/core/landscape.js, so a change
to that convention has to be mirrored here.

Usage:
    python3 scripts/generate-tns-landscape.py

Requires Pillow with WebP support. Output goes to
public/celestia-atlas-data/landscapes/touchnstars/.
"""

import math
import os
import sys

import random

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'public', 'celestia-atlas-data', 'landscapes', 'touchnstars')

TILE_WIDTH = 512
ALLSKY_TILE = 64
SUPERSAMPLE = 2  # samples per axis per tile pixel

def tile_pixel_to_horizontal(face, px, py):
    """Inverse of the engine's horizontalToHealpixPixel().

    `px`/`py` are continuous tile coordinates (pixel centre = index + 0.5).
    Returns (azimuth_deg, altitude_deg).
    """
    w = TILE_WIDTH
    if face < 4 and px + py >= w:
        # North polar cap
        asc = w - px
        desc = w - py
        radius = asc + desc
        z = 1.0 - radius * radius / (3.0 * w * w)
        tt = face + asc / radius
    elif face >= 8 and px + py < w:
        # South polar cap
        asc = py
        desc = px
        radius = asc + desc
        z = -(1.0 - radius * radius / (3.0 * w * w))
        tt = (face - 8) + asc / radius
    else:
        # Equatorial band
        if face < 4:
            asc_face, desc_face = face, face + 1
        elif face < 8:
            asc_face = desc_face = face - 4
        else:
            desc_face = face - 8
            asc_face = desc_face + 1
        asc = asc_face * w + (w - px)
        desc = desc_face * w + py
        tt = (asc + desc) / (2.0 * w) - 0.5
        z = (desc - asc) / (1.5 * w)
    z = max(-1.0, min(1.0, z))
    azimuth = (-tt * 90.0) % 360.0
    altitude = math.degrees(math.asin(z))
    return azimuth, altitude


def horizontal_to_tile_pixel(azimuth_deg, altitude_deg):
    """Straight port of the engine's forward mapping, used for self-checks."""
    w = TILE_WIDTH
    z = math.sin(math.radians(max(-90.0, min(90.0, altitude_deg))))
    za = abs(z)
    tt = ((-azimuth_deg) % 360.0) / 90.0
    if za <= 2.0 / 3.0:
        temp1 = w * (0.5 + tt)
        temp2 = w * z * 0.75
        ascending = math.floor(temp1 - temp2)
        descending = math.floor(temp1 + temp2)
        asc_face = ascending // w
        desc_face = descending // w
        if asc_face == desc_face:
            face = (asc_face & 3) + 4
        elif asc_face < desc_face:
            face = asc_face & 3
        else:
            face = (desc_face & 3) + 8
        ix = descending & (w - 1)
        iy = w - (ascending & (w - 1)) - 1
    else:
        quadrant = min(3, math.floor(tt))
        within = tt - quadrant
        radius = w * math.sqrt(3.0 * (1.0 - za))
        ascending = min(w - 1, math.floor(within * radius))
        descending = min(w - 1, math.floor((1.0 - within) * radius))
        if z >= 0:
            face = quadrant
            ix = w - descending - 1
            iy = w - ascending - 1
        else:
            face = quadrant + 8
            ix = ascending
            iy = descending
    return face, iy, ix


def self_check():
    """Round-trip a grid of directions through both mappings."""
    worst = 0.0
    for alt10 in range(-895, 896, 7):
        alt = alt10 / 10.0
        for az in range(0, 360, 3):
            face, x, y = horizontal_to_tile_pixel(az, alt)
            az2, alt2 = tile_pixel_to_horizontal(face, x + 0.5, y + 0.5)
            d_az = abs((az2 - az + 180.0) % 360.0 - 180.0) * math.cos(math.radians(alt))
            err = math.hypot(d_az, alt2 - alt)
            worst = max(worst, err)
    if worst > 0.4:
        raise SystemExit(f'Tile mapping round-trip error too large: {worst:.3f} deg')
    print(f'mapping self-check ok (worst round-trip error {worst:.3f} deg)')



# --- Scene -----------------------------------------------------------------------
# The panorama covers azimuth 0-360 deg (x) and altitude PANO_TOP..-90 deg (y).
# Nothing reaches higher than ~4 deg above the horizon so the sky stays free.
PANO_PX_PER_DEG = 20
PANO_TOP_DEG = 12.0
PANO_WIDTH = 360 * PANO_PX_PER_DEG
PANO_HEIGHT = int((PANO_TOP_DEG + 90.0) * PANO_PX_PER_DEG)
SAMPLE_DOWNSCALE = 2  # panorama is drawn oversized and shrunk for antialiasing

SKY = (0, 0, 0, 0)
GROUND_TOP = (12, 15, 18)
GROUND_NADIR = (6, 8, 10)
MIST = (34, 40, 52)

# Hill layers from far to near: (crest colour, base colour, base height, amplitude,
# seed, blur radius in px). Farther layers are lighter and softer (aerial
# perspective), nearer ones darker and crisper.
HILL_LAYERS = [
    ((26, 31, 42), (17, 21, 28), 1.6, 3.2, 11, 1.5),
    ((18, 22, 30), (13, 16, 21), 0.6, 1.8, 23, 1.0),
    ((14, 17, 22), (11, 13, 17), 0.2, 1.2, 37, 0.6),
    ((12, 15, 18), (10, 12, 15), -0.4, 0.9, 41, 0.4),
]
TREE_FAR = (14, 18, 24)
TREE_NEAR = (8, 11, 14)


def lerp(a, b, t):
    return a + (b - a) * t


def lerp_color(c0, c1, t):
    return tuple(int(round(lerp(c0[i], c1[i], t))) for i in range(3))


def pano_x(azimuth_deg):
    return azimuth_deg * PANO_PX_PER_DEG


def pano_y(altitude_deg):
    return (PANO_TOP_DEG - altitude_deg) * PANO_PX_PER_DEG


def ridge_profile(amplitude, base, seed, octaves=5, jagged=False):
    """Periodic (in azimuth) ridge line built from a few sine waves.

    `jagged` adds higher frequencies with |sin| terms for mountain-like peaks.
    """
    rng = random.Random(seed)
    waves = [
        (rng.randint(1, 3) * (i + 1), rng.uniform(0, 2 * math.pi), rng.uniform(0.4, 1.0))
        for i in range(octaves)
    ]
    if jagged:
        waves += [
            (rng.randint(14, 26), rng.uniform(0, 2 * math.pi), rng.uniform(0.25, 0.5))
            for _ in range(3)
        ]
    norm = sum(w[2] for w in waves)

    def height(azimuth_deg):
        a = math.radians(azimuth_deg)
        value = 0.0
        for freq, phase, weight in waves:
            term = math.sin(freq * a + phase)
            if jagged and freq >= 14:
                term = 2.0 * abs(term) - 1.0
            value += weight * term
        return base + amplitude * (0.5 + 0.5 * value / norm)

    return height


def ridge_mask(height_fn, step_deg=0.2):
    mask = Image.new('L', (PANO_WIDTH, PANO_HEIGHT), 0)
    draw = ImageDraw.Draw(mask)
    points = []
    az = 0.0
    while az <= 360.0:
        points.append((pano_x(az), pano_y(height_fn(az))))
        az += step_deg
    points.append((PANO_WIDTH, PANO_HEIGHT))
    points.append((0, PANO_HEIGHT))
    draw.polygon(points, fill=255)
    return mask


def vertical_gradient(color_top, color_bottom, alt_top, alt_bottom):
    """Full-size RGBA image blending between two colours over an altitude span."""
    image = Image.new('RGBA', (PANO_WIDTH, PANO_HEIGHT), color_bottom + (255,))
    draw = ImageDraw.Draw(image)
    y0, y1 = int(pano_y(alt_top)), int(pano_y(alt_bottom))
    for y in range(0, y1):
        t = 0.0 if y <= y0 else (y - y0) / max(1, y1 - y0)
        draw.line([(0, y), (PANO_WIDTH, y)], fill=lerp_color(color_top, color_bottom, t) + (255,))
    return image


def composite_masked(pano, mask, layer, blur=0.0):
    if blur > 0:
        mask = mask.filter(ImageFilter.GaussianBlur(blur))
    layer = layer.copy()
    layer.putalpha(mask)
    pano.alpha_composite(layer)


def draw_conifer(draw, az, base_alt, height, rng):
    """Slightly irregular conifer silhouette; sizes in degrees."""
    x = pano_x(az)
    y0 = pano_y(base_alt)
    half_w = height * 0.28 * PANO_PX_PER_DEG
    top = y0 - height * PANO_PX_PER_DEG
    left, right = [], []
    steps = 9
    for i in range(steps + 1):
        f = i / steps
        y = top + (y0 - top) * f
        w = half_w * (0.08 + 0.92 * f) * rng.uniform(0.8, 1.15)
        left.append((x - w, y))
        right.append((x + w, y))
    draw.polygon(left + right[::-1], fill=255)
    trunk = height * 0.04 * PANO_PX_PER_DEG
    draw.rectangle([x - trunk, y0 - height * 0.1 * PANO_PX_PER_DEG, x + trunk, y0 + 2], fill=255)


def draw_deciduous(draw, az, base_alt, height, rng):
    x = pano_x(az)
    y0 = pano_y(base_alt)
    trunk_h = height * 0.32
    trunk_w = height * 0.07 * PANO_PX_PER_DEG
    draw.rectangle([x - trunk_w, y0 - trunk_h * PANO_PX_PER_DEG, x + trunk_w, y0 + 2], fill=255)
    crown_r = height * 0.42
    cy = y0 - (trunk_h + crown_r * 0.8) * PANO_PX_PER_DEG
    for _ in range(14):
        dx = rng.uniform(-0.7, 0.7) * crown_r * PANO_PX_PER_DEG
        dy = rng.uniform(-0.5, 0.4) * crown_r * PANO_PX_PER_DEG
        r = crown_r * rng.uniform(0.35, 0.7) * PANO_PX_PER_DEG
        draw.ellipse([x + dx - r, cy + dy - r, x + dx + r, cy + dy + r], fill=255)


def tree_mask(clusters, base_fn, scale):
    """Silhouette mask of several tree clusters: (az_from, az_to, count, seed, kind)."""
    mask = Image.new('L', (PANO_WIDTH, PANO_HEIGHT), 0)
    draw = ImageDraw.Draw(mask)
    for az_from, az_to, count, seed, kind in clusters:
        rng = random.Random(seed)
        for _ in range(count):
            az = rng.uniform(az_from, az_to)
            base = base_fn(az) - rng.uniform(0.15, 0.6) * scale
            height = rng.uniform(1.6, 3.2) * scale
            if kind == 'conifer':
                draw_conifer(draw, az, base, height, rng)
            else:
                draw_deciduous(draw, az, base, height, rng)
    return mask


def paint_ground(pano):
    """Gradient below the horizon with soft mottling and fine grain."""
    layer = vertical_gradient(GROUND_TOP, GROUND_NADIR, 0.0, -90.0)
    mask = Image.new('L', (PANO_WIDTH, PANO_HEIGHT), 0)
    ImageDraw.Draw(mask).rectangle([0, int(pano_y(0.0)), PANO_WIDTH, PANO_HEIGHT], fill=255)
    pano.alpha_composite(_with_alpha(layer, mask))
    # Large soft patches (meadow texture) and fine grain, both only on the ground.
    patches = Image.effect_noise((PANO_WIDTH // 8, PANO_HEIGHT // 8), 40).filter(
        ImageFilter.GaussianBlur(6)
    )
    patches = patches.resize((PANO_WIDTH, PANO_HEIGHT), Image.BILINEAR)
    grain = Image.effect_noise((PANO_WIDTH, PANO_HEIGHT), 16).filter(ImageFilter.GaussianBlur(0.8))
    for texture, strength in ((patches, 14), (grain, 8)):
        alpha = mask.point(lambda v: v * strength // 255)
        pano.alpha_composite(Image.merge('RGBA', [texture, texture, texture, alpha]))


def _with_alpha(image, mask):
    image = image.copy()
    image.putalpha(mask)
    return image


def add_horizon_mist(pano):
    """Pale haze hugging the horizon, applied only where the landscape is opaque."""
    mist = Image.new('L', (PANO_WIDTH, PANO_HEIGHT), 0)
    draw = ImageDraw.Draw(mist)
    for y in range(int(pano_y(2.0)), int(pano_y(-3.0))):
        alt = PANO_TOP_DEG - y / PANO_PX_PER_DEG
        strength = 1.0 - alt / 2.0 if alt >= 0 else 1.0 + alt / 3.0
        draw.line([(0, y), (PANO_WIDTH, y)], fill=int(22 * max(0.0, strength) ** 2.0))
    alpha = ImageChops.multiply(mist, pano.getchannel('A'))
    pano.alpha_composite(Image.merge('RGBA', [Image.new('L', mist.size, c) for c in MIST] + [alpha]))


def build_panorama():
    pano = Image.new('RGBA', (PANO_WIDTH, PANO_HEIGHT), SKY)
    paint_ground(pano)

    profiles = []
    for index, (crest, base, height, amplitude, seed, blur) in enumerate(HILL_LAYERS):
        profile = ridge_profile(amplitude, height, seed, jagged=index == 0)
        if index == 0:
            # The far range only shows through in the east and the west.
            inner = profile

            def profile(az, inner=inner):
                window = max(
                    max(0.0, math.cos(math.radians((az - 80.0) * 1.2))),
                    max(0.0, math.cos(math.radians((az - 265.0) * 1.5))),
                )
                return inner(az) * window - 0.3

        profiles.append(profile)
        layer = vertical_gradient(crest, base, height + amplitude, -4.0)
        composite_masked(pano, ridge_mask(profile), layer, blur)

        if index == 1:
            far_trees = tree_mask(
                [(60, 110, 90, 1, 'conifer'), (245, 300, 80, 3, 'conifer')], profile, 0.7
            )
            composite_masked(pano, far_trees, vertical_gradient(TREE_FAR, TREE_FAR, 4, -4), 1.6)

    near_trees = tree_mask(
        [
            (5, 35, 9, 4, 'deciduous'),
            (95, 140, 55, 5, 'conifer'),
            (150, 200, 14, 6, 'deciduous'),
            (210, 250, 45, 7, 'conifer'),
            (300, 345, 10, 8, 'deciduous'),
        ],
        profiles[3],
        1.15,
    )
    composite_masked(pano, near_trees, vertical_gradient(TREE_NEAR, TREE_NEAR, 4, -4), 0.8)

    add_horizon_mist(pano)

    return pano.resize(
        (PANO_WIDTH // SAMPLE_DOWNSCALE, PANO_HEIGHT // SAMPLE_DOWNSCALE), Image.LANCZOS
    )


class PanoramaSampler:
    def __init__(self, image):
        self.width, self.height = image.size
        self.pixels = image.load()
        self.px_per_deg = self.width / 360.0

    def sample(self, azimuth_deg, altitude_deg):
        """Bilinear RGBA sample (floats 0-255); transparent above the panorama."""
        if altitude_deg >= PANO_TOP_DEG:
            return (0.0, 0.0, 0.0, 0.0)
        fx = (azimuth_deg % 360.0) * self.px_per_deg - 0.5
        fy = (PANO_TOP_DEG - altitude_deg) * self.px_per_deg - 0.5
        fy = max(0.0, min(self.height - 1.0, fy))
        x0 = int(math.floor(fx))
        y0 = int(fy)
        tx = fx - x0
        ty = fy - y0
        x0 %= self.width
        x1 = (x0 + 1) % self.width
        y1 = min(self.height - 1, y0 + 1)
        p00 = self.pixels[x0, y0]
        p10 = self.pixels[x1, y0]
        p01 = self.pixels[x0, y1]
        p11 = self.pixels[x1, y1]
        w00 = (1 - tx) * (1 - ty)
        w10 = tx * (1 - ty)
        w01 = (1 - tx) * ty
        w11 = tx * ty
        return tuple(
            p00[i] * w00 + p10[i] * w10 + p01[i] * w01 + p11[i] * w11 for i in range(4)
        )


def render_tile(face, panorama):
    supersample = SUPERSAMPLE
    offsets = [(i + 0.5) / supersample for i in range(supersample)]
    weight = 1.0 / (supersample * supersample)
    image = Image.new('RGBA', (TILE_WIDTH, TILE_WIDTH))
    pixels = image.load()
    for py in range(TILE_WIDTH):
        for px in range(TILE_WIDTH):
            r = g = b = a = 0.0
            for dy in offsets:
                for dx in offsets:
                    az, alt = tile_pixel_to_horizontal(face, px + dx, py + dy)
                    sr, sg, sb, sa = panorama.sample(az, alt)
                    # Accumulate colour weighted by coverage so the horizon
                    # edge blends cleanly against the transparent sky.
                    r += sr * sa
                    g += sg * sa
                    b += sb * sa
                    a += sa
            if a > 0:
                pixels[px, py] = (
                    int(round(r / a)),
                    int(round(g / a)),
                    int(round(b / a)),
                    int(round(a * weight)),
                )
            else:
                pixels[px, py] = (0, 0, 0, 0)
    return image


def write_properties(path):
    with open(path, 'w', encoding='utf-8') as handle:
        handle.write(
            'hips_order            = 0\n'
            'hips_order_min        = 0\n'
            'hips_tile_width       = 512\n'
            'hips_tile_format      = webp\n'
            'dataproduct_type      = image\n'
            "obs_title             = Touch'N'Stars\n"
            'type                  = landscape\n'
        )


def write_descriptions(directory):
    text = (
        "<h2>Touch'N'Stars</h2>\n"
        "<p>A moonlit meadow with rolling hills, distant mountains and tree lines. "
        'Generated by scripts/generate-tns-landscape.py.</p>\n'
    )
    for name in ('description.en.utf8', 'description.en.html'):
        with open(os.path.join(directory, name), 'w', encoding='utf-8') as handle:
            handle.write(text)


def main():
    self_check()
    panorama = PanoramaSampler(build_panorama())
    tile_dir = os.path.join(OUT_DIR, 'Norder0', 'Dir0')
    os.makedirs(tile_dir, exist_ok=True)

    allsky = Image.new('RGBA', (ALLSKY_TILE * 3, ALLSKY_TILE * 4), (0, 0, 0, 0))
    for face in range(12):
        tile = render_tile(face, panorama)
        tile.save(os.path.join(tile_dir, f'Npix{face}.webp'), 'WEBP', lossless=True, method=6)
        preview = tile.resize((ALLSKY_TILE, ALLSKY_TILE), Image.LANCZOS)
        allsky.paste(preview, ((face % 3) * ALLSKY_TILE, (face // 3) * ALLSKY_TILE))
        print(f'tile {face} written', file=sys.stderr)

    allsky.save(os.path.join(OUT_DIR, 'Norder0', 'Allsky.webp'), 'WEBP', lossless=True, method=6)
    write_properties(os.path.join(OUT_DIR, 'properties'))
    write_descriptions(OUT_DIR)
    print(f'landscape written to {OUT_DIR}')


if __name__ == '__main__':
    main()
