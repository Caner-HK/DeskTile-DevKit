"""Convert complete image resources to DTI without changing their aspect ratio."""
from pathlib import Path
import argparse,json
from PIL import Image
from icon_asset import load,encode

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('source',type=Path);p.add_argument('output',type=Path)
    p.add_argument('--mode',choices=['system','custom'],default='custom')
    p.add_argument('--width',type=int);p.add_argument('--height',type=int)
    a=p.parse_args()
    for value in (a.width,a.height):
        if value is not None and not 1<=value<=4096:p.error('dimensions must be 1..4096')
    image=load(a.source,svg_limit=None)
    if a.width or a.height:
        ratio=min(a.width/image.width if a.width else float('inf'),a.height/image.height if a.height else float('inf'))
        image=image.resize((max(1,round(image.width*ratio)),max(1,round(image.height*ratio))),Image.Resampling.LANCZOS)
    if image.width>4096 or image.height>4096 or image.width*image.height>1024*1024:p.error('DTI exceeds 4096 pixels per side or 1 megapixel; specify a smaller width or height')
    a.output.mkdir(parents=True,exist_ok=True)
    dti=a.output/'image.dti';dti.write_bytes(encode(image,a.mode));decoded=load(dti)
    for theme,bg,ink in [('light',(247,247,247),(31,31,31)),('dark',(17,17,17),(255,255,255))]:
        preview=Image.new('RGB',decoded.size,bg)
        preview.paste(ink if a.mode=='system' else decoded,(0,0,*decoded.size),decoded.getchannel('A'))
        preview.save(a.output/(theme+'.png'))
    (a.output/'image.json').write_text(json.dumps(dict(width=image.width,height=image.height,mode=a.mode)),encoding='utf-8')

if __name__=='__main__':main()
