import os
import shutil
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHAR_SEL_DIR = os.path.join(BASE_DIR, 'Main Characters', 'For character selection')
GAME_DIR = os.path.join(BASE_DIR, 'Main Characters', 'For the game')
PUBLIC_CHAR_DIR = os.path.join(BASE_DIR, 'public', 'characters')
PUBLIC_SPRITE_DIR = os.path.join(BASE_DIR, 'public', 'sprites')

os.makedirs(PUBLIC_CHAR_DIR, exist_ok=True)
os.makedirs(PUBLIC_SPRITE_DIR, exist_ok=True)

def crop_and_fit(im, target_size=(256, 256), pad_ratio=0.05):
    """Crops transparent padding and centers in a square transparent canvas."""
    im = im.convert('RGBA')
    bbox = im.getbbox()
    if bbox:
        cropped = im.crop(bbox)
        cw, ch = cropped.size
        # Make a square bounding box with small padding
        max_dim = int(max(cw, ch) * (1.0 + pad_ratio * 2))
        sq = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
        ox = (max_dim - cw) // 2
        oy = (max_dim - ch) // 2
        sq.paste(cropped, (ox, oy))
        return sq.resize(target_size, Image.Resampling.LANCZOS)
    return im.resize(target_size, Image.Resampling.LANCZOS)

def process_game_sprite(im, target_size=(16, 16)):
    """Downscales game sprite cleanly preserving transparency."""
    im = im.convert('RGBA')
    bbox = im.getbbox()
    if bbox:
        cropped = im.crop(bbox)
        cw, ch = cropped.size
        # Center in square with proportional aspect
        max_dim = max(cw, ch)
        sq = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
        ox = (max_dim - cw) // 2
        oy = (max_dim - ch) // 2
        sq.paste(cropped, (ox, oy))
        # Lanczos downscale produces crisp, recognizable miniature pixel art
        return sq.resize(target_size, Image.Resampling.LANCZOS)
    return im.resize(target_size, Image.Resampling.LANCZOS)

print("1. Processing Lobby Character Selection Portraits (256x256)...")
# Player 1 - 4 & Nagavalli from Selection folder
sel_map = {
    'Player 1.png': 'player_1.png',
    'Player 2.png': 'player_2.png',
    'Player 3.png': 'player_3.png',
    'Player 4.png': 'player_4.png',
    'Nagavalli.png': 'nagavalli.png',
}

for src_name, dst_name in sel_map.items():
    src_path = os.path.join(CHAR_SEL_DIR, src_name)
    if os.path.exists(src_path):
        im = Image.open(src_path)
        out = crop_and_fit(im, (256, 256))
        dst_path = os.path.join(PUBLIC_CHAR_DIR, dst_name)
        out.save(dst_path, format='PNG', optimize=True)
        print(f"  Saved {dst_name} ({out.size})")

# Player 5 portrait from Game Player 5/1.png
p5_src = os.path.join(GAME_DIR, 'Player 5', '1.png')
if os.path.exists(p5_src):
    im = Image.open(p5_src)
    out = crop_and_fit(im, (256, 256))
    dst_path = os.path.join(PUBLIC_CHAR_DIR, 'player_5.png')
    out.save(dst_path, format='PNG', optimize=True)
    print(f"  Saved player_5.png from Player 5 game sprite ({out.size})")

print("\n2. Processing Game Walk Cycle Sprites (16x16)...")
# Characters and their folder names
char_folders = [
    ('nagavalli', 'Nagavali'),
    ('hider_1', 'Player 1'),
    ('hider_2', 'Player 2'),
    ('hider_3', 'Player 3'),
    ('hider_4', 'Player 4'),
    ('hider_5', 'Player 5'),
]

for char_key, folder_name in char_folders:
    char_dir = os.path.join(GAME_DIR, folder_name)
    if not os.path.exists(char_dir):
        print(f"  Warning: {char_dir} not found!")
        continue

    # Find the 4 files
    files = os.listdir(char_dir)
    f1_file = next((f for f in files if f == '1.png' or f.startswith('1.')), None)
    f2_file = next((f for f in files if f == '2.png' or f.startswith('2.')), None)
    b1_file = next((f for f in files if f.replace(' ', '') == 'b1.png'), None)
    b2_file = next((f for f in files if f.replace(' ', '') == 'b2.png'), None)

    print(f"  {char_key} ({folder_name}): f1={f1_file}, f2={f2_file}, b1={b1_file}, b2={b2_file}")

    frame_map = [
        (f1_file, f"{char_key}_f1.png"),
        (f2_file, f"{char_key}_f2.png"),
        (b1_file, f"{char_key}_b1.png"),
        (b2_file, f"{char_key}_b2.png"),
    ]

    for src_file, dst_name in frame_map:
        if src_file:
            im = Image.open(os.path.join(char_dir, src_file))
            spr = process_game_sprite(im, (16, 16))
            spr_path = os.path.join(PUBLIC_SPRITE_DIR, dst_name)
            spr.save(spr_path, format='PNG', optimize=True)
        else:
            print(f"    Missing frame for {dst_name}")

    # Also save the primary default sprite (char_key.png) as alias of f1
    if f1_file:
        im = Image.open(os.path.join(char_dir, f1_file))
        spr = process_game_sprite(im, (16, 16))
        spr.save(os.path.join(PUBLIC_SPRITE_DIR, f"{char_key}.png"), format='PNG', optimize=True)

print("\nDone! All sprites processed successfully.")

