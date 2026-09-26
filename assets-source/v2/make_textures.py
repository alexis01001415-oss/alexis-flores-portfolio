from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import numpy as np

HERE=Path(__file__).resolve().parent
rng=np.random.default_rng(9014)
N=512
# Low contrast, directional surface texture. Values are sRGB reflectance.
grain=rng.normal(0,1,(N,N))
lines=rng.normal(0,1,(N,1))
base=np.clip(137+grain*.3+lines*.35,0,255).astype('uint8')
Image.fromarray(np.stack([base,base,base],2)).save(HERE/'aluminum-base.png')
rough=np.clip(95+grain*.4+lines*.55,0,255).astype('uint8')
Image.fromarray(np.stack([rough,rough,rough],2)).save(HERE/'aluminum-roughness.png')
noise=rng.normal(0,1,(N,N))
large=np.array(Image.fromarray(np.clip(rng.normal(128,35,(32,32)),0,255).astype('uint8')).resize((N,N),Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(2))).astype(float)-128
stone=np.clip(24+noise*.3+large*.025,0,255).astype('uint8')
Image.fromarray(np.stack([stone+2,stone+1,stone],2)).save(HERE/'stone-base.png')
rough=np.clip(167+noise*.7+large*.035,0,255).astype('uint8')
Image.fromarray(np.stack([rough,rough,rough],2)).save(HERE/'stone-roughness.png')

# Individual glyphs atlas. UVs are generated per key in Blender.
im=Image.new('RGBA',(1024,1024),(0,0,0,0)); d=ImageDraw.Draw(im)
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',34)
labels=['esc','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','●',
        '`','1','2','3','4','5','6','7','8','9','0','−','=','⌫',
        'tab','Q','W','E','R','T','Y','U','I','O','P','[',']','\\',
        'caps','A','S','D','F','G','H','J','K','L',';','\u0027','enter',
        'shift','Z','X','C','V','B','N','M',',','.','/','shift',
        'fn','ctrl','opt','cmd','','cmd','opt','←','↑','↓','→']
for i,label in enumerate(labels):
    x=(i%8)*128+64;y=(i//8)*80+40
    f=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',22 if len(label)>2 else 31)
    d.text((x,y),label,font=f,fill=(217,213,206,255),anchor='mm')
im.save(HERE/'key-legends.png')

screen=Image.new('RGB',(1600,1000),'#131211'); d=ImageDraw.Draw(screen)
fontbig=ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf',180)
fontsmall=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',26)
d.text((82,65),'ALEXIS FLORES',font=fontsmall,fill='#F2EAE3')
d.text((82,233),'Ideas que',font=fontbig,fill='#F2EAE3')
d.text((82,405),'se sienten.',font=fontbig,fill='#F2EAE3')
d.line((90,725,1500,725),fill='#504A48',width=2)
d.text((90,790),'DISEÑO DIGITAL  /  DIRECCIÓN VISUAL  /  DESARROLLO',font=fontsmall,fill='#D0C9C3')
d.ellipse((1285,765,1445,925),fill='#FF073A')
screen.save(HERE/'screen-default.jpg',quality=90)
print('TEXTURES_READY')
