"""Optimize existing Seicento renders for the portfolio without changing sources."""
from pathlib import Path
from shutil import copyfile
from PIL import Image
import json

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(r'C:/Users/alexi/Desktop/Blender GPT/Seicento_Makeup_School')
OUT = ROOT / 'public/images/seicento'
SEQUENCE = SOURCE / 'Web_Scroll/renders/v007_eevee_web_1440_png'


def main():
    (OUT / 'case').mkdir(parents=True, exist_ok=True)
    indices = [round(i * 119 / 89) + 1 for i in range(90)]
    for number, source_frame in enumerate(indices):
        with Image.open(SEQUENCE / f'seicento_web_{source_frame:04}.png') as source:
            image = source.convert('RGBA').resize((1280, 720), Image.Resampling.LANCZOS)
            image.save(OUT / 'case' / f'frame-{number:03}.webp', 'WEBP', quality=82, method=6)
    with Image.open(SEQUENCE / 'seicento_web_0063.png') as source:
        image = source.convert('RGBA').resize((1280, 720), Image.Resampling.LANCZOS)
        image.save(OUT / 'case-poster.webp', 'WEBP', quality=90, method=6)
    with Image.open(SOURCE / 'Lip_Oil_Cristal/previews_v009_premium/06_Premium_Alpha.png') as source:
        source.save(OUT / 'rubi-open.webp', 'WEBP', quality=90, method=6)
    for name in ['rubi-architecture', 'rubi-light', 'rubi-texture']:
        with Image.open(Path(__file__).parent / 'renders' / f'{name}.png') as source:
            source.convert('RGB').save(OUT / f'{name}.webp', 'WEBP', quality=88, method=6)
    copyfile(OUT / 'rubi-architecture.webp', OUT / 'rubi-poster.webp')
    print(json.dumps({'case_source_frames': indices, 'case_count': len(indices)}))


if __name__ == '__main__':
    main()
