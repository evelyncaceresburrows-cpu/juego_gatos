from PIL import Image
import os
d = 'C:/Users/Zeos/Downloads'
files = ['0BFA9AF5-FD80-4FD8-827A-3728BFBE31D0',
         '62704998-6F16-49D1-99EA-528DBD9FE0B4',
         '12708DD5-5A67-4D96-9584-4AFD8914E382',
         '66331D49-FE41-4A1F-B523-045822F33F03',
         '4302D5D7-035F-47E5-B53E-0F885E3F1C14',
         '9B460C92-7F05-42FD-8848-4D5AEB67CE1C']
for f in files:
    img = Image.open(os.path.join(d, f + '.png')).convert('RGBA')
    w, h = img.size
    c1 = img.getpixel((5, 5))
    c2 = img.getpixel((w - 5, 5))
    c3 = img.getpixel((5, h - 5))
    c4 = img.getpixel((w // 2, 5))
    print(f'{f[:8]} size={w}x{h}  TL={c1}  TR={c2}  BL={c3}  TC={c4}')
