import os
import math
import struct
import subprocess
import json

ALBUMS_FILE = "/Users/kaushal/Downloads/Nothing-to-listen-to/public/json/0.json"
SINGLE_DIR = "/Users/kaushal/Downloads/Nothing-to-listen-to/public/media/single"
TMP_DIR = "/tmp/music_covers"
os.makedirs(SINGLE_DIR, exist_ok=True)
os.makedirs(TMP_DIR, exist_ok=True)

with open(ALBUMS_FILE, "r") as f:
    albums = json.load(f)

print(f"Loaded {len(albums)} albums. Generating square cover art...")

# Font/Bitmap 5x7 mini character representation for writing titles/artists on covers
CHAR_MAP = {
    'A': [0x0C, 0x12, 0x12, 0x1E, 0x12, 0x12, 0x12],
    'B': [0x1C, 0x12, 0x12, 0x1C, 0x12, 0x12, 0x1C],
    'C': [0x0E, 0x10, 0x10, 0x10, 0x10, 0x10, 0x0E],
    'D': [0x1C, 0x12, 0x12, 0x12, 0x12, 0x12, 0x1C],
    'E': [0x1E, 0x10, 0x10, 0x1C, 0x10, 0x10, 0x1E],
    'F': [0x1E, 0x10, 0x10, 0x1C, 0x10, 0x10, 0x10],
    'G': [0x0E, 0x10, 0x10, 0x16, 0x12, 0x12, 0x0E],
    'H': [0x12, 0x12, 0x12, 0x1E, 0x12, 0x12, 0x12],
    'I': [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E],
    'J': [0x02, 0x02, 0x02, 0x02, 0x12, 0x12, 0x0C],
    'K': [0x12, 0x14, 0x18, 0x10, 0x18, 0x14, 0x12],
    'L': [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1E],
    'M': [0x11, 0x1B, 0x15, 0x11, 0x11, 0x11, 0x11],
    'N': [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
    'O': [0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
    'P': [0x1C, 0x12, 0x12, 0x1C, 0x10, 0x10, 0x10],
    'Q': [0x0E, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0D],
    'R': [0x1C, 0x12, 0x12, 0x1C, 0x14, 0x12, 0x11],
    'S': [0x0E, 0x10, 0x10, 0x0E, 0x01, 0x01, 0x1E],
    'T': [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
    'U': [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
    'V': [0x11, 0x11, 0x11, 0x11, 0x11, 0x0A, 0x04],
    'W': [0x11, 0x11, 0x11, 0x15, 0x15, 0x15, 0x0A],
    'X': [0x11, 0x11, 0x0A, 0x04, 0x0A, 0x11, 0x11],
    'Y': [0x11, 0x11, 0x0A, 0x04, 0x04, 0x04, 0x04],
    'Z': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1F],
    ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    '0': [0x0E, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0E],
    '1': [0x04, 0x0C, 0x04, 0x04, 0x04, 0x04, 0x0E],
    '2': [0x0E, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1F],
    '3': [0x1F, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0E],
    '4': [0x02, 0x06, 0x0A, 0x12, 0x1F, 0x02, 0x02],
    '5': [0x1F, 0x10, 0x1E, 0x01, 0x01, 0x11, 0x0E],
    '6': [0x06, 0x08, 0x10, 0x1E, 0x11, 0x11, 0x0E],
    '7': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
    '8': [0x0E, 0x11, 0x11, 0x0E, 0x11, 0x11, 0x0E],
    '9': [0x0E, 0x11, 0x11, 0x0F, 0x01, 0x02, 0x0C],
    '-': [0x00, 0x00, 0x00, 0x1F, 0x00, 0x00, 0x00],
    '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04],
    "'": [0x04, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00]
}

def draw_text(pixels, width, height, text, start_x, start_y, scale, color):
    text = text.upper()
    cur_x = start_x
    for ch in text:
        bitmap = CHAR_MAP.get(ch, CHAR_MAP[' '])
        for row in range(7):
            for col in range(5):
                if (bitmap[row] >> (4 - col)) & 1:
                    for sy in range(scale):
                        for sx in range(scale):
                            px = cur_x + col * scale + sx
                            py = start_y + row * scale + sy
                            if 0 <= px < width and 0 <= py < height:
                                idx = (py * width + px) * 3
                                pixels[idx] = color[0]
                                pixels[idx+1] = color[1]
                                pixels[idx+2] = color[2]
        cur_x += 6 * scale

# Size for single images: 300x300 (standard album art)
SIZE = 300

# We will also create the 18x12 atlas for DDS: 1980x1980
ATLAS_W = 1980
ATLAS_H = 1980
COLS = 18
ROWS = 12
TILE_W = ATLAS_W // COLS  # 110
TILE_H = ATLAS_H // ROWS  # 165
atlas_pixels = bytearray(ATLAS_W * ATLAS_H * 3)

for idx, album in enumerate(albums):
    title = album.get("title", "")
    artist = album.get("artist", "")
    year = album.get("release_year", "")
    
    # Generate distinctive colors based on ID
    hue = (idx * 137.5) % 360
    r = int((math.sin(math.radians(hue)) * 0.5 + 0.5) * 200 + 40)
    g = int((math.sin(math.radians(hue + 120)) * 0.5 + 0.5) * 200 + 40)
    b = int((math.sin(math.radians(hue + 240)) * 0.5 + 0.5) * 200 + 40)
    
    bg_r = int(r * 0.15)
    bg_g = int(g * 0.15)
    bg_b = int(b * 0.15)
    
    pixels = bytearray(SIZE * SIZE * 3)
    cx, cy = SIZE // 2, SIZE // 2
    
    # Render background gradient and vinyl groove pattern
    for y in range(SIZE):
        for x in range(SIZE):
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx * dx + dy * dy)
            
            # Vinyl disc record effect in center
            if dist < 125:
                # Grooves
                groove = int(math.sin(dist * 0.8) * 15)
                # Center label disc
                if dist < 45:
                    pr = min(255, r + 40)
                    pg = min(255, g + 40)
                    pb = min(255, b + 40)
                    if dist < 12: # Center spindle hole
                        pr, pg, pb = 20, 20, 20
                else:
                    # Black vinyl
                    val = max(10, min(60, 25 + groove))
                    pr, pg, pb = val, val, val
            else:
                # Album outer sleeve background with soft radial lighting
                shade = 1.0 - (dist / (SIZE * 0.7)) * 0.5
                pr = max(0, min(255, int(bg_r * shade + (x / SIZE) * (r * 0.3))))
                pg = max(0, min(255, int(bg_g * shade + (y / SIZE) * (g * 0.3))))
                pb = max(0, min(255, int(bg_b * shade + (1.0 - x / SIZE) * (b * 0.3))))
            
            # Sleeve border frame
            if x < 4 or x >= SIZE - 4 or y < 4 or y >= SIZE - 4:
                pr = min(255, pr + 60)
                pg = min(255, pg + 60)
                pb = min(255, pb + 60)
                
            idx_pix = (y * SIZE + x) * 3
            pixels[idx_pix] = pr
            pixels[idx_pix+1] = pg
            pixels[idx_pix+2] = pb
            
    # Text headers: Artist and Title
    draw_text(pixels, SIZE, SIZE, artist[:20], 18, 16, 2, (255, 255, 255))
    draw_text(pixels, SIZE, SIZE, title[:22], 18, 36, 2, (r, g, b))
    draw_text(pixels, SIZE, SIZE, f"{year} STEREO", 18, SIZE - 28, 2, (200, 200, 200))
    
    # Save single PPM and convert to JPG
    ppm_path = f"{TMP_DIR}/{idx}.ppm"
    jpg_path = f"{SINGLE_DIR}/{idx}.jpg"
    with open(ppm_path, "wb") as f:
        f.write(f"P6\n{SIZE} {SIZE}\n255\n".encode("ascii") + pixels)
        
    subprocess.run(["sips", "-s", "format", "jpeg", ppm_path, "--out", jpg_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # Also pack into 1980x1980 atlas for WebGL
    col = idx % COLS
    row = idx // COLS
    if row < ROWS:
        ox = col * TILE_W
        oy = row * TILE_H
        for ty in range(TILE_H):
            sy = int(ty * SIZE / TILE_H)
            for tx in range(TILE_W):
                sx = int(tx * SIZE / TILE_W)
                src_i = (sy * SIZE + sx) * 3
                dst_i = ((oy + ty) * ATLAS_W + (ox + tx)) * 3
                atlas_pixels[dst_i] = pixels[src_i]
                atlas_pixels[dst_i+1] = pixels[src_i+1]
                atlas_pixels[dst_i+2] = pixels[src_i+2]

print("Single album covers generated. Now encoding DXT1 DDS atlas (1980x1980)...")

# Write DXT1 DDS file
def rgb_to_565(r, g, b):
    return ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3)

def encode_dxt1(rgb_data, width, height):
    # Header: 128 bytes
    # Magic: 'DDS ' = 0x20534444
    # Size: 124
    # Flags: 0x1007 (CAPS | HEIGHT | WIDTH | PIXELFORMAT)
    # Height, Width
    # PitchOrLinearSize
    # Depth: 0
    # MipMapCount: 1
    # Reserved[11]
    # PixelFormat:
    #   Size: 32
    #   Flags: 0x4 (DDPF_FOURCC)
    #   FourCC: 'DXT1' = 0x31545844
    #   RGBBitCount: 0, R/G/B/A Masks: 0
    # Caps: 0x1000 (DDSCAPS_TEXTURE)
    
    header = bytearray(128)
    struct.pack_into('<I', header, 0, 0x20534444)  # Magic
    struct.pack_into('<I', header, 4, 124)         # Size
    struct.pack_into('<I', header, 8, 0x00081007)  # Flags
    struct.pack_into('<I', header, 12, height)
    struct.pack_into('<I', header, 16, width)
    pitch = ((width + 3) // 4) * 8
    struct.pack_into('<I', header, 20, pitch * ((height + 3) // 4))
    struct.pack_into('<I', header, 28, 1)          # Mipmap count
    
    # PixelFormat at offset 76
    struct.pack_into('<I', header, 76, 32)         # PF Size
    struct.pack_into('<I', header, 80, 0x4)        # DDPF_FOURCC
    struct.pack_into('<I', header, 84, 0x31545844) # FOURCC 'DXT1'
    struct.pack_into('<I', header, 108, 0x1000)    # DDSCAPS_TEXTURE
    
    blocks_x = width // 4
    blocks_y = height // 4
    out_blocks = bytearray(blocks_x * blocks_y * 8)
    out_offset = 0
    
    for by in range(blocks_y):
        py_start = by * 4
        for bx in range(blocks_x):
            px_start = bx * 4
            
            # Collect 16 pixels
            block_r = []
            block_g = []
            block_b = []
            min_lum = 9999
            max_lum = -1
            min_c = (0, 0, 0)
            max_c = (255, 255, 255)
            
            for iy in range(4):
                py = py_start + iy
                row_offset = (py * width + px_start) * 3
                for ix in range(4):
                    r = rgb_data[row_offset + ix * 3]
                    g = rgb_data[row_offset + ix * 3 + 1]
                    b = rgb_data[row_offset + ix * 3 + 2]
                    block_r.append(r)
                    block_g.append(g)
                    block_b.append(b)
                    lum = r * 30 + g * 59 + b * 11
                    if lum < min_lum:
                        min_lum = lum
                        min_c = (r, g, b)
                    if lum > max_lum:
                        max_lum = lum
                        max_c = (r, g, b)
                        
            # Ensure c0 > c1 for 4-color mode
            c0_565 = rgb_to_565(*max_c)
            c1_565 = rgb_to_565(*min_c)
            if c0_565 < c1_565:
                c0_565, c1_565 = c1_565, c0_565
                max_c, min_c = min_c, max_c
            elif c0_565 == c1_565 and c0_565 < 65535:
                c0_565 += 1
                
            # Derive 4 color points
            c0 = max_c
            c1 = min_c
            c2 = ((2 * c0[0] + c1[0]) // 3, (2 * c0[1] + c1[1]) // 3, (2 * c0[2] + c1[2]) // 3)
            c3 = ((c0[0] + 2 * c1[0]) // 3, (c0[1] + 2 * c1[1]) // 3, (c0[2] + 2 * c1[2]) // 3)
            colors = [c0, c1, c2, c3]
            
            bits = 0
            for i in range(16):
                pr, pg, pb = block_r[i], block_g[i], block_b[i]
                best_dist = 9999999
                best_idx = 0
                for ci, col in enumerate(colors):
                    dr = pr - col[0]
                    dg = pg - col[1]
                    db = pb - col[2]
                    d = dr*dr + dg*dg + db*db
                    if d < best_dist:
                        best_dist = d
                        best_idx = ci
                # DXT1 index map: 0 = c0, 1 = c1, 2 = c2, 3 = c3
                bits |= (best_idx << (2 * i))
                
            struct.pack_into('<HHI', out_blocks, out_offset, c0_565, c1_565, bits)
            out_offset += 8
            
    return header + out_blocks

dds_data = encode_dxt1(atlas_pixels, ATLAS_W, ATLAS_H)
for d in ["high", "mid", "low"]:
    dds_path = f"/Users/kaushal/Downloads/Nothing-to-listen-to/public/media/{d}/dds/0.dds"
    with open(dds_path, "wb") as f:
        f.write(dds_data)
    print(f"Wrote {dds_path} ({len(dds_data)} bytes)")

print("All album covers and DDS texture atlases generated successfully!")

