import sys
from PIL import Image

def process_logo(input_path, out_dir):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Change all white (also shades of whites)
            # to transparent
            if item[0] > 230 and item[1] > 230 and item[2] > 230:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)

        img.putdata(newData)
        
        # Get bounding box of non-transparent pixels
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        
        # Save main logo.png
        import os
        logo_path = os.path.join(out_dir, 'logo.png')
        img.save(logo_path, "PNG")
        
        # Generate sizes
        # For square icons, we should pad it to be square
        size = max(img.size)
        square_img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
        square_img.paste(img, ((size - img.size[0]) // 2, (size - img.size[1]) // 2))
        
        # Sizes
        square_img.resize((16, 16), Image.Resampling.LANCZOS).save(os.path.join(out_dir, 'favicon-16.png'))
        square_img.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(out_dir, 'favicon-32.png'))
        square_img.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(out_dir, 'apple-touch-icon.png'))
        square_img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(out_dir, 'icon-192x192.png'))
        square_img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(out_dir, 'icon-512x512.png'))
        
        # ICO
        square_img.save(os.path.join(out_dir, 'favicon.ico'), format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)])
        
        print(f"Successfully processed logo to {out_dir}")
        
    except Exception as e:
        print(f"Error processing logo: {e}")

if __name__ == "__main__":
    process_logo(sys.argv[1], sys.argv[2])
