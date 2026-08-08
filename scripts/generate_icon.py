import os
from PIL import Image, ImageDraw

assets_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'desktop', 'assets')
os.makedirs(assets_dir, exist_ok=True)

# Create a simple 256x256 blue icon with text "ERP"
img = Image.new('RGB', (256, 256), color = '#1e3a8a')
d = ImageDraw.Draw(img)
# Draw some text if we have a font, otherwise just shapes
d.rectangle([32, 32, 224, 224], outline='white', width=8)

img.save(os.path.join(assets_dir, 'icon.png'))
img.save(os.path.join(assets_dir, 'icon.ico'), format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])

print("Icons generated.")
